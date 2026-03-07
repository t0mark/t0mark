'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

const BASE_URL = 'https://www.jobkorea.co.kr/Search/';
const REQUEST_TIMEOUT_MS = 20000;
const DELAY_MS = 1400;

// 사람인과 동일한 검색 쿼리 세트
const SEARCH_QUERIES = [
  '로봇 연구 인턴',
  '로보틱스 인턴십',
  'AI 연구원 인턴',
  '자율주행 인턴',
  '컴퓨터 비전 인턴',
  '딥러닝 연구 인턴',
  '머신러닝 인턴십',
  '제어공학 인턴',
  '임베디드 로봇 인턴',
  'R&D 연구소 인턴',
];

// 관련 없는 결과 필터링: 제목에 기술 키워드가 있어야 함
const TECH_KEYWORDS = [
  '로봇', '로보틱스', 'robot', 'ai', '인공지능',
  '머신러닝', '딥러닝', '자율주행', '컴퓨터 비전',
  '연구', 'r&d', '제어', '임베디드', '소프트웨어',
  '데이터', '알고리즘', '엔지니어', '개발',
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  Referer: 'https://www.jobkorea.co.kr/',
};

function generateId(url) {
  return 'jobkorea:' + crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTechRelated(title) {
  const lower = title.toLowerCase();
  return TECH_KEYWORDS.some((k) => lower.includes(k));
}

/**
 * 컨테이너 텍스트에서 마감일 파싱
 * 형식: "MM/DD(요일) 마감" 또는 "상시채용"
 */
function parseDeadlineFromText(text) {
  if (text.includes('상시채용') || text.includes('채용시')) return '상시채용';
  // "04/03(금) 마감" 패턴
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

/**
 * 컨테이너 텍스트에서 등록일 파싱
 * 형식: "MM/DD(요일) 등록"
 */
function parsePostedAtFromText(text) {
  const m = text.match(/(\d{2})\/(\d{2})\([^)]+\)\s*등록/);
  if (m) {
    const [, mm, dd] = m;
    const year = new Date().getFullYear();
    return new Date(`${year}-${mm}-${dd}T00:00:00+09:00`).toISOString();
  }
  return new Date().toISOString();
}

/**
 * 잡코리아 검색 결과 파싱
 * - HTML은 CSS 모듈 기반이므로 class명 대신 href 패턴으로 컨테이너 특정
 * - 각 공고 컨테이너에서 텍스트 블록을 파싱
 */
async function fetchQuery(query, limit) {
  const items = [];
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        stext: query,
        typ: 1,  // 채용 공고
        ord: 2,  // 최신순
      },
      headers: HEADERS,
      timeout: REQUEST_TIMEOUT_MS,
    });

    const $ = cheerio.load(response.data);
    const seen = new Set();

    // GI_Read 링크를 포함한 Box_bg 컨테이너를 공고 단위로 처리
    $('[class*="Box_bg"]').each((_, el) => {
      if (items.length >= limit) return false;

      const $el = $(el);
      const $titleLink = $el.find('a[href*="/Recruit/GI_Read/"]').filter((_, a) => {
        // 공고 제목 링크 = 텍스트 길이가 일정 이상인 것
        return $(a).text().trim().length >= 5;
      }).first();

      if (!$titleLink.length) return;

      const href = $titleLink.attr('href') || '';
      // GI_Read URL에서 공고 ID 추출
      const idMatch = href.match(/GI_Read\/(\d+)/);
      if (!idMatch) return;

      const cleanUrl = `https://www.jobkorea.co.kr/Recruit/GI_Read/${idMatch[1]}`;
      if (seen.has(cleanUrl)) return;
      seen.add(cleanUrl);

      // 컨테이너 내 모든 GI_Read 링크: link[0]=스크랩버튼, link[1]=제목, link[2]=회사명
      const $allLinks = $el.find('a[href*="/Recruit/GI_Read/"]');
      const title = ($allLinks.eq(1).text().trim() || $allLinks.eq(0).text().trim());
      if (!title) return;

      // 관련 없는 공고 필터링 (제목에 기술 키워드 없으면 제외)
      if (!isTechRelated(title)) return;

      // 회사명: link[2]
      const company = $allLinks.eq(2).text().trim() || '미기재';

      // 컨테이너 전체 텍스트로 메타데이터 파싱
      const fullText = $el.text().replace(/\s+/g, ' ').trim();

      // 근무지: 시/도 패턴 추출 (회사명 이후에 등장)
      const afterCompany = fullText.replace(title, '').replace(company, '');
      const locMatch = afterCompany.match(/([가-힣]+(특별시|광역시|특별자치시|시|도)(\s+[가-힣]+구)?)/);
      const location = locMatch ? locMatch[1] : '미기재';

      // 경력 조건
      const expMatch = fullText.match(/(신입|경력무관|경력\s*\d+년|인턴)/);
      const experience = expMatch ? expMatch[1] : undefined;

      // 급여
      const salaryMatch = fullText.match(/(월급|시급|연봉|급여)\s*[\d~,]+\s*만원/);
      const salary = salaryMatch ? salaryMatch[0] : undefined;

      const deadline = parseDeadlineFromText(fullText);
      const postedAt = parsePostedAtFromText(fullText);

      // 직무 태그: TECH_KEYWORDS 중 제목에 포함된 것
      const tags = TECH_KEYWORDS.filter((k) => title.toLowerCase().includes(k)).slice(0, 5);

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

/**
 * 잡코리아에서 로봇·AI R&D 인턴 공고 수집
 * @param {number} limitPerQuery
 * @returns {Promise<object[]>}
 */
async function fetchJobkorea(limitPerQuery = 10) {
  console.log('[잡코리아] 인턴 공고 수집 시작...');
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
