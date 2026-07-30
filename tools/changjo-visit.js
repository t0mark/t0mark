#!/usr/bin/env node
/**
 * 창조2관 방문 신청 자동화 (Notion 폼)
 *
 * node scripts/changjo-visit.js --start 2026-06-01
 * node scripts/changjo-visit.js --start 2026-06-01 --end 2026-06-10
 * node scripts/changjo-visit.js --start 2026-06-01 --end 2026-06-10 --equipment "서버 2호기"
 * node scripts/changjo-visit.js --start 2026-06-01 --headless
 */

const puppeteer = require('puppeteer-core')

// ─── 고정 입력값 ───────────────────────────────────────────────────────────────
const FORM_URL    = 'https://physicalai.notion.site/31ea610aa31d80eab102d244e7370774'
const NAME        = '양현웅'
const ORG         = '전북대학교 조형기 교수님 연구실'
const POSITION    = '석사과정생'
const CONTACT     = '010-9653-6009'
const ENTRY_TIME  = '10:00'
const EXIT_TIME   = '18:00'
const PURPOSE     = '연구'
const DEFAULT_EQ  = '서버 1호기'

const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium'

const FIELD = {
  name:     'form-question-title-31ea610a-a31d-80b1-9555-007d4688da9d',
  org:      'form-question-title-31ea610a-a31d-8001-ac0f-007d050046d2',
  position: 'form-question-title-31ea610a-a31d-802a-b208-007d3af3640c',
  contact:  'form-question-title-31ea610a-a31d-804f-a242-007d1a15bea2',
  purpose:  'form-question-title-31ea610a-a31d-80d5-8555-007d097d8cbf',
  equip:    'form-question-title-364a610a-a31d-8018-9fbe-007d74ed49a4',
}

const MONTH_EN = {
  January:1, February:2, March:3, April:4,
  May:5, June:6, July:7, August:8,
  September:9, October:10, November:11, December:12,
}

// ─── XPath 헬퍼 (page.$x 대체, 숫자 상수 사용) ───────────────────────────────
// XPathResult.FIRST_ORDERED_NODE_TYPE = 9
// XPathResult.ORDERED_NODE_SNAPSHOT_TYPE = 7
async function xpFind(page, xpath) {
  return page.evaluateHandle(
    xp => document.evaluate(xp, document, null, 9, null).singleNodeValue,
    xpath
  ).then(h => h.asElement())
}

async function xpFindAll(page, xpath) {
  const handles = []
  const count = await page.evaluate(xp => {
    const snap = document.evaluate(xp, document, null, 7, null)
    return snap.snapshotLength
  }, xpath)
  for (let i = 0; i < count; i++) {
    const h = await page.evaluateHandle((xp, idx) => {
      return document.evaluate(xp, document, null, 7, null).snapshotItem(idx)
    }, xpath, i)
    handles.push(h.asElement())
  }
  return handles.filter(Boolean)
}

async function xpExists(page, xpath) {
  return page.evaluate(
    xp => !!document.evaluate(xp, document, null, 9, null).singleNodeValue,
    xpath
  )
}

// ─── 날짜 파싱 ─────────────────────────────────────────────────────────────────
function parseDateStr(str) {
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) throw new Error(`날짜 형식 오류: ${str}`)
  return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
}

function getDates(startStr, endStr) {
  const start = parseDateStr(startStr)
  const end   = endStr ? parseDateStr(endStr) : new Date(start)
  if (end < start) throw new Error('종료 날짜가 시작 날짜보다 이전입니다.')
  const dates = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1))
    dates.push(new Date(d))
  return dates
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── scroll_to ────────────────────────────────────────────────────────────────
async function scrollTo(el) {
  await el.evaluate(e => e.scrollIntoView({ block: 'center' }))
  await sleep(200)
}

// ─── fill_text ────────────────────────────────────────────────────────────────
async function fillText(page, fieldId, value, tag = 'input') {
  const sel = `${tag}[aria-labelledby="${fieldId}"]`
  await page.waitForSelector(sel, { timeout: 15000 })
  const elem = await page.$(sel)
  await scrollTo(elem)
  await elem.click()
  await sleep(150)
  await elem.evaluate(el => { el.select ? el.select() : null })
  // Ctrl+A → value 입력
  await page.keyboard.down('Control')
  await page.keyboard.press('a')
  await page.keyboard.up('Control')
  await sleep(100)
  await elem.type(value, { delay: 30 })
}

// ─── select_date ──────────────────────────────────────────────────────────────
async function selectDate(page, target) {
  await page.waitForSelector('[data-testid="property-value"]', { timeout: 15000 })
  const propBtns = await page.$$('[data-testid="property-value"]')
  await scrollTo(propBtns[0])
  await propBtns[0].click()
  await sleep(600)

  let clicked = false

  // 방법 1: 통합 매칭 — day, month로 aria-label 검색 (한/영 모두 지원)
  const day = target.getDate()
  const month = target.getMonth() + 1
  const monthNameEn = Object.keys(MONTH_EN).find(k => MONTH_EN[k] === month)
  clicked = await page.evaluate((day, month, monthNameEn) => {
    const cells = [...document.querySelectorAll('button[name="day"]')]
    for (const prefer of [true, false]) {
      for (const cell of cells) {
        const cls = cell.className || ''
        if (prefer && cls.includes('rdp-day_outside')) continue
        const aria = cell.getAttribute('aria-label') || ''
        // 한국어: "28일 5월", 영어: "May 28th, 2026 (Thursday)" 또는 "May 28, 2026"
        const koMatch = aria.includes(`${day}일 ${month}월`)
        const enMatch = aria.includes(monthNameEn) &&
                        new RegExp(`\\b${day}(st|nd|rd|th)?\\b`).test(aria)
        // 추가: 텍스트 노드가 day인 경우 (둘 다 실패 시)
        const textMatch = cell.textContent?.trim() === String(day)
        if (koMatch || enMatch || textMatch) { cell.click(); return true }
      }
    }
    return false
  }, day, month, monthNameEn)

  // 방법 2: 월 이동 후 텍스트로 찾기
  if (!clicked) {
    for (let nav = 0; nav < 48; nav++) {
      // 헤더 읽기
      let cy, cm
      const header = await page.evaluate(() => {
        const el = document.querySelector('h2.rdp-caption_label, [class*="caption_label"]')
        return el ? el.textContent : ''
      }).catch(() => '')

      const koMatch = header.match(/(\d{4})[년\s]\s*(\d{1,2})월/)
      if (koMatch) { cy = parseInt(koMatch[1]); cm = parseInt(koMatch[2]) }
      else {
        for (const [name, num] of Object.entries(MONTH_EN)) {
          if (header.includes(name)) {
            const yr = header.match(/\b(20\d{2})\b/)
            if (yr) { cy = parseInt(yr[1]); cm = num }
            break
          }
        }
      }
      if (!cy) break

      const diff = (target.getFullYear() - cy) * 12 + (target.getMonth() + 1 - cm)
      if (diff === 0) break

      if (diff > 0) {
        const btn = await page.$('button[aria-label="Next month"], button[aria-label="다음 달"]')
        if (btn) await btn.click()
      } else {
        const btn = await page.$('button[aria-label="Previous month"], button[aria-label="이전 달"]')
        if (btn) await btn.click()
      }
      await sleep(500)
    }

    const day = String(target.getDate())
    for (const xp of [
      `//button[@name='day' and not(contains(@class,'rdp-day_outside')) and normalize-space(text())='${day}']`,
      `//button[@name='day' and normalize-space(text())='${day}']`,
    ]) {
      const dayCells = await xpFindAll(page, xp)
      for (const cell of dayCells) {
        try { await cell.evaluate(el => el.click()); clicked = true; break } catch (_) {}
      }
      if (clicked) break
    }
  }

  if (!clicked) console.warn('    ⚠ 날짜 셀 클릭 실패')

  await sleep(500)
  await page.keyboard.press('Escape')
  await sleep(400)
}

// ─── select_time ──────────────────────────────────────────────────────────────
// 디버그 결과: 시간 피커는 [role="option"] 드롭다운 ("07:00", "08:00", ...).
// 우선 option 클릭, 안 되면 팝업 검색 input에 타이핑 후 Enter.
async function selectTime(page, btnIdx, timeStr) {
  const propBtns = await page.$$('[data-testid="property-value"]')
  if (propBtns.length <= btnIdx) {
    console.warn(`    ⚠ 시간 버튼[${btnIdx}] 미발견`)
    return
  }
  await scrollTo(propBtns[btnIdx])
  await propBtns[btnIdx].click()
  await sleep(600)

  // 시도 1: [role="option"] 중 텍스트 일치 클릭
  const optionClicked = await page.evaluate((t) => {
    for (const opt of document.querySelectorAll('[role="option"]')) {
      const txt = (opt.innerText || opt.textContent || '').replace(/\s+/g, ' ').trim()
      if (txt === t) { opt.click(); return true }
    }
    return false
  }, timeStr)

  if (optionClicked) {
    await sleep(200)
    await page.keyboard.press('Escape')
    await sleep(200)
    return
  }

  // 시도 2: 팝업 검색 input에 타이핑 후 첫 옵션 클릭
  const popupInput = await page.evaluateHandle(() => {
    for (const inp of document.querySelectorAll('input[type="text"], input[type="time"]')) {
      if (inp.closest('[data-popup-origin]') || inp.closest('[role="dialog"]')) return inp
    }
    return null
  }).then(h => h.asElement())

  if (popupInput) {
    await popupInput.click({ clickCount: 3 })
    await popupInput.type(timeStr, { delay: 20 })
    await sleep(200)
    // 필터된 첫 옵션 클릭 (없으면 Enter)
    const picked = await page.evaluate(() => {
      const opt = document.querySelector('[role="option"]')
      if (opt) { opt.click(); return true }
      return false
    })
    if (!picked) await page.keyboard.press('Enter')
    await sleep(200)
    await page.keyboard.press('Escape')
    await sleep(200)
    return
  }

  // 시도 3: 키보드 직접 입력
  await page.keyboard.type(timeStr, { delay: 20 })
  await sleep(200)
  await page.keyboard.press('Enter')
  await sleep(200)
  await page.keyboard.press('Escape')
  await sleep(200)
}

// ─── submit ───────────────────────────────────────────────────────────────────
async function submit(page) {
  // 열려있는 팝업 닫기
  await page.keyboard.press('Escape')
  await sleep(150)
  await page.keyboard.press('Escape')
  await sleep(150)

  // 한국어("제출") 또는 영어("Submit") 둘 다 매칭
  await page.waitForFunction(() => {
    return [...document.querySelectorAll('div[role="button"]')].some(d => {
      const t = (d.innerText || d.textContent || '').replace(/\s+/g, ' ').trim()
      return t === '제출' || t === 'Submit'
    })
  }, { timeout: 15000 })

  const btn = await page.evaluateHandle(() => {
    for (const d of document.querySelectorAll('div[role="button"]')) {
      const t = (d.innerText || d.textContent || '').replace(/\s+/g, ' ').trim()
      if (t === '제출' || t === 'Submit') return d
    }
    return null
  }).then(h => h.asElement())

  if (!btn) throw new Error('제출 버튼 미발견')

  await scrollTo(btn)
  await btn.click()
  await sleep(1500)

  // Python: for xp in [...]: if driver.find_elements(...): return True
  for (const xp of [
    "//*[contains(.,'감사')]",
    "//*[contains(.,'제출되었')]",
    "//*[contains(.,'완료')]",
    "//*[contains(.,'submitted')]",
  ]) {
    if (await xpExists(page, xp)) return true
  }
  // Python: return any(x in driver.current_url for x in ["thank", "submitted", "complete"])
  return ["thank", "submitted", "complete"].some(x => page.url().includes(x))
}

// ─── process_date ─────────────────────────────────────────────────────────────
async function processDate(page, date, equipment, onStep) {
  await page.goto(FORM_URL, { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(1500)

  const steps = [
    ['이름',       () => fillText(page, FIELD.name,     NAME)],
    ['소속/기관',   () => fillText(page, FIELD.org,      ORG)],
    ['직급',       () => fillText(page, FIELD.position,  POSITION)],
    ['연락처',     () => fillText(page, FIELD.contact,   CONTACT)],
    ['방문 희망일', () => selectDate(page, date)],
    ['입장 시간',   () => selectTime(page, 1, ENTRY_TIME)],
    ['퇴장 시간',   () => selectTime(page, 2, EXIT_TIME)],
    ['방문 목적',   () => fillText(page, FIELD.purpose,  PURPOSE, 'textarea')],
    ['사용 장비',   () => fillText(page, FIELD.equip,    equipment)],
    ['제출',       () => submit(page)],
  ]

  let success = false
  for (const [label, fn] of steps) {
    try {
      const ret = await fn()
      if (label === '제출') success = Boolean(ret)
      onStep && onStep({ label, ok: true })
    } catch (err) {
      onStep && onStep({ label, ok: false, error: String(err) })
    }
  }
  return success
}

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  const args  = process.argv.slice(2)
  const get   = f => { const i = args.indexOf(f); return i !== -1 ? args[i+1] : null }
  const has   = f => args.includes(f)

  const startStr  = get('--start')
  const endStr    = get('--end')
  const equipment = get('--equipment') || DEFAULT_EQ
  const headless  = has('--headless')

  if (!startStr) { console.error('--start YYYY-MM-DD 필요'); process.exit(1) }

  const dates = getDates(startStr, endStr)
  console.log(`\n신청 기간: ${startStr} ~ ${endStr || startStr}  (${dates.length}일)`)
  console.log(`사용 장비: ${equipment}\n`)

  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1280,960', '--lang=ko-KR'],
  })

  let ok = 0, fail = 0
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 960 })
    // Notion 폼이 한국어로 렌더되도록 강제 (--lang 인자만으론 안 됨)
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.5' })

    for (let i = 0; i < dates.length; i++) {
      const d   = dates[i]
      const fmt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      console.log(`[${String(i+1).padStart(2,'0')}/${String(dates.length).padStart(2,'0')}] ${fmt}`)

      const success = await processDate(page, d, equipment, ({ label, ok: stepOk, error }) => {
        console.log(`    ${label}... ${stepOk ? '✓' : `✗  [${error}]`}`)
      })

      if (success) { ok++;   console.log('  → 제출 완료\n') }
      else         { fail++; console.log('  → 결과 미확인\n') }

      if (i < dates.length - 1) await sleep(1000)
    }
  } finally {
    await browser.close()
  }

  console.log('─'.repeat(40))
  console.log(`완료: 성공 ${ok}건  /  미확인 ${fail}건`)
}

module.exports = { getDates, processDate, DEFAULT_EQ, CHROMIUM_PATH }

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1) })
}
