#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });

const { fetchSaramin } = require('./scholarships/saramin');
const { fetchJobkorea } = require('./scholarships/jobkorea');
const { gptFilter } = require('./scholarships/gpt-filter');
const { loadData, saveData, mergeItems } = require('./scholarships/storage');

function parseArgs() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith('--limit='));
  return {
    limit: limitArg ? parseInt(limitArg.split('=')[1], 10) : null,
    skipGpt: args.includes('--skip-gpt'),
  };
}

async function main() {
  const startTime = Date.now();
  const { limit, skipGpt } = parseArgs();

  console.log('╔══════════════════════════════════════╗');
  console.log('║   R&D Scholarship Fetcher v1.0       ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`Started  : ${new Date().toLocaleString('ko-KR')}`);
  if (limit) console.log(`Limit    : ${limit} per source`);
  if (skipGpt) console.log(`GPT      : 건너뜀 (--skip-gpt)`);
  console.log('');

  const existing = loadData();
  console.log(`[Info] 기존 항목: ${existing.items.length}개`);

  console.log('\n── 수집 중 ───────────────────────────');
  const [saraminItems, jobkoreaItems] = await Promise.all([
    fetchSaramin(limit ?? 10),
    fetchJobkorea(limit ?? 10),
  ]);

  const allFetched = [...saraminItems, ...jobkoreaItems];
  console.log(`\n[Info] 총 수집: ${allFetched.length}개`);
  console.log(`       - 사람인: ${saraminItems.length}개`);
  console.log(`       - 잡코리아: ${jobkoreaItems.length}개`);

  const existingIds = new Set(existing.items.map((i) => i.id));
  const newItems = allFetched.filter((item) => !existingIds.has(item.id));
  console.log(`[Info] 신규 항목: ${newItems.length}개`);

  if (newItems.length === 0) {
    console.log('\n[Info] 신규 공고 없음. lastUpdated만 업데이트합니다.');
    saveData({ ...existing, lastUpdated: new Date().toISOString() });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n완료 (${elapsed}s)`);
    return;
  }

  let filteredItems = newItems;
  if (!skipGpt) {
    console.log('\n── GPT 필터링 중 ─────────────────────');
    filteredItems = await gptFilter(newItems);
  }

  if (filteredItems.length === 0) {
    console.log('\n[Info] GPT 필터 후 저장할 항목 없음. lastUpdated만 업데이트합니다.');
    saveData({ ...existing, lastUpdated: new Date().toISOString() });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n완료 (${elapsed}s)`);
    return;
  }

  console.log('\n── 저장 중 ───────────────────────────');
  const merged = mergeItems(existing, filteredItems);
  saveData(merged);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n╔══════════════════════════════════════╗');
  console.log(`║  완료!  ${elapsed}s  총 ${merged.items.length}개${' '.repeat(Math.max(0, 14 - String(merged.items.length).length))}║`);
  console.log('╚══════════════════════════════════════╝');
}

main().catch((err) => {
  console.error('\n[FATAL]', err.message);
  console.error(err.stack);
  process.exit(1);
});
