#!/usr/bin/env node
/**
 * 창조2관 방문 신청 자동화 (Notion 폼)
 *
 * 신청자 목록은 data/changjo-applicants.json 에서 읽고, active=true 인 사람만 신청한다.
 *
 *   node tools/changjo-visit.js --date 2026-08-12
 *   node tools/changjo-visit.js --date 2026-08-12 --headless
 *   node tools/changjo-visit.js --date 2026-08-12 --only <신청자id> --only <신청자id>
 *   node tools/changjo-visit.js --date 2026-08-12 --dry-run   # 폼만 채우고 제출 안 함
 */

const puppeteer = require('puppeteer-core')
const { readFileSync } = require('fs')
const { join } = require('path')

// ─── 고정값 ───────────────────────────────────────────────────────────────────
const FORM_URL      = 'https://physicalai.notion.site/31ea610aa31d80eab102d244e7370774'
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium'
const APPLICANTS_PATH = join(process.cwd(), 'data', 'changjo-applicants.json')

/** 신청자 사이 간격. Notion 이 429 를 잘 뱉어서 넉넉히 둔다. */
const GAP_BETWEEN_APPLICANTS_MS = 5000
const MAX_LOAD_ATTEMPTS = 4
const RATE_LIMIT_BASE_MS = 15000

const FIELD = {
  name:     'form-question-title-31ea610a-a31d-80b1-9555-007d4688da9d',
  org:      'form-question-title-31ea610a-a31d-8001-ac0f-007d050046d2',
  position: 'form-question-title-31ea610a-a31d-802a-b208-007d3af3640c',
  contact:  'form-question-title-31ea610a-a31d-804f-a242-007d1a15bea2',
  purpose:  'form-question-title-31ea610a-a31d-80d5-8555-007d097d8cbf',
  equip:    'form-question-title-364a610a-a31d-8018-9fbe-007d74ed49a4',
}

// property-value 버튼 순서: 0 = 방문 희망일, 1 = 입장 시간, 2 = 퇴장 시간
const PROP_DATE  = 0
const PROP_ENTRY = 1
const PROP_EXIT  = 2

const MONTH_EN = {
  January:1, February:2, March:3, April:4,
  May:5, June:6, July:7, August:8,
  September:9, October:10, November:11, December:12,
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

// ─── XPath 헬퍼 (page.$x 대체, 숫자 상수 사용) ───────────────────────────────
// XPathResult.FIRST_ORDERED_NODE_TYPE = 9
// XPathResult.ORDERED_NODE_SNAPSHOT_TYPE = 7
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

// ─── 날짜 ─────────────────────────────────────────────────────────────────────
function parseDateStr(str) {
  const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) throw new Error(`날짜 형식 오류: ${str}`)
  const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
  if (d.getFullYear() !== parseInt(m[1]) || d.getMonth() !== parseInt(m[2]) - 1 || d.getDate() !== parseInt(m[3])) {
    throw new Error(`존재하지 않는 날짜: ${str}`)
  }
  return d
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── 신청자 목록 ──────────────────────────────────────────────────────────────
function loadApplicants(onlyIds) {
  let raw
  try {
    raw = JSON.parse(readFileSync(APPLICANTS_PATH, 'utf-8'))
  } catch (err) {
    throw new Error(`신청자 목록을 읽지 못했습니다 (${APPLICANTS_PATH}): ${err.message}`)
  }
  const all = Array.isArray(raw && raw.applicants) ? raw.applicants : []
  const picked = onlyIds && onlyIds.length
    ? all.filter(a => onlyIds.includes(a.id))
    : all.filter(a => a.active)

  for (const a of picked) {
    for (const key of ['name', 'org', 'position', 'contact', 'purpose', 'equipment', 'entryTime', 'exitTime']) {
      if (!a[key]) throw new Error(`신청자 "${a.name || a.id}" 의 ${key} 값이 비어 있습니다.`)
    }
  }
  return picked
}

// ─── DOM 조작 헬퍼 ────────────────────────────────────────────────────────────
async function scrollTo(el) {
  await el.evaluate(e => e.scrollIntoView({ block: 'center' }))
  await sleep(200)
}

async function fillText(page, fieldId, value, tag = 'input') {
  const sel = `${tag}[aria-labelledby="${fieldId}"]`
  await page.waitForSelector(sel, { timeout: 15000 })
  const elem = await page.$(sel)
  await scrollTo(elem)
  await elem.click()
  await sleep(150)
  await page.keyboard.down('Control')
  await page.keyboard.press('a')
  await page.keyboard.up('Control')
  await sleep(100)
  await elem.type(value, { delay: 30 })

  // 입력이 실제로 반영됐는지 확인 — 조용히 빈 값이 제출되는 걸 막는다
  const got = await elem.evaluate(el => el.value)
  if (got.trim() !== value.trim()) {
    throw new Error(`입력값 불일치 (기대: "${value}", 실제: "${got}")`)
  }
}

async function selectDate(page, target) {
  await page.waitForSelector('[data-testid="property-value"]', { timeout: 15000 })
  const propBtns = await page.$$('[data-testid="property-value"]')
  if (propBtns.length <= PROP_DATE) throw new Error('날짜 입력 버튼 미발견')
  await scrollTo(propBtns[PROP_DATE])
  await propBtns[PROP_DATE].click()
  await sleep(600)

  const day = target.getDate()
  const month = target.getMonth() + 1
  const monthNameEn = Object.keys(MONTH_EN).find(k => MONTH_EN[k] === month)

  // 방법 1: 열려 있는 달에서 aria-label 로 바로 찾기 (한/영 모두 지원)
  let clicked = await page.evaluate((day, month, monthNameEn) => {
    const cells = [...document.querySelectorAll('button[name="day"]')]
    for (const cell of cells) {
      const cls = cell.className || ''
      if (cls.includes('rdp-day_outside')) continue
      const aria = cell.getAttribute('aria-label') || ''
      // 한국어: "28일 5월 (목요일)", 영어: "May 28th, 2026 (Thursday)"
      const koMatch = aria.includes(`${day}일 ${month}월`)
      const enMatch = aria.includes(monthNameEn) &&
                      new RegExp(`\\b${day}(st|nd|rd|th)?\\b`).test(aria)
      if (koMatch || enMatch) { cell.click(); return true }
    }
    return false
  }, day, month, monthNameEn)

  // 방법 2: 목표 월로 이동한 뒤 날짜 텍스트로 찾기
  if (!clicked) {
    for (let nav = 0; nav < 48; nav++) {
      const header = await page.evaluate(() => {
        const el = document.querySelector('h2.rdp-caption_label, [class*="caption_label"]')
        return el ? el.textContent : ''
      }).catch(() => '')

      let cy, cm
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

      const diff = (target.getFullYear() - cy) * 12 + (month - cm)
      if (diff === 0) break

      const label = diff > 0
        ? 'button[aria-label="Next month"], button[aria-label="다음 달"]'
        : 'button[aria-label="Previous month"], button[aria-label="이전 달"]'
      const btn = await page.$(label)
      if (!btn) break
      await btn.click()
      await sleep(500)
    }

    // 이번 달 셀만 대상으로 한다. rdp-day_outside 를 포함하면 이웃 달을 잘못 고른다.
    const xp = `//button[@name='day' and not(contains(@class,'rdp-day_outside')) and normalize-space(text())='${day}']`
    for (const cell of await xpFindAll(page, xp)) {
      try { await cell.evaluate(el => el.click()); clicked = true; break } catch (_) {}
    }
  }

  if (!clicked) throw new Error('날짜 셀을 찾지 못했습니다')

  await sleep(500)
  await page.keyboard.press('Escape')
  await sleep(400)

  // 선택 결과 검증
  const shown = await page.evaluate((idx) => {
    const el = document.querySelectorAll('[data-testid="property-value"]')[idx]
    return el ? (el.innerText || '').trim() : ''
  }, PROP_DATE)
  if (!new RegExp(`\\b${day}\\b`).test(shown)) {
    throw new Error(`날짜가 반영되지 않았습니다 (표시: "${shown}")`)
  }
}

/**
 * 입장/퇴장 시간은 자유 입력이 아니라 고정 선택지 드롭다운이다 (확인 시점: 07:00~18:00 정시).
 * 목록에 없는 값은 타이핑해도 반영되지 않으므로, 조용히 넘어가지 않고 가능한 값을 알려주며 실패시킨다.
 */
async function selectTime(page, btnIdx, timeStr) {
  const propBtns = await page.$$('[data-testid="property-value"]')
  if (propBtns.length <= btnIdx) throw new Error(`시간 입력 버튼[${btnIdx}] 미발견`)
  await scrollTo(propBtns[btnIdx])
  await propBtns[btnIdx].click()
  await sleep(700)

  const picked = await page.evaluate((t) => {
    const opts = [...document.querySelectorAll('[role="option"]')]
    const texts = opts.map(o => (o.innerText || o.textContent || '').replace(/\s+/g, ' ').trim())
    const i = texts.indexOf(t)
    if (i !== -1) { opts[i].click(); return { ok: true, texts } }
    return { ok: false, texts }
  }, timeStr)

  if (!picked.ok) {
    await page.keyboard.press('Escape')
    await sleep(200)
    const available = picked.texts.length ? picked.texts.join(', ') : '(선택지를 찾지 못함)'
    throw new Error(`"${timeStr}" 은(는) 선택 가능한 시간이 아닙니다. 가능: ${available}`)
  }

  await sleep(300)
  await page.keyboard.press('Escape')
  await sleep(300)

  const shown = await page.evaluate((idx) => {
    const el = document.querySelectorAll('[data-testid="property-value"]')[idx]
    return el ? (el.innerText || '').replace(/\s+/g, ' ').trim() : ''
  }, btnIdx)
  if (!shown.includes(timeStr)) {
    throw new Error(`시간이 반영되지 않았습니다 (기대: "${timeStr}", 표시: "${shown}")`)
  }
}

async function submit(page) {
  await page.keyboard.press('Escape')
  await sleep(150)
  await page.keyboard.press('Escape')
  await sleep(150)

  const findSubmit = () => page.evaluateHandle(() => {
    for (const d of document.querySelectorAll('div[role="button"]')) {
      const t = (d.innerText || d.textContent || '').replace(/\s+/g, ' ').trim()
      if (t === '제출' || t === 'Submit') return d
    }
    return null
  }).then(h => h.asElement())

  await page.waitForFunction(() => {
    return [...document.querySelectorAll('div[role="button"]')].some(d => {
      const t = (d.innerText || d.textContent || '').replace(/\s+/g, ' ').trim()
      return t === '제출' || t === 'Submit'
    })
  }, { timeout: 15000 })

  const btn = await findSubmit()
  if (!btn) throw new Error('제출 버튼 미발견')

  await scrollTo(btn)
  await btn.click()
  await sleep(2500)

  // 제출 성공 판정: 완료 화면이 뜨면 폼(제출 버튼)이 사라진다.
  // 기존의 //*[contains(.,'완료')] 식 검사는 html/body 까지 매칭돼 오탐이 났다.
  const stillOnForm = await page.evaluate(() => {
    return [...document.querySelectorAll('div[role="button"]')].some(d => {
      const t = (d.innerText || d.textContent || '').replace(/\s+/g, ' ').trim()
      return t === '제출' || t === 'Submit'
    })
  })
  if (!stillOnForm) return true

  for (const xp of [
    "//*[self::h1 or self::h2 or self::h3 or self::p or self::div[not(*)]][contains(.,'감사')]",
    "//*[self::h1 or self::h2 or self::h3 or self::p or self::div[not(*)]][contains(.,'제출되었')]",
    "//*[self::h1 or self::h2 or self::h3 or self::p or self::div[not(*)]][contains(.,'submitted')]",
  ]) {
    if (await xpExists(page, xp)) return true
  }
  return ['thank', 'submitted', 'complete'].some(x => page.url().includes(x))
}

// ─── 폼 로드 (429 백오프 포함) ────────────────────────────────────────────────
async function openForm(page, log) {
  for (let attempt = 1; attempt <= MAX_LOAD_ATTEMPTS; attempt++) {
    const resp = await page.goto(FORM_URL, { waitUntil: 'networkidle2', timeout: 45000 })
    const status = resp ? resp.status() : 0

    if (status !== 429) {
      try {
        await page.waitForSelector('[data-testid="property-value"]', { timeout: 20000 })
        await sleep(1000)
        return
      } catch (_) {
        if (attempt === MAX_LOAD_ATTEMPTS) throw new Error(`폼이 렌더되지 않았습니다 (HTTP ${status})`)
        log(`    폼 렌더 실패 (HTTP ${status}) — 재시도 ${attempt}/${MAX_LOAD_ATTEMPTS - 1}`)
        await sleep(RATE_LIMIT_BASE_MS)
        continue
      }
    }

    if (attempt === MAX_LOAD_ATTEMPTS) {
      throw new Error('Notion 요청 제한(429)이 풀리지 않았습니다. 잠시 후 다시 시도하세요.')
    }
    const wait = RATE_LIMIT_BASE_MS * attempt
    log(`    요청 제한(429) — ${Math.round(wait / 1000)}초 대기 후 재시도 ${attempt}/${MAX_LOAD_ATTEMPTS - 1}`)
    await sleep(wait)
  }
}

// ─── 신청자 1명 처리 ──────────────────────────────────────────────────────────
async function processApplicant(page, applicant, date, { dryRun, log }) {
  await openForm(page, log)

  // 제출 전 단계. 하나라도 실패하면 제출하지 않는다 — 빈 폼이 접수되는 걸 막는다.
  const steps = [
    ['이름',        () => fillText(page, FIELD.name,     applicant.name)],
    ['소속/기관',   () => fillText(page, FIELD.org,      applicant.org)],
    ['직급',        () => fillText(page, FIELD.position, applicant.position)],
    ['연락처',      () => fillText(page, FIELD.contact,  applicant.contact)],
    ['방문 희망일', () => selectDate(page, date)],
    ['입장 시간',   () => selectTime(page, PROP_ENTRY, applicant.entryTime)],
    ['퇴장 시간',   () => selectTime(page, PROP_EXIT,  applicant.exitTime)],
    ['방문 목적',   () => fillText(page, FIELD.purpose,  applicant.purpose, 'textarea')],
    ['사용 장비',   () => fillText(page, FIELD.equip,    applicant.equipment)],
  ]

  for (const [label, fn] of steps) {
    try {
      await fn()
      log(`    ${label}... ✓`)
    } catch (err) {
      log(`    ${label}... ✗  [${err.message}]`)
      return { ok: false, reason: `${label} 실패` }
    }
  }

  if (dryRun) {
    log('    제출... 건너뜀 (dry-run)')
    return { ok: true, reason: 'dry-run (미제출)' }
  }

  try {
    const done = await submit(page)
    log(`    제출... ${done ? '✓' : '✗  [완료 화면 미확인]'}`)
    return done ? { ok: true, reason: '제출 완료' } : { ok: false, reason: '결과 미확인' }
  } catch (err) {
    log(`    제출... ✗  [${err.message}]`)
    return { ok: false, reason: '제출 실패' }
  }
}

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2)
  const get     = f => { const i = argv.indexOf(f); return i !== -1 ? argv[i + 1] : null }
  const getAll  = f => argv.reduce((acc, v, i) => (v === f && argv[i + 1] ? [...acc, argv[i + 1]] : acc), [])
  const has     = f => argv.includes(f)

  const dateStr  = get('--date')
  const headless = has('--headless')
  const dryRun   = has('--dry-run')
  const onlyIds  = getAll('--only')

  if (!dateStr) { console.error('--date YYYY-MM-DD 필요'); process.exit(1) }
  const date = parseDateStr(dateStr)

  const applicants = loadApplicants(onlyIds)
  if (applicants.length === 0) {
    console.log('활성화된 신청자가 없습니다. 신청할 사람을 활성화한 뒤 다시 실행하세요.')
    process.exit(1)
  }

  const log = line => console.log(line)

  console.log(`\n신청일: ${dateStr} (${DAY_NAMES[date.getDay()]})`)
  console.log(`대상: ${applicants.length}명${dryRun ? '  [dry-run — 제출하지 않음]' : ''}\n`)

  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1280,960', '--lang=ko-KR'],
  })

  const results = []
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 960 })
    // Notion 폼이 한국어로 렌더되도록 강제 (--lang 인자만으론 안 됨)
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.5' })

    for (let i = 0; i < applicants.length; i++) {
      const a = applicants[i]
      const idx = `[${String(i + 1).padStart(2, '0')}/${String(applicants.length).padStart(2, '0')}]`
      console.log(`${idx} ${a.name} — ${a.equipment}, ${a.entryTime}~${a.exitTime}`)

      let res
      try {
        res = await processApplicant(page, a, date, { dryRun, log })
      } catch (err) {
        log(`    중단... ✗  [${err.message}]`)
        res = { ok: false, reason: err.message }
      }
      results.push({ name: a.name, ...res })
      console.log(`  → ${res.reason}\n`)

      if (i < applicants.length - 1) await sleep(GAP_BETWEEN_APPLICANTS_MS)
    }
  } finally {
    await browser.close()
  }

  const ok   = results.filter(r => r.ok)
  const fail = results.filter(r => !r.ok)

  console.log('─'.repeat(44))
  console.log(`완료: 성공 ${ok.length}명  /  실패 ${fail.length}명`)
  for (const r of fail) console.log(`  실패 — ${r.name}: ${r.reason}`)

  if (fail.length > 0) process.exitCode = 2
}

module.exports = { parseDateStr, loadApplicants, processApplicant, APPLICANTS_PATH, CHROMIUM_PATH }

if (require.main === module) {
  main().catch(err => { console.error(`오류: ${err.message}`); process.exit(1) })
}
