#!/usr/bin/env node
'use strict';

// .env.local 로드 (Next.js 환경과 동일한 파일 사용)
require('dotenv').config({ path: '.env.local' });

const { fetchArxiv } = require('./fetchers/arxiv');
const { fetchSemanticScholar } = require('./fetchers/semanticscholar');
const { fetchRssFeeds } = require('./fetchers/rss');
const { translateItems } = require('./shared/translator');
const { createStorage } = require('./shared/storage');
const { gptFilter } = require('./trends/gpt-filter');

const { loadData, saveData, mergeItems, pruneExpired } = createStorage('data/robotics_trends.json');

// 소스별 TTL. 논문은 길게, 뉴스/블로그는 짧게.
const STALE_DAYS_BY_SOURCE = {
  arxiv: 365,
  semanticscholar: 365,
  robotreport: 90,
  ieeespectrum: 90,
  robohub: 90,
  rosdiscourse: 60,
  nvidia: 120,
  deepmind: 120,
  openai: 120,
};
const DEFAULT_STALE_DAYS = 90;

/**
 * CLI 옵션 파싱
 * --no-translate : 번역 스킵 (원문 그대로 저장, 빠른 테스트용)
 * --skip-gpt     : GPT 관련성 필터 건너뜀
 * --limit=N      : 소스당 수집 최대 N개 (기본값 소스별 상이)
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    noTranslate: args.includes('--no-translate'),
    skipGpt: args.includes('--skip-gpt'),
    limit: (() => {
      const arg = args.find((a) => a.startsWith('--limit='));
      return arg ? parseInt(arg.split('=')[1], 10) : null;
    })(),
  };
}

/**
 * 항목별로 TTL을 적용해 만료 정리
 * pruneExpired는 균일 staleDays만 지원하므로 소스별 그룹핑 후 개별 정리
 */
function pruneBySource(data) {
  const groups = new Map();
  for (const item of data.items) {
    const src = item.source || 'unknown';
    if (!groups.has(src)) groups.set(src, []);
    groups.get(src).push(item);
  }

  const kept = [];
  for (const [src, items] of groups) {
    const staleDays = STALE_DAYS_BY_SOURCE[src] ?? DEFAULT_STALE_DAYS;
    const before = items.length;
    const { items: keptItems } = pruneExpired({ items }, { staleDays });
    kept.push(...keptItems);
    const removed = before - keptItems.length;
    if (removed > 0) {
      console.log(`[Prune] ${src}: ${removed}개 제거 (TTL ${staleDays}일)`);
    }
  }
  return { ...data, items: kept };
}

async function main() {
  const startTime = Date.now();
  const { noTranslate, skipGpt, limit } = parseArgs();

  console.log('╔══════════════════════════════════════╗');
  console.log('║   Robotics Trends Fetcher v2.0       ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`Started  : ${new Date().toLocaleString('ko-KR')}`);
  console.log(`Translate: ${noTranslate ? 'OFF (--no-translate)' : 'ON (gpt-5-mini)'}`);
  console.log(`GPT Filt : ${skipGpt ? 'OFF (--skip-gpt)' : 'ON (gpt-5-mini)'}`);
  if (limit) console.log(`Limit    : ${limit} per source`);
  console.log('');

  // 1. 기존 데이터 로드 + 소스별 TTL로 만료 정리
  const loaded = loadData();
  console.log(`[Info] Existing items: ${loaded.items.length}`);
  const existing = pruneBySource(loaded);
  console.log(`[Info] Kept after prune: ${existing.items.length}`);

  // 2. 모든 소스에서 병렬 수집
  console.log('\n── Fetching ──────────────────────────');
  const [arxivItems, ssItems, rssItems] = await Promise.all([
    fetchArxiv(limit ?? 20),
    fetchSemanticScholar(limit ?? 8),
    fetchRssFeeds(limit ?? 10),
  ]);

  const allFetched = [...arxivItems, ...ssItems, ...rssItems];
  console.log(`\n[Info] Total fetched: ${allFetched.length}`);

  // 3. 중복 필터링 (기존 데이터와 비교)
  const existingIds = new Set(existing.items.map((i) => i.id));
  const newItems = allFetched.filter((item) => !existingIds.has(item.id));
  console.log(`[Info] New unique items: ${newItems.length}`);

  if (newItems.length === 0) {
    console.log('\n[Info] No new items found. Saving pruned state.');
    saveData({ ...existing, lastUpdated: new Date().toISOString() });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nDone in ${elapsed}s`);
    return;
  }

  // 4. GPT 관련성 필터
  let relevantItems = newItems;
  if (!skipGpt) {
    console.log('\n── GPT 관련성 필터 ──────────────────');
    relevantItems = await gptFilter(newItems);
  }

  if (relevantItems.length === 0) {
    console.log('\n[Info] 필터 후 저장할 항목 없음. Saving pruned state.');
    saveData({ ...existing, lastUpdated: new Date().toISOString() });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nDone in ${elapsed}s`);
    return;
  }

  // 5. 번역 (필터 통과 항목만)
  let translatedItems;
  if (noTranslate) {
    console.log('\n── Translation SKIPPED ───────────────');
    translatedItems = relevantItems.map((item) => ({
      ...item,
      titleKo: item.title,
      abstractKo: item.abstract,
    }));
  } else {
    console.log(`\n── Translating ${relevantItems.length} items ──────────`);
    translatedItems = await translateItems(relevantItems);
  }

  // 6. 병합 저장
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
