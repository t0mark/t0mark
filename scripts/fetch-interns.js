#!/usr/bin/env node
'use strict';

// .env.local에서 OPENAI_API_KEY 로드
require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });

const { fetchSaramin } = require('./interns/saramin');
const { fetchJobkorea } = require('./interns/jobkorea');
const { fetchWanted } = require('./interns/wanted');
const { fetchJasoseol } = require('./interns/jasoseol');
const { gptFilter } = require('./interns/gpt-filter');
const { loadData, saveData, mergeItems } = require('./interns/storage');

/**
 * CLI 옵션 파싱
 * --limit=N   : 소스당 수집 최대 N개 (테스트용)
 * --skip-gpt  : GPT 필터 건너뜀 (빠른 테스트)
 */
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
  console.log('║   R&D Intern Fetcher v2.0            ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`Started  : ${new Date().toLocaleString('ko-KR')}`);
  if (limit) console.log(`Limit    : ${limit} per source`);
  if (skipGpt) console.log(`GPT      : 건너뜀 (--skip-gpt)`);
  console.log('');

  // 1. 기존 데이터 로드
  const existing = loadData();
  console.log(`[Info] 기존 항목: ${existing.items.length}개`);

  // 2. 병렬 수집
  console.log('\n── 수집 중 ───────────────────────────');
  const [saraminItems, jobkoreaItems, wantedItems, jasoseolItems] = await Promise.all([
    fetchSaramin(limit ?? 10),
    fetchJobkorea(limit ?? 10),
    fetchWanted(limit ?? 20),
    fetchJasoseol(limit ?? 20),
  ]);

  const allFetched = [...saraminItems, ...jobkoreaItems, ...wantedItems, ...jasoseolItems];
  console.log(`\n[Info] 총 수집: ${allFetched.length}개`);
  console.log(`       - 사람인: ${saraminItems.length}개`);
  console.log(`       - 잡코리아: ${jobkoreaItems.length}개`);
  console.log(`       - 원티드: ${wantedItems.length}개`);
  console.log(`       - 자소설닷컴: ${jasoseolItems.length}개`);

  // 3. 중복 필터링 (기존 데이터와 비교)
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

  // 4. GPT 필터링 (신규 항목에만 적용)
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

  // 5. 병합 저장
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
