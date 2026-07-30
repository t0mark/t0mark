'use strict';

const axios = require('axios');
const { fetchDescriptions } = require('../shared/fetch-description');
const { createFilterCache } = require('../shared/filter-cache');

const filterCache = createFilterCache('data/.cache/scholarships-filter.json');
const BATCH_SIZE = 10;
const MODEL = 'gpt-5-mini';

// title에 이 단어들이 있으면 GPT 호출 없이 즉시 탈락
const TITLE_BLACKLIST = [
  '소재', 'CMP', '나노', '반도체', '화학', '바이오', '제약', '의료', '헬스케어', '병원',
  '광고', '마케팅', '유통', '물류', '영업', '회계', '재무', '인사', '총무',
  '행정 보조', '행정보조', '사무 보조', '사무보조', '경영지원', '상담',
  '디자인', '콘텐츠', '기획', 'PM', 'PMO',
  '게임', '블록체인', '금융', '보험',
];

// SW가 아닌 순수 HW 직무 패턴
const HW_ONLY_PATTERNS = [
  /하드웨어\s*개발/,
  /하드웨어\s*엔지니어/,
  /\bHW\s*개발/,
  /\bHW\s*엔지니어/,
  /회로\s*설계/,
  /PCB\s*설계/,
  /기구\s*설계/,
  /기계\s*설계/,
  /금형/,
  /사출/,
];

// 산학 장학생이 아닌 것으로 title에 명시된 패턴
const NON_SCHOLARSHIP_TITLE_PATTERNS = [
  /인턴/,
  /\[?\s*신입\s*[/·]\s*경력\s*\]?/,
  /\[?\s*경력\s*[/·]\s*신입\s*\]?/,
  /신입\s*사원/,
  /경력\s*사원/,
  /정규직\s*채용/,
  /수시\s*채용/,
];

function hardReject(item) {
  const title = item.title || '';
  const titleLower = title.toLowerCase();

  const hasScholarship = /장학|산학|Scholarship/i.test(title);
  if (!hasScholarship) {
    for (const pat of NON_SCHOLARSHIP_TITLE_PATTERNS) {
      if (pat.test(title)) return { rejected: true, reason: '산학장학 아님 (인턴/정규/경력)' };
    }
  }

  // 순수 HW 직무 탈락 (SW 명시 없이 HW 개발/설계면 탈락)
  const hasSw = /(?:^|[\s(/])(SW|소프트웨어|Software|software|S\/W)(?:[\s)/]|$)/.test(title);
  if (!hasSw) {
    for (const pat of HW_ONLY_PATTERNS) {
      if (pat.test(title)) return { rejected: true, reason: '순수 HW 직무 (SW 아님)' };
    }
  }

  for (const kw of TITLE_BLACKLIST) {
    if (title.includes(kw) || titleLower.includes(kw.toLowerCase())) {
      return { rejected: true, reason: `title에 "${kw}" 포함` };
    }
  }

  return { rejected: false };
}

const SYSTEM_PROMPT = `당신은 로봇 R&D 대학원생을 위한 산학 장학생 공고 심사관입니다.
매우 좁은 도메인만 통과시키며, 조금이라도 애매하면 반드시 relevant=false를 반환합니다.

【통과 가능한 도메인 — 아래 셋 중 하나에 명확히 해당해야만 relevant=true】

A. 로봇 소프트웨어 (Robotics SW)
   - SLAM, VIO, 3D 매핑, Localization
   - Path Planning, Motion Planning, Trajectory Optimization, Task Planning
   - 로봇 SDK / 미들웨어 (ROS, ROS2, Isaac ROS, MoveIt, Nav2 등)
   - 로봇 제어 (Manipulation, Locomotion, Whole-body Control)
   - Teleoperation

B. 로봇에 적용되는 AI (AI for Robotics)
   - 로봇용 강화학습, 모방학습, VLA 모델
   - Sim-to-Real, Domain Randomization
   - 로봇용 지각 (6DoF Pose, Grasping, 센서 퓨전 for robot)

C. 공간 AI (Spatial AI)
   - 3D 재구성 (NeRF, Gaussian Splatting, SfM, MVS)
   - 3D 씬 이해, Semantic Mapping
   - VLN (Vision-Language Navigation), Embodied AI
   - 공간 표현 학습 / 3D Foundation Model

【판단 순서】

Step 1. 대학원 산학 장학생 프로그램인가?
- 통과: "산학 장학생", "산학연계 장학", "채용 조건형 장학생", "석사 장학", "박사 장학" 등
  대학원 대상 산학 장학 프로그램이 명시된 공고
- 탈락: 인턴, 신입/경력 채용, 정규직, 계약직, 파견직
- 탈락: 학부생 대상 장학, 등록금 지원, 국가 장학, 기부 장학, 사내 학자금
- 산학 장학 명시가 없으면 → false

Step 2. 실제 연구가 위 A/B/C 중 하나이며 SW 연구인가?
- 통과: description에 SLAM / Path Planning / ROS / 로봇 제어 SW / 강화학습 for robot / VLA /
  Sim-to-Real / NeRF / Gaussian Splatting / VLN / Embodied AI 같은 SW 개발·연구 서술.
- 탈락: 하드웨어 개발/엔지니어링, 회로·PCB·기구·기계 설계, 금형·사출 등 순수 HW 연구.
- "AI/딥러닝/CV/자율주행"만 막연히 언급되고 로봇/공간 응용이 명시되지 않으면 → false.
- description이 HTML/CSS 마크업뿐이거나 유효 텍스트 80자 이하면 → false.

Step 3. 명시적 탈락 도메인 (title 또는 description 어디든 해당하면 즉시 false)
- 반도체, CMP, 소재, 나노, 화학, 바이오, 제약, 의료, 헬스케어
- 광고, 마케팅, 유통, 물류, 행정, 사무, 회계, 인사, 영업
- 게임, 웹/앱 서비스, 블록체인, 금융, 보험
- 순수 LLM/NLP/추천/광고AI/의료AI 등 로봇·공간 응용이 아닌 AI
- 통신, 전력, 에너지, 환경 등 로봇과 무관한 하드웨어·과학 R&D

【최종 판정 원칙】
- Step 1·2·3 모두 명확히 통과해야만 relevant=true
- 회사가 로봇/AI 기업이라도 해당 장학의 연구 분야가 A/B/C가 아니면 반드시 false
- 조금이라도 확신 없으면 false

【응답 형식 - 반드시 아래 스키마의 JSON 객체 하나만 반환】
JSON 예시:
{"results": [{"id": "<id>", "relevant": true|false, "reason": "<한국어 30자 이내 근거>"}, ...]}

【판단 시 핵심 원칙】
- 회사가 어디인지(로봇 회사·대기업·스타트업 여부)는 판단 근거로 삼지 말 것.
- description에 기술된 실제 연구 분야(job function)만 근거로 판단할 것.
- description이 없거나 유효 텍스트가 부족하면 title의 직무 문구로만 판단하되, 확신 없으면 false.`;

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
      // gpt-5 계열은 reasoning model — reasoning_tokens + 실제 출력 합계가 이 값 안에 들어가야 함
      max_completion_tokens: 12000,
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
  const verdicts = new Map();

  if (Array.isArray(parsed.results)) {
    for (const r of parsed.results) {
      verdicts.set(r.id, { relevant: r.relevant === true, reason: r.reason || '' });
    }
  }

  return verdicts;
}

async function gptFilter(items) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[GPT Filter] OPENAI_API_KEY 없음 - 필터 건너뜀');
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
    `[GPT Filter] 평가 대상: ${uncached.length}개 ` +
    `(승인 캐시 통과: ${pass.length}개, 거부 캐시 제외: ${cachedReject}개)`
  );

  if (uncached.length === 0) {
    filterCache.save({ approved, rejected });
    return pass;
  }

  // GPT 호출 전 하드 필터
  const hardRejected = [];
  const survivors = [];
  for (const item of uncached) {
    const result = hardReject(item);
    if (result.rejected) {
      hardRejected.push({ item, reason: result.reason });
      rejected.add(item.id);
    } else {
      survivors.push(item);
    }
  }
  if (hardRejected.length > 0) {
    console.log(`[GPT Filter] 하드 필터 탈락: ${hardRejected.length}개`);
    for (const { item, reason } of hardRejected.slice(0, 10)) {
      const preview = (item.title || '').slice(0, 40);
      console.log(`  ✗ [${item.company}] ${preview} — ${reason}`);
    }
    if (hardRejected.length > 10) console.log(`  ... 외 ${hardRejected.length - 10}개`);
  }

  if (survivors.length === 0) {
    filterCache.save({ approved, rejected });
    return pass;
  }

  console.log(`[GPT Filter] 직무 내용 수집 중... (${survivors.length}개)`);
  await fetchDescriptions(survivors);
  const fetched = survivors.filter((i) => i.description).length;
  console.log(`[GPT Filter] 직무 내용 수집 완료: ${fetched}/${survivors.length}개`);

  for (let i = 0; i < survivors.length; i += BATCH_SIZE) {
    const batch = survivors.slice(i, i + BATCH_SIZE);
    console.log(`[GPT Filter] 배치 ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length}개) 평가 중...`);

    try {
      const verdicts = await evaluateBatch(batch, apiKey);

      let passed = 0;
      for (const item of batch) {
        const v = verdicts.get(item.id);
        const mark = v?.relevant ? '✓' : '✗';
        const preview = (item.title || '').slice(0, 40);
        console.log(`  ${mark} [${item.company}] ${preview} — ${v?.reason || '판단 없음'}`);
        if (v?.relevant) {
          approved.add(item.id);
          pass.push(item);
          passed++;
        } else {
          rejected.add(item.id);
        }
      }

      console.log(
        `[GPT Filter] 배치 결과: ${passed}개 통과 / ${batch.length - passed}개 제외`
      );
    } catch (err) {
      console.error(`[GPT Filter] 배치 평가 실패: ${err.message}`);
      console.warn('[GPT Filter] 실패한 배치는 이번 실행에서 제외 (다음 실행에 재평가)');
    }
  }

  filterCache.save({ approved, rejected });

  console.log(`[GPT Filter] 완료: ${pass.length}개 통과 / ${items.length - pass.length}개 제외`);

  return pass;
}

module.exports = { gptFilter };
