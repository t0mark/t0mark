import { getDrive, getSlides } from '@/lib/google'
import type { SlideDump, SlideElement } from './types'
import type { PresenterSlideTexts } from './gpt'

const FILE_NAME_PATTERN = /(\d{4})\.(\d{2})\.(\d{2})\s*세미나/

interface DriveFile {
  id: string
  name: string
  mimeType?: string
  modifiedTime?: string
}

export interface SeminarFile {
  id: string
  name: string
  date: string           // 'YYYY-MM-DD'
  mimeType: string
}

export async function findSeminarFile(folderId: string, dateHint?: string): Promise<SeminarFile | null> {
  const drive = getDrive()
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, modifiedTime)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 100,
  })
  const files = (res.data.files ?? []) as DriveFile[]

  const candidates: SeminarFile[] = []
  for (const f of files) {
    const m = f.name.match(FILE_NAME_PATTERN)
    if (!m || !f.id) continue
    candidates.push({
      id: f.id,
      name: f.name,
      date: `${m[1]}-${m[2]}-${m[3]}`,
      mimeType: f.mimeType ?? '',
    })
  }

  if (candidates.length === 0) return null

  // With a date hint: only return an exact match. Never fall back to a
  // different date — that would silently sync the wrong week's papers.
  if (dateHint) {
    return candidates.find((c) => c.date === dateHint) ?? null
  }

  candidates.sort((a, b) => (a.date < b.date ? 1 : -1))
  return candidates[0]
}

export async function extractSlides(fileId: string): Promise<SlideDump[]> {
  const slides = getSlides()
  const res = await slides.presentations.get({ presentationId: fileId })
  const pres = res.data
  const pageHeight = pres.pageSize?.height?.magnitude ?? 5143500

  const out: SlideDump[] = []
  const pages = pres.slides ?? []
  pages.forEach((slide, idx) => {
    const els: SlideElement[] = []
    for (const el of slide.pageElements ?? []) {
      const shape = el.shape
      if (!shape?.text) continue
      const parts: string[] = []
      for (const te of shape.text.textElements ?? []) {
        const run = te.textRun?.content
        if (run) parts.push(run)
      }
      // Preserve paragraph breaks (\n) so the LLM sees title-vs-author
      // boundaries. Collapse only horizontal whitespace.
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
    out.push({ slideIndex: idx + 1, elements: els, pageHeight })
  })

  return out
}

const HANGUL_NAME_RE = /[가-힣]{2,4}/g
const PRESENTER_PREFIX_RE = /^(?:발표자|Presenter|이름|Name)\s*[:：-]?\s*/i

function extractPresenterFromLines(lines: string[]): string {
  for (const line of lines) {
    const cleaned = line.replace(PRESENTER_PREFIX_RE, '').trim()
    const matches = cleaned.match(HANGUL_NAME_RE)
    if (matches && matches.length > 0) return matches[0]
  }
  return ''
}

// For each slide: extract the presenter name (bottom Y > 80% zone) and the
// title-area text (top Y < 20% zone). The LLM handles all title/author/venue
// disambiguation on the raw text.
interface SlideForLLM {
  presenter: string
  topText: string
}

function toSlideForLLM(dump: SlideDump): SlideForLLM | null {
  const ph = dump.pageHeight
  const topEls = dump.elements.filter((e) => e.y < ph * 0.20)
  const botEls = dump.elements.filter((e) => e.y >= ph * 0.80)

  const botLines = botEls.flatMap((e) => e.text.split('\n'))
  const presenter = extractPresenterFromLines(botLines)
  if (!presenter) return null

  const topText = topEls.map((e) => e.text).filter(Boolean).join('\n---\n')
  if (!topText.trim()) return null

  return { presenter, topText }
}

// Group slide top-of-page texts by presenter. Presenters seen on only one
// slide are dropped (usually a body-text false positive).
export function groupSlidesByPresenter(dumps: SlideDump[]): PresenterSlideTexts[] {
  const map = new Map<string, string[]>()
  for (const d of dumps) {
    const info = toSlideForLLM(d)
    if (!info) continue
    if (!map.has(info.presenter)) map.set(info.presenter, [])
    map.get(info.presenter)!.push(info.topText)
  }
  const out: PresenterSlideTexts[] = []
  for (const [presenter, texts] of map) {
    if (texts.length < 2) continue
    // Dedupe identical top-texts (the title-slide text often repeats verbatim
    // across many slides). Keep insertion order.
    const seen = new Set<string>()
    const unique: string[] = []
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
