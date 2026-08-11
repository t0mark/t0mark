// Test both bug fixes end-to-end without touching the deployed server.
// (1) Non-existent date → clear error
// (2) Existing file but missing block → auto-create block + write

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

async function findSeminarFile(folderId, dateHint) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 100,
  })
  const candidates = []
  for (const f of res.data.files || []) {
    const m = f.name.match(FILE_NAME_PATTERN)
    if (!m) continue
    candidates.push({ id: f.id, name: f.name, date: `${m[1]}-${m[2]}-${m[3]}` })
  }
  if (candidates.length === 0) return null
  if (dateHint) return candidates.find(c => c.date === dateHint) || null
  candidates.sort((a, b) => a.date < b.date ? 1 : -1)
  return candidates[0]
}

function normalizeDate(s) {
  const m = String(s).match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/)
  if (!m) return ''
  return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`
}

async function readAllRows(spreadsheetId, sheetTitle) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!A1:Z`,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  return (res.data.values || []).map((row, i) => ({ row: i + 1, cells: row.map(c => c == null ? '' : String(c)) }))
}

async function findBlockByDate(spreadsheetId, sheetTitle, targetDate) {
  const rows = await readAllRows(spreadsheetId, sheetTitle)
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].cells
    const b = (cells[1] || '').trim().toLowerCase()
    if (b !== 'date') continue
    const dateVal = cells.slice(2).map(normalizeDate).find(v => v !== '')
    if (dateVal !== targetDate) continue
    const dateRow = rows[i].row
    const presenterRows = []
    for (let j = i + 2; j < rows.length; j++) {
      const bj = (rows[j].cells[1] || '').trim()
      if (!bj) break
      if (bj.toLowerCase() === 'date') break
      presenterRows.push({ row: rows[j].row, name: bj })
    }
    return { date: targetDate, dateRow, presenterRows }
  }
  return null
}

async function getLatestBlockRoster(spreadsheetId, sheetTitle) {
  const rows = await readAllRows(spreadsheetId, sheetTitle)
  let lastDateIdx = -1
  for (let i = 0; i < rows.length; i++) {
    const b = (rows[i].cells[1] || '').trim().toLowerCase()
    if (b === 'date') lastDateIdx = i
  }
  if (lastDateIdx === -1) return []
  const roster = []
  for (let j = lastDateIdx + 2; j < rows.length; j++) {
    const bj = (rows[j].cells[1] || '').trim()
    if (!bj) break
    if (bj.toLowerCase() === 'date') break
    if (bj.toLowerCase() === 'presenter') continue
    roster.push(bj)
  }
  return roster
}

async function createBlock(spreadsheetId, sheetTitle, targetDate, presenters) {
  const info = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!A1:F`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  const values = info.data.values || []
  const lastRow = values.length
  const dateRow = lastRow + 3
  const headerRow = dateRow + 1
  const rowsToWrite = [
    ['', 'Date', targetDate],
    ['', 'Presenter', 'Paper Title', 'Journal/Conference', 'Year'],
    ...presenters.map(name => ['', name]),
  ]
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!A${dateRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rowsToWrite },
  })
  return {
    date: targetDate,
    dateRow,
    presenterRows: presenters.map((name, i) => ({ row: headerRow + 1 + i, name })),
  }
}

// ─── Slide + GPT (mirrors lib/seminar) ────────────────────────
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
      const y = el.transform?.translateY ?? 0
      els.push({ text: combined, y })
    }
    els.sort((a, b) => a.y - b.y)
    out.push({ elements: els, pageHeight: ph })
  })
  return out
}

function extractPresenter(lines) {
  for (const line of lines) {
    const m = line.trim().match(HANGUL_NAME_RE)
    if (m && m.length > 0) return m[0]
  }
  return ''
}

function groupSlidesByPresenter(dumps) {
  const map = new Map()
  for (const d of dumps) {
    const ph = d.pageHeight
    const topEls = d.elements.filter(e => e.y < ph * 0.20)
    const botEls = d.elements.filter(e => e.y >= ph * 0.80)
    const presenter = extractPresenter(botEls.flatMap(e => e.text.split('\n')))
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
- title: strip author names, affiliations, footnotes (1,2,*), "Member IEEE", university names. "" if none.
- venue: standard short abbreviations only ("NeurIPS", "CVPR", "ICRA", "RSS", "T-RO", "RA-L", "arXiv", "AAAI", "ICLR", "ICML", "ICCV", "ECCV", "IROS", "CoRL", "WACV", "BMVC", "T-ITS", "T-PAMI", "T-IM", "IJRR", "IJCV" ...). No IEEE/ACM prefix. Full names → abbreviation. "" if unclear.
- year: 4-digit only. "" if none.`

const VENUE_CANONICAL = { arxiv: 'arXiv', aaai: 'AAAI', neurips: 'NeurIPS', cvpr: 'CVPR', iccv: 'ICCV', eccv: 'ECCV', iclr: 'ICLR', icml: 'ICML', iros: 'IROS', icra: 'ICRA', rss: 'RSS', corl: 'CoRL', 'ra-l': 'RA-L', 't-ro': 'T-RO', 't-its': 'T-ITS', 't-pami': 'T-PAMI', 't-iv': 'T-IV', 't-im': 'T-IM', ijrr: 'IJRR', wacv: 'WACV', bmvc: 'BMVC', '3dv': '3DV', ijcai: 'IJCAI', acl: 'ACL', emnlp: 'EMNLP', naacl: 'NAACL', jmlr: 'JMLR', tmlr: 'TMLR', ijcv: 'IJCV', nature: 'Nature', science: 'Science' }
function normalizeVenue(raw) {
  if (!raw) return ''
  let v = raw.trim().replace(/^(?:IEEE|ACM)\s+/i, '').replace(/\s+(?:Workshop|Draft|Under\s+Review|Submitted).*$/i, '')
  const key = v.toLowerCase().replace(/\s+/g, '')
  if (VENUE_CANONICAL[key]) return VENUE_CANONICAL[key]
  const nh = key.replace(/-/g, '')
  for (const [k, c] of Object.entries(VENUE_CANONICAL)) if (k.replace(/-/g, '') === nh) return c
  return v
}

async function extractPapersWithGPT(presenters) {
  const res = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(presenters.map(p => ({ presenter: p.presenter, slides: p.slideTexts.slice(0, 8) }))) },
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

// ─── Main tests ─────────────────────────────────
async function main() {
  const folderId = process.env.SEMINAR_FOLDER_ID
  const spreadsheetId = process.env.PAPER_LIST_SHEET_ID
  const gid = parseInt(process.env.PAPER_LIST_SHEET_GID, 10)
  const ss = await sheets.spreadsheets.get({ spreadsheetId })
  const sheetTitle = ss.data.sheets.find(s => s.properties.sheetId === gid).properties.title

  // ── TEST 1: non-existent date ──
  console.log('════ TEST 1: 존재하지 않는 날짜 (2099-01-01) ════')
  const f1 = await findSeminarFile(folderId, '2099-01-01')
  if (f1) {
    console.log(`  ✗ FAIL: 파일 반환됨: ${f1.name}`)
  } else {
    console.log('  ✓ PASS: null 반환 (에러로 던져질 것)')
  }

  // ── TEST 2: existing file, no block → auto-create ──
  console.log('\n════ TEST 2: 파일 있는데 블록 없는 날짜 (2026-07-14) → 자동 생성 ════')
  const target = '2026-07-14'
  const f2 = await findSeminarFile(folderId, target)
  if (!f2) { console.log('  파일 없음, skip'); return }
  console.log(`  파일: ${f2.name}`)

  // Check block doesn't exist
  const existingBlock = await findBlockByDate(spreadsheetId, sheetTitle, target)
  if (existingBlock) {
    console.log(`  ⚠️  블록이 이미 있음 (row ${existingBlock.dateRow}). 테스트 조건 안 맞음, 다른 날짜 필요.`)
    return
  }
  console.log('  블록 없음 확인 ✓')

  console.log('  슬라이드 파싱 + GPT...')
  const dumps = await extractSlides(f2.id)
  const groups = groupSlidesByPresenter(dumps)
  const papers = await extractPapersWithGPT(groups)
  console.log(`  논문 ${papers.length}편 추출`)

  console.log('  이전 블록 발표자 명단 로드...')
  const roster = await getLatestBlockRoster(spreadsheetId, sheetTitle)
  const detected = papers.map(p => p.presenter).filter(Boolean)
  const unionSet = new Set([...roster, ...detected])
  const finalRoster = Array.from(unionSet)
  console.log(`  이전 블록: ${roster.length}명, 새 발표자 추가: ${finalRoster.length - roster.length}명, 최종: ${finalRoster.length}명`)
  console.log(`  → ${finalRoster.join(', ')}`)

  console.log('  블록 생성...')
  const newBlock = await createBlock(spreadsheetId, sheetTitle, target, finalRoster)
  console.log(`  ✓ 블록 생성됨 (Date row ${newBlock.dateRow})`)

  console.log('  매칭 + 쓰기...')
  const updates = []
  for (const pr of newBlock.presenterRows) {
    const paper = papers.find(p => p.presenter.trim() === pr.name.trim())
    if (paper) updates.push({ row: pr.row, paper })
  }
  const data = updates.map(u => ({
    range: `'${sheetTitle}'!C${u.row}:E${u.row}`,
    values: [[u.paper.title, u.paper.venue, u.paper.year]],
  }))
  const w = await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'USER_ENTERED', data },
  })
  console.log(`  ✓ ${w.data.totalUpdatedCells}개 셀 업데이트`)

  console.log('\n  검증: 새로 만들어진 블록 읽기...')
  const verify = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!B${newBlock.dateRow}:E${newBlock.dateRow + finalRoster.length + 2}`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  ;(verify.data.values || []).forEach(row => {
    console.log(`    ${(row[0] || '').padEnd(12)} | ${(row[1] || '').toString().slice(0, 55).padEnd(55)} | ${row[2] || '-'} | ${row[3] || '-'}`)
  })
}

main().catch(e => { console.error(e); process.exit(1) })
