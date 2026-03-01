'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

const ARXIV_API = 'https://export.arxiv.org/api/query';
const REQUEST_TIMEOUT_MS = 20000;

/**
 * arXiv API (cs.RO 카테고리)에서 최신 논문 수집
 * Atom XML 형식 응답을 cheerio로 파싱
 * @param {number} maxResults
 * @returns {Promise<object[]>}
 */
async function fetchArxiv(maxResults = 20) {
  console.log(`[arXiv] Fetching top ${maxResults} cs.RO papers...`);

  try {
    const response = await axios.get(ARXIV_API, {
      params: {
        search_query: 'cat:cs.RO',
        sortBy: 'submittedDate',
        sortOrder: 'descending',
        max_results: maxResults,
      },
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'User-Agent': 't0mark-trends-bot/1.0 (personal research aggregator)',
        Accept: 'application/atom+xml',
      },
    });

    // cheerio로 Atom XML 파싱 (xmlMode 필수)
    const $ = cheerio.load(response.data, { xmlMode: true });
    const items = [];

    $('entry').each((_, el) => {
      try {
        const $el = $(el);

        // arXiv ID 추출: "http://arxiv.org/abs/XXXX.XXXXX" 형태
        const rawId = $el.find('id').first().text().trim();
        const paperId = rawId
          .replace('http://arxiv.org/abs/', '')
          .replace('https://arxiv.org/abs/', '')
          .split('v')[0]; // 버전 suffix 제거

        if (!paperId) return;

        const url = `https://arxiv.org/abs/${paperId}`;
        const title = $el.find('title').first().text().trim().replace(/\s+/g, ' ');
        const abstract = $el.find('summary').first().text().trim().replace(/\s+/g, ' ');
        const published = $el.find('published').first().text().trim();
        const authors = $el
          .find('author name')
          .map((_, nameEl) => $(nameEl).text().trim())
          .get();
        const categories = $el
          .find('category')
          .map((_, catEl) => $(catEl).attr('term') ?? '')
          .get()
          .filter(Boolean);

        if (!title) return;

        items.push({
          id: `arxiv:${paperId}`,
          title,
          abstract,
          source: 'arxiv',
          url,
          publishedAt: published || new Date().toISOString(),
          authors,
          tags: categories,
        });
      } catch (entryErr) {
        console.warn('[arXiv] Failed to parse an entry:', entryErr.message);
      }
    });

    console.log(`[arXiv] Fetched ${items.length} papers.`);
    return items;
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      console.error('[arXiv] Request timed out.');
    } else if (err.response) {
      console.error(`[arXiv] HTTP ${err.response.status}: ${err.response.statusText}`);
    } else {
      console.error('[arXiv] Fetch failed:', err.message);
    }
    return [];
  }
}

module.exports = { fetchArxiv };
