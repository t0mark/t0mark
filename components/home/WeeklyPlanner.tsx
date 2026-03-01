const categories = [
  {
    name: '학습 (논문 / 이론)',
    goal: ['연구 분야의 최신 동향 파악 및 기술적 이해 심화', '• 초기 : 대량 스캔 (landscape 파악)', '• 중기 : 특정 주제 집중 분석', '• 후기 : 관련 연구 추적 및 비교'],
    output: ['• Notion Papers DB 지속 업데이트', '• 논문 분석 문서 (스캔/심층)', '• 연구 트렌드 맵', '• Baseline/SOTA 비교 표'],
    days: '2일',
  },
  {
    name: '기술 구현',
    goal: ['논문 아이디어의 실제 구현 및 검증', '• 초기 : Baseline 재구현', '• 중기 : 본인 아이디어 프로토타입', '• 후기 : 실험 및 최적화'],
    output: ['• GitHub repository', '• 실험 결과 정리', '• 기술 블로그/문서', '• 포트폴리오용 프로젝트'],
    days: '1일',
  },
  {
    name: '프로그래밍',
    goal: ['로보틱스 연구/개발에 필요한 언어 및 도구 습득', '• C++, ROS2, CUDA 등', '• 라이브러리 : Eigen, PCL, OpenCV 등', '• 시스템 프로그래밍 개념'],
    output: ['• 학습 정리 문서', '• 실습 코드', '• 미니 프로젝트', '• 기술 스택 체크리스트'],
    days: '1일',
  },
  {
    name: '영어',
    goal: ['학술/산업 커뮤니케이션 능력 향상', '• 스피킹 기초', '• 기술 발표/논문 작성', '• 자격증 대비 (TOEIC, OPIC)'],
    output: ['• 연구 발표 스크립트', '• 논문 초록/초안 영작', '• 회화 연습 기록', '• 자격증 성적'],
    days: '1일',
  },
  {
    name: '주간 통합 & 계획',
    goal: ['학습 내용 정리, 연구 방향 점검, 다음 주 계획', '• 주간 회고', '• 연구 진행 상황 체크', '• 포트폴리오 업데이트'],
    output: ['• Weekly Review', '• 연구 진척 보고서', '• 다음 주 액션 플랜', '• 장기 로드맵 조정'],
    days: '1일',
  },
  {
    name: '과제',
    goal: ['주어진 과제 및 지시사항 기한 내 완료', '• 연구 과제', '• 수업 과제', '• 교수님 지시', '• 논문 세미나 : 발표 논문 분석 및 준비', '• 랩 미팅 : 진행 상황 정리 및 자료 준비'],
    output: null,
    days: null,
  },
]

function Cell({ lines }: { lines: string[] }) {
  return (
    <td className="px-4 py-3 text-sm text-text-muted align-top border-b border-r border-border last:border-r-0">
      {lines.map((line, i) => (
        <p
          key={i}
          className={`leading-relaxed ${i === 0 && !line.startsWith('•') ? 'text-primary font-medium' : 'text-text-muted text-xs mt-0.5'}`}
        >
          {line}
        </p>
      ))}
    </td>
  )
}


export default function WeeklyPlanner() {
  return (
    <div className="overflow-x-auto rounded-xl shadow-card border border-border">
      <table className="w-full text-sm border-collapse min-w-[800px] table-fixed">
        <colgroup>
          <col style={{ width: '80px' }} />
          {categories.map((cat) => (
            <col key={cat.name} style={{ width: `${100 / categories.length}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-bg-light border-b border-border">
            <th className="px-4 py-2.5 text-left text-[11px] font-bold text-text-light uppercase tracking-widest border-r border-border">
            </th>
            {categories.map((cat) => (
              <th
                key={cat.name}
                className="px-4 py-2.5 text-center text-xs font-bold text-primary uppercase tracking-wide border-r border-border last:border-r-0"
              >
                {cat.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* 목표 */}
          <tr className="bg-white border-b border-border">
            <td className="px-4 py-3 text-xs font-bold text-text-light uppercase tracking-widest border-r border-border whitespace-nowrap align-middle text-center bg-bg-light">
              목표
            </td>
            {categories.map((cat) => (
              <Cell key={cat.name} lines={cat.goal} />
            ))}
          </tr>
          {/* 산출물 */}
          <tr className="bg-white border-b border-border">
            <td className="px-4 py-3 text-xs font-bold text-text-light uppercase tracking-widest border-r border-border whitespace-nowrap align-middle text-center bg-bg-light">
              산출물
            </td>
            {categories.map((cat) =>
              cat.output === null
                ? <td key={cat.name} className="border-b border-r border-border last:border-r-0" />
                : <Cell key={cat.name} lines={cat.output} />
            )}
          </tr>
          {/* 할당 */}
          <tr className="bg-white">
            <td className="px-4 py-3 text-xs font-bold text-text-light uppercase tracking-widest border-r border-border whitespace-nowrap align-middle text-center bg-bg-light">
              할당
            </td>
            {categories.map((cat) =>
              cat.days === null
                ? <td key={cat.name} className="border-r border-border last:border-r-0" />
                : <td
                    key={cat.name}
                    className="px-4 py-3 text-sm font-semibold text-center text-primary border-r border-border last:border-r-0 align-middle"
                  >
                    {cat.days}
                  </td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
