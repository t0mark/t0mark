'use strict';

const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'https://www.wanted.co.kr/api/v4/jobs';
const REQUEST_TIMEOUT_MS = 15000;

// 원티드는 공개 API의 키워드 검색을 지원하지 않음
// → 최신 공고를 대량 수집 후 타이틀 기반 이중 필터링
const INTERN_KEYWORDS = ['인턴', 'intern', '인턴십', 'internship'];

// 짧은 키워드(ai, nlp 등)는 단어 경계 매칭이 필요 → 별도 처리
const TECH_KEYWORDS_WORD = [
  /\bai\b/, /\bnlp\b/, /\bml\b/, /\bllm\b/,
  /\brobot/i, /\br&d\b/i, /\brl\b/,
];
const TECH_KEYWORDS_SUBSTR = [
  '로봇', '로보틱스', '인공지능', '머신러닝', '딥러닝',
  '자율주행', '컴퓨터 비전', 'computer vision',
  '임베디드', 'embedded', '연구개발',
  '데이터 사이언스', 'data science',
  '강화학습', 'reinforcement learning',
  '자연어처리',
];

function generateId(id) {
  return 'wanted:' + crypto.createHash('md5').update(String(id)).digest('hex').slice(0, 12);
}

function isIntern(position) {
  const lower = position.toLowerCase();
  return INTERN_KEYWORDS.some((k) => lower.includes(k));
}

function isTechRelated(position) {
  const lower = position.toLowerCase();
  return (
    TECH_KEYWORDS_WORD.some((re) => re.test(lower)) ||
    TECH_KEYWORDS_SUBSTR.some((k) => lower.includes(k))
  );
}

/**
 * 원티드 v4 API - 페이지네이션으로 대량 수집 후 인턴 + 기술 키워드 이중 필터링
 * @param {number} targetLimit - 목표 수집 수 (필터 후)
 * @returns {Promise<object[]>}
 */
async function fetchWanted(targetLimit = 30) {
  console.log('[원티드] 인턴 공고 수집 시작...');
  const allItems = [];
  const seenIds = new Set();

  const PAGE_SIZE = 100;
  const MAX_PAGES = 10; // 최대 1000개 스캔

  for (let page = 0; page < MAX_PAGES; page++) {
    if (allItems.length >= targetLimit) break;

    try {
      const response = await axios.get(BASE_URL, {
        params: {
          country: 'kr',
          job_sort: 'job.latest_order',
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          Referer: 'https://www.wanted.co.kr/',
        },
        timeout: REQUEST_TIMEOUT_MS,
      });

      const jobs = response.data?.data ?? [];
      if (jobs.length === 0) break;

      for (const job of jobs) {
        if (allItems.length >= targetLimit) break;
        if (!job.id || !job.position) continue;

        const position = job.position ?? '';

        // 인턴 키워드 + 기술 키워드 이중 필터
        if (!isIntern(position) || !isTechRelated(position)) continue;

        const id = generateId(job.id);
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const url = `https://www.wanted.co.kr/wd/${job.id}`;
        const company = job.company?.name ?? '미기재';
        const location = job.address?.location ?? '미기재';

        let deadline = '상시채용';
        if (job.due_time) {
          try {
            deadline = new Date(job.due_time).toISOString();
          } catch {
            deadline = job.due_time;
          }
        }

        let postedAt = new Date().toISOString();
        if (job.created_time) {
          try {
            postedAt = new Date(job.created_time).toISOString();
          } catch { /* fallback */ }
        }

        // 포지션 제목에서 태그 추출
        const posLower = position.toLowerCase();
        const tags = [
          ...TECH_KEYWORDS_SUBSTR.filter((k) => posLower.includes(k)),
          ...TECH_KEYWORDS_WORD.filter((re) => re.test(posLower)).map((re) => re.source.replace(/\\b|\\|i/g, '')),
        ].slice(0, 5);

        allItems.push({
          id,
          title: position,
          company,
          location,
          deadline,
          postedAt,
          source: 'wanted',
          url,
          tags,
          experience: undefined,
          salary: undefined,
        });
      }

      console.log(`[원티드] page ${page + 1}: ${jobs.length}개 스캔, 누적 ${allItems.length}개`);

      if (jobs.length < PAGE_SIZE) break;
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        console.error(`[원티드] 타임아웃 (page ${page + 1})`);
      } else if (err.response) {
        console.error(`[원티드] HTTP ${err.response.status} (page ${page + 1})`);
      } else {
        console.error(`[원티드] 오류:`, err.message);
      }
      break;
    }
  }

  console.log(`[원티드] 총 수집: ${allItems.length}개`);
  return allItems;
}

module.exports = { fetchWanted };
