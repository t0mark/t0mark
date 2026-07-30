'use strict';

const axios = require('axios');

const SS_API = 'https://api.semanticscholar.org/graph/v1/paper/search';
const REQUEST_TIMEOUT_MS = 20000;

// 로보틱스 관련 검색 쿼리 - 관심 R&D 도메인 전반을 커버
// (조작/휴머노이드/VLA는 기존, SLAM/자율주행/RL/모바일 매니퓰레이션 추가)
const QUERIES = [
  // 조작·손
  'robot manipulation foundation model',
  'dexterous hand manipulation',
  'mobile manipulation',
  // 학습 정책
  'vision language action robot',
  'diffusion policy robot',
  'visuomotor policy learning',
  'robot reinforcement learning',
  // 시뮬-투-리얼
  'sim-to-real transfer robotics',
  // 휴머노이드·이동
  'humanoid robot learning',
  'quadruped locomotion learning',
  // 인식·SLAM
  'visual SLAM localization',
  'lidar 3D object detection',
  // 자율주행
  'end-to-end autonomous driving',
  // 임베디드 AI
  'embodied AI navigation',
];

/**
 * Semantic Scholar Graph API에서 로보틱스 최신 논문 수집
 * @param {number} limitPerQuery - 쿼리당 최대 논문 수
 * @returns {Promise<object[]>}
 */
async function fetchSemanticScholar(limitPerQuery = 8) {
  console.log('[SemanticScholar] Fetching papers...');
  const allItems = [];
  const seenIds = new Set();

  for (const query of QUERIES) {
    try {
      const response = await axios.get(SS_API, {
        params: {
          query,
          fields: 'title,abstract,authors,year,publicationDate,externalIds,url',
          limit: limitPerQuery,
          // publicationDateOrYear:2025- 로 최근 논문만 (Semantic Scholar 지원 파라미터)
        },
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          'User-Agent': 't0mark-trends-bot/1.0',
        },
      });

      const papers = response.data?.data ?? [];

      for (const p of papers) {
        if (!p.title || !p.paperId) continue;

        // 고유 ID 결정 우선순위: DOI > ArXiv ID > paperId
        const doi = p.externalIds?.DOI;
        const arxivId = p.externalIds?.ArXiv;
        const id = doi ? `doi:${doi}` : arxivId ? `arxiv:${arxivId}` : `ss:${p.paperId}`;

        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const url =
          p.url ||
          (arxivId
            ? `https://arxiv.org/abs/${arxivId}`
            : `https://www.semanticscholar.org/paper/${p.paperId}`);

        // 날짜 파싱
        let publishedAt;
        if (p.publicationDate) {
          publishedAt = new Date(p.publicationDate).toISOString();
        } else if (p.year) {
          publishedAt = new Date(`${p.year}-01-01`).toISOString();
        } else {
          publishedAt = new Date().toISOString();
        }

        allItems.push({
          id,
          title: p.title,
          abstract: p.abstract ?? '',
          source: 'semanticscholar',
          url,
          publishedAt,
          authors: (p.authors ?? []).map((a) => a.name).filter(Boolean),
          tags: [],
        });
      }

      console.log(`[SemanticScholar] "${query}" → ${papers.length} papers`);
    } catch (err) {
      if (err.response?.status === 429) {
        console.warn('[SemanticScholar] Rate limit hit — skipping remaining queries.');
        break;
      } else if (err.code === 'ECONNABORTED') {
        console.error(`[SemanticScholar] Timeout on query: "${query}"`);
      } else {
        console.error(`[SemanticScholar] Failed on query "${query}":`, err.message);
      }
    }
  }

  console.log(`[SemanticScholar] Total fetched: ${allItems.length} papers.`);
  return allItems;
}

module.exports = { fetchSemanticScholar };
