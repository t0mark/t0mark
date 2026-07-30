'use strict';

const axios = require('axios');
const { createFilterCache } = require('../shared/filter-cache');

const filterCache = createFilterCache('data/.cache/trends-filter.json');
const BATCH_SIZE = 15;
const MODEL = 'gpt-5-mini';

const SYSTEM_PROMPT = `당신은 한국 로봇공학/AI R&D 분야 대학원생을 위한 연구 동향 큐레이터입니다.
논문·기술 블로그·뉴스 항목이 실제로 이 연구자의 R&D에 유용한지 title + abstract를 근거로 판단합니다.

【관심 R&D 도메인】
- 로봇: 휴머노이드, 사족보행, 매니퓰레이션(고정형·모바일), 협동로봇, 드론
- 인식: 컴퓨터 비전(CV), 3D 인식, 객체 탐지/분할, SLAM, 라이다/카메라/센서 퓨전
- 학습·정책: 딥러닝, 강화학습, 모방학습, VLA(Vision-Language-Action), 디퓨전 정책,
  파운데이션 모델의 로봇 응용, 월드 모델
- 제어·플래닝: 로봇 제어, 모션/경로 플래닝, 임베디드 제어, 시뮬-투-리얼
- 자율주행: 인식·판단·제어 알고리즘
- 인프라: ROS/ROS2, Isaac Sim/Lab, MuJoCo, 시뮬레이션

【판정 프로토콜】

Step 1. 도메인 부합
- 통과: 위 도메인 중 하나에 해당하는 연구·기술·응용
- 탈락: 순수 LLM/텍스트 생성/이미지 생성 (로봇·물리세계 응용 없음)
- 탈락: 일반 AI 제품·서비스 소식 (ChatGPT 신기능, 광고 매출, 파트너십 등)
- 탈락: 산업용 매니퓰레이터 하드웨어 세일즈, 부품·모터 광고성 기사
- 탈락: 농업 로봇·수확 로봇·특정 작물 대상 응용 등 좁은 산업 응용 (단, 방법론이
  일반적이면 통과: 예 "occlusion reasoning for harvesting" 은 인식 방법론이면 통과)
- 탈락: 반도체·통신·에너지·바이오·의료·소재 관련 (도메인 무관)

Step 2. 정보 품질
- 통과: 방법·결과·수식·구조가 명시된 논문, 기술 심층 블로그, 오픈소스 릴리스,
  주요 연구 발표, 벤치마크·데이터셋 공개
- 탈락: 단순 채용·행사·홍보 공고, 인터뷰·인물 프로필, 시장·투자 뉴스,
  일반 대중 대상 개론 기사

Step 3. 참신성 (지엽적 항목 걸러내기)
- 통과: 최신 방법·아키텍처·결과 (아무리 좁은 주제여도 새로우면 통과)
- 탈락: 이미 성숙한 상용 제품의 마이너 업데이트, 저널리즘성 해설

【판정 원칙】
- 세 단계 모두 통과해야 relevant=true
- 확신 없거나 abstract이 너무 빈약해서 판단 불가하면 → false (정확도 우선)
- title에 "robot"이 있어도 실제 내용이 도메인 무관이면 false

【응답 형식】
반드시 아래 JSON만 출력. reason은 30자 이내 한국어 근거.
{"results": [{"id": "<id>", "relevant": true|false, "reason": "<근거>"}, ...]}`;

async function evaluateBatch(batch, apiKey) {
  const userMessage = JSON.stringify(
    batch.map((item) => ({
      id: item.id,
      source: item.source,
      title: item.title,
      abstract: (item.abstract || '').slice(0, 800),
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
      // gpt-5 계열은 temperature 커스텀 불가(기본 1 고정), max_tokens 대신 max_completion_tokens 사용
      max_completion_tokens: 6000,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 45000,
    }
  );

  const content = response.data.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content);
  const verdicts = new Map();

  if (Array.isArray(parsed.results)) {
    for (const r of parsed.results) {
      verdicts.set(r.id, { relevant: r.relevant === true, reason: r.reason || '' });
    }
  }

  return verdicts;
}

/**
 * 연구 동향 관련성 필터
 * - 캐시된 ID는 GPT 재호출 없이 통과 (이전 판정 유지)
 * - API 실패 시 원본 items 그대로 반환 (fallback)
 * @param {object[]} items
 * @returns {Promise<object[]>}
 */
async function gptFilter(items) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[Trends Filter] OPENAI_API_KEY 없음 - 필터 건너뜀');
    return items;
  }

  if (items.length === 0) return items;

  const { approved, rejected } = filterCache.load();

  const pass = [];
  const uncached = [];
  let cachedReject = 0;
  for (const item of items) {
    if (approved.has(item.id)) pass.push(item);
    else if (rejected.has(item.id)) cachedReject++;
    else uncached.push(item);
  }

  console.log(
    `[Trends Filter] 평가 대상: ${uncached.length}개 ` +
    `(승인 캐시 통과: ${pass.length}개, 거부 캐시 제외: ${cachedReject}개)`
  );

  if (uncached.length === 0) {
    filterCache.save({ approved, rejected });
    return pass;
  }

  for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
    const batch = uncached.slice(i, i + BATCH_SIZE);
    console.log(`[Trends Filter] 배치 ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length}개) 평가 중...`);

    try {
      const verdicts = await evaluateBatch(batch, apiKey);

      let passed = 0;
      for (const item of batch) {
        const v = verdicts.get(item.id);
        const mark = v?.relevant ? '✓' : '✗';
        const preview = (item.title || '').slice(0, 60);
        console.log(`  ${mark} [${item.source}] ${preview} — ${v?.reason || '판단 없음'}`);
        if (v?.relevant) {
          approved.add(item.id);
          pass.push(item);
          passed++;
        } else {
          rejected.add(item.id);
        }
      }

      console.log(
        `[Trends Filter] 배치 결과: ${passed}개 통과 / ${batch.length - passed}개 제외`
      );
    } catch (err) {
      console.error(`[Trends Filter] 배치 평가 실패: ${err.message}`);
      console.warn('[Trends Filter] 실패한 배치는 이번 실행에서 제외 (다음 실행에 재평가)');
    }
  }

  filterCache.save({ approved, rejected });

  console.log(`[Trends Filter] 완료: ${pass.length}개 통과 / ${items.length - pass.length}개 제외`);

  return pass;
}

module.exports = { gptFilter };
