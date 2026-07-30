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

  return { loadData, saveData, mergeItems };
}

module.exports = { createStorage };
