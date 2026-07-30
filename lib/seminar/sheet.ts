import { getSheets } from '@/lib/google'
import type { WeekBlock, ParsedPaper } from './types'

export async function getSheetTitle(spreadsheetId: string, gid: number): Promise<string> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.get({ spreadsheetId })
  const sheet = res.data.sheets?.find((s) => s.properties?.sheetId === gid)
  if (!sheet?.properties?.title) throw new Error(`Sheet with gid=${gid} not found`)
  return sheet.properties.title
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
