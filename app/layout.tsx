import type { Metadata } from 'next'
import './globals.css'
import ConditionalNavbar from '@/components/layout/ConditionalNavbar'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Hyeonung Yang – AI Robotics Engineer Portfolio',
  icons: { icon: '/images/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ConditionalNavbar />
        {children}
      </body>
    </html>
  )
}
