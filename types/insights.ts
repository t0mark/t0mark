export interface HardwareItem {
  name: string
  category: string
  image: string
  description: string
  features: string[]
  specs: Record<string, string>
}

export type HardwareData = Record<string, HardwareItem>

export type ImportanceLevel = 'high' | 'medium' | 'low'

export interface SubjectItem {
  name: string
  importance: ImportanceLevel
}

export interface BookItem {
  title: string
  author: string
  image?: string
  badge?: string
  featured?: boolean
}

export interface CourseItem {
  source: string
  title: string
  instructor: string
  badge?: string
  featured?: boolean
}

export interface SkillItem {
  name: string
  detail?: string
  importance: ImportanceLevel
}

export interface PlatformItem {
  name: string
  desc?: string
  featured?: boolean
}

export interface SimItem {
  name: string
  popular?: boolean
}

export interface NoticeItem {
  type: 'notice'
  text: string
}

export type SectionItem = SubjectItem | BookItem | CourseItem | SkillItem | PlatformItem | SimItem

export interface BuildingSection {
  type: 'subjects' | 'books' | 'courses' | 'skills' | 'platforms' | 'sims' | 'notice'
  title?: string
  items?: SectionItem[]
  text?: string
}

export interface CampusBuilding {
  title: string
  sections: BuildingSection[]
}

export type CampusData = Record<string, CampusBuilding>

export type HardwareCategory = 'platforms' | 'computing' | 'sensors' | 'actuators'

export interface CategoryInfo {
  title: string
  badge: string
  badgeColor: string
}
