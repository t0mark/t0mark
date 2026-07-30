export interface PresenterSlideTexts {
  presenter: string
  slideTexts: string[]
}

export interface ExtractedPaper {
  presenter: string
  title: string
  venue: string
  year: string
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

const VENUE_CANONICAL: Record<string, string> = {
  arxiv: 'arXiv',
  arxiv2: 'arXiv',
  ax: 'arXiv',
  aaai: 'AAAI',
  neurips: 'NeurIPS',
  cvpr: 'CVPR',
  iccv: 'ICCV',
  eccv: 'ECCV',
  iclr: 'ICLR',
  icml: 'ICML',
  iros: 'IROS',
  icra: 'ICRA',
  rss: 'RSS',
  corl: 'CoRL',
  'ra-l': 'RA-L',
  't-ro': 'T-RO',
  't-its': 'T-ITS',
  't-pami': 'T-PAMI',
  't-iv': 'T-IV',
  't-im': 'T-IM',
  ijrr: 'IJRR',
  wacv: 'WACV',
  bmvc: 'BMVC',
  '3dv': '3DV',
  ijcai: 'IJCAI',
  acl: 'ACL',
  emnlp: 'EMNLP',
  naacl: 'NAACL',
  jmlr: 'JMLR',
  tmlr: 'TMLR',
  ijcv: 'IJCV',
  nature: 'Nature',
  science: 'Science',
}

function normalizeVenue(raw: string): string {
  if (!raw) return ''
  let v = raw.trim()
  // Strip common prefixes/suffixes
  v = v.replace(/^(?:IEEE|ACM)\s+/i, '')
  v = v.replace(/\s+(?:Workshop|Draft|Under\s+Review|Submitted).*$/i, '')
  const key = v.toLowerCase().replace(/\s+/g, '')
  if (VENUE_CANONICAL[key]) return VENUE_CANONICAL[key]
  // Try matching without hyphens (T-RO vs TRO)
  const noHyphen = key.replace(/-/g, '')
  for (const [k, canonical] of Object.entries(VENUE_CANONICAL)) {
    if (k.replace(/-/g, '') === noHyphen) return canonical
  }
  return v
}

export async function extractPapersWithGPT(
  presenters: PresenterSlideTexts[]
): Promise<ExtractedPaper[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  if (presenters.length === 0) return []

  const payload = presenters.map((p) => ({
    presenter: p.presenter,
    slides: p.slideTexts.slice(0, 8),
  }))

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(payload) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`OpenAI API ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(content) as { papers?: unknown }
  if (!Array.isArray(parsed.papers)) return []

  const out: ExtractedPaper[] = []
  for (const p of parsed.papers) {
    if (!p || typeof p !== 'object') continue
    const obj = p as Record<string, unknown>
    out.push({
      presenter: String(obj.presenter ?? '').trim(),
      title: String(obj.title ?? '').trim(),
      venue: normalizeVenue(String(obj.venue ?? '').trim()),
      year: String(obj.year ?? '').trim(),
    })
  }
  return out
}
