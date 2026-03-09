'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { fetchDescriptions } = require('../fetch-description');

const CACHE_FILE = path.join(process.cwd(), 'data', 'interns-filter-cache.json');
const BATCH_SIZE = 10;
const MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = `당신은 한국의 로봇공학/AI 연구 분야 대학원생을 위한 인턴십 공고 필터입니다.

관심 분야:
- 휴머노이드 로봇, 사족보행 로봇, 로봇 매니퓰레이션
- 컴퓨터 비전 (CV), 3D 인식, 객체 탐지
- 자율주행, 라이다/카메라 인식
- 딥러닝, 강화학습 (특히 로봇 제어)
- 임베디드 로봇 시스템, 모터 제어
- SLAM, 경로 계획, 모션 플래닝
- 로보틱스 소프트웨어 R&D, ROS

각 공고에 대해 이 연구자에게 실질적으로 유용한 인턴십인지 판단하세요.

판단 기준:
- relevant=true: 인턴십/체험형 인턴이면서 기술 연구/개발 직무 (로봇 SW, 비전 알고리즘, ML/RL 연구, 제어 시스템, 임베디드 등)
- relevant=false: 정규직/계약직/신입사원/경력사원 채용 (인턴십이 아닌 경우 무조건 false)
- relevant=false: 영업/마케팅/경영/디자인/회계/사무 직무 (회사가 연구소·기술기업이더라도 직무가 비기술이면 반드시 false)
- relevant=false: 단순 IT 지원, 데이터 입력, 고객센터, 상담, 사무보조, 행정 등
- relevant=false: 탄소/환경/정책/법무/행정/회계/인사 관련 직무
- 핵심 규칙: 공고 제목에 "신입사원", "경력사원", "정규직", "사무보조", "상담지원", "행정", "경영지원" 이 포함된 경우 무조건 false

응답은 반드시 JSON 형식으로만 출력하세요:
{"results": [{"id": "...", "relevant": true}, {"id": "...", "relevant": false}, ...]}`;

/**
 * 캐시 로드: { ids: string[] } 형태
 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      return new Set(Array.isArray(data.ids) ? data.ids : []);
    }
  } catch { /* 캐시 없으면 빈 Set */ }
  return new Set();
}

/**
 * 캐시 저장
 */
function saveCache(cacheSet) {
  try {
    const dataDir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ ids: [...cacheSet] }, null, 2));
  } catch (err) {
    console.error('[GPT Filter] 캐시 저장 실패:', err.message);
  }
}

/**
 * 배치 단위로 GPT에 관련성 판단 요청
 * @param {object[]} batch - { id, title, company }[] 형태
 * @param {string} apiKey
 * @returns {Promise<Set<string>>} - relevant=true인 id들의 Set
 */
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

/**
 * GPT-4o-mini로 공고 관련성 필터링
 *
 * - 이미 캐시된 ID는 재평가 없이 통과 처리
 * - NO 판정된 ID도 캐시에 저장해 재수집 방지
 * - API 실패 시 원본 items 그대로 반환 (fallback)
 *
 * @param {object[]} items - InternItem[]
 * @returns {Promise<object[]>} - 관련 있는 공고만
 */
async function gptFilter(items) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[GPT Filter] OPENAI_API_KEY 없음 - 필터 건너뜀');
    return items;
  }

  if (items.length === 0) return items;

  const cache = loadCache();

  // 이미 평가된 항목: 캐시에 있으면 이전에 YES였던 것만 통과
  // (NO였으면 캐시에는 있지만 저장된 items에는 없을 것)
  // → 단순화: 캐시에 없는 것만 GPT 평가, 캐시에 있으면 이미 통과한 것으로 간주
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

  // 배치 처리
  for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
    const batch = uncached.slice(i, i + BATCH_SIZE);
    console.log(`[GPT Filter] 배치 ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length}개) 평가 중...`);

    try {
      const relevantIds = await evaluateBatch(batch, apiKey);

      for (const item of batch) {
        // 캐시에 평가 결과 기록 (YES/NO 모두)
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
