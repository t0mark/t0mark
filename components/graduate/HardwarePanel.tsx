'use client'

import { useState } from 'react'
import type { HardwareData, HardwareCategory, CategoryInfo } from '@/types/graduate'

const categoryInfo: Record<HardwareCategory, CategoryInfo> = {
  platforms: { title: '차세대 로봇 플랫폼', badge: '2024 HOT', badgeColor: '#ff6b6b' },
  computing: { title: 'AI 컴퓨팅 하드웨어', badge: 'EDGE AI', badgeColor: '#10b981' },
  sensors: { title: '차세대 센서 기술', badge: 'SENSING', badgeColor: '#0ea5e9' },
  actuators: { title: '스마트 액추에이터', badge: 'MOTION', badgeColor: '#2c3e50' },
}

// 카테고리별 하드웨어 항목 (trends.html에서 이식)
const categoryItems: Record<HardwareCategory, { name: string; spec: string; featured?: boolean }[]> = {
  platforms: [
    { name: 'Tesla Bot Gen-2', spec: 'Optimus 휴머노이드', featured: true },
    { name: 'Figure 01', spec: 'OpenAI 협력 로봇', featured: true },
    { name: 'Boston Dynamics Atlas', spec: '전기 구동 버전' },
    { name: 'Agility Digit v6', spec: '물류 자동화' },
    { name: '1X NEO Beta', spec: '가정용 로봇' },
  ],
  computing: [
    { name: 'NVIDIA Jetson Thor', spec: '2000 TOPS AI 성능', featured: true },
    { name: 'Apple M4 Ultra', spec: 'Neural Engine 38 TOPS', featured: true },
    { name: 'Qualcomm RB5', spec: '로봇 전용 플랫폼' },
    { name: 'Intel Loihi 2', spec: '뉴로모픽 칩' },
    { name: 'Google Coral TPU', spec: '엣지 AI 추론' },
  ],
  sensors: [
    { name: '4D Imaging Radar', spec: 'Arbe Robotics', featured: true },
    { name: 'Event Camera', spec: 'Prophesee DVS', featured: true },
    { name: 'Solid-State LiDAR', spec: 'Luminar Iris' },
    { name: 'Tactile Sensor Array', spec: 'SynTouch BioTac' },
    { name: 'Multi-modal Fusion', spec: 'Camera+Radar+LiDAR' },
  ],
  actuators: [
    { name: 'Series Elastic Actuator', spec: '안전한 힘 제어', featured: true },
    { name: 'Soft Robotics Actuator', spec: '공압 구동', featured: true },
    { name: 'Direct Drive Motor', spec: '고토크 밀도' },
    { name: 'Shape Memory Alloy', spec: '바이오 미메틱' },
    { name: 'Magnetic Gear', spec: '비접촉 전동' },
  ],
}

interface HardwarePanelProps {
  hardwareData?: HardwareData
}

export default function HardwarePanel({ hardwareData }: HardwarePanelProps) {
  const [activeCategory, setActiveCategory] = useState<HardwareCategory>('platforms')
  const [modalItem, setModalItem] = useState<string | null>(null)

  const info = categoryInfo[activeCategory]
  const items = categoryItems[activeCategory]
  const modalData = modalItem ? hardwareData?.[modalItem] : null

  return (
    <div className="flex gap-5 mt-4">
      {/* 로봇 SVG 다이어그램 */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <svg
          viewBox="-50 -50 612 612"
          xmlns="http://www.w3.org/2000/svg"
          className="w-44 h-44"
        >
          {/* 팔 (Actuators) */}
          <g
            className={`robot-part cursor-pointer ${activeCategory === 'actuators' ? 'active' : ''}`}
            onClick={() => setActiveCategory('actuators')}
          >
            <rect x="79.733" y="174.756" transform="matrix(-0.704 -0.7102 0.7102 -0.704 -0.8879 464.9204)" fill="#ECECED" width="33.417" height="115.779"/>
            <path fill="#D7D7D7" d="M45.224,328.709l-5.13-33.022c0.903-0.14,2.228-0.555,3.405-1.732c2.41-2.41,2.412-6.335,0-8.745s-6.335-2.412-8.746,0c-1.177,1.177-1.592,2.502-1.732,3.405L0,283.487c1.298-8.351,5.144-15.925,11.123-21.905c15.44-15.44,40.564-15.441,56.005,0s15.44,40.565,0,56.005C61.148,323.566,53.573,327.412,45.224,328.709z"/>
            <rect x="398.851" y="174.74" transform="matrix(0.704 -0.7102 0.7102 0.704 -42.2075 363.9888)" fill="#D7D7D7" width="33.417" height="115.779"/>
            <path fill="#B0B0B0" d="M466.776,328.709l5.13-33.022c-0.903-0.14-2.228-0.555-3.405-1.732c-2.41-2.41-2.412-6.335,0-8.745c2.412-2.41,6.335-2.412,8.746,0c1.177,1.177,1.592,2.502,1.732,3.405L512,283.487c-1.298-8.351-5.144-15.925-11.123-21.905c-15.44-15.44-40.564-15.441-56.005,0s-15.44,40.565,0,56.005C450.852,323.566,458.426,327.412,466.776,328.709z"/>
          </g>
          {/* 머리 (Computing) */}
          <g
            className={`robot-part cursor-pointer ${activeCategory === 'computing' ? 'active' : ''}`}
            onClick={() => setActiveCategory('computing')}
          >
            <path fill="#92E5EA" d="M360.457,182.403H151.542v-61.667c0-57.594,46.86-104.451,104.457-104.451s104.457,46.856,104.457,104.451L360.457,182.403L360.457,182.403z"/>
            <path fill="#79BBBC" d="M360.457,182.403H255.999c0,0,0-143.614,0-166.119c57.598,0,104.457,46.856,104.457,104.451V182.403z"/>
          </g>
          {/* 몸통 (Platforms) */}
          <g
            className={`robot-part cursor-pointer ${activeCategory === 'platforms' ? 'active' : ''}`}
            onClick={() => setActiveCategory('platforms')}
          >
            <rect x="120.836" y="165.694" fill="#D7D7D7" width="270.333" height="253.625"/>
            <rect x="255.997" y="165.694" fill="#B0B0B0" width="135.161" height="253.625"/>
            <path fill="#C8F9FA" d="M334.663,309.217H177.337V218.35h157.327L334.663,309.217L334.663,309.217z"/>
            <path fill="#92E5EA" d="M334.663,309.217h-78.664V218.35h78.664V309.217z"/>
          </g>
          {/* 눈/센서 (Sensors) */}
          <g
            className={`robot-part cursor-pointer ${activeCategory === 'sensors' ? 'active' : ''}`}
            onClick={() => setActiveCategory('sensors')}
          >
            <circle cx="210" cy="99" r="18" fill="#4a90e2"/>
            <circle cx="302" cy="99" r="18" fill="#4a90e2"/>
            <rect x="200" y="140" width="112" height="8" rx="4" fill="#ff6b6b"/>
          </g>
          {/* 다리 (클릭 불가) */}
          <g className="robot-legs">
            <path fill="#8B8B8B" d="M189.799,495.715H85.288V322.484h104.511L189.799,495.715L189.799,495.715z"/>
            <rect x="85.292" y="358.065" fill="#6F6F6F" width="104.506" height="33.417"/>
            <rect x="85.292" y="426.781" fill="#6F6F6F" width="104.506" height="33.417"/>
            <path fill="#6F6F6F" d="M322.2,322.484h104.511v173.231H322.2V322.484z"/>
            <rect x="322.197" y="358.065" fill="#444444" width="104.506" height="33.417"/>
            <rect x="322.197" y="426.781" fill="#444444" width="104.506" height="33.417"/>
          </g>
        </svg>
        <p className="text-[10px] text-text-light flex items-center gap-1">
          <span>👆</span> 로봇 부위를 클릭하세요
        </p>
        {/* 카테고리 버튼 */}
        <div className="flex gap-1 flex-wrap justify-center">
          {(Object.keys(categoryInfo) as HardwareCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-light border-border hover:border-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 하드웨어 패널 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <h4 className="font-bold text-primary text-sm">{info.title}</h4>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: info.badgeColor }}
          >
            {info.badge}
          </span>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                if (hardwareData?.[item.name]) setModalItem(item.name)
              }}
              className={`w-full flex justify-between items-center p-2.5 rounded-lg border text-left transition-all hover:shadow-sm ${
                item.featured
                  ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                  : 'bg-white border-border hover:border-primary/30'
              }`}
            >
              <span className={`text-xs font-semibold ${item.featured ? 'text-primary' : 'text-text-muted'}`}>
                {item.name}
              </span>
              <span className="text-[10px] text-text-light">{item.spec}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 하드웨어 상세 모달 */}
      {modalItem && modalData && (
        <>
          <div className="modal-overlay" onClick={() => setModalItem(null)} />
          <div className="modal-panel">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-float relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-primary text-base">{modalData.name}</h3>
                  <span className="text-xs text-text-light">{modalData.category}</span>
                </div>
                <button
                  onClick={() => setModalItem(null)}
                  className="text-text-light hover:text-primary transition-colors text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-text-muted mb-4 leading-relaxed">{modalData.description}</p>
              <div className="mb-4">
                <h4 className="text-xs font-bold text-primary mb-2">주요 기능</h4>
                <ul className="space-y-1">
                  {modalData.features.map((f) => (
                    <li key={f} className="text-xs text-text-muted flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-hardware shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-primary mb-2">사양</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(modalData.specs).map(([k, v]) => (
                    <div key={k} className="bg-bg-light rounded-lg p-2">
                      <p className="text-[10px] text-text-light">{k}</p>
                      <p className="text-xs font-semibold text-text-base">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
