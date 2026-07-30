// Actually write the 2026-07-28 papers to the sheet.
// Uses the same GPT extraction + sheet write logic as the app.

require('dotenv').config({ path: '.env.local' })
const { google } = require('googleapis')
const axios = require('axios')
const fs = require('fs')

const credPath = process.env.GOOGLE_CREDENTIALS_PATH
const keyFile = JSON.parse(fs.readFileSync(credPath, 'utf-8'))
const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/presentations.readonly',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
})
const drive = google.drive({ version: 'v3', auth })
const slides = google.slides({ version: 'v1', auth })
const sheets = google.sheets({ version: 'v4', auth })

const FILE_NAME_PATTERN = /(\d{4})\.(\d{2})\.(\d{2})\s*세미나/
const HANGUL_NAME_RE = /[가-힣]{2,4}/g

function extractPresenter(lines) {
  for (const line of lines) {
    const m = line.trim().match(HANGUL_NAME_RE)
    if (m && m.length > 0) return m[0]
  }
  return ''
}

async function extractSlides(fileId) {
  const res = await slides.presentations.get({ presentationId: fileId })
  const pres = res.data
  const ph = pres.pageSize?.height?.magnitude ?? 5143500
  const out = []
  ;(pres.slides || []).forEach((slide) => {
    const els = []
    for (const el of slide.pageElements || []) {
      const shape = el.shape
      if (!shape?.text) continue
      const parts = []
      for (const te of shape.text.textElements || []) {
        if (te.textRun?.content) parts.push(te.textRun.content)
      }
      const combined = parts.join('')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n+/g, '\n')
        .replace(/\n\s+/g, '\n')
        .replace(/\s+\n/g, '\n')
        .trim()
      if (!combined) continue
      const y = el.transform?.translateY ?? 0
      els.push({ text: combined, y })
    }
    els.sort((a, b) => a.y - b.y)
    out.push({ elements: els, pageHeight: ph })
  })
  return out
}

function groupSlidesByPresenter(dumps) {
  const map = new Map()
  for (const d of dumps) {
    const ph = d.pageHeight
    const topEls = d.elements.filter(e => e.y < ph * 0.20)
    const botEls = d.elements.filter(e => e.y >= ph * 0.80)
    const botLines = botEls.flatMap(e => e.text.split('\n'))
    const presenter = extractPresenter(botLines)
    if (!presenter) continue
    const topText = topEls.map(e => e.text).filter(Boolean).join('\n---\n')
    if (!topText.trim()) continue
    if (!map.has(presenter)) map.set(presenter, [])
    map.get(presenter).push(topText)
  }
  const out = []
  for (const [presenter, texts] of map) {
    if (texts.length < 2) continue
    const seen = new Set()
    const unique = []
    for (const t of texts) {
      const key = t.slice(0, 200)
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(t)
    }
    out.push({ presenter, slideTexts: unique })
  }
  return out
}

const SYSTEM_PROMPT = `You extract paper metadata from research-lab seminar slides. Each input describes ONE presenter presenting ONE paper across multiple slides.

Return ONLY JSON in the exact shape:
{ "papers": [ { "presenter": "<name>", "title": "<paper title>", "venue": "<venue>", "year": "<year>" }, ... ] }

Rules:
- One entry per input presenter. Preserve presenter names verbatim.
- title: the actual paper title. STRIP author names, affiliation numbers, footnotes (1, 2, *), "Member IEEE", university names. Keep colons/subtitles/hyphens. Return "" if no title.
- venue: use standard short abbreviations only: "NeurIPS", "ICML", "CVPR", "ICCV", "ECCV", "ICLR", "AAAI", "IROS", "ICRA", "RSS", "CoRL", "RA-L", "T-RO", "T-ITS", "T-PAMI", "T-IV", "T-IM", "IJRR", "arXiv", "WACV", "BMVC", "3DV", "IJCAI", "ACL", "EMNLP", "NAACL", "JMLR", "TMLR", "Nature", "Science", "IJCV". Strip "IEEE"/"ACM" prefix. Full journal names → abbreviation. "" if unclear.
- year: 4-digit year. "" if none.`

const VENUE_CANONICAL = {
  arxiv: 'arXiv', aaai: 'AAAI', neurips: 'NeurIPS', cvpr: 'CVPR',
  iccv: 'ICCV', eccv: 'ECCV', iclr: 'ICLR', icml: 'ICML',
  iros: 'IROS', icra: 'ICRA', rss: 'RSS', corl: 'CoRL',
  'ra-l': 'RA-L', 't-ro': 'T-RO', 't-its': 'T-ITS', 't-pami': 'T-PAMI',
  't-iv': 'T-IV', 't-im': 'T-IM', ijrr: 'IJRR', wacv: 'WACV',
  bmvc: 'BMVC', '3dv': '3DV', ijcai: 'IJCAI', acl: 'ACL',
  emnlp: 'EMNLP', naacl: 'NAACL', jmlr: 'JMLR', tmlr: 'TMLR',
  ijcv: 'IJCV', nature: 'Nature', science: 'Science',
}
function normalizeVenue(raw) {
  if (!raw) return ''
  let v = raw.trim()
    .replace(/^(?:IEEE|ACM)\s+/i, '')
    .replace(/\s+(?:Workshop|Draft|Under\s+Review|Submitted).*$/i, '')
  const key = v.toLowerCase().replace(/\s+/g, '')
  if (VENUE_CANONICAL[key]) return VENUE_CANONICAL[key]
  const noHyphen = key.replace(/-/g, '')
  for (const [k, c] of Object.entries(VENUE_CANONICAL)) {
    if (k.replace(/-/g, '') === noHyphen) return c
  }
  return v
}

async function extractPapersWithGPT(presenters) {
  const payload = presenters.map(p => ({
    presenter: p.presenter,
    slides: p.slideTexts.slice(0, 8),
  }))
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(payload) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      timeout: 60000,
    }
  )
  const parsed = JSON.parse(res.data.choices[0].message.content ?? '{}')
  const papers = Array.isArray(parsed.papers) ? parsed.papers : []
  return papers.map(p => ({
    presenter: String(p.presenter ?? '').trim(),
    title: String(p.title ?? '').trim(),
    venue: normalizeVenue(String(p.venue ?? '').trim()),
    year: String(p.year ?? '').trim(),
  }))
}

function normalizeDate(s) {
  const m = String(s).match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/)
  if (!m) return ''
  return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`
}

async function findBlock(spreadsheetId, sheetTitle, targetDate) {
  const val = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!A1:F500`,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  const rows = val.data.values || []
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i]
    const b = String(cells[1] ?? '').trim().toLowerCase()
    if (b !== 'date') continue
    const dateVal = cells.slice(2).map(c => normalizeDate(c ?? '')).find(v => v !== '')
    if (dateVal !== targetDate) continue
    const dateRow = i + 1
    const presenterRows = []
    for (let j = i + 2; j < rows.length; j++) {
      const bj = String(rows[j][1] ?? '').trim()
      if (!bj) break
      if (bj.toLowerCase() === 'date') break
      presenterRows.push({ row: j + 1, name: bj })
    }
    return { dateRow, presenterRows }
  }
  return null
}

async function main() {
  const targetDate = '2026-07-28'
  const folderId = process.env.SEMINAR_FOLDER_ID
  const spreadsheetId = process.env.PAPER_LIST_SHEET_ID
  const gid = parseInt(process.env.PAPER_LIST_SHEET_GID, 10)

  console.log(`━━ 1) 세미나 파일 찾기 (${targetDate}) ━━`)
  const filesRes = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 100,
  })
  const targetName = targetDate.replace(/-/g, '.')  // 2026.07.28
  const file = (filesRes.data.files || []).find(f => f.name.includes(targetName))
  if (!file) throw new Error('세미나 파일 못 찾음')
  console.log(`   ${file.name} (${file.id})`)

  console.log('━━ 2) 슬라이드 파싱 + GPT 추출 ━━')
  const dumps = await extractSlides(file.id)
  const groups = groupSlidesByPresenter(dumps)
  const papers = await extractPapersWithGPT(groups)
  papers.forEach(p => console.log(`   ${p.presenter} | ${p.title} | ${p.venue} ${p.year}`))

  console.log('━━ 3) 시트 탭 확인 ━━')
  const ss = await sheets.spreadsheets.get({ spreadsheetId })
  const target = ss.data.sheets.find(s => s.properties.sheetId === gid)
  const sheetTitle = target.properties.title
  console.log(`   탭: ${sheetTitle}`)

  console.log('━━ 4) 블록 탐색 ━━')
  const block = await findBlock(spreadsheetId, sheetTitle, targetDate)
  if (!block) throw new Error('블록 못 찾음')
  console.log(`   Date row: ${block.dateRow}, presenters:`, block.presenterRows.map(r => `${r.row}=${r.name}`).join(', '))

  console.log('━━ 5) 매칭 ━━')
  const updates = []
  for (const pr of block.presenterRows) {
    const paper = papers.find(p => p.presenter.trim() === pr.name.trim())
    if (!paper) continue
    updates.push({
      row: pr.row,
      title: paper.title,
      venue: paper.venue,
      year: paper.year,
    })
  }
  updates.forEach(u => console.log(`   row ${u.row}: [${u.title}] [${u.venue}] [${u.year}]`))

  console.log('━━ 6) 시트에 실제 쓰기 ━━')
  const data = updates.map(u => ({
    range: `'${sheetTitle}'!C${u.row}:E${u.row}`,
    values: [[u.title, u.venue, u.year]],
  }))
  const writeRes = await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  })
  console.log(`   ✓ 업데이트된 셀 수: ${writeRes.data.totalUpdatedCells}`)

  console.log('━━ 7) 읽어서 검증 ━━')
  const verify = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!B${block.dateRow + 2}:E${block.dateRow + 12}`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  ;(verify.data.values || []).forEach(row => {
    console.log(`   ${(row[0] || '').padEnd(4)} | ${(row[1] || '').slice(0, 60)} | ${row[2] || '-'} | ${row[3] || '-'}`)
  })
}

main().catch(e => { console.error(e); process.exit(1) })
