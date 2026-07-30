require('dotenv').config({ path: '.env.local' })
const { google } = require('googleapis')
const fs = require('fs')

async function main() {
  const credPath = process.env.GOOGLE_CREDENTIALS_PATH
  const keyFile = JSON.parse(fs.readFileSync(credPath, 'utf-8'))
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/presentations.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
    ],
  })
  const slides = google.slides({ version: 'v1', auth })
  const sheets = google.sheets({ version: 'v4', auth })

  const presId = '1jJzmln9cF_cW-dNdyrD_vyb3OOLQr_8lXA7c2YWnCjA'
  const pres = await slides.presentations.get({ presentationId: presId })
  console.log('=== PRESENTATION ===')
  console.log('Title :', pres.data.title)
  console.log('PageSize:', JSON.stringify(pres.data.pageSize))
  console.log('Slides:', pres.data.slides?.length)

  for (let s = 0; s < Math.min(3, pres.data.slides?.length ?? 0); s++) {
    const slide = pres.data.slides[s]
    console.log(`\n=== SLIDE ${s + 1} ELEMENTS ===`)
    for (const el of slide.pageElements || []) {
      const shape = el.shape
      if (!shape?.text) continue
      const parts = []
      for (const te of shape.text.textElements || []) {
        if (te.textRun?.content) parts.push(te.textRun.content)
      }
      const text = parts.join('').replace(/\n/g, ' | ').trim()
      if (!text) continue
      console.log('---')
      console.log(' Placeholder:', shape.placeholder?.type || '(none)')
      console.log(' Y:', el.transform?.translateY, 'X:', el.transform?.translateX)
      console.log(' W:', el.size?.width?.magnitude, 'H:', el.size?.height?.magnitude)
      console.log(' Text:', text.slice(0, 220))
    }
  }

  const sheetId = '1IiddKBT-2NOmJfJBHa-JBtXoVsYCtcvpPVg6tDRfy20'
  const ss = await sheets.spreadsheets.get({ spreadsheetId: sheetId })
  console.log('\n=== SPREADSHEET TABS ===')
  for (const s of ss.data.sheets || []) {
    console.log(`  gid=${s.properties.sheetId}  title="${s.properties.title}"`)
  }

  // For the target gid, dump top 20 rows
  const targetGid = 1051028909
  const targetSheet = ss.data.sheets?.find(x => x.properties.sheetId === targetGid)
  if (targetSheet) {
    const title = targetSheet.properties.title
    const val = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'${title}'!A1:F30`,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    })
    console.log(`\n=== TAB "${title}" first 30 rows ===`)
    ;(val.data.values || []).forEach((row, i) => {
      console.log(`row ${i + 1}:`, row.map(c => c === undefined ? '' : String(c).slice(0, 60)))
    })
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
