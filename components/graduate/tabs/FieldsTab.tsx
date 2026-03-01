type Item = {
  title: string
  sub?: string
  desc: string
  keywords: string[]
}

type Section = {
  col: number
  label: string
  headerColor: string
  items: Item[]
}

const sections: Section[] = [
  {
    col: 1, label: 'Platform',
    headerColor: 'text-blue-700 border-blue-300 bg-blue-50',
    items: [
      { title: 'Mobile Robot', sub: 'Wheel / Legged / Aerial / Underwater', desc: '다양한 환경(지상, 공중, 수중)에서 이동성을 확보하기 위한 메커니즘 및 자율 주행 기술 연구', keywords: ['Kinematics/Dynamics', 'Non-holonomic Constraint', 'Gait Generation (ZMP)', 'Hydrodynamics', 'Flight Control'] },
      { title: 'Manipulator Robot', sub: undefined, desc: '고정된 베이스에서 작업 공간 내의 물체를 조작하기 위한 로봇 팔의 기구학 및 동역학 해석', keywords: ['Forward/Inverse Kinematics', 'Jacobian Matrix', 'Singularity', 'Grasping Strategy', 'Force/Torque Control'] },
      { title: 'Mobile Manipulator / Humanoid', sub: undefined, desc: '이동 능력(Mobility)과 조작 능력(Manipulation)이 결합된 복합 시스템의 전신 제어(Whole-body Control)', keywords: ['Whole-body Control', 'Stability Margin', 'Hybrid Locomotion', 'Task Priority', 'Floating Base Dynamics'] },
      { title: 'Soft Robot / Wearable Robot', sub: undefined, desc: '유연한 소재를 활용한 비정형 환경 적응 및 인간의 신체 능력을 보조/증강하는 로봇 기술', keywords: ['Soft Actuator (Pneumatic/Dielectric)', 'Compliant Mechanism', 'pHRI (Physical HRI)', 'Exoskeleton', 'Bio-mimicry'] },
      { title: 'Multi-Robot System', sub: undefined, desc: '단일 로봇으로 해결하기 어려운 대규모 작업을 수행하기 위한 다수 로봇의 협업 및 군집 제어', keywords: ['Swarm Intelligence', 'Distributed Control', 'Consensus Algorithm', 'Formation Control', 'Task Allocation'] },
    ],
  },
  {
    col: 2, label: 'Function',
    headerColor: 'text-violet-700 border-violet-300 bg-violet-50',
    items: [
      { title: 'Perception & Sensing', sub: undefined, desc: '카메라, 라이다 등 다양한 센서 데이터를 융합하여 주변 환경을 인식하고 의미 있는 정보를 추출하는 과정', keywords: ['Computer Vision', 'Sensor Fusion (Kalman Filter)', 'Object Detection/Tracking', 'Semantic Segmentation', 'State Estimation'] },
      { title: 'Localization & Mapping', sub: undefined, desc: '미지의 환경에서 로봇의 현재 위치를 추정(Localization)하고 동시에 지도를 작성(Mapping)하는 기술', keywords: ['SLAM (Lidar/Visual)', 'Odometry', 'Loop Closure', 'Occupancy Grid Map', 'Point Cloud Processing'] },
      { title: 'Decision Making', sub: undefined, desc: '로봇이 수행해야 할 작업의 순서를 결정하고, 상황 변화에 따라 최적의 전략을 선택하는 고수준의 판단 과정', keywords: ['Task Planning (PDDL)', 'Finite State Machine (FSM)', 'Behavior Tree', 'Markov Decision Process (MDP)', 'Multi-agent Coordination'] },
      { title: 'Control', sub: undefined, desc: '상위 레벨에서 계획된 명령을 실제 모터의 전압/토크 신호로 변환하여 로봇을 목표 상태로 움직이는 기술', keywords: ['PID Control', 'Feedback Linearization', 'MPC (Model Predictive Control)', 'Robust Control', 'Torque Control'] },
      { title: 'Adaptation', sub: undefined, desc: '사전에 모델링되지 않은 환경 변화나 로봇의 하드웨어 변경 등에 실시간으로 대응하여 성능을 유지하는 능력', keywords: ['Adaptive Control', 'MRAC (Model Reference Adaptive Control)', 'Online Parameter Estimation', 'Disturbance Observer', 'Gain Scheduling'] },
      { title: 'Human–Robot Interaction', sub: undefined, desc: '로봇과 인간이 같은 공간에서 안전하게 공존하며 효율적으로 상호작용하기 위한 인터페이스 및 알고리즘', keywords: ['Social Navigation', 'Intent Prediction', 'Verbal/Non-verbal Communication', 'Safety Standards (ISO 13482)', 'Teleoperation'] },
    ],
  },
  {
    col: 3, label: 'Approach',
    headerColor: 'text-green-700 border-green-300 bg-green-50',
    items: [
      { title: 'Rule-base', sub: undefined, desc: '명확한 논리적 규칙과 물리적 모델에 기반하여 로봇의 행동을 결정하는 고전적이고 결정론적인 접근법', keywords: ['Deterministic Algorithm', 'If-Then Rules', 'Expert Systems', 'Classical Control Theory', 'Model-based Design'] },
      { title: 'Data-driven', sub: undefined, desc: '대량의 데이터를 활용하여 로봇이 스스로 특징을 학습하고 최적의 행동을 도출하는 기계학습/딥러닝 기반 접근법', keywords: ['Deep Learning (CNN, RNN)', 'Reinforcement Learning (RL)', 'Imitation Learning', 'End-to-End Learning', 'Big Data'] },
      { title: 'Hybrid', sub: undefined, desc: 'Rule-base의 안정성과 Data-driven의 유연성을 결합하여 각 방법론의 단점을 상호 보완하는 접근법', keywords: ['Residual Learning', 'Physics-informed Neural Networks (PINN)', 'Model-based RL', 'Neuro-symbolic AI'] },
      { title: 'Hardware-based', sub: undefined, desc: '소프트웨어 알고리즘에 의존하기보다, 기구적 설계와 소재의 특성을 활용하여 지능적 동작을 구현하는 접근법', keywords: ['Passive Dynamics', 'Compliant Mechanism', 'Underactuated System', 'Soft Materials', 'Energy Efficiency'] },
      { title: 'System-level', sub: undefined, desc: '개별 알고리즘의 성능뿐만 아니라, 전체 시스템 아키텍처, 통신, 리소스 관리 관점에서의 최적화 접근법', keywords: ['ROS/ROS2 Middleware', 'Real-time Computing', 'Edge Computing', 'System Architecture', 'Latency Optimization'] },
    ],
  },
  {
    col: 4, label: 'Domain',
    headerColor: 'text-orange-700 border-orange-300 bg-orange-50',
    items: [
      { title: 'Logistics & Transportation', sub: undefined, desc: '물류 센터 및 라스트 마일 배송, 자율 주행 셔틀 등 물자의 효율적 이동 및 관리를 위한 자동화 기술', keywords: ['AGV/AMR', 'Fleet Management System (FMS)', 'Last-mile Delivery', 'Warehouse Automation', 'Route Optimization'] },
      { title: 'Industrial Automation', sub: undefined, desc: '제조 공장에서의 생산성 향상, 정밀 조립, 용접, 도장 등 반복적이고 위험한 작업을 대체하는 로봇 기술', keywords: ['Factory Automation (FA)', 'Smart Factory', 'Collaborative Robot (Cobot)', 'Precision Assembly', 'Safety Fence-less'] },
      { title: 'Domestic Service', sub: undefined, desc: '가정 내에서 가사 노동을 돕거나 노약자를 케어하는 등 인간의 일상 생활을 지원하는 서비스 로봇 기술', keywords: ['Home Service Robot', 'Elderly Care', 'Object Manipulation in Clutter', 'Semantic Mapping', 'Privacy Preserving'] },
      { title: 'Medical', sub: undefined, desc: '수술 보조, 재활 치료, 병원 내 물류 이송 등 의료 현장에서 의료진을 돕고 환자의 회복을 돕는 기술', keywords: ['Surgical Robot (Teleoperation)', 'Rehabilitation Exoskeleton', 'Haptic Feedback', 'Biocompatibility', 'Precision Medicine'] },
      { title: 'Exploration', sub: undefined, desc: '심해, 우주, 재난 현장 등 인간이 접근하기 어려운 극한 환경에서의 탐사, 구조, 지도 작성을 수행하는 기술', keywords: ['Search and Rescue (SAR)', 'Planetary Exploration', 'Terrain Analysis', 'Autonomous Navigation in GPS-denied Area', 'Robustness'] },
      { title: 'Smart Infrastructure', sub: undefined, desc: '교량, 터널, 파이프라인 등 사회 기반 시설의 점검, 유지보수, 모니터링을 자동화하는 로봇 기술', keywords: ['Structural Health Monitoring (SHM)', 'Inspection Drone/Crawler', '3D Reconstruction', 'Digital Twin', 'IoT Integration'] },
      { title: 'Simulation', sub: undefined, desc: '실제 로봇을 제작하거나 테스트하기 전, 가상 환경에서 물리 엔진을 기반으로 검증하고 학습 데이터를 생성하는 기술', keywords: ['Physics Engine (MuJoCo, PyBullet, Gazebo)', 'Sim-to-Real Transfer', 'Synthetic Data Generation', 'Digital Twin', 'Virtual Verification'] },
    ],
  },
]

export default function FieldsTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-10">
      {sections.map((section) => (
        <div key={section.label}>
          {/* 섹션 헤더 */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-3 ${section.headerColor}`}>
            <span className="text-[10px] font-bold tracking-widest opacity-60">COLUMN {section.col}</span>
            <span className="text-xs font-black uppercase tracking-wider">{section.label}</span>
          </div>

          {/* 카드 목록 */}
          <div className="space-y-2">
            {section.items.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl shadow-card border border-border flex overflow-hidden"
              >
                <div className="flex-1 min-w-0 p-3.5 flex flex-col gap-2">
                  {/* 제목 */}
                  <div>
                    <p className="text-sm font-black text-primary uppercase leading-tight tracking-wide">
                      {item.title}
                    </p>
                    {item.sub && (
                      <p className="text-xs text-text-light mt-0.5">({item.sub})</p>
                    )}
                  </div>

                  {/* 설명 */}
                  <p className="text-sm text-text-muted leading-relaxed">
                    {item.desc}
                  </p>

                  {/* 키워드 박스 */}
                  <div className="border border-border rounded-lg p-2.5 bg-bg-light">
                    <p className="text-xs font-bold text-text-light uppercase tracking-widest mb-2">Keywords</p>
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {item.keywords.map((kw) => (
                        <li key={kw} className="text-sm text-text-muted leading-snug flex gap-1">
                          <span className="shrink-0 mt-px">·</span>
                          <span>{kw}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
