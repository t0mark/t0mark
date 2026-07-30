// Standalone parser test — mirrors lib/seminar/slides.ts logic in plain JS.
// Doesn't touch the deployed server. Tests parsing against all seminar files.

require('dotenv').config({ path: '.env.local' })
const { google } = require('googleapis')
const fs = require('fs')

const credPath = process.env.GOOGLE_CREDENTIALS_PATH
const keyFile = JSON.parse(fs.readFileSync(credPath, 'utf-8'))
const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/presentations.readonly',
  ],
})
const drive = google.drive({ version: 'v3', auth })
const slides = google.slides({ version: 'v1', auth })

const FILE_NAME_PATTERN = /(\d{4})\.(\d{2})\.(\d{2})\s*세미나/
const YEAR_RE = /\b(19\d{2}|20\d{2})\b/
const VENUE_TOKENS = [
  'arXiv', 'NeurIPS', 'ICML', 'CVPR', 'ICCV', 'ECCV', 'ACL', 'EMNLP',
  'ICLR', 'AAAI', 'IJCAI', 'NAACL', 'SIGGRAPH', 'SIGKDD', 'WACV', 'BMVC',
  '3DV', 'IROS', 'ICRA', 'RSS', 'CoRL', 'Humanoids',
  'RA-L', 'T-RO', 'IJRR', 'T-ITS', 'T-PAMI', 'T-IV', 'T-IE',
  'JMLR', 'TMLR', 'Nature', 'Science',
]

function extractVenueYear(text) {
  const yearMatch = text.match(YEAR_RE)
  const year = yearMatch ? yearMatch[1] : ''
  let venue = ''
  const lc = text.toLowerCase()
  for (const v of VENUE_TOKENS) if (lc.includes(v.toLowerCase())) { venue = v; break }
  return { venue, year }
}

const HANGUL_NAME_RE = /[가-힣]{2,4}/g
const PRESENTER_PREFIX_RE = /^(?:발표자|Presenter|이름|Name)\s*[:：-]?\s*/i
function extractPresenter(lines) {
  for (const line of lines) {
    const cleaned = line.replace(PRESENTER_PREFIX_RE, '').trim()
    const m = cleaned.match(HANGUL_NAME_RE)
    if (m && m.length > 0) return m[0]
  }
  return ''
}

function findAuthorStartAtEnd(text) {
  const t = text.trimEnd()
  const m = t.match(/([A-Z][a-z]+\s+[A-Z][a-zA-Z]+)\s*$/)
  return m && typeof m.index === 'number' ? m.index : -1
}

function stripAuthorList(title) {
  let t = title
  const memberIdx = t.search(/[,\s]+(?:Student\s+)?Member\s*,?\s*IEEE/i)
  if (memberIdx > 0) {
    const before = t.slice(0, memberIdx)
    const authorStart = findAuthorStartAtEnd(before)
    t = t.slice(0, authorStart > 20 ? authorStart : memberIdx)
  }
  const andIdx = t.search(/,\s*and\s+[A-Z][a-z]+/)
  if (andIdx > 0) t = t.slice(0, andIdx)
  const nameStart = t.match(/([a-z])([A-Z][a-z]+\s+[A-Z][a-zA-Z])/)
  if (nameStart && typeof nameStart.index === 'number') {
    const cutAt = nameStart.index + 1
    const tail = t.slice(cutAt)
    const listy = tail.length > 15 &&
      (/,/.test(tail) || ((tail.match(/[A-Z][a-z]+/g) || []).length >= 3))
    if (cutAt > 20 && listy) t = t.slice(0, cutAt)
  }
  const listCommaIdx = t.search(/[A-Z][a-z]+\s+[A-Z][a-zA-Z]+[\d,\s]*,\s*[A-Z][a-z]+\s+[A-Z][a-zA-Z]/)
  if (listCommaIdx > 30) t = t.slice(0, listCommaIdx)
  const parts = t.split(/\s*\|\s*/)
  if (parts.length > 1) {
    const kept = []
    for (const p of parts) {
      const s = p.trim()
      const nameCount = (s.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/g) || []).length
      const commaCount = (s.match(/,/g) || []).length
      if (nameCount >= 2 && commaCount >= 1) break
      kept.push(p)
    }
    if (kept.length > 0) t = kept.join(' ').trim()
  }
  return t.trim()
}

function extractTitleLines(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return ''
  const kept = [lines[0]]
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const commaCount = (line.match(/,/g) || []).length
    const nameCount = (line.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/g) || []).length
    if (commaCount >= 1 && nameCount >= 2) break
    kept.push(line)
  }
  return kept.join(' ')
}

async function extractSlides(fileId) {
  const res = await slides.presentations.get({ presentationId: fileId })
  const pres = res.data
  const ph = pres.pageSize?.height?.magnitude ?? 5143500
  const out = []
  ;(pres.slides || []).forEach((slide, idx) => {
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
      const placeholderType = shape.placeholder?.type ?? null
      els.push({ text: combined, y, placeholderType })
    }
    els.sort((a, b) => a.y - b.y)
    out.push({ slideIndex: idx + 1, elements: els, pageHeight: ph })
  })
  return out
}

function parseSlideToPaper(dump) {
  const ph = dump.pageHeight
  const topEls = dump.elements.filter(e => e.y < ph * 0.15)
  const midEls = dump.elements.filter(e => e.y >= ph * 0.15 && e.y < ph * 0.80)
  const botEls = dump.elements.filter(e => e.y >= ph * 0.80)
  const botLines = botEls.flatMap(e => e.text.split('\n'))
  const presenter = extractPresenter(botLines)
  const titleCandidates = topEls.map(e => extractTitleLines(e.text))
  let title = ''
  if (titleCandidates.length > 0) {
    title = titleCandidates.reduce((a, b) => a.length >= b.length ? a : b)
  }
  let venue = '', year = ''
  const searchTexts = [...topEls, ...midEls.slice(0, 3)].map(e => e.text.replace(/\n/g, ' '))
  for (const t of searchTexts) {
    const r = extractVenueYear(t)
    if (!venue && r.venue) venue = r.venue
    if (!year && r.year) year = r.year
    if (venue && year) break
  }
  if (venue) title = title.replace(new RegExp(venue, 'gi'), '')
  if (year) title = title.replace(new RegExp(`\\b${year}\\b`, 'g'), '')
  title = stripAuthorList(title)
  title = title.replace(/[()\[\]]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!title && !presenter) return null
  return { title, venue, year, presenter }
}

function dedupePapers(papers) {
  const byPresenter = new Map()
  for (const p of papers) {
    const name = (p.presenter || '').trim()
    if (!name) continue
    if (!byPresenter.has(name)) byPresenter.set(name, [])
    byPresenter.get(name).push(p)
  }
  const out = []
  for (const group of byPresenter.values()) {
    if (group.length < 2) continue
    let best = group[0]
    for (const p of group) if ((p.title || '').length > (best.title || '').length) best = p
    const venue = (group.find(p => p.venue) || {}).venue || best.venue
    const year = (group.find(p => p.year) || {}).year || best.year
    out.push({ ...best, venue, year })
  }
  return out
}

async function main() {
  const folderId = process.env.SEMINAR_FOLDER_ID
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, modifiedTime)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 100,
  })
  const files = (res.data.files || [])
    .filter(f => FILE_NAME_PATTERN.test(f.name))
    .map(f => ({ id: f.id, name: f.name, date: (() => {
      const m = f.name.match(FILE_NAME_PATTERN); return `${m[1]}-${m[2]}-${m[3]}`
    })() }))
  files.sort((a, b) => (a.date < b.date ? 1 : -1))

  console.log(`Found ${files.length} seminar files. Testing recent 5:\n`)
  const targets = files.slice(0, 5)
  for (const f of targets) {
    console.log(`\n══════════════════════════════════════════`)
    console.log(`FILE: ${f.name}  (${f.date})`)
    console.log(`══════════════════════════════════════════`)
    try {
      const dumps = await extractSlides(f.id)
      const raw = []
      for (const d of dumps) {
        const p = parseSlideToPaper(d)
        if (p) raw.push(p)
      }
      const unique = dedupePapers(raw)
      console.log(`Slides: ${dumps.length}  Papers (after dedupe): ${unique.length}`)
      for (const p of unique) {
        const v = (p.venue || p.year) ? `${p.venue || '?'} ${p.year || '?'}` : '—'
        console.log(`  ${p.presenter.padEnd(4)} | ${p.title || '(empty)'} | ${v}`)
      }
    } catch (e) {
      console.log(`  ERROR: ${e.message}`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
