'use strict';

const Parser = require('rss-parser');
const crypto = require('crypto');

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 't0mark-trends-bot/1.0 (personal research aggregator)',
    Accept: 'application/rss+xml, application/atom+xml, text/xml, */*',
  },
  // 추가 custom 필드 (author, creator 등)
  customFields: {
    item: [
      ['dc:creator', 'creator'],
      ['media:content', 'mediaContent'],
    ],
  },
});

// NVIDIA 블로그 로보틱스 관련 키워드 필터
const NVIDIA_KEYWORDS = [
  'robot', 'robotics', 'autonomous', 'manipulation', 'isaac',
  'perception', 'humanoid', 'drone', 'navigation', 'embodied',
  'sim-to-real', 'dexterous', 'locomotion',
];

function isNvidiaRoboticsRelated(title, abstract) {
  const text = `${title} ${abstract}`.toLowerCase();
  return NVIDIA_KEYWORDS.some((kw) => text.includes(kw));
}

// 구독할 RSS 피드 목록 (무인증, 무료)
const RSS_FEEDS = [
  {
    source: 'robotreport',
    label: 'The Robot Report',
    url: 'https://www.therobotreport.com/feed/',
    filter: null,
  },
  {
    source: 'ieeespectrum',
    label: 'IEEE Spectrum (Robotics)',
    url: 'https://spectrum.ieee.org/feeds/topic/robotics.rss',
    filter: null,
  },
  {
    source: 'robohub',
    label: 'Robohub',
    url: 'https://robohub.org/feed/',
    filter: null,
  },
  {
    source: 'rosdiscourse',
    label: 'ROS Discourse',
    url: 'https://discourse.ros.org/latest.rss',
    filter: null,
  },
  {
    source: 'nvidia',
    label: 'NVIDIA Technical Blog',
    url: 'https://blogs.nvidia.com/feed/',
    filter: isNvidiaRoboticsRelated, // 로보틱스 관련 글만 수집
  },
  {
    source: 'deepmind',
    label: 'Google DeepMind / AI Blog',
    url: 'https://blog.google/innovation-and-ai/technology/ai/rss/',
    filter: null,
  },
  {
    source: 'openai',
    label: 'OpenAI News',
    url: 'https://openai.com/news/rss.xml',
    filter: null,
  },
];

/**
 * HTML 태그 및 엔티티를 제거하고 텍스트만 추출
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * URL 기반 결정적 해시로 고유 ID 생성
 * @param {string} source
 * @param {string} url
 * @returns {string}
 */
function generateId(source, url) {
  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
  return `${source}:${hash}`;
}

/**
 * 모든 RSS 피드에서 최신 아이템 수집
 * @param {number} maxPerFeed - 피드당 최대 아이템 수
 * @returns {Promise<object[]>}
 */
async function fetchRssFeeds(maxPerFeed = 10) {
  const allItems = [];

  for (const feed of RSS_FEEDS) {
    console.log(`[RSS] Fetching ${feed.label}...`);
    try {
      const result = await parser.parseURL(feed.url);
      const rawItems = (result.items ?? []).slice(0, maxPerFeed);

      const items = rawItems
        .map((item) => {
          const url = item.link ?? item.guid ?? '';
          if (!url) return null;

          // 요약 추출: content > contentSnippet > summary 순으로 시도
          const rawAbstract =
            item.content ?? item.contentSnippet ?? item.summary ?? item['content:encoded'] ?? '';
          const abstract = stripHtml(rawAbstract).slice(0, 600);

          // 저자 추출
          const author = item.creator ?? item.author ?? '';

          const title = item.title ? stripHtml(item.title) : '(제목 없음)';

          // 소스별 필터 적용 (예: NVIDIA → 로보틱스 관련 글만)
          if (feed.filter && !feed.filter(title, abstract)) return null;

          return {
            id: generateId(feed.source, url),
            title,
            abstract,
            source: feed.source,
            url,
            publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
            authors: author ? [author] : [],
            tags: [],
          };
        })
        .filter(Boolean);

      console.log(`[RSS] ${feed.label}: ${items.length} items`);
      allItems.push(...items);
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        console.error(`[RSS] Timeout fetching ${feed.label}`);
      } else if (err.message?.includes('Invalid XML')) {
        console.error(`[RSS] XML parse error for ${feed.label}: ${err.message}`);
      } else {
        console.error(`[RSS] Failed to fetch ${feed.label}:`, err.message);
      }
      // 개별 피드 실패 시 계속 진행
    }
  }

  console.log(`[RSS] Total fetched: ${allItems.length} items.`);
  return allItems;
}

module.exports = { fetchRssFeeds };
