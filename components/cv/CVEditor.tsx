'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Phone, Mail, MapPin, Linkedin, Github, BookOpen, Plus, Trash2, X, Save, RotateCcw } from 'lucide-react'
import type { CVData, EducationEntry, InternshipEntry, ProjectEntry, DatedEntry, LinkEntry } from '@/types/cv'

const PASSWORD = '5297'
const PW_KEY = 'cv-edit-password'

interface Props {
  initial: CVData
}

export default function CVEditor({ initial }: Props) {
  const [data, setData] = useState<CVData>(initial)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(PW_KEY) === PASSWORD) setEditMode(true)
  }, [])

  const update = (fn: (d: CVData) => CVData) => {
    setData((prev) => fn(prev))
    setDirty(true)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/cv', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CV-Password': sessionStorage.getItem(PW_KEY) ?? '',
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(String(res.status))
      setDirty(false)
    } catch (err) {
      alert(`저장 실패: ${err instanceof Error ? err.message : ''}`)
    } finally {
      setSaving(false)
    }
  }

  function revert() {
    if (!dirty || confirm('변경사항을 취소하고 마지막 저장 상태로 되돌릴까요?')) {
      setData(initial)
      setDirty(false)
    }
  }

  function handleFooterDblClick() {
    if (editMode) {
      if (dirty) { alert('저장하지 않은 변경사항이 있습니다.'); return }
      if (confirm('편집 모드를 해제할까요?')) {
        sessionStorage.removeItem(PW_KEY)
        setEditMode(false)
      }
      return
    }
    const input = prompt('비밀번호')
    if (input === null) return
    if (input === PASSWORD) {
      sessionStorage.setItem(PW_KEY, input)
      setEditMode(true)
    } else {
      alert('비밀번호가 틀렸습니다.')
    }
  }

  const { name, role, contact, links, skills, education, internships, projects, awards, scholarships, certifications, extracurricular } = data

  return (
    <div className="min-h-screen bg-bg-light py-8 px-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-72 shrink-0 flex flex-col gap-5">
          <div className="bg-white rounded-2xl p-6 shadow-card text-center">
            <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden border-4 border-border">
              <Image src="/images/profile.png" alt={name} width={96} height={96} className="object-cover" />
            </div>
            <EditableText
              editMode={editMode}
              value={name}
              onChange={(v) => update((d) => ({ ...d, name: v }))}
              className="block text-xl font-bold text-primary"
              inputClass="block text-xl font-bold text-primary text-center w-full"
            />
            <EditableText
              editMode={editMode}
              value={role}
              onChange={(v) => update((d) => ({ ...d, role: v }))}
              className="block text-base text-text-light mt-1"
              inputClass="block text-base text-text-light text-center w-full mt-1"
            />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h2 className="text-base font-bold text-primary mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Contact
            </h2>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-center gap-2">
                <Phone className="w-3 h-3 shrink-0" />
                <EditableText
                  editMode={editMode}
                  value={contact.phone}
                  onChange={(v) => update((d) => ({ ...d, contact: { ...d.contact, phone: v } }))}
                  className="flex-1"
                />
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3 h-3 shrink-0" />
                <EditableText
                  editMode={editMode}
                  value={contact.email}
                  onChange={(v) => update((d) => ({ ...d, contact: { ...d.contact, email: v } }))}
                  className="flex-1"
                />
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3 h-3 shrink-0" />
                <EditableText
                  editMode={editMode}
                  value={contact.location}
                  onChange={(v) => update((d) => ({ ...d, contact: { ...d.contact, location: v } }))}
                  className="flex-1"
                />
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h2 className="text-base font-bold text-primary mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Links
            </h2>
            <ul className="space-y-2">
              {links.map((link, i) => (
                <li key={i} className="flex items-center gap-2 text-sm group">
                  {link.icon === 'linkedin' && <Linkedin className="w-3 h-3 text-[#0077B5] shrink-0" />}
                  {link.icon === 'github' && <Github className="w-3 h-3 text-gray-700 shrink-0" />}
                  {editMode ? (
                    <>
                      <input
                        value={link.icon}
                        onChange={(e) => update((d) => ({ ...d, links: d.links.map((l, j) => j === i ? { ...l, icon: e.target.value } : l) }))}
                        placeholder="icon"
                        className="w-16 text-xs border border-dashed border-primary/40 rounded px-1 outline-none focus:border-primary"
                      />
                      <input
                        value={link.label}
                        onChange={(e) => update((d) => ({ ...d, links: d.links.map((l, j) => j === i ? { ...l, label: e.target.value } : l) }))}
                        placeholder="label"
                        className="flex-1 min-w-0 text-xs border border-dashed border-primary/40 rounded px-1 outline-none focus:border-primary"
                      />
                      <input
                        value={link.href}
                        onChange={(e) => update((d) => ({ ...d, links: d.links.map((l, j) => j === i ? { ...l, href: e.target.value } : l) }))}
                        placeholder="href"
                        className="flex-1 min-w-0 text-xs border border-dashed border-primary/40 rounded px-1 outline-none focus:border-primary"
                      />
                      <DeleteBtn onClick={() => update((d) => ({ ...d, links: d.links.filter((_, j) => j !== i) }))} />
                    </>
                  ) : (
                    <a href={link.href} target="_blank" rel="noreferrer" className="text-accent-industry hover:underline">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
              {editMode && (
                <AddBtn
                  label="링크 추가"
                  onClick={() => update((d) => ({ ...d, links: [...d.links, { icon: '', label: '', href: '' } as LinkEntry] }))}
                />
              )}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h2 className="text-base font-bold text-primary mb-3">🛠️ Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, i) => (
                <span key={i} className="bg-bg-light text-primary text-sm font-medium px-2.5 py-1 rounded-full border border-border flex items-center gap-1">
                  {editMode ? (
                    <input
                      value={skill}
                      onChange={(e) => update((d) => ({ ...d, skills: d.skills.map((s, j) => j === i ? e.target.value : s) }))}
                      className="w-20 bg-transparent outline-none"
                    />
                  ) : skill}
                  {editMode && <DeleteBtn small onClick={() => update((d) => ({ ...d, skills: d.skills.filter((_, j) => j !== i) }))} />}
                </span>
              ))}
              {editMode && (
                <button
                  onClick={() => update((d) => ({ ...d, skills: [...d.skills, ''] }))}
                  className="bg-bg-light text-primary text-sm font-medium px-2.5 py-1 rounded-full border border-dashed border-primary/40 hover:bg-primary/5"
                >
                  <Plus className="w-3 h-3 inline" />
                </button>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col gap-6">
          <Section
            title="Education"
            onAdd={editMode ? () => update((d) => ({ ...d, education: [...d.education, { institution: '', degrees: [''], duration: '', achievements: [] } as EducationEntry] })) : undefined}
          >
            {education.map((edu, i) => (
              <div key={i} className="border-l-2 border-border pl-4 py-1 relative">
                {editMode && (
                  <div className="absolute right-0 top-0">
                    <DeleteBtn onClick={() => update((d) => ({ ...d, education: d.education.filter((_, j) => j !== i) }))} />
                  </div>
                )}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <EditableText
                      editMode={editMode}
                      value={edu.institution}
                      onChange={(v) => update((d) => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, institution: v } : e) }))}
                      className="font-semibold text-primary text-base"
                      inputClass="font-semibold text-primary text-base w-full"
                    />
                    <div className="mt-0.5 space-y-0.5">
                      {edu.degrees.map((deg, di) => (
                        <div key={di} className="flex items-center gap-1">
                          <EditableText
                            editMode={editMode}
                            value={deg}
                            onChange={(v) => update((d) => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, degrees: e.degrees.map((x, k) => k === di ? v : x) } : e) }))}
                            className="text-sm text-text-light"
                            inputClass="text-sm text-text-light flex-1"
                          />
                          {editMode && (
                            <DeleteBtn small onClick={() => update((d) => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, degrees: e.degrees.filter((_, k) => k !== di) } : e) }))} />
                          )}
                        </div>
                      ))}
                      {editMode && (
                        <AddBtn
                          label="학위 추가"
                          onClick={() => update((d) => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, degrees: [...e.degrees, ''] } : e) }))}
                        />
                      )}
                    </div>
                    {(edu.lab || editMode) && (
                      <EditableText
                        editMode={editMode}
                        value={edu.lab ?? ''}
                        onChange={(v) => update((d) => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, lab: v || undefined } : e) }))}
                        placeholder="Lab (선택)"
                        className="text-sm text-text-muted mt-0.5"
                        inputClass="text-sm text-text-muted w-full mt-0.5"
                      />
                    )}
                  </div>
                  <EditableText
                    editMode={editMode}
                    value={edu.duration}
                    onChange={(v) => update((d) => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, duration: v } : e) }))}
                    className="text-sm text-text-light shrink-0 mt-0.5"
                    inputClass="text-sm text-text-light shrink-0 mt-0.5 w-40"
                  />
                </div>
                <ul className="mt-2 space-y-0.5">
                  {edu.achievements.map((a, ai) => (
                    <li key={ai} className="text-sm text-text-muted flex items-center gap-1.5 before:content-['•'] before:text-border-dark">
                      <EditableText
                        editMode={editMode}
                        value={a}
                        onChange={(v) => update((d) => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, achievements: e.achievements.map((x, k) => k === ai ? v : x) } : e) }))}
                        className="flex-1"
                        inputClass="flex-1"
                      />
                      {editMode && (
                        <DeleteBtn small onClick={() => update((d) => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, achievements: e.achievements.filter((_, k) => k !== ai) } : e) }))} />
                      )}
                    </li>
                  ))}
                  {editMode && (
                    <AddBtn
                      label="성과 추가"
                      onClick={() => update((d) => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, achievements: [...e.achievements, ''] } : e) }))}
                    />
                  )}
                </ul>
              </div>
            ))}
          </Section>

          <Section
            title="Internships"
            onAdd={editMode ? () => update((d) => ({ ...d, internships: [...d.internships, { organization: '', position: '', duration: '', description: '' } as InternshipEntry] })) : undefined}
          >
            {internships.map((intern, i) => (
              <div key={i} className="border-l-2 border-border pl-4 py-1 relative">
                {editMode && (
                  <div className="absolute right-0 top-0">
                    <DeleteBtn onClick={() => update((d) => ({ ...d, internships: d.internships.filter((_, j) => j !== i) }))} />
                  </div>
                )}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <EditableText
                      editMode={editMode}
                      value={intern.organization}
                      onChange={(v) => update((d) => ({ ...d, internships: d.internships.map((x, j) => j === i ? { ...x, organization: v } : x) }))}
                      className="font-semibold text-primary text-base"
                      inputClass="font-semibold text-primary text-base w-full"
                    />
                    <EditableText
                      editMode={editMode}
                      value={intern.position}
                      onChange={(v) => update((d) => ({ ...d, internships: d.internships.map((x, j) => j === i ? { ...x, position: v } : x) }))}
                      className="text-sm text-text-light mt-0.5"
                      inputClass="text-sm text-text-light w-full mt-0.5"
                    />
                  </div>
                  <EditableText
                    editMode={editMode}
                    value={intern.duration}
                    onChange={(v) => update((d) => ({ ...d, internships: d.internships.map((x, j) => j === i ? { ...x, duration: v } : x) }))}
                    className="text-sm text-text-light shrink-0 mt-0.5"
                    inputClass="text-sm text-text-light shrink-0 mt-0.5 w-40"
                  />
                </div>
                <EditableText
                  editMode={editMode}
                  value={intern.description}
                  onChange={(v) => update((d) => ({ ...d, internships: d.internships.map((x, j) => j === i ? { ...x, description: v } : x) }))}
                  className="text-sm text-text-muted mt-1"
                  inputClass="text-sm text-text-muted mt-1 w-full"
                />
              </div>
            ))}
          </Section>

          <Section title="Projects">
            <ProjectGroup
              label="Master"
              accent="text-accent-research"
              items={projects.master}
              editMode={editMode}
              onChange={(items) => update((d) => ({ ...d, projects: { ...d.projects, master: items } }))}
              placeholderText="Coming soon"
            />
            <ProjectGroup
              label="Undergraduate"
              accent="text-accent-industry"
              items={projects.undergraduate}
              editMode={editMode}
              onChange={(items) => update((d) => ({ ...d, projects: { ...d.projects, undergraduate: items } }))}
            />
          </Section>

          <DatedListSection
            title="Awards"
            items={awards}
            editMode={editMode}
            onChange={(items) => update((d) => ({ ...d, awards: items }))}
          />
          <DatedListSection
            title="Scholarships / Honors"
            items={scholarships}
            editMode={editMode}
            onChange={(items) => update((d) => ({ ...d, scholarships: items }))}
          />
          <DatedListSection
            title="Certifications"
            items={certifications}
            editMode={editMode}
            onChange={(items) => update((d) => ({ ...d, certifications: items }))}
          />

          <Section
            title="Extracurricular"
            onAdd={editMode ? () => update((d) => ({ ...d, extracurricular: [...d.extracurricular, ''] })) : undefined}
          >
            <ul className="space-y-1">
              {extracurricular.map((item, i) => (
                <li key={i} className="text-sm text-text-muted flex items-center gap-2 before:content-['•'] before:text-border-dark">
                  <EditableText
                    editMode={editMode}
                    value={item}
                    onChange={(v) => update((d) => ({ ...d, extracurricular: d.extracurricular.map((x, j) => j === i ? v : x) }))}
                    className="flex-1"
                    inputClass="flex-1"
                  />
                  {editMode && (
                    <DeleteBtn small onClick={() => update((d) => ({ ...d, extracurricular: d.extracurricular.filter((_, j) => j !== i) }))} />
                  )}
                </li>
              ))}
            </ul>
          </Section>
        </main>
      </div>

      <footer
        onDoubleClick={handleFooterDblClick}
        className={`text-center text-sm mt-8 print:block select-none cursor-default transition-colors ${
          editMode ? 'text-accent-industry font-semibold' : 'text-text-light'
        }`}
      >
        {editMode ? '✎ 편집 모드' : 'Updated CV. Contact and links verified.'}
      </footer>

      {editMode && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-white rounded-full shadow-float border border-border px-3 py-2 z-50">
          {dirty && <span className="text-xs text-orange-500 font-medium">● 저장 안 됨</span>}
          <button
            onClick={revert}
            disabled={!dirty}
            title="되돌리기"
            className="p-1.5 text-text-muted hover:text-primary disabled:opacity-30 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-full hover:bg-primary-light disabled:opacity-40 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      )}
    </div>
  )
}

function Section({ title, children, onAdd }: { title: string; children: React.ReactNode; onAdd?: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
        <h2 className="text-lg font-bold text-primary">{title}</h2>
        {onAdd && <AddBtn label="추가" onClick={onAdd} inline />}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function ProjectGroup({ label, accent, items, editMode, onChange, placeholderText }: {
  label: string
  accent: string
  items: ProjectEntry[]
  editMode: boolean
  onChange: (items: ProjectEntry[]) => void
  placeholderText?: string
}) {
  return (
    <div className={label === 'Master' ? 'mb-3' : ''}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-bold ${accent} uppercase tracking-wider`}>{label}</h3>
        {editMode && (
          <AddBtn label="추가" onClick={() => onChange([...items, { title: '', period: '' }])} inline />
        )}
      </div>
      {items.length === 0 && !editMode && placeholderText ? (
        <p className="text-sm text-text-light italic">{placeholderText}</p>
      ) : (
        items.map((p, i) => (
          <div key={i} className="flex justify-between items-center py-1.5 border-b border-border last:border-0 group">
            <EditableText
              editMode={editMode}
              value={p.title}
              onChange={(v) => onChange(items.map((x, j) => j === i ? { ...x, title: v } : x))}
              className="text-sm text-text-muted flex-1"
              inputClass="text-sm text-text-muted flex-1"
            />
            <div className="flex items-center gap-1 ml-2">
              <EditableText
                editMode={editMode}
                value={p.period}
                onChange={(v) => onChange(items.map((x, j) => j === i ? { ...x, period: v } : x))}
                className="text-sm text-text-light shrink-0"
                inputClass="text-sm text-text-light shrink-0 w-32"
              />
              {editMode && <DeleteBtn small onClick={() => onChange(items.filter((_, j) => j !== i))} />}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function DatedListSection({ title, items, editMode, onChange }: {
  title: string
  items: DatedEntry[]
  editMode: boolean
  onChange: (items: DatedEntry[]) => void
}) {
  return (
    <Section
      title={title}
      onAdd={editMode ? () => onChange([...items, { date: '', title: '' }]) : undefined}
    >
      {items.map((it, i) => (
        <div key={i} className="flex gap-4 items-start group">
          <EditableText
            editMode={editMode}
            value={it.date}
            onChange={(v) => onChange(items.map((x, j) => j === i ? { ...x, date: v } : x))}
            className="text-sm text-text-light shrink-0 w-14"
            inputClass="text-sm text-text-light shrink-0 w-16"
          />
          <EditableText
            editMode={editMode}
            value={it.title}
            onChange={(v) => onChange(items.map((x, j) => j === i ? { ...x, title: v } : x))}
            className="text-sm text-text-muted flex-1"
            inputClass="text-sm text-text-muted flex-1"
          />
          {editMode && <DeleteBtn small onClick={() => onChange(items.filter((_, j) => j !== i))} />}
        </div>
      ))}
    </Section>
  )
}

function EditableText({ editMode, value, onChange, className, inputClass, placeholder }: {
  editMode: boolean
  value: string
  onChange: (v: string) => void
  className?: string
  inputClass?: string
  placeholder?: string
}) {
  if (!editMode) return <span className={className}>{value}</span>
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputClass ?? className ?? ''} border border-dashed border-primary/40 rounded px-1 outline-none focus:border-primary bg-transparent`}
    />
  )
}

function AddBtn({ label, onClick, inline }: { label: string; onClick: () => void; inline?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-xs text-accent-industry hover:underline ${inline ? '' : 'mt-1'}`}
    >
      <Plus className="w-3 h-3" /> {label}
    </button>
  )
}

function DeleteBtn({ onClick, small }: { onClick: () => void; small?: boolean }) {
  const Icon = small ? X : Trash2
  return (
    <button
      onClick={onClick}
      className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
      title="삭제"
    >
      <Icon className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    </button>
  )
}
