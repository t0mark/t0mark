'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { fetchDescriptions } = require('../fetch-description');

const CACHE_FILE = path.join(process.cwd(), 'data', 'scholarships-filter-cache.json');
const BATCH_SIZE = 10;
const MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = `당신은 한국의 로봇공학/AI 연구 분야 대학원생을 위한 산학 장학생 공고 필터입니다.

관심 분야:
- 휴머노이드 로봇, 사족보행 로봇, 로봇 매니퓰레이션
- 컴퓨터 비전 (CV), 3D 인식, 객체 탐지, 자율주행
- 딥러닝, 강화학습 (특히 로봇 제어), ROS
- 임베디드 로봇 시스템, 모터 제어, SLAM, 경로 계획
- 로보틱스 소프트웨어 R&D, AI 연구

각 공고에 대해 이 연구자에게 실질적으로 유용한 산학 장학생 프로그램인지 판단하세요.

판단 기준:
- relevant=true: 석사/박사 과정 대상 R&D 산학 장학금 프로그램 (로봇/AI/제어/비전/자율주행/임베디드 분야)
- relevant=false: 경영/회계/인사/마케팅/법무/행정 등 비기술 분야
- relevant=false: 재료/화학/바이오/환경/에너지 등 비 로봇/비 AI 분야
- relevant=false: 인턴십, 정규직, 계약직 채용 (산학 장학생 프로그램이 아닌 경우)
- relevant=false: 학부생 대상 프로그램 또는 장학생이 명시되지 않은 경우

응답은 반드시 JSON 형식으로만 출력하세요:
{"results": [{"id": "...", "relevant": true}, {"id": "...", "relevant": false}, ...]}`;

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      return new Set(Array.isArray(data.ids) ? data.ids : []);
    }
  } catch { /* 캐시 없으면 빈 Set */ }
  return new Set();
}

function saveCache(cacheSet) {
  try {
    const dataDir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ ids: [...cacheSet] }, null, 2));
  } catch (err) {
    console.error('[GPT Filter] 캐시 저장 실패:', err.message);
  }
}

async function evaluateBatch(batch, apiKey) {
  const userMessage = JSON.stringify(
    batch.map((item) => ({
      id: item.id,
      title: item.title,
      company: item.company,
      ...(item.description ? { description: item.description } : {}),
    }))
  );

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const content = response.data.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content);
  const relevantIds = new Set();

  if (Array.isArray(parsed.results)) {
    for (const r of parsed.results) {
      if (r.relevant === true) relevantIds.add(r.id);
    }
  }

  return relevantIds;
}

async function gptFilter(items) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[GPT Filter] OPENAI_API_KEY 없음 - 필터 건너뜀');
    return items;
  }

  if (items.length === 0) return items;

  const cache = loadCache();
  const uncached = items.filter((item) => !cache.has(item.id));
  const alreadyApproved = items.filter((item) => cache.has(item.id));

  console.log(`[GPT Filter] 평가 대상: ${uncached.length}개 (캐시 통과: ${alreadyApproved.length}개)`);

  if (uncached.length === 0) return alreadyApproved;

  // 신규 항목 상세 페이지에서 직무 내용 fetch
  console.log(`[GPT Filter] 직무 내용 수집 중... (${uncached.length}개)`);
  await fetchDescriptions(uncached);
  const fetched = uncached.filter((i) => i.description).length;
  console.log(`[GPT Filter] 직무 내용 수집 완료: ${fetched}/${uncached.length}개`);

  const approved = [...alreadyApproved];

  for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
    const batch = uncached.slice(i, i + BATCH_SIZE);
    console.log(`[GPT Filter] 배치 ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length}개) 평가 중...`);

    try {
      const relevantIds = await evaluateBatch(batch, apiKey);

      for (const item of batch) {
        cache.add(item.id);
        if (relevantIds.has(item.id)) {
          approved.push(item);
        }
      }

      console.log(
        `[GPT Filter] 배치 결과: ${relevantIds.size}개 통과 / ${batch.length - relevantIds.size}개 제외`
      );
    } catch (err) {
      console.error(`[GPT Filter] 배치 평가 실패: ${err.message}`);
      console.warn('[GPT Filter] 실패한 배치는 필터 없이 통과 처리');
      for (const item of batch) {
        approved.push(item);
        cache.add(item.id);
      }
    }
  }

  saveCache(cache);

  const excluded = uncached.length - (approved.length - alreadyApproved.length);
  console.log(`[GPT Filter] 완료: ${approved.length}개 통과 / ${excluded}개 제외`);

  return approved;
}

module.exports = { gptFilter };
