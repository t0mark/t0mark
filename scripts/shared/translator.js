'use strict';

const axios = require('axios');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const RATE_LIMIT_DELAY_MS = 400; // GPT-4o-mini 안정 호출 간격
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GPT-4o-mini로 title + abstract를 한 번의 API 호출로 한국어 번역
 * @param {string} title
 * @param {string} abstract
 * @param {number} retryCount
 * @returns {Promise<{ titleKo: string, abstractKo: string }>}
 */
async function translateItem(title, abstract, retryCount = 0) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('[Translator] OPENAI_API_KEY not set — skipping translation.');
    return { titleKo: title, abstractKo: abstract || '' };
  }

  const prompt = `로보틱스/AI 학술·기술 텍스트를 영어에서 한국어로 번역합니다.
제목과 요약을 번역하여 아래 JSON 형식으로만 응답하세요.

제목: ${title}
요약: ${abstract ? abstract.slice(0, 600) : '(요약 없음)'}

{"titleKo": "번역된 제목", "abstractKo": "번역된 요약"}`;

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              '당신은 로보틱스, AI, 전자공학 분야의 전문 번역가입니다. 기술 용어는 국내 업계 표준 한국어를 사용하고, 자연스러운 문체로 번역하세요. 반드시 유효한 JSON만 응답하세요.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 35000,
      }
    );

    const content = response.data.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);
    return {
      titleKo: parsed.titleKo || title,
      abstractKo: parsed.abstractKo || abstract || '',
    };
  } catch (err) {
    // Rate limit → 지수 백오프 재시도
    if (err.response?.status === 429 && retryCount < MAX_RETRIES) {
      const waitMs = 5000 * (retryCount + 1);
      console.warn(`[Translator] Rate limit (429). Waiting ${waitMs / 1000}s before retry ${retryCount + 1}/${MAX_RETRIES}...`);
      await sleep(waitMs);
      return translateItem(title, abstract, retryCount + 1);
    }

    // 서버 에러 → 재시도
    if (err.response?.status >= 500 && retryCount < MAX_RETRIES) {
      console.warn(`[Translator] Server error (${err.response.status}). Retrying...`);
      await sleep(2000);
      return translateItem(title, abstract, retryCount + 1);
    }

    // 타임아웃 / 네트워크 에러 → 재시도
    if ((err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND') && retryCount < MAX_RETRIES) {
      console.warn(`[Translator] Network error (${err.code}). Retrying...`);
      await sleep(3000);
      return translateItem(title, abstract, retryCount + 1);
    }

    console.error('[Translator] Translation failed:', err.message);
    // 번역 실패 시 원문 그대로 반환 (파이프라인 중단 방지)
    return { titleKo: title, abstractKo: abstract || '' };
  }
}

/**
 * 아이템 배열을 순차적으로 번역 (Rate limit 방지)
 * @param {object[]} items
 * @returns {Promise<object[]>}
 */
async function translateItems(items) {
  const translated = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const preview = item.title.slice(0, 60);
    console.log(`[Translator] (${i + 1}/${items.length}) ${preview}...`);

    const { titleKo, abstractKo } = await translateItem(item.title, item.abstract);
    translated.push({ ...item, titleKo, abstractKo });

    // 마지막 아이템이 아니면 딜레이
    if (i < items.length - 1) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  return translated;
}

module.exports = { translateItems };
