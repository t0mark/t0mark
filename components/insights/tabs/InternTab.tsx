'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Search,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  ArrowUpDown,
  Building2,
  MapPin,
  Clock,
  Briefcase,
} from 'lucide-react'
import type { InternItem, InternSource, InternsData } from '@/types/interns'

// ── 소스 메타데이터 ──────────────────────────────────────────────
const SOURCE_META: Record<InternSource, { label: string; bg: string; text: string; border: string }> = {
  saramin: {
    label: '사람인',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  jobkorea: {
    label: '잡코리아',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  wanted: {
    label: '원티드',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
  },
  jasoseol: {
    label: '자소설닷컴',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
}

const ALL_SOURCES = Object.keys(SOURCE_META) as InternSource[]
const FILTER_OPTIONS = ['전체', ...ALL_SOURCES] as const
type FilterOption = (typeof FILTER_OPTIONS)[number]

// ── 유틸 ────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  if (iso === '상시채용' || iso === '미기재') return iso
  try {
    return new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatLastUpdated(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

/**
 * 마감까지 남은 일수. 상시채용/미기재면 null 반환.
 */
function getDaysLeft(deadline: string): number | null {
  if (deadline === '상시채용' || deadline === '미기재') return null
  try {
    const diff = new Date(deadline).getTime() - Date.now()
    return Math.ceil(diff / 86400000)
  } catch {
    return null
  }
}

// ── 소스 배지 ───────────────────────────────────────────────────
function SourceBadge({ source }: { source: InternSource }) {
  const meta = SOURCE_META[source]
  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}
    >
      {meta.label}
    </span>
  )
}

// ── 마감일 배지 ─────────────────────────────────────────────────
function DeadlineBadge({ deadline }: { deadline: string }) {
  const daysLeft = getDaysLeft(deadline)
  const label = deadline === '상시채용' || deadline === '미기재' ? deadline : formatDate(deadline)

  if (daysLeft === null) {
    return <span className="text-[11px] text-text-light">{label}</span>
  }
  if (daysLeft < 0) {
    return <span className="text-[11px] text-text-light line-through">{label} (마감)</span>
  }
  if (daysLeft <= 3) {
    return (
      <span className="text-[11px] font-bold text-red-600">
        {label}{' '}
        <span className="text-[10px] bg-red-50 border border-red-200 rounded px-1">D-{daysLeft}</span>
      </span>
    )
  }
  if (daysLeft <= 7) {
    return (
      <span className="text-[11px] font-semibold text-orange-600">
        {label}{' '}
        <span className="text-[10px] bg-orange-50 border border-orange-200 rounded px-1">D-{daysLeft}</span>
      </span>
    )
  }
  return <span className="text-[11px] text-text-muted">{label}</span>
}

// ── 개별 카드 ───────────────────────────────────────────────────
function InternCard({ item }: { item: InternItem }) {
  return (
    <div className="bg-white rounded-xl shadow-card border border-border hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      <div className="p-4 flex-1 space-y-2">
        {/* 소스 배지 + 마감일 */}
        <div className="flex items-center justify-between gap-2">
          <SourceBadge source={item.source} />
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-text-light" />
            <DeadlineBadge deadline={item.deadline} />
          </div>
        </div>

        {/* 공고 제목 */}
        <h4 className="text-sm font-bold text-primary leading-snug line-clamp-2">
          {item.title}
        </h4>

        {/* 회사명 + 근무지 */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Building2 className="w-3 h-3 shrink-0" />
            {item.company}
          </span>
          {item.location && item.location !== '미기재' && (
            <span className="flex items-center gap-1 text-xs text-text-light">
              <MapPin className="w-3 h-3 shrink-0" />
              {item.location}
            </span>
          )}
        </div>

        {/* 경력 조건 / 급여 */}
        {(item.experience || item.salary) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {item.experience && (
              <span className="text-[11px] text-text-light">{item.experience}</span>
            )}
            {item.salary && (
              <span className="text-[11px] font-medium text-accent-industry">{item.salary}</span>
            )}
          </div>
        )}

        {/* 직무 태그 */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-1.5 py-0.5 rounded bg-bg-light text-text-light border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 공고 링크 */}
      <div className="px-4 pb-3 pt-1 border-t border-border">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-accent-research transition-colors"
        >
          공고 보기 <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

// ── 빈 상태 ─────────────────────────────────────────────────────
function EmptyState({ filtered }: { filtered: boolean }) {
  if (filtered) {
    return (
      <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center">
        <Search className="w-10 h-10 text-border-dark mb-3" />
        <p className="text-sm font-medium text-text-muted">검색 결과가 없습니다.</p>
        <p className="text-xs text-text-light mt-1">필터나 검색어를 변경해보세요.</p>
      </div>
    )
  }
  return (
    <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="w-10 h-10 text-border-dark mb-3" />
      <p className="text-sm font-bold text-text-muted mb-1">데이터가 없습니다.</p>
      <p className="text-xs text-text-light mb-4">
        아래 명령어로 인턴 공고를 수집하세요:
      </p>
      <div className="bg-bg-gray rounded-lg px-5 py-3 font-mono text-xs text-primary border border-border text-left space-y-1">
        <div>
          <span className="text-text-light"># 전체 수집</span>
        </div>
        <div>npm run fetch-interns</div>
        <div className="pt-1">
          <span className="text-text-light"># 빠른 테스트 (소스당 3개)</span>
        </div>
        <div>npm run fetch-interns:fast</div>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
export default function InternTab() {
  const [data, setData] = useState<InternsData>({ lastUpdated: null, items: [] })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterOption>('전체')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'deadline' | 'newest'>('deadline')

  useEffect(() => {
    fetch('/api/insights/interns')
      .then((r) => r.json())
      .then((d: InternsData) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // 소스별 아이템 수
  const countBySource = useMemo(() => {
    const map: Partial<Record<InternSource, number>> = {}
    for (const item of data.items) {
      map[item.source] = (map[item.source] ?? 0) + 1
    }
    return map
  }, [data.items])

  const filtered = useMemo(() => {
    let result = data.items

    // 마감된 공고 제외
    result = result.filter((item) => {
      if (item.deadline === '상시채용' || item.deadline === '미기재') return true
      try {
        return new Date(item.deadline).getTime() >= Date.now()
      } catch {
        return true
      }
    })

    if (filter !== '전체') {
      result = result.filter((item) => item.source === filter)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.company.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    return [...result].sort((a, b) => {
      if (sort === 'deadline') {
        // 상시채용/미기재는 뒤로
        const special = (d: string) => d === '상시채용' || d === '미기재'
        if (special(a.deadline) && !special(b.deadline)) return 1
        if (!special(a.deadline) && special(b.deadline)) return -1
        if (special(a.deadline) && special(b.deadline)) return 0
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      // newest: 등록일 최신순
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    })
  }, [data.items, filter, search, sort])

  const isFiltered = filter !== '전체' || search.trim().length > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-text-light">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">데이터 로드 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-primary flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> 로봇·AI R&D 인턴십
          </h3>
        </div>
        {data.lastUpdated && (
          <div className="text-[10px] text-text-light bg-bg-light rounded-lg px-3 py-1.5 border border-border">
            마지막 업데이트{' '}
            <span className="font-medium text-text-muted">
              {formatLastUpdated(data.lastUpdated)}
            </span>
          </div>
        )}
      </div>

      {/* 검색 + 정렬 */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-light pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="공고 제목, 회사명, 직무 검색..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-primary placeholder:text-text-light transition"
          />
        </div>
        <button
          onClick={() => setSort((s) => (s === 'deadline' ? 'newest' : 'deadline'))}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-border rounded-lg text-text-muted hover:text-primary hover:border-primary transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sort === 'deadline' ? '마감일순' : '최신순'}
        </button>
      </div>

      {/* 소스 필터 칩 */}
      {data.items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((opt) => {
            const count =
              opt === '전체' ? data.items.length : (countBySource[opt as InternSource] ?? 0)
            if (opt !== '전체' && count === 0) return null
            const active = filter === opt
            const meta = opt !== '전체' ? SOURCE_META[opt as InternSource] : null
            return (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-text-muted border-border hover:border-primary hover:text-primary'
                }`}
              >
                {opt === '전체' ? '전체' : (meta?.label ?? opt)}
                <span
                  className={`text-[9px] px-1 py-0.5 rounded-full font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-bg-gray text-text-light'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* 결과 수 */}
      {data.items.length > 0 && (
        <p className="text-[11px] text-text-light">
          {isFiltered
            ? `${filtered.length}개 결과 / 전체 ${data.items.length}개`
            : `전체 ${data.items.length}개 (마감된 공고 자동 제외)`}
        </p>
      )}

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <EmptyState filtered={isFiltered && data.items.length > 0} />
        ) : (
          filtered.map((item) => <InternCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}
