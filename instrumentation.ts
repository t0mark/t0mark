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

    console.log('[Cron] 인턴/산학장학생 공고 수집 스케줄 등록 완료 (매일 02:00 / 03:00)')
  }
}
