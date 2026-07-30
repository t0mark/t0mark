require('dotenv').config({ path: '.env.local' })
const { google } = require('googleapis')
const fs = require('fs')

async function main() {
  const credPath = process.env.GOOGLE_CREDENTIALS_PATH
  const keyFile = JSON.parse(fs.readFileSync(credPath, 'utf-8'))
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })

  const sheetId = '1IiddKBT-2NOmJfJBHa-JBtXoVsYCtcvpPVg6tDRfy20'
  const tab = '26/02/13'
  const val = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${tab}'!A1:F500`,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  const rows = val.data.values || []
  const dates = []
  rows.forEach((row, i) => {
    const b = (row[1] || '').toString().trim().toLowerCase()
    if (b !== 'date') return
    for (let k = 2; k < row.length; k++) {
      const c = row[k]
      if (!c) continue
      const s = String(c)
      const m = s.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/)
      if (m) { dates.push({ row: i + 1, date: `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`, raw: s }); break }
    }
  })
  console.log('All date blocks in tab:')
  dates.forEach((d) => console.log(`  row ${d.row}: ${d.date} (raw="${d.raw}")`))
  const target = dates.find((d) => d.date === '2026-07-28')
  console.log('\n2026-07-28 block:', target ? `FOUND at row ${target.row}` : 'NOT FOUND')

  if (target) {
    console.log(`\n=== 2026-07-28 block preview ===`)
    for (let k = target.row - 1; k < target.row + 12 && k < rows.length; k++) {
      console.log(`row ${k + 1}:`, rows[k])
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
