import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync, renameSync } from 'fs'
import { join } from 'path'
import yaml from 'js-yaml'
import { Client } from '@notionhq/client'
import type { CalendarData } from '@/types/calendar'

const filePath = join(process.cwd(), 'data', 'calendar-data.yaml')

interface NotionPage {
  id: string
  url: string
  properties?: Record<string, unknown>
  icon?: unknown
  archived?: boolean
  in_trash?: boolean
  parent?: { type?: string; page_id?: string }
}

interface NotionBlock {
  id: string
  type: string
  archived?: boolean
  in_trash?: boolean
  heading_3?: { rich_text?: Array<{ plain_text?: string; text?: { content?: string } }> }
  child_page?: { title?: string }
}

function normalizePageId(raw: string): string | null {
  const hex = raw.replace(/-/g, '').toLowerCase()
  const match = /([0-9a-f]{32})/.exec(hex)
  if (!match) return null
  const id = match[1]
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
}

function extractTitle(page: NotionPage): string {
  const props = page.properties ?? {}
  for (const key of Object.keys(props)) {
    const p = props[key] as { type?: string; title?: Array<{ plain_text?: string }> }
    if (p?.type === 'title' && Array.isArray(p.title)) {
      return p.title.map((t) => t.plain_text ?? '').join('')
    }
  }
  return ''
}

type Notion = InstanceType<typeof Client>

async function ensureItemPage(
  notion: Notion,
  opts: { existingId: string | undefined; parentId: string; title: string }
): Promise<{ id: string; url: string } | null> {
  const { existingId, parentId, title } = opts

  if (existingId) {
    try {
      const page = (await notion.pages.retrieve({ page_id: existingId })) as unknown as NotionPage
      if (page.archived || page.in_trash) {
        // fall through to create
      } else {
        const parentMatches = page.parent?.type === 'page_id'
          && page.parent.page_id?.replace(/-/g, '') === parentId.replace(/-/g, '')
        if (!parentMatches) {
          // 이전에 category 페이지 하위에 있던 것 → archive 후 root 아래로 재생성
          try { await notion.pages.update({ page_id: existingId, archived: true }) } catch { /* ignore */ }
        } else {
          if (extractTitle(page) !== title) {
            await notion.pages.update({
              page_id: existingId,
              properties: { title: { title: [{ text: { content: title } }] } },
            })
          }
          return { id: page.id, url: page.url }
        }
      }
    } catch (err) {
      console.warn(`Notion page ${existingId} 조회 실패, 재생성:`, err instanceof Error ? err.message : err)
    }
  }

  try {
    const created = (await notion.pages.create({
      parent: { page_id: parentId },
      properties: { title: { title: [{ text: { content: title } }] } },
    })) as unknown as NotionPage
    return { id: created.id, url: created.url }
  } catch (err) {
    console.error(`Notion page 생성 실패 (${title}):`, err instanceof Error ? err.message : err)
    return null
  }
}

async function cleanupOrphans(
  notion: Notion,
  parentId: string,
  calendar: CalendarData
) {
  // Parent 의 모든 블록 조회
  const blocks: NotionBlock[] = []
  let cursor: string | undefined = undefined
  do {
    const res = await notion.blocks.children.list({ block_id: parentId, start_cursor: cursor })
    blocks.push(...(res.results as unknown as NotionBlock[]))
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)

  const validItemIds = new Set(
    Object.values(calendar.todos ?? {})
      .flatMap((cat) => cat.items.map((it) => it.notionPageId))
      .filter((pid): pid is string => !!pid)
      .map((pid) => pid.replace(/-/g, ''))
  )

  // 유효 pageId 집합에 없는 모든 child_page 는 우리가 만든 orphan (중복 sync 결과) → archive
  for (const block of blocks) {
    if (block.type !== 'child_page') continue
    const normalizedId = block.id.replace(/-/g, '')
    if (validItemIds.has(normalizedId)) continue
    try {
      await notion.pages.update({ page_id: block.id, archived: true })
    } catch { /* ignore */ }
  }
}

// 서버 mutex — 동시 sync 방지. 진행 중이면 후속 요청은 기다렸다가 그 결과를 공유.
let currentSync: Promise<Record<string, string>> | null = null

export async function POST() {
  const apiKey = process.env.NOTION_API_KEY
  const parentRaw = process.env.NOTION_TODO_PARENT_PAGE_ID
  if (!apiKey || !parentRaw) {
    return NextResponse.json({ error: 'Notion env vars missing' }, { status: 500 })
  }
  const parentId = normalizePageId(parentRaw)
  if (!parentId) {
    return NextResponse.json({ error: `Invalid NOTION_TODO_PARENT_PAGE_ID: ${parentRaw}` }, { status: 500 })
  }

  if (currentSync) {
    const urls = await currentSync
    return NextResponse.json({ urls })
  }
  currentSync = runSync(apiKey, parentId).finally(() => { currentSync = null })
  try {
    const urls = await currentSync
    return NextResponse.json({ urls })
  } catch (err) {
    console.error('sync 실패:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

async function runSync(apiKey: string, parentId: string): Promise<Record<string, string>> {
  const notion = new Client({ auth: apiKey })
  const calendar = yaml.load(readFileSync(filePath, 'utf-8')) as CalendarData

  const urls: Record<string, string> = {}
  let dirty = false

  for (const [categoryName, catData] of Object.entries(calendar.todos ?? {})) {
    // 이전에 만들어졌던 category 페이지는 더 이상 안 씀 (남은 값은 정리)
    if (catData.notionPageId !== undefined) {
      delete catData.notionPageId
      dirty = true
    }

    for (const item of catData.items) {
      const text = item.text?.trim()
      if (!text) continue

      const result = await ensureItemPage(notion, {
        existingId: item.notionPageId,
        parentId,
        title: text,
      })
      if (!result) continue
      if (item.notionPageId !== result.id) {
        item.notionPageId = result.id
        dirty = true
      }
      urls[`${categoryName}::${text}`] = result.url
    }
  }

  if (dirty) {
    try {
      const yamlStr = yaml.dump(calendar, { lineWidth: -1 })
      const tmpPath = filePath + '.tmp'
      writeFileSync(tmpPath, yamlStr, 'utf-8')
      renameSync(tmpPath, filePath)
    } catch (err) {
      console.error('calendar-data.yaml 저장 실패:', err)
    }
  }

  // Orphan 정리: yaml 에 없는 모든 child_page archive
  try {
    await cleanupOrphans(notion, parentId, calendar)
  } catch (err) {
    console.error('orphan 정리 실패:', err instanceof Error ? err.message : err)
  }

  return urls
}
