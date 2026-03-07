'use client'

import { useState } from 'react'
import { Settings2, TrendingUp, Building2, Briefcase, GraduationCap } from 'lucide-react'
import FieldsTab from './tabs/FieldsTab'
import TrendsTab from './tabs/TrendsTab'
import ConferencesTab from './tabs/ConferencesTab'
import InternTab from './tabs/InternTab'
import ScholarshipTab from './tabs/ScholarshipTab'

type Tab = 'fields' | 'trends' | 'conferences' | 'interns' | 'scholarships'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'trends', label: '연구 동향', icon: TrendingUp },
  { id: 'conferences', label: '학회 & 저널', icon: Building2 },
  { id: 'fields', label: '연구 분야', icon: Settings2 },
  { id: 'interns', label: '인턴', icon: Briefcase },
  { id: 'scholarships', label: '산학장학생', icon: GraduationCap },
]

export default function InsightsClient() {
  const [activeTab, setActiveTab] = useState<Tab>('trends')

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* 탭 네비게이션 */}
      <nav className="flex gap-1 bg-white rounded-xl p-1 shadow-card mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-light hover:text-primary hover:bg-bg-light'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* 탭 콘텐츠 */}
      <div>
        {activeTab === 'fields' && <FieldsTab />}
        {activeTab === 'trends' && <TrendsTab />}
        {activeTab === 'conferences' && <ConferencesTab />}
        {activeTab === 'interns' && <InternTab />}
        {activeTab === 'scholarships' && <ScholarshipTab />}
      </div>
    </div>
  )
}
