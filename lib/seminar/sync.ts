import { findSeminarFile, extractSlides, groupSlidesByPresenter } from './slides'
import { extractPapersWithGPT } from './gpt'
import { getSheetTitle, findBlockByDate, listAllBlockDates, matchPapersToRows, writePapersToBlock } from './sheet'
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

export async function runPreview(opts: PreviewOptions, emit: Emit): Promise<PreviewResult> {
  const folderId = requireEnv('SEMINAR_FOLDER_ID')
  const sheetId = requireEnv('PAPER_LIST_SHEET_ID')
  const gid = parseInt(requireEnv('PAPER_LIST_SHEET_GID'), 10)

  emit('▶ 세미나 폴더에서 파일 탐색...')
  const file = await findSeminarFile(folderId, opts.dateHint)
  if (!file) {
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

  emit('▶ 스프레드시트 탭 확인...')
  const sheetTitle = await getSheetTitle(sheetId, gid)
  emit(`✓ 탭: ${sheetTitle}`)

  emit(`▶ ${file.date} 주 블록 탐색...`)
  const block = await findBlockByDate(sheetId, sheetTitle, file.date)
  if (!block) {
    const all = await listAllBlockDates(sheetId, sheetTitle)
    emit(`✗ 블록 없음. 시트에 있는 날짜들: ${all.join(', ') || '(비어 있음)'}`)
    return {
      fileName: file.name,
      fileDate: file.date,
      papers,
      block: null,
      matches: [],
    }
  }
  emit(`✓ 블록 발견 (행 ${block.dateRow}) - 발표자 ${block.presenterRows.length}명`)

  const matches = matchPapersToRows(papers, block.presenterRows)
  const matched = matches.filter((m) => m.paper && m.row).length
  emit(`✓ 매칭 완료: ${matched}건 반영 예정`)

  return {
    fileName: file.name,
    fileDate: file.date,
    papers,
    block: {
      date: block.date,
      presenterRows: block.presenterRows,
    },
    matches,
  }
}

export interface CommitOptions {
  matches: Array<{ row: number | null; paper: ParsedPaper | null }>
}

export async function runCommit(opts: CommitOptions): Promise<{ updated: number; sheetTitle: string }> {
  const sheetId = requireEnv('PAPER_LIST_SHEET_ID')
  const gid = parseInt(requireEnv('PAPER_LIST_SHEET_GID'), 10)
  const sheetTitle = await getSheetTitle(sheetId, gid)
  const updated = await writePapersToBlock(sheetId, sheetTitle, opts.matches)
  return { updated, sheetTitle }
}

// One-shot: extract → parse → GPT → match → write to sheet.
// Used by both the manual "run now" button and the scheduled cron.
export async function runFull(opts: PreviewOptions, emit: Emit): Promise<{
  updated: number
  sheetTitle: string
  fileName: string
  fileDate: string
  papers: ParsedPaper[]
}> {
  const preview = await runPreview(opts, emit)
  if (!preview.block) {
    emit('✗ 시트 블록 없음 → 반영 건너뜀')
    return {
      updated: 0,
      sheetTitle: '',
      fileName: preview.fileName,
      fileDate: preview.fileDate,
      papers: preview.papers,
    }
  }
  const validMatches = preview.matches.filter((m) => m.row && m.paper)
  if (validMatches.length === 0) {
    emit('✗ 매칭된 발표자 없음 → 반영 건너뜀')
    return {
      updated: 0,
      sheetTitle: '',
      fileName: preview.fileName,
      fileDate: preview.fileDate,
      papers: preview.papers,
    }
  }
  emit(`▶ 시트에 ${validMatches.length}건 반영 중...`)
  const commit = await runCommit({ matches: validMatches })
  emit(`✓ 시트 반영 완료: ${commit.updated}행 업데이트 (${commit.sheetTitle} 탭)`)
  return {
    updated: commit.updated,
    sheetTitle: commit.sheetTitle,
    fileName: preview.fileName,
    fileDate: preview.fileDate,
    papers: preview.papers,
  }
}
