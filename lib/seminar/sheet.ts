import { getSheets } from '@/lib/google'
import type { WeekBlock, ParsedPaper } from './types'

export async function getSheetTitle(spreadsheetId: string, gid: number): Promise<string> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.get({ spreadsheetId })
  const sheet = res.data.sheets?.find((s) => s.properties?.sheetId === gid)
  if (!sheet?.properties?.title) throw new Error(`Sheet with gid=${gid} not found`)
  return sheet.properties.title
}

// Returns the semester tab name a given seminar date belongs to.
// Spring semester (Mar–Aug): "YY/03 ~"
// Fall semester   (Sep–Feb next year): "YY/09 ~" (year is the Sep year)
export function getSemesterTabName(date: string): string {
  const [y, m] = date.split('-').map(Number)
  if (m >= 3 && m <= 8) {
    return `${String(y % 100).padStart(2, '0')}/03 ~`
  }
  if (m >= 9) {
    return `${String(y % 100).padStart(2, '0')}/09 ~`
  }
  // Jan/Feb → belongs to previous year's Sep semester
  return `${String((y - 1) % 100).padStart(2, '0')}/09 ~`
}

// Ensures a tab with the given title exists. Returns its sheetId (gid) and title.
export async function ensureTab(
  spreadsheetId: string,
  tabName: string,
): Promise<{ sheetId: number; title: string; created: boolean }> {
  const sheets = getSheets()
  const ss = await sheets.spreadsheets.get({ spreadsheetId })
  const existing = ss.data.sheets?.find((s) => s.properties?.title === tabName)
  if (existing?.properties?.sheetId != null) {
    return { sheetId: existing.properties.sheetId, title: tabName, created: false }
  }
  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      // index: 0 → leftmost. Newest semester tab shows first when the sheet opens.
      requests: [{ addSheet: { properties: { title: tabName, index: 0 } } }],
    },
  })
  const newProps = res.data.replies?.[0]?.addSheet?.properties
  if (!newProps?.sheetId || !newProps.title) {
    throw new Error(`Failed to create tab "${tabName}"`)
  }
  return { sheetId: newProps.sheetId, title: newProps.title, created: true }
}

// Searches every tab in the spreadsheet for a block matching the given date.
// Returns the tab it lives in + the block, or null if nowhere.
export async function findBlockInAnyTab(
  spreadsheetId: string,
  targetDate: string,
): Promise<{ tabTitle: string; tabGid: number; block: WeekBlock } | null> {
  const sheets = getSheets()
  const ss = await sheets.spreadsheets.get({ spreadsheetId })
  for (const s of ss.data.sheets ?? []) {
    const title = s.properties?.title
    const gid = s.properties?.sheetId
    if (!title || gid == null) continue
    const block = await findBlockByDate(spreadsheetId, title, targetDate)
    if (block) return { tabTitle: title, tabGid: gid, block }
  }
  return null
}

interface RawRow { row: number; cells: string[] }

async function readAllRows(spreadsheetId: string, sheetTitle: string): Promise<RawRow[]> {
  const sheets = getSheets()
  const range = `'${sheetTitle}'!A1:Z`
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  const raw = res.data.values ?? []
  return raw.map((row, i) => ({
    row: i + 1,
    cells: (row as unknown[]).map((c) => (c == null ? '' : String(c))),
  }))
}

function normalizeDate(s: string): string {
  // accepts 'YYYY-MM-DD', 'YYYY.MM.DD', 'YYYY/MM/DD', Date-serial-number strings ignored
  const m = s.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/)
  if (!m) return ''
  const y = m[1]
  const mo = m[2].padStart(2, '0')
  const d = m[3].padStart(2, '0')
  return `${y}-${mo}-${d}`
}

export async function findBlockByDate(
  spreadsheetId: string,
  sheetTitle: string,
  targetDate: string,
): Promise<WeekBlock | null> {
  const rows = await readAllRows(spreadsheetId, sheetTitle)

  // scan for "Date" in col B; date value is in the merged C-D-E span (first non-empty after B)
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].cells
    const b = (cells[1] ?? '').trim().toLowerCase()
    if (b !== 'date') continue
    const afterB = cells.slice(2)
    const parsed = (afterB.map(normalizeDate).find((v) => v !== '')) ?? ''
    if (parsed !== targetDate) continue

    const dateRow = rows[i].row
    const headerRow = dateRow + 1
    const presenterRows: Array<{ row: number; name: string }> = []
    for (let j = i + 2; j < rows.length; j++) {
      const bj = (rows[j].cells[1] ?? '').trim()
      if (!bj) break
      if (bj.toLowerCase() === 'date') break
      presenterRows.push({ row: rows[j].row, name: bj })
    }
    return { date: targetDate, dateRow, headerRow, presenterRows }
  }
  return null
}

export async function listAllBlockDates(
  spreadsheetId: string,
  sheetTitle: string,
): Promise<string[]> {
  const rows = await readAllRows(spreadsheetId, sheetTitle)
  const dates: string[] = []
  for (const r of rows) {
    const b = (r.cells[1] ?? '').trim().toLowerCase()
    if (b !== 'date') continue
    const afterB = r.cells.slice(2)
    const d = afterB.map(normalizeDate).find((v) => v !== '') ?? ''
    if (d) dates.push(d)
  }
  return dates
}

function matchPresenterToRow(
  presenterName: string,
  rows: Array<{ row: number; name: string }>,
): number | null {
  const target = presenterName.trim()
  if (!target) return null
  // exact match
  const exact = rows.find((r) => r.name.trim() === target)
  if (exact) return exact.row
  // Korean-name partial (last 2-3 chars)
  const short = target.slice(-3)
  const partial = rows.find((r) => r.name.includes(short) || target.includes(r.name))
  return partial ? partial.row : null
}

export function matchPapersToRows(
  papers: ParsedPaper[],
  presenterRows: Array<{ row: number; name: string }>,
): Array<{ presenter: string; row: number | null; paper: ParsedPaper | null }> {
  const results: Array<{ presenter: string; row: number | null; paper: ParsedPaper | null }> = []
  const usedRows = new Set<number>()

  // one entry per presenter row (show all sheet-registered presenters, matched or not)
  for (const pr of presenterRows) {
    const paper = papers.find((p) => {
      const row = matchPresenterToRow(p.presenter, [pr])
      return row !== null
    }) ?? null
    if (paper) usedRows.add(pr.row)
    results.push({ presenter: pr.name, row: pr.row, paper })
  }

  // include papers whose presenter didn't match anyone in sheet
  for (const p of papers) {
    const row = matchPresenterToRow(p.presenter, presenterRows)
    if (row === null) {
      results.push({ presenter: p.presenter || '(미매칭)', row: null, paper: p })
    }
  }

  return results
}

export async function writePapersToBlock(
  spreadsheetId: string,
  sheetTitle: string,
  matches: Array<{ row: number | null; paper: ParsedPaper | null }>,
): Promise<number> {
  const sheets = getSheets()
  const updates = matches
    .filter((m): m is { row: number; paper: ParsedPaper } => m.row !== null && m.paper !== null)
    .map((m) => ({
      range: `'${sheetTitle}'!C${m.row}:E${m.row}`,
      values: [[m.paper.title, m.paper.venue, m.paper.year]],
    }))
  if (updates.length === 0) return 0
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: updates,
    },
  })
  return updates.length
}

// Returns the presenter roster (column-B names) of the most recent existing
// block in the sheet, ordered as they appear. Used as a template when creating
// a new block so the same lab members show up.
export async function getLatestBlockRoster(
  spreadsheetId: string,
  sheetTitle: string,
): Promise<string[]> {
  const rows = await readAllRows(spreadsheetId, sheetTitle)
  let lastDateIdx = -1
  for (let i = 0; i < rows.length; i++) {
    const b = (rows[i].cells[1] ?? '').trim().toLowerCase()
    if (b === 'date') lastDateIdx = i
  }
  if (lastDateIdx === -1) return []
  const roster: string[] = []
  // presenter rows start at lastDateIdx + 2 (skip Date row + header row)
  for (let j = lastDateIdx + 2; j < rows.length; j++) {
    const bj = (rows[j].cells[1] ?? '').trim()
    if (!bj) break
    if (bj.toLowerCase() === 'date') break
    if (bj.toLowerCase() === 'presenter') continue
    roster.push(bj)
  }
  return roster
}

// Create a weekly block at the TOP of the tab (newest date first).
// Layout:
//   row 1-2 : blank spacing
//   row 3   : [B]="Date"        [C:E merged]=<targetDate>
//   row 4   : [B]="Presenter"  [C]="Paper Title"  [D]="Journal/Conference"  [E]="Year"
//   row 5.. : [B]=<presenter>
// If the tab already has content, rows are pushed down by (N + 4) via
// insertDimension so the new block always sits at rows 3–(N+4).
export async function createBlock(
  spreadsheetId: string,
  sheetTitle: string,
  sheetId: number,
  targetDate: string,
  presenters: string[],
): Promise<WeekBlock> {
  const sheets = getSheets()

  // If tab has any existing content, push it down to make room at the top.
  const info = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!A1:F`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  const hasContent = (info.data.values ?? []).length > 0
  const shift = presenters.length + 4  // block (N+2) + 2-row gap after

  if (hasContent) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          insertDimension: {
            range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: shift },
            inheritFromBefore: false,
          },
        }],
      },
    })
  }

  const dateRow = 3
  const headerRow = 4
  const lastBlockRow = headerRow + presenters.length  // exclusive

  const rowsToWrite: string[][] = [
    ['', 'Date', targetDate],
    ['', 'Presenter', 'Paper Title', 'Journal/Conference', 'Year'],
    ...presenters.map((name) => ['', name]),
  ]
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!A${dateRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rowsToWrite },
  })

  const border = { style: 'SOLID' as const, width: 1, color: { red: 0, green: 0, blue: 0 } }
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          mergeCells: {
            range: {
              sheetId,
              startRowIndex: dateRow - 1,
              endRowIndex: dateRow,
              startColumnIndex: 2,
              endColumnIndex: 5,
            },
            mergeType: 'MERGE_ALL',
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: dateRow - 1,
              endRowIndex: dateRow,
              startColumnIndex: 2,
              endColumnIndex: 5,
            },
            cell: { userEnteredFormat: { horizontalAlignment: 'CENTER' } },
            fields: 'userEnteredFormat.horizontalAlignment',
          },
        },
        {
          updateBorders: {
            range: {
              sheetId,
              startRowIndex: dateRow - 1,
              endRowIndex: lastBlockRow,
              startColumnIndex: 1,
              endColumnIndex: 5,
            },
            top: border,
            bottom: border,
            left: border,
            right: border,
            innerHorizontal: border,
            innerVertical: border,
          },
        },
      ],
    },
  })

  const presenterRows = presenters.map((name, i) => ({
    row: headerRow + 1 + i,
    name,
  }))
  return { date: targetDate, dateRow, headerRow, presenterRows }
}
