'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

const BASE_URL = 'https://www.jobkorea.co.kr/Search/';
const REQUEST_TIMEOUT_MS = 20000;
const DELAY_MS = 1400;

const SEARCH_QUERIES = [
  '산학장학생 모집',
  'R&D 산학장학생',
  '석박사 산학장학생',
  '산학장학생 로봇',
  '산학장학생 AI 연구',
  '채용연계 장학생',
];

// 제목에 이 중 하나 이상이 포함되어야 관련 공고로 판단
const TITLE_KEYWORDS = [
  '산학장학생', '산학 장학생', '채용연계 장학', 'r&d 장학', '석박사 장학',
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  Referer: 'https://www.jobkorea.co.kr/',
};

function generateId(url) {
  return 'jobkorea-sch:' + crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTitleRelated(title) {
  const lower = title.toLowerCase();
  return TITLE_KEYWORDS.some((k) => lower.includes(k));
}

function parseDeadlineFromText(text) {
  if (text.includes('상시채용') || text.includes('채용시')) return '상시채용';
  const m = text.match(/(\d{2})\/(\d{2})\([^)]+\)\s*마감/);
  if (m) {
    const [, mm, dd] = m;
    const year = new Date().getFullYear();
    const candidate = new Date(`${year}-${mm}-${dd}T23:59:00+09:00`);
    if (candidate < new Date()) candidate.setFullYear(year + 1);
    return candidate.toISOString();
  }
  return '미기재';
}

function parsePostedAtFromText(text) {
  const m = text.match(/(\d{2})\/(\d{2})\([^)]+\)\s*등록/);
  if (m) {
    const [, mm, dd] = m;
    const year = new Date().getFullYear();
    return new Date(`${year}-${mm}-${dd}T00:00:00+09:00`).toISOString();
  }
  return new Date().toISOString();
}

async function fetchQuery(query, limit) {
  const items = [];
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        stext: query,
        typ: 1,
        ord: 2,
      },
      headers: HEADERS,
      timeout: REQUEST_TIMEOUT_MS,
    });

    const $ = cheerio.load(response.data);
    const seen = new Set();

    $('[class*="Box_bg"]').each((_, el) => {
      if (items.length >= limit) return false;

      const $el = $(el);
      const $titleLink = $el.find('a[href*="/Recruit/GI_Read/"]').filter((_, a) => {
        return $(a).text().trim().length >= 5;
      }).first();

      if (!$titleLink.length) return;

      const href = $titleLink.attr('href') || '';
      const idMatch = href.match(/GI_Read\/(\d+)/);
      if (!idMatch) return;

      const cleanUrl = `https://www.jobkorea.co.kr/Recruit/GI_Read/${idMatch[1]}`;
      if (seen.has(cleanUrl)) return;
      seen.add(cleanUrl);

      const $allLinks = $el.find('a[href*="/Recruit/GI_Read/"]');
      const title = ($allLinks.eq(1).text().trim() || $allLinks.eq(0).text().trim());
      if (!title) return;

      // 산학장학생 관련 키워드 pre-filter
      if (!isTitleRelated(title)) return;

      const company = $allLinks.eq(2).text().trim() || '미기재';
      const fullText = $el.text().replace(/\s+/g, ' ').trim();

      const afterCompany = fullText.replace(title, '').replace(company, '');
      const locMatch = afterCompany.match(/([가-힣]+(특별시|광역시|특별자치시|시|도)(\s+[가-힣]+구)?)/);
      const location = locMatch ? locMatch[1] : '미기재';

      const expMatch = fullText.match(/(석사|박사|석\/박사|석박사|신입|경력무관)/);
      const experience = expMatch ? expMatch[1] : undefined;

      const salaryMatch = fullText.match(/(월급|시급|연봉|급여|장학금)\s*[\d~,]+\s*만원/);
      const salary = salaryMatch ? salaryMatch[0] : undefined;

      const deadline = parseDeadlineFromText(fullText);
      const postedAt = parsePostedAtFromText(fullText);

      const tags = TITLE_KEYWORDS.filter((k) => title.toLowerCase().includes(k)).slice(0, 5);

      items.push({
        id: generateId(cleanUrl),
        title,
        company,
        location,
        deadline,
        postedAt,
        source: 'jobkorea',
        url: cleanUrl,
        tags,
        experience,
        salary,
      });
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      console.error(`[잡코리아] 타임아웃: "${query}"`);
    } else if (err.response) {
      console.error(`[잡코리아] HTTP ${err.response.status}: "${query}"`);
    } else {
      console.error(`[잡코리아] 오류 ("${query}"):`, err.message);
    }
  }
  return items;
}

async function fetchJobkorea(limitPerQuery = 10) {
  console.log('[잡코리아] 산학장학생 공고 수집 시작...');
  const allItems = [];
  const seenIds = new Set();

  for (const query of SEARCH_QUERIES) {
    console.log(`[잡코리아] 검색: "${query}"`);
    const items = await fetchQuery(query, limitPerQuery);

    for (const item of items) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allItems.push(item);
      }
    }
    console.log(`[잡코리아] "${query}" → ${items.length}개`);
    await sleep(DELAY_MS);
  }

  console.log(`[잡코리아] 총 수집: ${allItems.length}개`);
  return allItems;
}

module.exports = { fetchJobkorea };
