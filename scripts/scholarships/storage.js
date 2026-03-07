'use strict';

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'scholarships.json');

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      console.log('[Storage] 데이터 파일 없음. 새로 시작합니다.');
      return { lastUpdated: null, items: [] };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.items)) parsed.items = [];
    return parsed;
  } catch (err) {
    console.error('[Storage] 데이터 로드 실패:', err.message);
    return { lastUpdated: null, items: [] };
  }
}

function saveData(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmpFile = DATA_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
    console.log(`[Storage] 저장 완료: 총 ${data.items.length}개`);
  } catch (err) {
    console.error('[Storage] 저장 실패:', err.message);
    throw err;
  }
}

function mergeItems(existing, newItems) {
  const existingIds = new Set(existing.items.map((item) => item.id));
  const uniqueNew = newItems.filter((item) => !existingIds.has(item.id));
  console.log(
    `[Storage] 수집 ${newItems.length}개 → 신규 ${uniqueNew.length}개 (중복 ${newItems.length - uniqueNew.length}개 제외)`
  );
  return {
    lastUpdated: new Date().toISOString(),
    items: [...uniqueNew, ...existing.items],
  };
}

module.exports = { loadData, saveData, mergeItems };
