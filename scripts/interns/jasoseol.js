'use strict';

const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'https://jasoseol.com/api/v1/employment_companies';
const REQUEST_TIMEOUT_MS = 15000;
const DELAY_MS = 800;

// 제목에 이 중 하나 이상이 포함되어야 관련 공고로 판단
const TITLE_TECH_KEYWORDS = [
  '로봇', '로보틱스', 'robot', 'robotics',
  'ai', '인공지능', '머신러닝', '딥러닝',
  '자율주행', '컴퓨터 비전', 'computer vision',
  '제어', '임베디드', 'embedded',
  'r&d', '연구개발', '연구원', '인턴', '인턴십',
  '소프트웨어 연구', '알고리즘', '데이터 사이언스',
  '강화학습', 'slam', '경로계획',
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  Referer: 'https://jasoseol.com/',
};

function generateId(id) {
  return 'jasoseol:' + crypto.createHash('md5').update(String(id)).digest('hex').slice(0, 12);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTechRelated(title) {
  const lower = title.toLowerCase();
  return TITLE_TECH_KEYWORDS.some((k) => lower.includes(k));
}

/**
 * 자소설닷컴 인턴 공고 수집
 * API: https://jasoseol.com/api/v1/employment_companies?career=인턴&page=N&per=20
 * @param {number} targetLimit - 수집 목표 수 (필터 후)
 * @returns {Promise<object[]>}
 */
async function fetchJasoseol(targetLimit = 20) {
  console.log('[자소설닷컴] 인턴 공고 수집 시작...');
  const allItems = [];
  const seenIds = new Set();
  const MAX_PAGES = 15;

  for (let page = 1; page <= MAX_PAGES; page++) {
    if (allItems.length >= targetLimit) break;

    try {
      const response = await axios.get(BASE_URL, {
        params: {
          career: '인턴',
          page,
          per: 20,
        },
        headers: HEADERS,
        timeout: REQUEST_TIMEOUT_MS,
      });

      const jobs = response.data;
      if (!Array.isArray(jobs) || jobs.length === 0) break;

      for (const job of jobs) {
        if (allItems.length >= targetLimit) break;
        if (!job.id || !job.title) continue;

        // 제목 기반 기술 키워드 필터
        if (!isTechRelated(job.title)) continue;

        const id = generateId(job.id);
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const url = `https://jasoseol.com/recruit/${job.id}`;
        const company = job.name ?? '미기재';

        let deadline = '미기재';
        if (job.end_time) {
          try {
            deadline = new Date(job.end_time).toISOString();
          } catch {
            deadline = job.end_time;
          }
        }

        let postedAt = new Date().toISOString();
        if (job.created_at) {
          try {
            postedAt = new Date(job.created_at).toISOString();
          } catch { /* fallback */ }
        } else if (job.start_time) {
          try {
            postedAt = new Date(job.start_time).toISOString();
          } catch { /* fallback */ }
        }

        // 태그: 제목에서 TITLE_TECH_KEYWORDS 추출
        const tags = TITLE_TECH_KEYWORDS.filter((k) =>
          job.title.toLowerCase().includes(k)
        ).slice(0, 5);

        allItems.push({
          id,
          title: job.title,
          company,
          location: '미기재',
          deadline,
          postedAt,
          source: 'jasoseol',
          url,
          tags,
          experience: undefined,
          salary: undefined,
        });
      }

      console.log(`[자소설닷컴] page ${page}: ${jobs.length}개 스캔, 누적 ${allItems.length}개`);

      if (jobs.length < 20) break;
      await sleep(DELAY_MS);
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        console.error(`[자소설닷컴] 타임아웃 (page ${page})`);
      } else if (err.response) {
        console.error(`[자소설닷컴] HTTP ${err.response.status} (page ${page})`);
      } else {
        console.error(`[자소설닷컴] 오류:`, err.message);
      }
      break;
    }
  }

  console.log(`[자소설닷컴] 총 수집: ${allItems.length}개`);
  return allItems;
}

module.exports = { fetchJasoseol };
