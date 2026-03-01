'use client'

import { useEffect, useState } from 'react'
import { FlaskConical, TrendingUp, Bot, GraduationCap, Brain, ShieldCheck, Factory, Car, Home, HeartPulse, Cpu } from 'lucide-react'
import HardwarePanel from '../HardwarePanel'
import type { HardwareData } from '@/types/graduate'

const researchTrends = [
  {
    icon: Bot,
    title: 'Foundation Models for Robotics',
    desc: '자연어 명령으로 로봇을 조작할 수 있는 통합 AI 모델',
    tags: [
      { label: 'Large Language Models (LLMs) 기반 로봇 제어', hot: true },
      { label: 'Vision-Language-Action (VLA) 모델', hot: true },
      { label: 'Multimodal Foundation Models', hot: false },
      { label: '웹 스케일 지식 전이', hot: false },
    ],
  },
  {
    icon: GraduationCap,
    title: 'Learning Paradigms',
    desc: '적은 데이터로 빠르게 학습하고 새로운 환경에 적응하는 효율적인 로봇 학습 기법',
    tags: [
      { label: 'Few-shot and Zero-shot Robot Learning', hot: false },
      { label: 'Meta-learning for Rapid Adaptation', hot: false },
      { label: 'Self-supervised Learning', hot: false },
      { label: 'Continual Learning', hot: false },
    ],
  },
  {
    icon: Brain,
    title: 'Embodied AI',
    desc: '시뮬레이션에서 실제 환경으로 지식을 전이하는 물리적 AI 에이전트',
    tags: [
      { label: 'Sim-to-Real Transfer Learning', hot: true },
      { label: 'World Models for Robotics', hot: false },
      { label: 'Emergent Behaviors', hot: false },
      { label: 'Physical Intelligence', hot: false },
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Safety and Robustness',
    desc: '불확실성과 적대적 공격에 강건한 안전하고 신뢰할 수 있는 로봇 시스템',
    tags: [
      { label: 'Safe Reinforcement Learning', hot: false },
      { label: 'Uncertainty Quantification', hot: false },
      { label: 'Adversarial Robustness', hot: false },
      { label: 'Formal Verification', hot: false },
    ],
  },
]

const industryCards = [
  {
    icon: Factory,
    colorClass: 'border-l-blue-500 bg-blue-50',
    iconClass: 'bg-blue-100 text-blue-600',
    title: 'Smart Manufacturing',
    items: ['Industry 4.0 & 스마트 팩토리', 'Collaborative Manufacturing', 'Quality Control and Inspection', 'Flexible Automation'],
    career: '제조업 자동화 엔지니어, 스마트 팩토리 연구원',
  },
  {
    icon: Car,
    colorClass: 'border-l-green-500 bg-green-50',
    iconClass: 'bg-green-100 text-green-600',
    title: 'Autonomous Systems',
    items: ['Level 4/5 자율주행 기술', 'V2X (Vehicle-to-Everything)', 'UAM (Urban Air Mobility)', 'Fleet Management'],
    career: '자율주행 개발자, 드론/UAM 시스템 엔지니어',
  },
  {
    icon: Home,
    colorClass: 'border-l-purple-500 bg-purple-50',
    iconClass: 'bg-purple-100 text-purple-600',
    title: 'Service Robotics',
    items: ['배송 및 물류 로봇', '청소 및 보안 로봇', '호텔·레스토랑 서비스', '개인 맞춤 서비스'],
    career: '서비스 로봇 개발자, HRI 연구원',
  },
  {
    icon: HeartPulse,
    colorClass: 'border-l-red-500 bg-red-50',
    iconClass: 'bg-red-100 text-red-600',
    title: 'Healthcare Robotics',
    items: ['원격 수술 로봇', '재활 치료 로봇', '케어 로봇', '의료 보조 시스템'],
    career: '의료 로봇 연구원, 헬스케어 AI 개발자',
  },
]

export default function TrendsTab() {
  const [hardwareData, setHardwareData] = useState<HardwareData>({})

  useEffect(() => {
    fetch('/api/graduate/hardware')
      .then((r) => r.json())
      .then(setHardwareData)
      .catch(console.error)
  }, [])

  return (
    <div className="space-y-8">
      {/* 연구 트렌드 */}
      <section>
        <h3 className="text-base font-bold text-primary flex items-center gap-2 mb-4">
          <FlaskConical className="w-5 h-5 text-accent-research" /> 주요 연구 트렌드
        </h3>
        <div className="space-y-4">
          {researchTrends.map((trend) => {
            const Icon = trend.icon
            return (
              <div key={trend.title} className="bg-white rounded-xl p-5 shadow-card flex gap-4">
                <div className="w-10 h-10 bg-bg-gray rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-primary text-sm mb-1">{trend.title}</h4>
                  <p className="text-xs text-text-light mb-2">{trend.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {trend.tags.map((tag) => (
                      <span
                        key={tag.label}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          tag.hot
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : 'bg-bg-light border-border text-text-muted'
                        }`}
                      >
                        {tag.hot && '🔥 '}{tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 산업 응용 */}
      <section>
        <h3 className="text-base font-bold text-primary flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent-industry" /> 산업 응용 분야
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {industryCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className={`rounded-xl p-4 border-l-4 ${card.colorClass} hover:-translate-y-1 hover:shadow-hover transition-all duration-300`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.iconClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-primary text-sm">{card.title}</h4>
                </div>
                <ul className="space-y-1 mb-2">
                  {card.items.map((item) => (
                    <li key={item} className="text-xs text-text-muted flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-border-dark shrink-0" />{item}
                    </li>
                  ))}
                </ul>
                <div className="text-[10px] text-text-light bg-white/70 rounded px-2 py-1">
                  💼 <strong>진로 기회</strong> {card.career}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 하드웨어 트렌드 */}
      <section>
        <h3 className="text-base font-bold text-primary flex items-center gap-2 mb-2">
          <Cpu className="w-5 h-5 text-accent-hardware" /> 최신 하드웨어 트렌드
        </h3>
        <div className="bg-white rounded-xl p-5 shadow-card">
          <HardwarePanel hardwareData={hardwareData} />
        </div>
      </section>
    </div>
  )
}
