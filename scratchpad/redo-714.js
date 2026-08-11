// Delete the wrongly-created 2026-07-14 block, then re-run with the fixed
// "only detected presenters" logic.

require('dotenv').config({ path: '.env.local' })
const { google } = require('googleapis')
const axios = require('axios')
const fs = require('fs')

const kf = JSON.parse(fs.readFileSync(process.env.GOOGLE_CREDENTIALS_PATH, 'utf-8'))
const auth = new google.auth.GoogleAuth({
  credentials: kf,
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

function normalizeDate(s) {
  const m = String(s).match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/)
  return m ? `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}` : ''
}

async function findFile(folderId, dateHint) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name)',
    supportsAllDrives: true, includeItemsFromAllDrives: true, pageSize: 100,
  })
  for (const f of res.data.files || []) {
    const m = f.name.match(FILE_NAME_PATTERN)
    if (!m) continue
    if (`${m[1]}-${m[2]}-${m[3]}` === dateHint) return { id: f.id, name: f.name, date: dateHint }
  }
  return null
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
      const combined = parts.join('').replace(/[ \t]+/g, ' ').replace(/\n+/g, '\n').replace(/\n\s+/g, '\n').replace(/\s+\n/g, '\n').trim()
      if (!combined) continue
      els.push({ text: combined, y: el.transform?.translateY ?? 0 })
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
    let presenter = ''
    for (const line of botEls.flatMap(e => e.text.split('\n'))) {
      const m = line.trim().match(HANGUL_NAME_RE)
      if (m && m.length > 0) { presenter = m[0]; break }
    }
    if (!presenter) continue
    const topText = topEls.map(e => e.text).filter(Boolean).join('\n---\n')
    if (!topText.trim()) continue
    if (!map.has(presenter)) map.set(presenter, [])
    map.get(presenter).push(topText)
  }
  const out = []
  for (const [presenter, texts] of map) {
    if (texts.length < 2) continue
    const seen = new Set(); const unique = []
    for (const t of texts) { const k = t.slice(0, 200); if (!seen.has(k)) { seen.add(k); unique.push(t) } }
    out.push({ presenter, slideTexts: unique })
  }
  return out
}

const SYSTEM_PROMPT = `You extract paper metadata from research-lab seminar slides. Each input describes ONE presenter presenting ONE paper across multiple slides.
Return ONLY JSON: { "papers": [ { "presenter": "<name>", "title": "<title>", "venue": "<venue>", "year": "<year>" }, ... ] }
Rules:
- Preserve presenter names verbatim.
- title: strip author names, affiliations, footnotes, "Member IEEE". "" if none.
- venue: standard short abbreviations only (NeurIPS, CVPR, ICRA, RSS, T-RO, RA-L, arXiv, AAAI, ICLR, ICML, ICCV, ECCV, IROS, CoRL, WACV, BMVC, T-ITS, T-PAMI, T-IM, IJRR, IJCV). No IEEE/ACM prefix. "" if unclear.
- year: 4-digit only. "" if none.`

const VENUE_CANONICAL = { arxiv:'arXiv',aaai:'AAAI',neurips:'NeurIPS',cvpr:'CVPR',iccv:'ICCV',eccv:'ECCV',iclr:'ICLR',icml:'ICML',iros:'IROS',icra:'ICRA',rss:'RSS',corl:'CoRL','ra-l':'RA-L','t-ro':'T-RO','t-its':'T-ITS','t-pami':'T-PAMI','t-iv':'T-IV','t-im':'T-IM',ijrr:'IJRR',wacv:'WACV',bmvc:'BMVC','3dv':'3DV',ijcai:'IJCAI',acl:'ACL',emnlp:'EMNLP',naacl:'NAACL',jmlr:'JMLR',tmlr:'TMLR',ijcv:'IJCV',nature:'Nature',science:'Science' }
function normalizeVenue(raw) {
  if (!raw) return ''
  let v = raw.trim().replace(/^(?:IEEE|ACM)\s+/i, '').replace(/\s+(?:Workshop|Draft|Under\s+Review|Submitted).*$/i, '')
  const key = v.toLowerCase().replace(/\s+/g, '')
  if (VENUE_CANONICAL[key]) return VENUE_CANONICAL[key]
  const nh = key.replace(/-/g, ''); for (const [k, c] of Object.entries(VENUE_CANONICAL)) if (k.replace(/-/g, '') === nh) return c
  return v
}

async function extractPapersWithGPT(groups) {
  const res = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(groups.map(g => ({ presenter: g.presenter, slides: g.slideTexts.slice(0, 8) }))) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  }, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    timeout: 60000,
  })
  const parsed = JSON.parse(res.data.choices[0].message.content ?? '{}')
  return (Array.isArray(parsed.papers) ? parsed.papers : []).map(p => ({
    presenter: String(p.presenter ?? '').trim(),
    title: String(p.title ?? '').trim(),
    venue: normalizeVenue(String(p.venue ?? '').trim()),
    year: String(p.year ?? '').trim(),
  }))
}

async function main() {
  const folderId = process.env.SEMINAR_FOLDER_ID
  const spreadsheetId = process.env.PAPER_LIST_SHEET_ID
  const gid = parseInt(process.env.PAPER_LIST_SHEET_GID, 10)
  const ss = await sheets.spreadsheets.get({ spreadsheetId })
  const sheetTitle = ss.data.sheets.find(s => s.properties.sheetId === gid).properties.title
  const target = '2026-07-14'

  // ── Step 1: find the 07-14 block ──
  console.log('▶ 기존 07-14 블록 찾기...')
  const rowsRes = await sheets.spreadsheets.values.get({
    spreadsheetId, range: `'${sheetTitle}'!A1:Z`,
    valueRenderOption: 'UNFORMATTED_VALUE', dateTimeRenderOption: 'FORMATTED_STRING',
  })
  const rows = rowsRes.data.values || []
  let dateRow = -1
  for (let i = 0; i < rows.length; i++) {
    const b = (rows[i][1] || '').toString().trim().toLowerCase()
    if (b !== 'date') continue
    const dv = (rows[i].slice(2) || []).map(normalizeDate).find(v => v !== '')
    if (dv === target) { dateRow = i + 1; break }
  }
  if (dateRow === -1) {
    console.log('  블록 없음 — skip 삭제')
  } else {
    // Find end of block: scan until 2 consecutive empty rows or next Date
    let endRow = dateRow + 1  // header
    for (let j = dateRow + 1; j < rows.length; j++) {
      const b = (rows[j][1] || '').toString().trim().toLowerCase()
      if (!b) { endRow = j; break }  // first empty presenter row → end
      if (b === 'date') { endRow = j; break }
      endRow = j + 1
    }
    console.log(`  블록: row ${dateRow} ~ ${endRow} → 삭제`)

    // Delete rows (batchUpdate deleteDimension). Sheet API is 0-indexed and end exclusive.
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: gid,
              dimension: 'ROWS',
              startIndex: dateRow - 1,   // convert to 0-index
              endIndex: endRow,          // exclusive
            },
          },
        }],
      },
    })
    console.log(`  ✓ ${endRow - (dateRow - 1)}행 삭제됨`)
  }

  // ── Step 2: re-run parse ──
  console.log('\n▶ 슬라이드 파싱 + GPT (2026-07-14)...')
  const file = await findFile(folderId, target)
  if (!file) throw new Error('파일 없음')
  const dumps = await extractSlides(file.id)
  const groups = groupSlidesByPresenter(dumps)
  const papers = await extractPapersWithGPT(groups)
  console.log(`  발표자 ${papers.length}명 (실제 발표한 사람만):`)
  papers.forEach(p => console.log(`    ${p.presenter} | ${p.title} | ${p.venue} ${p.year}`))

  // ── Step 3: create new block with ONLY the actual presenters ──
  const info = await sheets.spreadsheets.values.get({
    spreadsheetId, range: `'${sheetTitle}'!A1:F`, valueRenderOption: 'UNFORMATTED_VALUE',
  })
  const lastRow = (info.data.values || []).length
  const newDateRow = lastRow + 3
  const newHeaderRow = newDateRow + 1
  const presenters = papers.map(p => p.presenter)
  const rowsToWrite = [
    ['', 'Date', target],
    ['', 'Presenter', 'Paper Title', 'Journal/Conference', 'Year'],
    ...papers.map(p => ['', p.presenter, p.title, p.venue, p.year]),
  ]
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!A${newDateRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rowsToWrite },
  })
  console.log(`\n  ✓ 새 블록 생성 (Date row ${newDateRow}, 발표자 ${presenters.length}명)`)

  // ── Step 4: verify ──
  console.log('\n▶ 결과 확인:')
  const verify = await sheets.spreadsheets.values.get({
    spreadsheetId, range: `'${sheetTitle}'!B${newDateRow}:E${newDateRow + presenters.length + 2}`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  ;(verify.data.values || []).forEach(row => {
    console.log(`    ${(row[0] || '').padEnd(12)} | ${(row[1] || '').toString().slice(0, 60).padEnd(60)} | ${row[2] || '-'} | ${row[3] || '-'}`)
  })
}

main().catch(e => { console.error(e); process.exit(1) })
