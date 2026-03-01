#!/usr/bin/env node
'use strict';

// .env.local 로드 (Next.js 환경과 동일한 파일 사용)
require('dotenv').config({ path: '.env.local' });

const { fetchArxiv } = require('./fetchers/arxiv');
const { fetchSemanticScholar } = require('./fetchers/semanticscholar');
const { fetchRssFeeds } = require('./fetchers/rss');
const { translateItems } = require('./translator');
const { loadData, saveData, mergeItems } = require('./storage');

/**
 * CLI 옵션 파싱
 * --no-translate : 번역 스킵 (원문 그대로 저장, 빠른 테스트용)
 * --limit=N      : 소스당 수집 최대 N개 (기본값 소스별 상이)
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    noTranslate: args.includes('--no-translate'),
    limit: (() => {
      const arg = args.find((a) => a.startsWith('--limit='));
      return arg ? parseInt(arg.split('=')[1], 10) : null;
    })(),
  };
}

async function main() {
  const startTime = Date.now();
  const { noTranslate, limit } = parseArgs();

  console.log('╔══════════════════════════════════════╗');
  console.log('║   Robotics Trends Fetcher v1.0       ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`Started  : ${new Date().toLocaleString('ko-KR')}`);
  console.log(`Translate: ${noTranslate ? 'OFF (--no-translate)' : 'ON (GPT-4o-mini)'}`);
  if (limit) console.log(`Limit    : ${limit} per source`);
  console.log('');

  // 1. 기존 데이터 로드
  const existing = loadData();
  console.log(`[Info] Existing items: ${existing.items.length}`);

  // 2. 모든 소스에서 병렬 수집
  console.log('\n── Fetching ──────────────────────────');
  const [arxivItems, ssItems, rssItems] = await Promise.all([
    fetchArxiv(limit ?? 20),
    fetchSemanticScholar(limit ?? 8),
    fetchRssFeeds(limit ?? 10),
  ]);

  const allFetched = [...arxivItems, ...ssItems, ...rssItems];
  console.log(`\n[Info] Total fetched: ${allFetched.length}`);

  // 3. 중복 필터링
  const existingIds = new Set(existing.items.map((i) => i.id));
  const newItems = allFetched.filter((item) => !existingIds.has(item.id));
  console.log(`[Info] New unique items: ${newItems.length}`);

  if (newItems.length === 0) {
    console.log('\n[Info] No new items found. Updating lastUpdated timestamp.');
    saveData({ ...existing, lastUpdated: new Date().toISOString() });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nDone in ${elapsed}s`);
    return;
  }

  // 4. 번역
  let translatedItems;
  if (noTranslate) {
    console.log('\n── Translation SKIPPED ───────────────');
    translatedItems = newItems.map((item) => ({
      ...item,
      titleKo: item.title,
      abstractKo: item.abstract,
    }));
  } else {
    console.log(`\n── Translating ${newItems.length} items ──────────`);
    translatedItems = await translateItems(newItems);
  }

  // 5. 병합 저장
  console.log('\n── Saving ────────────────────────────');
  const merged = mergeItems(existing, translatedItems);
  saveData(merged);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n╔══════════════════════════════════════╗');
  console.log(`║  Done!  ${elapsed}s  Total: ${merged.items.length} items${' '.repeat(Math.max(0, 15 - String(merged.items.length).length))}║`);
  console.log('╚══════════════════════════════════════╝');
}

main().catch((err) => {
  console.error('\n[FATAL]', err.message);
  console.error(err.stack);
  process.exit(1);
});
