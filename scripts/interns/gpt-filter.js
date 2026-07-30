'use strict';

const axios = require('axios');
const { fetchDescriptions } = require('../shared/fetch-description');
const { createFilterCache } = require('../shared/filter-cache');

const filterCache = createFilterCache('data/.cache/interns-filter.json');
const BATCH_SIZE = 10;
const MODEL = 'gpt-5-mini';

// title에 이 단어들이 있으면 GPT 호출 없이 즉시 탈락 (도메인/직무 성격)
const TITLE_BLACKLIST = [
  // 관심 없는 도메인
  '소재', 'CMP', '나노', '반도체', '화학', '바이오', '제약', '의료', '헬스케어', '병원',
  '광고', '마케팅', '유통', '물류', '영업', '회계', '재무', '인사', '총무',
  '행정 보조', '행정보조', '사무 보조', '사무보조', '경영지원', '상담', '고객 응대',
  '디자인', '콘텐츠', 'SNS', '기획', '사업개발', 'PM', 'PMO',
  '게임', '블록체인', '금융', '보험', '부동산',
  '통번역', '번역', '통역', '강의', '교육 운영', '행사',
];

// SW가 아닌 순수 HW/기구 직무 패턴 — SW/HW 통합이 아니라 명확히 HW 전담이면 탈락
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
  /부품\s*조립/,
];

// 정규직·경력 채용처럼 대학원생 대상이 아닌 고용 형태
const REJECT_EMPLOYMENT_PATTERNS = [
  /\[?\s*경력\s*\]/,
  /경력\s*사원/,
  /경력\s*채용/,
  /정규직\s*채용/,
  /수시\s*채용/,
];

// 통과 대상: 인턴 + 신입 + 교육 프로그램 (사용자 지정)
const ALLOWED_EMPLOYMENT_RE = /인턴|intern|체험형|신입|교육\s*프로그램|캠프|캠퍼스\s*아카데미|아카데미|트레이닝|R&D\s*프로그램/i;

function hardReject(item) {
  const title = item.title || '';
  const titleLower = title.toLowerCase();

  // 1. 고용 형태 필터: 인턴/신입/교육 명시 없이 정규직·경력만 있으면 탈락
  const hasAllowedEmployment = ALLOWED_EMPLOYMENT_RE.test(title);
  if (!hasAllowedEmployment) {
    for (const pat of REJECT_EMPLOYMENT_PATTERNS) {
      if (pat.test(title)) return { rejected: true, reason: '정규직/경력 채용' };
    }
  }

  // 2. 순수 HW 직무 탈락 (SW/HW 통합이 명시되지 않은 HW 전담)
  const hasSw = /(?:^|[\s(/])(SW|소프트웨어|Software|software|S\/W|SW\s*엔지니어)(?:[\s)/]|$)/.test(title);
  if (!hasSw) {
    for (const pat of HW_ONLY_PATTERNS) {
      if (pat.test(title)) return { rejected: true, reason: '순수 HW 직무 (SW 아님)' };
    }
  }

  // 3. 관심 없는 도메인 키워드
  for (const kw of TITLE_BLACKLIST) {
    if (title.includes(kw) || titleLower.includes(kw.toLowerCase())) {
      return { rejected: true, reason: `title에 "${kw}" 포함` };
    }
  }

  return { rejected: false };
}

const SYSTEM_PROMPT = `당신은 로봇 R&D 대학원생을 위한 채용 공고 심사관입니다.
직무가 소프트웨어 개발/연구여야 하며, 조금이라도 애매하면 반드시 relevant=false를 반환합니다.

【통과 가능한 도메인 — 아래 셋 중 하나에 명확히 해당해야만 relevant=true】

A. 로봇 소프트웨어 (Robotics SW)
   - SLAM, VIO, 3D 매핑, Localization
   - Path Planning, Motion Planning, Trajectory Optimization, Task Planning
   - 로봇 SDK / 미들웨어 (ROS, ROS2, Isaac ROS, MoveIt, Nav2 등)
   - 로봇 제어 SW (Manipulation, Locomotion, Whole-body Control)
   - Teleoperation SW
   - 로봇 펌웨어·제어 소프트웨어 (SW 코드 작성이 주 업무)

B. 로봇에 적용되는 AI (AI for Robotics)
   - 로봇용 강화학습(RL), 모방학습(Imitation Learning), 정책 학습
   - VLA (Vision-Language-Action) 모델, Foundation Model for Robotics
   - Sim-to-Real, Domain Randomization, 시뮬레이션 학습
   - 로봇용 지각 SW (6DoF Pose Estimation, Grasping, 센서 퓨전 for 로봇)

C. 공간 AI (Spatial AI)
   - 3D 재구성 (NeRF, Gaussian Splatting, SfM, MVS)
   - 3D 씬 이해, Semantic Mapping, Occupancy Prediction
   - VLN (Vision-Language Navigation), Embodied AI
   - 3D Foundation Model, 공간 표현 학습

【판단 순서】

Step 1. 대학원생이 지원 가능한 프로그램인가?
- 통과: 인턴, 체험형 인턴, R&D 인턴, 연구 인턴, 산학 인턴, 신입 채용/신입사원,
  교육 프로그램, R&D 캠프/캠퍼스 아카데미, 아카데미, 트레이닝 프로그램.
- 탈락: title에 "[경력]", "경력 사원", "경력 채용", "정규직 채용", "수시 채용"만 있고
  위 통과 표현이 하나도 없으면 → false.
- "정규직 신입 채용"처럼 신입이 명시된 정규직은 통과.

Step 2. 직무가 소프트웨어인가? (매우 중요 — HW 직무는 반드시 탈락)
- 통과: description에 SLAM / Path Planning / Motion Planning / ROS / MoveIt / Nav2 /
  로봇 제어 SW / 매니퓰레이션 SW / 강화학습 for robot / VLA / Sim-to-Real /
  NeRF / Gaussian Splatting / VLN / Embodied AI / 6DoF pose / Grasping 같은 SW 개발·연구 서술.
- 탈락 (SW가 아닌 순수 HW 직무):
  * "하드웨어 개발자/엔지니어", "HW 개발자/엔지니어"
  * "회로 설계", "PCB 설계", "임베디드 HW 설계"
  * "기구 설계", "기계 설계", "구조 설계", "금형", "사출", "액추에이터 설계"
  * "부품 조립", "생산", "제조 공정"
  * 로봇 의수/의족 등을 다뤄도 HW 개발이 주 업무면 반드시 false.
- 통합 개발이라도 SW 비중이 명시적으로 나오지 않으면 false.
- "AI/딥러닝/CV/자율주행"만 막연히 언급되고 로봇/공간 응용이 명시 없음 → false.
- description이 HTML/CSS 마크업뿐이거나 유효 텍스트 80자 이하면 → false.

Step 3. 명시적 탈락 도메인 (title 또는 description 어디든 해당하면 즉시 false)
- 반도체, CMP, 소재, 나노, 화학, 바이오, 제약, 의료, 헬스케어
- 광고, 마케팅, 유통, 물류, 행정, 사무, 총무, 회계, 재무, 인사, 영업, 상담, 고객지원
- 콘텐츠, 디자인, PM/PMO, 기획, 사업개발
- 게임, 웹/앱 서비스 개발, 블록체인, 금융, 보험, 부동산
- 순수 LLM/NLP/추천/광고AI/의료AI 등 로봇·공간 응용이 아닌 AI
- 통신, 전력, 에너지, 환경 등 로봇과 무관한 하드웨어·과학 R&D

【최종 판정 원칙】
- Step 1·2·3 모두 명확히 통과해야만 relevant=true.
- 회사가 로봇/AI 기업이라도 이 공고의 직무가 A/B/C의 SW가 아니면 반드시 false.
- HW 개발/엔지니어링/설계/제조 관련 직무는 어떤 이유로든 반드시 false.
- 조금이라도 확신 없으면 false.

【응답 형식 - 반드시 아래 스키마의 JSON 객체 하나만 반환】
JSON 예시:
{"results": [{"id": "<id>", "relevant": true|false, "reason": "<한국어 30자 이내 근거>"}, ...]}

【판단 시 핵심 원칙】
- 회사가 어디인지(로봇 회사·대기업·스타트업 여부)는 판단 근거로 삼지 말 것.
- description에 기술된 실제 직무(job function)만 근거로 판단할 것.
- 특히 SW인지 HW인지가 가장 중요 — HW는 무조건 탈락.
- description이 없거나 유효 텍스트가 부족하면 title의 직무 문구로만 판단하되, 확신 없으면 false.`;

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
      // gpt-5 계열은 reasoning model — reasoning_tokens + 실제 출력 합계가 이 값 안에 들어가야 함
      // 배치당 최대 10개 아이템 * (reasoning + JSON 출력) → 10000 이상 필요
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

  const { approved, rejected } = filterCache.load();

  // 캐시 분류:
  //  - approved: YES 이력이 있는 ID → GPT 재호출 없이 통과
  //  - rejected: NO 이력이 있는 ID → GPT 재호출 없이 제외
  //  - 그 외: 이번 실행에서 평가
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

  // GPT 호출 전 하드 필터: title만으로 확실히 탈락되는 것 걸러내기
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

  // 하드 필터 통과한 항목만 description fetch + GPT 판단
  console.log(`[GPT Filter] 직무 내용 수집 중... (${survivors.length}개)`);
  await fetchDescriptions(survivors);
  const fetched = survivors.filter((i) => i.description).length;
  console.log(`[GPT Filter] 직무 내용 수집 완료: ${fetched}/${survivors.length}개`);

  // 배치 처리
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
      // 캐시에 추가하지 않아 다음 실행 때 재시도됨. pass에도 추가하지 않음.
    }
  }

  filterCache.save({ approved, rejected });

  console.log(`[GPT Filter] 완료: ${pass.length}개 통과 / ${items.length - pass.length}개 제외`);

  return pass;
}

module.exports = { gptFilter };
