export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron')
    const { execFile } = await import('child_process')
    const path = await import('path')

    // 매일 새벽 2시 인턴 공고 자동 수집
    cron.schedule('0 2 * * *', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'fetch-interns.js')
      execFile('node', [scriptPath], { cwd: process.cwd() }, (err) => {
        if (err) console.error('[Cron] fetch-interns 실패:', err.message)
        else console.log('[Cron] fetch-interns 완료')
      })
    })

    // 매일 새벽 3시 산학장학생 공고 자동 수집
    cron.schedule('0 3 * * *', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'fetch-scholarships.js')
      execFile('node', [scriptPath], { cwd: process.cwd() }, (err) => {
        if (err) console.error('[Cron] fetch-scholarships 실패:', err.message)
        else console.log('[Cron] fetch-scholarships 완료')
      })
    })

    // 매일 새벽 4시 연구 동향 자동 수집 (arXiv + Semantic Scholar + RSS)
    cron.schedule('0 4 * * *', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'fetch-trends.js')
      execFile('node', [scriptPath], { cwd: process.cwd(), maxBuffer: 20 * 1024 * 1024 }, (err) => {
        if (err) console.error('[Cron] fetch-trends 실패:', err.message)
        else console.log('[Cron] fetch-trends 완료')
      })
    })

    console.log('[Cron] 인턴/산학장학생/연구동향 수집 스케줄 등록 완료 (매일 02:00 / 03:00 / 04:00)')

    // 서버 시작 시와 5분마다 Claude 사용량을 미리 조회해 캐시 유지
    const { refreshClaudeUsage } = await import('./lib/claude-usage/fetcher')
    const refreshClaudeUsageCache = () => {
      refreshClaudeUsage().catch((err) => console.error('[Cron] Claude 사용량 갱신 실패:', err))
    }
    refreshClaudeUsageCache()
    cron.schedule('*/5 * * * *', refreshClaudeUsageCache)
    console.log('[Cron] Claude 사용량 갱신 등록 (5분마다)')

    // 세미나 논문 자동 동기화 (설정된 요일/시간에 실행)
    const { registerSeminarCron } = await import('./lib/seminar/cron')
    await registerSeminarCron()

    // 창조2관 방문 신청 (매일 설정 시간에 실행, 다음 날이 평일일 때만 신청)
    const { registerChangjoCron } = await import('./lib/changjo/cron')
    await registerChangjoCron()
  }
}
