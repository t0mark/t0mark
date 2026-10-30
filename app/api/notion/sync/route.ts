import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import yaml from 'js-yaml'
import { Client } from '@notionhq/client'
import type { CalendarData } from '@/types/calendar'

const filePath = join(process.cwd(), 'data', 'calendar-data.yaml')

// TODO 항목과 Notion 페이지는 제목(이름)으로만 매칭한다.
// 페이지 id 를 저장하지 않으므로 Notion 에서 위치를 옮기거나, 앱에서 항목을 지우거나 옮겨도 서로 깨지지 않는다.
// 서버는 페이지를 만들기만 하고, 이름 변경·삭제(archive)는 하지 않는다.

interface NotionPage {
  id: string
  url: string
  object?: string
  properties?: Record<string, unknown>
  archived?: boolean
  in_trash?: boolean
}

interface NotionBlock {
  id: string
  type: string
  has_children?: boolean
  archived?: boolean
  in_trash?: boolean
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

function pageUrl(id: string): string {
  return `https://www.notion.so/${id.replace(/-/g, '')}`
}

type Notion = InstanceType<typeof Client>

// parent 페이지 안의 하위 페이지를 제목 → id 로 모은다.
// 컬럼·토글 같은 컨테이너 블록 안까지 내려가지만, 하위 페이지의 본문 안으로는 들어가지 않는다.
async function collectChildPages(notion: Notion, blockId: string, out: Map<string, string>) {
  let cursor: string | undefined = undefined
  do {
    const res = await notion.blocks.children.list({ block_id: blockId, start_cursor: cursor })
    for (const block of res.results as unknown as NotionBlock[]) {
      if (block.archived || block.in_trash) continue
      if (block.type === 'child_page') {
        const title = block.child_page?.title?.trim()
        if (title && !out.has(title)) out.set(title, block.id)
      } else if (block.has_children && block.type !== 'child_database') {
        await collectChildPages(notion, block.id, out)
      }
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)
}

// TODO 페이지 밖(다른 페이지 안 등)으로 옮겨진 페이지는 검색으로 찾는다.
async function searchPageByTitle(notion: Notion, title: string): Promise<string | null> {
  const res = await notion.search({ query: title, filter: { property: 'object', value: 'page' } })
  for (const page of res.results as unknown as NotionPage[]) {
    if (page.archived || page.in_trash) continue
    if (extractTitle(page).trim() === title) return page.id
  }
  return null
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

  const pagesByTitle = new Map<string, string>()
  await collectChildPages(notion, parentId, pagesByTitle)

  const urls: Record<string, string> = {}

  for (const [categoryName, catData] of Object.entries(calendar.todos ?? {})) {
    for (const item of catData.items) {
      const text = item.text?.trim()
      if (!text) continue

      let pageId = pagesByTitle.get(text) ?? null
      if (!pageId) {
        try {
          pageId = await searchPageByTitle(notion, text)
        } catch (err) {
          console.warn(`Notion 검색 실패 (${text}):`, err instanceof Error ? err.message : err)
        }
      }
      if (!pageId) {
        try {
          const created = (await notion.pages.create({
            parent: { page_id: parentId },
            properties: { title: { title: [{ text: { content: text } }] } },
          })) as unknown as NotionPage
          pageId = created.id
        } catch (err) {
          console.error(`Notion page 생성 실패 (${text}):`, err instanceof Error ? err.message : err)
          continue
        }
      }

      pagesByTitle.set(text, pageId)
      urls[`${categoryName}::${text}`] = pageUrl(pageId)
    }
  }

  return urls
}
