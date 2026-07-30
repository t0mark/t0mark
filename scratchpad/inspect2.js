require('dotenv').config({ path: '.env.local' })
const { google } = require('googleapis')
const fs = require('fs')

async function main() {
  const credPath = process.env.GOOGLE_CREDENTIALS_PATH
  const keyFile = JSON.parse(fs.readFileSync(credPath, 'utf-8'))
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ['https://www.googleapis.com/auth/presentations.readonly'],
  })
  const slides = google.slides({ version: 'v1', auth })
  const presId = '1jJzmln9cF_cW-dNdyrD_vyb3OOLQr_8lXA7c2YWnCjA'
  const pres = await slides.presentations.get({ presentationId: presId })
  const pageHeight = pres.data.pageSize?.height?.magnitude ?? 5143500

  // sample several slides across the deck
  const indices = [7, 10, 15, 20, 25, 30, 35, 40]
  for (const idx of indices) {
    const slide = pres.data.slides[idx]
    if (!slide) continue
    console.log(`\n=== SLIDE ${idx + 1} ===`)
    for (const el of slide.pageElements || []) {
      const shape = el.shape
      if (!shape?.text) continue
      const parts = []
      for (const te of shape.text.textElements || []) {
        if (te.textRun?.content) parts.push(te.textRun.content)
      }
      const text = parts.join('').replace(/\n/g, ' | ').trim()
      if (!text) continue
      const y = el.transform?.translateY ?? 0
      const yPct = ((y / pageHeight) * 100).toFixed(1)
      console.log(` PH=${shape.placeholder?.type || '(none)'.padEnd(8)}  Y=${yPct.padStart(5)}%  Text=${text.slice(0, 140)}`)
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
