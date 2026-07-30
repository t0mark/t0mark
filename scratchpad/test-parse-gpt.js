// Test the GPT-based parser against multiple weeks.
// Does NOT touch the deployed server — pure Google API + OpenAI direct calls.

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
  ],
})
const drive = google.drive({ version: 'v3', auth })
const slides = google.slides({ version: 'v1', auth })

const FILE_NAME_PATTERN = /(\d{4})\.(\d{2})\.(\d{2})\s*세미나/
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
      els.push({ text: combined, y })
    }
    els.sort((a, b) => a.y - b.y)
    out.push({ slideIndex: idx + 1, elements: els, pageHeight: ph })
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

const MODEL = 'gpt-4o-mini'
const SYSTEM_PROMPT = `You extract paper metadata from research-lab seminar slides. Each input describes ONE presenter presenting ONE paper across multiple slides.

Return ONLY JSON in the exact shape:
{ "papers": [ { "presenter": "<name>", "title": "<paper title>", "venue": "<venue>", "year": "<year>" }, ... ] }

Rules:
- One entry per input presenter. Preserve presenter names verbatim.
- title: the actual paper title from the slides. STRIP: author names, affiliation numbers, footnote markers (1, 2, *), asterisks, "Member IEEE" / "Student Member", email addresses, university names. Keep colons, subtitles, hyphenated technical terms. Do NOT invent a title if the slides have none — return "".
- venue: publication venue ONLY, using standard short abbreviations from this exact list (spelling and casing must match exactly):
  "NeurIPS", "ICML", "CVPR", "ICCV", "ECCV", "ICLR", "AAAI", "IROS", "ICRA", "RSS", "CoRL", "RA-L", "T-RO", "T-ITS", "T-PAMI", "T-IV", "T-IM", "IJRR", "arXiv", "WACV", "BMVC", "3DV", "IJCAI", "ACL", "EMNLP", "NAACL", "JMLR", "TMLR", "Nature", "Science", "IJCV"
  Rules for venue:
  - DO NOT include "IEEE" / "ACM" prefix. "IEEE T-RO" → "T-RO". "IEEE TRANSACTIONS ON ROBOTICS" → "T-RO".
  - DO NOT include "Draft", "Under review", "Submitted to", or "Workshop" — just the venue.
  - Full journal names: "IEEE Transactions on Robotics" → "T-RO". "IEEE Transactions on Intelligent Transportation Systems" → "T-ITS". "IEEE Robotics and Automation Letters" → "RA-L". "IEEE Transactions on Instrumentation and Measurement" → "T-IM".
  - If unsure or the venue is unusual and doesn't map to the list, return "".
- year: 4-digit year visible on the slides. "" if none.
- Return an empty title if the slides look like an award / announcement / non-paper session (e.g. only "Best Paper Finalist" text with no actual paper content).`

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
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not set')
  if (presenters.length === 0) return []
  const payload = presenters.map(p => ({
    presenter: p.presenter,
    slides: p.slideTexts.slice(0, 8),
  }))
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: MODEL,
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
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 60000,
    }
  )
  const content = res.data.choices?.[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(content)
  const papers = Array.isArray(parsed.papers) ? parsed.papers : []
  return papers.map(p => ({
    presenter: String(p.presenter ?? '').trim(),
    title: String(p.title ?? '').trim(),
    venue: normalizeVenue(String(p.venue ?? '').trim()),
    year: String(p.year ?? '').trim(),
  }))
}

async function main() {
  const folderId = process.env.SEMINAR_FOLDER_ID
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name)',
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

  const targets = files.slice(0, 5)
  console.log(`Testing ${targets.length} recent files with GPT-4o-mini extractor.\n`)

  for (const f of targets) {
    console.log(`\n══════════════════════════════════════════`)
    console.log(`FILE: ${f.name}  (${f.date})`)
    console.log(`══════════════════════════════════════════`)
    try {
      const dumps = await extractSlides(f.id)
      const groups = groupSlidesByPresenter(dumps)
      const papers = await extractPapersWithGPT(groups)
      console.log(`Slides: ${dumps.length}  Presenters: ${groups.length}  Papers: ${papers.length}`)
      for (const p of papers) {
        const v = (p.venue || p.year) ? `${p.venue || '?'} ${p.year || '?'}` : '—'
        console.log(`  ${(p.presenter || '?').padEnd(4)} | ${p.title || '(none)'} | ${v}`)
      }
    } catch (e) {
      console.log(`  ERROR: ${e.message}`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
