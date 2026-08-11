import { findSeminarFile, extractSlides, groupSlidesByPresenter } from './slides'
import { extractPapersWithGPT } from './gpt'
import {
  findBlockByDate,
  matchPapersToRows,
  writePapersToBlock,
  createBlock,
  getSemesterTabName,
  ensureTab,
  findBlockInAnyTab,
} from './sheet'
import type { PreviewResult, ParsedPaper } from './types'

function requireEnv(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`${key} env is not set`)
  return v
}

type Emit = (line: string) => void

export interface PreviewOptions {
  dateHint?: string
}

// Preview: extract + parse + look up block in the target semester tab
// (searches all tabs as fallback so we still find legacy manually-created blocks).
export async function runPreview(opts: PreviewOptions, emit: Emit): Promise<PreviewResult> {
  const folderId = requireEnv('SEMINAR_FOLDER_ID')
  const sheetId = requireEnv('PAPER_LIST_SHEET_ID')

  emit('▶ 세미나 폴더에서 파일 탐색...')
  const file = await findSeminarFile(folderId, opts.dateHint)
  if (!file) {
    if (opts.dateHint) {
      throw new Error(`${opts.dateHint} 날짜의 세미나 파일이 02_세미나 폴더에 없습니다`)
    }
    throw new Error('02_세미나 폴더에서 세미나 파일을 찾지 못했습니다')
  }
  emit(`✓ 파일 발견: ${file.name} (${file.date})`)

  emit('▶ 슬라이드 텍스트 추출...')
  const dumps = await extractSlides(file.id)
  emit(`✓ 슬라이드 ${dumps.length}장 파싱`)

  emit('▶ 발표자별 슬라이드 그룹핑...')
  const groups = groupSlidesByPresenter(dumps)
  emit(`✓ 발표자 ${groups.length}명 감지`)

  emit('▶ GPT로 논문 정보 추출 중...')
  const gptResults = await extractPapersWithGPT(groups)
  emit(`✓ 논문 ${gptResults.length}편 추출`)

  const papers: ParsedPaper[] = gptResults.map((r) => ({
    title: r.title,
    venue: r.venue,
    year: r.year,
    presenter: r.presenter,
  }))
  for (const p of papers) {
    emit(`  → ${p.presenter || '?'} | ${p.title || '(제목 미검출)'} | ${p.venue || '?'} ${p.year || '?'}`)
  }

  emit(`▶ 시트에서 ${file.date} 블록 탐색 (모든 탭)...`)
  const found = await findBlockInAnyTab(sheetId, file.date)
  if (!found) {
    const semesterName = getSemesterTabName(file.date)
    emit(`✗ 블록 없음. 반영 시 "${semesterName}" 탭에 새로 생성됩니다.`)
    return {
      fileName: file.name,
      fileDate: file.date,
      papers,
      block: null,
      matches: [],
    }
  }
  emit(`✓ 블록 발견 ("${found.tabTitle}" 탭, 행 ${found.block.dateRow}) - 발표자 ${found.block.presenterRows.length}명`)

  const matches = matchPapersToRows(papers, found.block.presenterRows)
  const matched = matches.filter((m) => m.paper && m.row).length
  emit(`✓ 매칭 완료: ${matched}건 반영 예정`)

  return {
    fileName: file.name,
    fileDate: file.date,
    papers,
    block: { date: found.block.date, presenterRows: found.block.presenterRows },
    matches,
  }
}

export interface CommitOptions {
  matches: Array<{ row: number | null; paper: ParsedPaper | null }>
  sheetTitle: string   // which tab to write to
}

export async function runCommit(opts: CommitOptions): Promise<{ updated: number; sheetTitle: string }> {
  const sheetId = requireEnv('PAPER_LIST_SHEET_ID')
  const updated = await writePapersToBlock(sheetId, opts.sheetTitle, opts.matches)
  return { updated, sheetTitle: opts.sheetTitle }
}

// One-shot: extract → parse → GPT → match → write (auto-create block in
// semester tab if missing). Used by both the manual "지금 동기화" button and
// the scheduled cron.
export async function runFull(opts: PreviewOptions, emit: Emit): Promise<{
  updated: number
  sheetTitle: string
  fileName: string
  fileDate: string
  papers: ParsedPaper[]
  blockCreated: boolean
  tabCreated: boolean
}> {
  const folderId = requireEnv('SEMINAR_FOLDER_ID')
  const sheetId = requireEnv('PAPER_LIST_SHEET_ID')

  emit('▶ 세미나 폴더에서 파일 탐색...')
  const file = await findSeminarFile(folderId, opts.dateHint)
  if (!file) {
    if (opts.dateHint) {
      throw new Error(`${opts.dateHint} 날짜의 세미나 파일이 02_세미나 폴더에 없습니다`)
    }
    throw new Error('02_세미나 폴더에서 세미나 파일을 찾지 못했습니다')
  }
  emit(`✓ 파일 발견: ${file.name} (${file.date})`)

  emit('▶ 슬라이드 텍스트 추출...')
  const dumps = await extractSlides(file.id)
  emit(`✓ 슬라이드 ${dumps.length}장 파싱`)

  emit('▶ 발표자별 슬라이드 그룹핑...')
  const groups = groupSlidesByPresenter(dumps)
  emit(`✓ 발표자 ${groups.length}명 감지`)

  emit('▶ GPT로 논문 정보 추출 중...')
  const gptResults = await extractPapersWithGPT(groups)
  emit(`✓ 논문 ${gptResults.length}편 추출`)

  const papers: ParsedPaper[] = gptResults.map((r) => ({
    title: r.title,
    venue: r.venue,
    year: r.year,
    presenter: r.presenter,
  }))
  for (const p of papers) {
    emit(`  → ${p.presenter || '?'} | ${p.title || '(제목 미검출)'} | ${p.venue || '?'} ${p.year || '?'}`)
  }

  emit(`▶ 시트에서 ${file.date} 블록 탐색 (모든 탭)...`)
  const existing = await findBlockInAnyTab(sheetId, file.date)

  let targetTitle: string
  let targetGid: number
  let block: NonNullable<Awaited<ReturnType<typeof findBlockByDate>>>
  let blockCreated = false
  let tabCreated = false

  if (existing) {
    targetTitle = existing.tabTitle
    targetGid = existing.tabGid
    block = existing.block
    emit(`✓ 블록 발견 ("${targetTitle}" 탭, 행 ${block.dateRow}) - 발표자 ${block.presenterRows.length}명`)
  } else {
    // No existing block anywhere → create at TOP of the semester tab
    const semesterName = getSemesterTabName(file.date)
    emit(`▶ 블록 없음 → "${semesterName}" 탭 준비`)
    const tab = await ensureTab(sheetId, semesterName)
    targetTitle = tab.title
    targetGid = tab.sheetId
    tabCreated = tab.created
    if (tabCreated) emit(`✓ 신규 탭 생성: "${targetTitle}"`)
    else emit(`✓ 기존 탭 사용: "${targetTitle}"`)

    // Detected presenters only (roster changes every week)
    const detected: string[] = []
    const seen = new Set<string>()
    for (const p of papers) {
      const name = p.presenter.trim()
      if (!name || seen.has(name)) continue
      seen.add(name)
      detected.push(name)
    }
    if (detected.length === 0) {
      throw new Error('슬라이드에서 발표자를 검출하지 못해 블록을 만들 수 없습니다')
    }
    emit(`▶ 발표자 ${detected.length}명으로 새 블록 생성 (탭 상단)`)
    block = await createBlock(sheetId, targetTitle, targetGid, file.date, detected)
    blockCreated = true
    emit(`✓ 블록 생성 완료 (행 ${block.dateRow})`)
  }

  const matches = matchPapersToRows(papers, block.presenterRows)
  const validMatches = matches.filter((m) => m.row && m.paper)
  if (validMatches.length === 0) {
    emit('✗ 매칭된 발표자 없음 → 반영 건너뜀')
    return {
      updated: 0,
      sheetTitle: targetTitle,
      fileName: file.name,
      fileDate: file.date,
      papers,
      blockCreated,
      tabCreated,
    }
  }

  emit(`▶ 시트에 ${validMatches.length}건 반영 중...`)
  const updated = await writePapersToBlock(sheetId, targetTitle, validMatches)
  emit(`✓ 시트 반영 완료: ${updated}행 업데이트 ("${targetTitle}" 탭)`)

  return {
    updated,
    sheetTitle: targetTitle,
    fileName: file.name,
    fileDate: file.date,
    papers,
    blockCreated,
    tabCreated,
  }
}
