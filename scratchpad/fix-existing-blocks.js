// Backfill borders (+ merge Date row + center) on existing auto-created blocks,
// and patch 07-07 현상미 row with the missing venue/year (RA-L, 2021).

require('dotenv').config({ path: '.env.local' })
const { google } = require('googleapis')
const fs = require('fs')

const kf = JSON.parse(fs.readFileSync(process.env.GOOGLE_CREDENTIALS_PATH, 'utf-8'))
const auth = new google.auth.GoogleAuth({
  credentials: kf,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
const sheets = google.sheets({ version: 'v4', auth })

function normalizeDate(s) {
  const m = String(s).match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/)
  return m ? `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}` : ''
}

async function findBlockRange(spreadsheetId, sheetTitle, targetDate) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!A1:F`,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  const rows = res.data.values || []
  let dateRow = -1
  for (let i = 0; i < rows.length; i++) {
    const b = (rows[i][1] || '').toString().trim().toLowerCase()
    if (b !== 'date') continue
    const dv = (rows[i].slice(2) || []).map(normalizeDate).find(v => v !== '')
    if (dv === targetDate) { dateRow = i + 1; break }
  }
  if (dateRow === -1) return null
  // Find end of block: first empty presenter row after the header
  let endRow = dateRow + 1
  for (let j = dateRow + 1; j < rows.length; j++) {
    const b = (rows[j][1] || '').toString().trim().toLowerCase()
    if (!b) break
    if (b === 'date') break
    endRow = j + 1
  }
  return { dateRow, endRow }  // both 1-indexed, endRow is last row inclusive
}

async function applyBlockFormatting(spreadsheetId, gid, dateRow, endRow) {
  const border = { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } }
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          mergeCells: {
            range: { sheetId: gid, startRowIndex: dateRow - 1, endRowIndex: dateRow, startColumnIndex: 2, endColumnIndex: 5 },
            mergeType: 'MERGE_ALL',
          },
        },
        {
          repeatCell: {
            range: { sheetId: gid, startRowIndex: dateRow - 1, endRowIndex: dateRow, startColumnIndex: 2, endColumnIndex: 5 },
            cell: { userEnteredFormat: { horizontalAlignment: 'CENTER' } },
            fields: 'userEnteredFormat.horizontalAlignment',
          },
        },
        {
          updateBorders: {
            range: { sheetId: gid, startRowIndex: dateRow - 1, endRowIndex: endRow, startColumnIndex: 1, endColumnIndex: 5 },
            top: border, bottom: border, left: border, right: border,
            innerHorizontal: border, innerVertical: border,
          },
        },
      ],
    },
  })
}

async function main() {
  const sid = process.env.PAPER_LIST_SHEET_ID
  const gid = parseInt(process.env.PAPER_LIST_SHEET_GID, 10)
  const ss = await sheets.spreadsheets.get({ spreadsheetId: sid })
  const sheetTitle = ss.data.sheets.find(s => s.properties.sheetId === gid).properties.title
  console.log('탭:', sheetTitle)

  for (const targetDate of ['2026-07-07', '2026-07-14']) {
    console.log(`\n──── ${targetDate} 블록 처리 ────`)
    const range = await findBlockRange(sid, sheetTitle, targetDate)
    if (!range) { console.log('  블록 없음, skip'); continue }
    console.log(`  블록 행: ${range.dateRow} ~ ${range.endRow}`)
    try {
      await applyBlockFormatting(sid, gid, range.dateRow, range.endRow)
      console.log('  ✓ 테두리 + Date 셀 병합 완료')
    } catch (e) {
      // If already merged, skip merge but continue borders
      console.log(`  ⚠ 일부 실패: ${e.message}`)
    }
  }

  // Patch 07-07 현상미 row with RA-L, 2021
  console.log('\n──── 07-07 현상미 행 patch ────')
  const range = await findBlockRange(sid, sheetTitle, '2026-07-07')
  if (!range) { console.log('  07-07 블록 없음'); return }
  const rowsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sid,
    range: `'${sheetTitle}'!B${range.dateRow + 2}:E${range.endRow}`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  const rows = rowsRes.data.values || []
  let hyunRow = -1
  for (let i = 0; i < rows.length; i++) {
    if ((rows[i][0] || '').toString().trim() === '현상미') { hyunRow = range.dateRow + 2 + i; break }
  }
  if (hyunRow === -1) { console.log('  현상미 행 없음'); return }
  console.log(`  현상미 row: ${hyunRow}, D/E 채우기 (RA-L / 2021)`)
  await sheets.spreadsheets.values.update({
    spreadsheetId: sid,
    range: `'${sheetTitle}'!D${hyunRow}:E${hyunRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['RA-L', '2021']] },
  })
  console.log('  ✓ 완료')
}

main().catch(e => { console.error(e); process.exit(1) })
