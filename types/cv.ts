export interface EducationEntry {
  institution: string
  degrees: string[]
  lab?: string
  duration: string
  achievements: string[]
}

export interface InternshipEntry {
  organization: string
  position: string
  duration: string
  description: string
}

export interface ProjectEntry {
  title: string
  period: string
}

export interface DatedEntry {
  date: string
  title: string
}

export interface LinkEntry {
  icon: string
  label: string
  href: string
}

export interface CVData {
  name: string
  role: string
  contact: {
    phone: string
    email: string
    location: string
  }
  links: LinkEntry[]
  skills: string[]
  education: EducationEntry[]
  internships: InternshipEntry[]
  projects: {
    master: ProjectEntry[]
    undergraduate: ProjectEntry[]
  }
  awards: DatedEntry[]
  scholarships: DatedEntry[]
  certifications: DatedEntry[]
  extracurricular: string[]
}
