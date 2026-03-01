'use strict';

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'robotics_trends.json');

/**
 * 로컬 JSON 파일에서 기존 데이터를 읽어옴
 * @returns {import('../types/trends').TrendsData}
 */
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      console.log('[Storage] Data file not found. Starting fresh.');
      return { lastUpdated: null, items: [] };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.items)) parsed.items = [];
    return parsed;
  } catch (err) {
    console.error('[Storage] Failed to load data:', err.message);
    return { lastUpdated: null, items: [] };
  }
}

/**
 * 데이터를 로컬 JSON 파일에 저장
 * @param {{ lastUpdated: string | null, items: object[] }} data
 */
function saveData(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // 원자적 쓰기: 임시 파일에 먼저 쓴 뒤 rename
    const tmpFile = DATA_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
    console.log(`[Storage] Saved ${data.items.length} total items.`);
  } catch (err) {
    console.error('[Storage] Failed to save data:', err.message);
    throw err;
  }
}

/**
 * 중복 제거 후 새 아이템을 기존 데이터에 병합
 * @param {{ lastUpdated: string | null, items: object[] }} existing
 * @param {object[]} newItems
 * @returns {{ lastUpdated: string, items: object[] }}
 */
function mergeItems(existing, newItems) {
  const existingIds = new Set(existing.items.map((item) => item.id));
  const uniqueNew = newItems.filter((item) => !existingIds.has(item.id));

  console.log(
    `[Storage] ${newItems.length} fetched → ${uniqueNew.length} new (${newItems.length - uniqueNew.length} duplicates skipped)`
  );

  return {
    lastUpdated: new Date().toISOString(),
    // 최신 아이템이 앞에 오도록 prepend
    items: [...uniqueNew, ...existing.items],
  };
}

module.exports = { loadData, saveData, mergeItems };
