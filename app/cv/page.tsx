import Image from 'next/image'
import { Phone, Mail, MapPin, Linkedin, Github, Trophy, BookOpen } from 'lucide-react'
import { cvData } from '@/data/cv'

export const metadata = { title: 'CV – Hyeonung Yang' }

export default function CVPage() {
  const { name, role, contact, links, skills, education, internships, projects, awards, scholarships, certifications, extracurricular } = cvData

  return (
    <div className="min-h-screen bg-bg-light py-8 px-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
        {/* ===== 사이드바 ===== */}
        <aside className="w-full md:w-72 shrink-0 flex flex-col gap-5">
          {/* 프로필 */}
          <div className="bg-white rounded-2xl p-6 shadow-card text-center">
            <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden border-4 border-border">
              <Image src="/images/profile.png" alt={name} width={96} height={96} className="object-cover" />
            </div>
            <h1 className="text-lg font-bold text-primary">{name}</h1>
            <p className="text-sm text-text-light mt-1">{role}</p>
          </div>

          {/* 연락처 */}
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h2 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Contact
            </h2>
            <ul className="space-y-2 text-xs text-text-muted">
              <li className="flex items-center gap-2"><Phone className="w-3 h-3 shrink-0" />{contact.phone}</li>
              <li className="flex items-center gap-2"><Mail className="w-3 h-3 shrink-0" />{contact.email}</li>
              <li className="flex items-center gap-2"><MapPin className="w-3 h-3 shrink-0" />{contact.location}</li>
            </ul>
          </div>

          {/* 링크 */}
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h2 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Links
            </h2>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href} className="flex items-center gap-2 text-xs">
                  {link.icon === 'linkedin' && <Linkedin className="w-3 h-3 text-[#0077B5]" />}
                  {link.icon === 'github' && <Github className="w-3 h-3 text-gray-700" />}
                  {link.icon === 'solved' && <Trophy className="w-3 h-3 text-orange-400" />}
                  <a href={link.href} target="_blank" rel="noreferrer" className="text-accent-industry hover:underline">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 스킬 */}
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h2 className="text-sm font-bold text-primary mb-3">🛠️ Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span key={skill} className="bg-bg-light text-primary text-xs font-medium px-2.5 py-1 rounded-full border border-border">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* ===== 메인 콘텐츠 ===== */}
        <main className="flex-1 flex flex-col gap-6">
          {/* Education */}
          <Section title="Education">
            {education.map((edu, i) => (
              <div key={i} className="border-l-2 border-border pl-4 py-1">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-primary text-sm">{edu.institution}</h3>
                    {'degree' in edu ? (
                      <>
                        <p className="text-xs text-text-light mt-0.5">{edu.degree}</p>
                        {'lab' in edu && edu.lab && (
                          <p className="text-xs text-text-muted mt-0.5">{edu.lab}</p>
                        )}
                      </>
                    ) : (
                      edu.degrees?.map((d) => <p key={d} className="text-xs text-text-light mt-0.5">{d}</p>)
                    )}
                  </div>
                  <span className="text-xs text-text-light shrink-0 mt-0.5">{edu.duration}</span>
                </div>
                {edu.achievements.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {edu.achievements.map((a) => (
                      <li key={a} className="text-xs text-text-muted flex items-center gap-1.5 before:content-['•'] before:text-border-dark">{a}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>

          {/* Internships */}
          <Section title="Internships">
            {internships.map((intern, i) => (
              <div key={i} className="border-l-2 border-border pl-4 py-1">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-primary text-sm">{intern.organization}</h3>
                    <p className="text-xs text-text-light mt-0.5">{intern.position}</p>
                  </div>
                  <span className="text-xs text-text-light shrink-0 mt-0.5">{intern.duration}</span>
                </div>
                <p className="text-xs text-text-muted mt-1">{intern.description}</p>
              </div>
            ))}
          </Section>

          {/* Projects */}
          <Section title="Projects">
            <div className="mb-3">
              <h3 className="text-xs font-bold text-accent-research uppercase tracking-wider mb-2">Master</h3>
              {projects.master.length === 0 ? (
                <p className="text-xs text-text-light italic">Coming soon</p>
              ) : (
                projects.master.map((p) => <ProjectRow key={p.title} {...p} />)
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold text-accent-industry uppercase tracking-wider mb-2">Undergraduate</h3>
              {projects.undergraduate.map((p) => <ProjectRow key={p.title} {...p} />)}
            </div>
          </Section>

          {/* Awards */}
          <Section title="Awards">
            {awards.map((a) => (
              <div key={`${a.date}-${a.title}`} className="flex gap-4 items-start">
                <span className="text-xs text-text-light shrink-0 w-14">{a.date}</span>
                <span className="text-xs text-text-muted">{a.title}</span>
              </div>
            ))}
          </Section>

          {/* Scholarships / Honors */}
          <Section title="Scholarships / Honors">
            {scholarships.map((s) => (
              <div key={`${s.date}-${s.title}`} className="flex gap-4 items-start">
                <span className="text-xs text-text-light shrink-0 w-14">{s.date}</span>
                <span className="text-xs text-text-muted">{s.title}</span>
              </div>
            ))}
          </Section>

          {/* Certifications */}
          <Section title="Certifications">
            {certifications.map((c) => (
              <div key={`${c.date}-${c.title}`} className="flex gap-4 items-start">
                <span className="text-xs text-text-light shrink-0 w-14">{c.date}</span>
                <span className="text-xs text-text-muted">{c.title}</span>
              </div>
            ))}
          </Section>

          {/* Extracurricular */}
          <Section title="Extracurricular">
            <ul className="space-y-1">
              {extracurricular.map((item) => (
                <li key={item} className="text-xs text-text-muted flex items-center gap-2 before:content-['•'] before:text-border-dark">{item}</li>
              ))}
            </ul>
          </Section>
        </main>
      </div>

      <footer className="text-center text-xs text-text-light mt-8 print:block">
        Updated CV. Contact and links verified.
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card">
      <h2 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function ProjectRow({ title, period }: { title: string; period: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-text-muted">{title}</span>
      <span className="text-xs text-text-light shrink-0 ml-2">{period}</span>
    </div>
  )
}
