'use strict';

const fs = require('fs');
const path = require('path');

/**
 * GPT 필터용 YES/NO 판정 캐시.
 * 형식: { approved: string[], rejected: string[] }
 *
 * 구 포맷 { ids: [] } 는 YES/NO 구분이 없어 오탐 원인이었으므로 무시하고
 * 빈 캐시로 시작한다(자동 재평가 유도).
 */
function createFilterCache(relativePath) {
  const CACHE_FILE = path.join(process.cwd(), relativePath);

  function load() {
    try {
      if (!fs.existsSync(CACHE_FILE)) {
        return { approved: new Set(), rejected: new Set() };
      }
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      return {
        approved: new Set(Array.isArray(data.approved) ? data.approved : []),
        rejected: new Set(Array.isArray(data.rejected) ? data.rejected : []),
      };
    } catch {
      return { approved: new Set(), rejected: new Set() };
    }
  }

  function save({ approved, rejected }) {
    try {
      const dir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmp = CACHE_FILE + '.tmp';
      fs.writeFileSync(
        tmp,
        JSON.stringify({ approved: [...approved], rejected: [...rejected] }, null, 2)
      );
      fs.renameSync(tmp, CACHE_FILE);
    } catch (err) {
      console.error('[Filter Cache] 저장 실패:', err.message);
    }
  }

  return { load, save };
}

module.exports = { createFilterCache };
