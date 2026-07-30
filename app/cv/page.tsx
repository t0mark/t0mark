import { readFileSync } from 'fs'
import { join } from 'path'
import type { CVData } from '@/types/cv'
import CVEditor from '@/components/cv/CVEditor'

export const metadata = { title: 'CV – Hyeonung Yang' }
export const dynamic = 'force-dynamic'

const cvFilePath = join(process.cwd(), 'data', 'cv.json')

export default function CVPage() {
  const cvData = JSON.parse(readFileSync(cvFilePath, 'utf-8')) as CVData
  return <CVEditor initial={cvData} />
}
