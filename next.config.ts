import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Vercel 배포 최적화

  // 라즈베리파이 5(4코어)에서 빌드 워커가 4개 다 붙으면 보드가 리셋된다.
  // 워커를 2개로 묶어 두면 완주한다. 배포 환경에서는 BUILD_CPUS 로 올릴 수 있다.
  experimental: {
    cpus: Number(process.env.BUILD_CPUS ?? 2),
  },
}

export default nextConfig
