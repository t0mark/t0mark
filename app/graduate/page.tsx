import type { Metadata } from 'next'
import GraduateClient from '@/components/graduate/GraduateClient'

export const metadata: Metadata = { title: 'Graduate' }

export default function GraduatePage() {
  return <GraduateClient />
}
