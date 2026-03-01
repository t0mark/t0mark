'use client'

import dynamic from 'next/dynamic'

const NetworkGraph = dynamic(() => import('@/components/home/NetworkGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full">
      <div className="loading-spinner" />
    </div>
  ),
})

export default function PostsPage() {
  return (
    <main className="mx-auto max-w-main h-[calc(100vh-64px)] flex items-center justify-center px-8">
      <NetworkGraph />
    </main>
  )
}
