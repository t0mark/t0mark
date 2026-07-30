'use strict';

const fs = require('fs');
const path = require('path');

function createStorage(relativePath) {
  const DATA_FILE = path.join(process.cwd(), relativePath);

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

  function saveData(data) {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpFile = DATA_FILE + '.tmp';
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DATA_FILE);
      console.log(`[Storage] Saved ${data.items.length} total items.`);
    } catch (err) {
      console.error('[Storage] Failed to save data:', err.message);
      throw err;
    }
  }

  function mergeItems(existing, newItems) {
    const existingIds = new Set(existing.items.map((item) => item.id));
    const uniqueNew = newItems.filter((item) => !existingIds.has(item.id));

    console.log(
      `[Storage] ${newItems.length} fetched → ${uniqueNew.length} new (${newItems.length - uniqueNew.length} duplicates skipped)`
    );

    return {
      lastUpdated: new Date().toISOString(),
      items: [...uniqueNew, ...existing.items],
    };
  }

  /**
   * 만료된 공고 제거
   * - deadline이 오늘 이전이면 제거 (마감일 지남)
   * - deadline 파싱 불가(상시채용/미기재/수시채용 등)면 postedAt 기준으로 staleDays 초과 시 제거
   * - deadline과 postedAt 모두 없으면 유지 (안전한 기본값)
   */
  function pruneExpired(data, { staleDays = 90, now = new Date() } = {}) {
    const kept = [];
    const removed = [];

    for (const item of data.items) {
      const deadlineDate = item.deadline ? new Date(item.deadline) : null;
      const deadlineValid = deadlineDate && !isNaN(deadlineDate.getTime());

      if (deadlineValid) {
        if (deadlineDate < now) {
          removed.push({ item, reason: `마감 ${item.deadline.slice(0, 10)}` });
          continue;
        }
        kept.push(item);
        continue;
      }

      const postedDate = item.postedAt ? new Date(item.postedAt) : null;
      const postedValid = postedDate && !isNaN(postedDate.getTime());
      if (postedValid) {
        const ageDays = (now.getTime() - postedDate.getTime()) / 86400000;
        if (ageDays > staleDays) {
          removed.push({ item, reason: `게시 ${Math.floor(ageDays)}일 경과` });
          continue;
        }
      }

      kept.push(item);
    }

    if (removed.length > 0) {
      console.log(`[Storage] 만료 정리: ${removed.length}개 제거`);
      for (const { item, reason } of removed.slice(0, 10)) {
        const preview = (item.title || '').slice(0, 40);
        console.log(`  - [${item.company}] ${preview} (${reason})`);
      }
      if (removed.length > 10) {
        console.log(`  ... 외 ${removed.length - 10}개`);
      }
    } else {
      console.log('[Storage] 만료 정리: 대상 없음');
    }

    return { ...data, items: kept };
  }

  return { loadData, saveData, mergeItems, pruneExpired };
}

module.exports = { createStorage };
