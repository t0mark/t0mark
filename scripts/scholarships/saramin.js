'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

const BASE_URL = 'https://www.saramin.co.kr/zf_user/search/recruit';
const REQUEST_TIMEOUT_MS = 20000;
const DELAY_MS = 1200;

const SEARCH_QUERIES = [
  '산학장학생 로봇',
  '산학장학생 AI',
  '산학장학생 자율주행',
  '산학장학생 반도체',
  'R&D 석박사 산학장학생',
  '채용연계 장학생 연구',
  '산학 장학생 딥러닝',
  '산학 장학생 컴퓨터비전',
];

// 제목에 이 중 하나 이상이 포함되어야 관련 공고로 판단
const TITLE_KEYWORDS = [
  '산학장학생', '산학 장학생', '채용연계 장학', 'r&d 장학', '석박사 장학',
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
  Referer: 'https://www.saramin.co.kr/',
};

function generateId(url) {
  return 'saramin-sch:' + crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseDeadline(raw) {
  if (!raw) return '미기재';
  const cleaned = raw.replace(/[~\s까지]/g, '').trim();
  if (cleaned.includes('상시') || cleaned.includes('채용시')) return '상시채용';
  if (cleaned.includes('오늘') || cleaned.includes('today')) {
    const today = new Date();
    today.setHours(23, 59, 0, 0);
    return today.toISOString();
  }
  const full = cleaned.match(/(\d{2})\/(\d{2})\/(\d{2})/);
  if (full) {
    const [, yy, mm, dd] = full;
    return new Date(`20${yy}-${mm}-${dd}T23:59:00+09:00`).toISOString();
  }
  const short = cleaned.match(/(\d{2})\/(\d{2})\([^)]*\)/);
  if (short) {
    const [, mm, dd] = short;
    const year = new Date().getFullYear();
    const candidate = new Date(`${year}-${mm}-${dd}T23:59:00+09:00`);
    if (candidate < new Date()) candidate.setFullYear(year + 1);
    return candidate.toISOString();
  }
  return raw.trim() || '미기재';
}

async function fetchQuery(query, limit) {
  const items = [];
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        searchword: query,
        recruitSort: 'reg_dt',
        recruitPage: 1,
        // job_type 미지정: 산학장학생은 인턴십 카테고리 아님
      },
      headers: HEADERS,
      timeout: REQUEST_TIMEOUT_MS,
    });

    const $ = cheerio.load(response.data);

    $('.item_recruit').each((_, el) => {
      if (items.length >= limit) return false;

      try {
        const $el = $(el);

        const $titleLink = $el.find('.job_tit a').first();
        const title = $titleLink.text().trim();
        const href = $titleLink.attr('href') ?? '';
        if (!title || !href) return;

        // 산학장학생 관련 키워드 pre-filter
        const titleLower = title.toLowerCase();
        if (!TITLE_KEYWORDS.some((k) => titleLower.includes(k))) return;

        const fullHref = href.startsWith('http') ? href : 'https://www.saramin.co.kr' + href;
        const recIdxMatch = fullHref.match(/rec_idx=(\d+)/);
        if (!recIdxMatch) return;
        const url = `https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=${recIdxMatch[1]}`;

        const company = $el.find('.corp_name a').first().text().trim() || '미기재';

        const conditions = $el
          .find('.job_condition span')
          .map((_, s) => $(s).text().trim())
          .get()
          .filter(Boolean);
        const location = conditions[0] ?? '미기재';
        const experience = conditions[1] ?? '';

        const deadlineRaw = $el.find('.job_date .date').first().text().trim();
        const deadline = parseDeadline(deadlineRaw);

        const tags = $el
          .find('.job_sector a, .job_sector span')
          .map((_, t) => $(t).text().trim())
          .get()
          .filter((t) => t && t !== '·');

        items.push({
          id: generateId(url),
          title,
          company,
          location,
          deadline,
          postedAt: new Date().toISOString(),
          source: 'saramin',
          url,
          tags: tags.slice(0, 5),
          experience: experience || undefined,
        });
      } catch (e) {
        console.warn('[사람인] 항목 파싱 실패:', e.message);
      }
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      console.error(`[사람인] 타임아웃: "${query}"`);
    } else if (err.response) {
      console.error(`[사람인] HTTP ${err.response.status}: "${query}"`);
    } else {
      console.error(`[사람인] 오류 ("${query}"):`, err.message);
    }
  }
  return items;
}

async function fetchSaramin(limitPerQuery = 10) {
  console.log('[사람인] 산학장학생 공고 수집 시작...');
  const allItems = [];
  const seenIds = new Set();

  for (const query of SEARCH_QUERIES) {
    console.log(`[사람인] 검색: "${query}"`);
    const items = await fetchQuery(query, limitPerQuery);

    for (const item of items) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allItems.push(item);
      }
    }
    console.log(`[사람인] "${query}" → ${items.length}개`);
    await sleep(DELAY_MS);
  }

  console.log(`[사람인] 총 수집: ${allItems.length}개`);
  return allItems;
}

module.exports = { fetchSaramin };
