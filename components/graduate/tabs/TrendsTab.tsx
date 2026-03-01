'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  Rss,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react'
import type { TrendItem, TrendSource, TrendsData } from '@/types/trends'

// ── 소스 메타데이터 ────────────────────────────────────────────────
const SOURCE_META: Record<
  TrendSource,
  { label: string; bg: string; text: string; border: string; icon: 'paper' | 'rss' }
> = {
  arxiv: {
    label: 'arXiv',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    icon: 'paper',
  },
  semanticscholar: {
    label: 'Semantic Scholar',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    icon: 'paper',
  },
  robotreport: {
    label: 'Robot Report',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'rss',
  },
  ieeespectrum: {
    label: 'IEEE Spectrum',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: 'rss',
  },
  robohub: {
    label: 'Robohub',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: 'rss',
  },
  rosdiscourse: {
    label: 'ROS Discourse',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: 'rss',
  },
  nvidia: {
    label: 'NVIDIA Blog',
    bg: 'bg-lime-50',
    text: 'text-lime-700',
    border: 'border-lime-200',
    icon: 'rss',
  },
  deepmind: {
    label: 'DeepMind',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: 'rss',
  },
  openai: {
    label: 'OpenAI',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: 'rss',
  },
}

const ALL_SOURCES = Object.keys(SOURCE_META) as TrendSource[]
const FILTER_OPTIONS = ['전체', ...ALL_SOURCES] as const
type FilterOption = (typeof FILTER_OPTIONS)[number]

// ── 유틸 ──────────────────────────────────────────────────────────
function formatDate(iso: string): string {
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

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return '오늘'
    if (days === 1) return '1일 전'
    if (days < 7) return `${days}일 전`
    if (days < 30) return `${Math.floor(days / 7)}주 전`
    if (days < 365) return `${Math.floor(days / 30)}개월 전`
    return `${Math.floor(days / 365)}년 전`
  } catch {
    return ''
  }
}

// ── 소스 배지 ─────────────────────────────────────────────────────
function SourceBadge({ source }: { source: TrendSource }) {
  const meta = SOURCE_META[source]
  const Icon = meta.icon === 'paper' ? FileText : Rss
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {meta.label}
    </span>
  )
}

// ── 개별 아이템 카드 ──────────────────────────────────────────────
function TrendCard({ item }: { item: TrendItem }) {
  const [expanded, setExpanded] = useState(false)
  const hasAbstract = !!item.abstractKo?.trim()
  const isLong = (item.abstractKo?.length ?? 0) > 180

  return (
    <div className="bg-white rounded-xl shadow-card border border-border hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* 헤더 */}
      <div className="p-4 flex-1">
        {/* 메타 행 */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <SourceBadge source={item.source} />
          <time
            dateTime={item.publishedAt}
            className="text-[10px] text-text-light shrink-0"
            title={formatDate(item.publishedAt)}
          >
            {formatRelative(item.publishedAt)}
          </time>
        </div>

        {/* 제목 (한국어) */}
        <h4 className="text-sm font-bold text-primary leading-snug mb-1 line-clamp-3">
          {item.titleKo || item.title}
        </h4>

        {/* 영문 원제 (회색, 작게) */}
        {item.titleKo && item.titleKo !== item.title && (
          <p className="text-[10px] text-text-light leading-tight mb-2 line-clamp-2 italic">
            {item.title}
          </p>
        )}

        {/* 요약 */}
        {hasAbstract && (
          <div className="mt-2">
            <p
              className={`text-xs text-text-muted leading-relaxed ${!expanded && isLong ? 'line-clamp-3' : ''}`}
            >
              {item.abstractKo}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 text-[10px] text-text-light hover:text-primary flex items-center gap-0.5 transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" /> 접기
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" /> 더보기
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* 저자 */}
        {item.authors && item.authors.length > 0 && (
          <p className="mt-2 text-[10px] text-text-light truncate">
            <span className="font-medium">저자:</span>{' '}
            {item.authors.slice(0, 3).join(', ')}
            {item.authors.length > 3 && ` 외 ${item.authors.length - 3}명`}
          </p>
        )}

        {/* 태그 */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 4).map((tag) => (
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

      {/* 원문 링크 */}
      <div className="px-4 pb-3 pt-1 border-t border-border">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-accent-research transition-colors"
        >
          원문 보기 <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

// ── 빈 상태 ───────────────────────────────────────────────────────
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
        아래 명령어로 데이터를 수집하세요:
      </p>
      <div className="bg-bg-gray rounded-lg px-5 py-3 font-mono text-xs text-primary border border-border text-left space-y-1">
        <div>
          <span className="text-text-light"># 번역 포함 (OPENAI_API_KEY 필요)</span>
        </div>
        <div>npm run fetch-trends</div>
        <div className="pt-1">
          <span className="text-text-light"># 번역 없이 빠른 테스트</span>
        </div>
        <div>npm run fetch-trends -- --no-translate</div>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────
export default function TrendsTab() {
  const [data, setData] = useState<TrendsData>({ lastUpdated: null, items: [] })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterOption>('전체')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    fetch('/api/graduate/trends')
      .then((r) => r.json())
      .then((d: TrendsData) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // 소스별 아이템 수 (필터 칩 뱃지용)
  const countBySource = useMemo(() => {
    const map: Partial<Record<TrendSource, number>> = {}
    for (const item of data.items) {
      map[item.source] = (map[item.source] ?? 0) + 1
    }
    return map
  }, [data.items])

  const filtered = useMemo(() => {
    let result = data.items

    if (filter !== '전체') {
      result = result.filter((item) => item.source === filter)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (item) =>
          (item.titleKo || item.title).toLowerCase().includes(q) ||
          (item.abstractKo || item.abstract || '').toLowerCase().includes(q) ||
          item.authors?.some((a) => a.toLowerCase().includes(q))
      )
    }

    return [...result].sort((a, b) => {
      const da = new Date(a.publishedAt).getTime()
      const db = new Date(b.publishedAt).getTime()
      return sort === 'newest' ? db - da : da - db
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
          <h3 className="text-base font-bold text-primary">로보틱스 최신 동향</h3>
          <p className="text-xs text-text-light mt-0.5">
            arXiv · Semantic Scholar · RSS 피드 수집 / GPT-4o-mini 번역
          </p>
        </div>
        {data.lastUpdated && (
          <div className="text-[10px] text-text-light bg-bg-light rounded-lg px-3 py-1.5 border border-border">
            마지막 업데이트{' '}
            <span className="font-medium text-text-muted">
              {formatDate(data.lastUpdated)}
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
            placeholder="제목, 요약, 저자 검색..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-primary placeholder:text-text-light transition"
          />
        </div>
        <button
          onClick={() => setSort((s) => (s === 'newest' ? 'oldest' : 'newest'))}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-border rounded-lg text-text-muted hover:text-primary hover:border-primary transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sort === 'newest' ? '최신순' : '오래된순'}
        </button>
      </div>

      {/* 소스 필터 칩 */}
      {data.items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((opt) => {
            const count = opt === '전체' ? data.items.length : (countBySource[opt as TrendSource] ?? 0)
            if (opt !== '전체' && count === 0) return null
            const active = filter === opt
            const meta = opt !== '전체' ? SOURCE_META[opt as TrendSource] : null
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
            : `전체 ${data.items.length}개`}
        </p>
      )}

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <EmptyState filtered={isFiltered && data.items.length > 0} />
        ) : (
          filtered.map((item) => <TrendCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}
