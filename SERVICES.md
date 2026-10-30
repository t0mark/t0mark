# t0mark 서버 서비스 현황

2026-10-31 기준

## 한눈에 보기

| 서비스 | 실행 방식 | 주기 / 포트 | 상태 |
|---|---|---|---|
| t0mark 웹 서버 (Next.js) | pm2 | 포트 5000 | 실행 중 |
| 인턴 공고 수집 | 웹 서버 내부 cron | 매일 02:00 | 활성 |
| 산학장학생 공고 수집 | 웹 서버 내부 cron | 매일 03:00 | 활성 |
| 연구 동향 수집 | 웹 서버 내부 cron | 매일 04:00 | 활성 |
| 세미나 논문 동기화 | 웹 서버 내부 cron | 매주 금요일 13:00 | 활성 |
| 창조2관 방문 신청 | 웹 서버 내부 cron | 매일 18:00 (설정값) | **비활성** |
| Claude 사용량 조회 | 페이지 접속 시 CLI 실행 | 5분 캐시 | 활성, 자동 갱신 미확인 |

예약 작업은 전부 웹 서버 프로세스 안에서 돌아갑니다. **웹 서버가 꺼지면 예약 작업도 멈춥니다.** 시스템 crontab은 비어 있습니다.

## 서버 환경

| 항목 | 값 |
|---|---|
| 호스트 | tomark (aarch64, Raspberry Pi 커널) |
| OS | Debian 13 (trixie) |
| Node.js | v20.20.0 |
| 메모리 | 7.9GB |
| 디스크 | 15GB, 97% 사용, 여유 약 520MB |
| 내부 IP | 192.168.0.21 |

## 웹 서버

- pm2 앱 이름: `t0mark`
- 실행 명령: `npm run start -- -H 0.0.0.0 -p 5000`
- 작업 폴더: `~/t0mark`
- 부팅 시 자동 시작: `pm2-tomark` 서비스 활성화됨
- 로그 위치: `~/.pm2/logs/`
- 인증: 없음. 포트 5000으로 접속하면 누구나 볼 수 있습니다.

```bash
pm2 list                            # 상태 확인
pm2 logs t0mark --lines 50          # 로그 확인
pm2 restart t0mark --update-env     # 재시작
```

### 배포 순서

1. `df -h /`로 디스크 여유를 확인합니다. 이번 빌드는 약 800MB를 사용했습니다.
2. `npm run build`를 실행합니다.
3. `pm2 restart t0mark --update-env`를 실행합니다.

빌드는 시작할 때 기존 산출물을 지웁니다. 실패하면 서버가 메모리로 응답은 해도 재시작하면 뜨지 않을 수 있으니, 다시 빌드에 성공할 때까지 재시작하지 마세요.

## 예약 작업

등록 위치는 `instrumentation.ts`입니다. 서버가 시작될 때 등록되고 로그는 `[Cron]`으로 시작합니다.

| 작업 | 실행 내용 | 저장 위치 | 설정 |
|---|---|---|---|
| 인턴 공고 | `scripts/fetch-interns.js` | `data/interns.json` | 코드 고정 |
| 산학장학생 공고 | `scripts/fetch-scholarships.js` | `data/scholarships.json` | 코드 고정 |
| 연구 동향 | `scripts/fetch-trends.js` | `data/robotics_trends.json` | 코드 고정 |
| 세미나 동기화 | `lib/seminar/` | Google Sheets·Slides 연동 | `data/seminar-schedule.json` |
| 창조2관 신청 | `lib/changjo/`, `tools/changjo-visit.js` | `data/changjo-applicants.json` | `data/changjo-schedule.json` (`enabled: false`) |

수동 실행:

```bash
npm run fetch-interns
npm run fetch-scholarships
npm run fetch-trends
```

## Claude 사용량 카드

홈 화면 D-DAY 아래에 계정별 5시간·7일 사용률을 표시합니다. `xl` 미만 화면에서는 보이지 않습니다.

### 동작 방식

```
홈 화면 → /api/claude-usage → 공식 CLI `claude -p /usage` (계정별) → 문구 해석 → 카드 표시
```

- 조회는 모델을 호출하지 않아 사용량을 소모하지 않습니다.
- 서버는 토큰을 직접 다루지 않습니다. 로그인 정보는 CLI가 관리합니다.
- 결과는 5분간 캐시합니다. 캐시가 지난 뒤 첫 조회는 약 8초 걸립니다.
- 페이지가 열려 있으면 5분마다 다시 조회합니다. 아무도 접속하지 않으면 조회도 실행되지 않습니다.

### 계정

| 계정 (폴더 이름) | 플랜 |
|---|---|
| a96536009 | Pro |
| iwagoho | Pro |
| tomark | Pro |
| woong5297 | Team |

- 로그인 폴더: `~/.claude-usage/<계정>/`. 폴더가 곧 카드에 표시되는 계정 목록입니다.
- 계정 제외: 해당 폴더를 삭제합니다.
- CLI 경로: `.env.local`의 `CLAUDE_CLI_PATH`, VS Code 확장의 최신 버전, PATH의 `claude` 순서로 찾습니다.

### 계정 추가·재로그인

```bash
CLAUDE=~/.vscode-server/extensions/anthropic.claude-code-2.1.314-linux-arm64/resources/native-binary/claude
CLAUDE_CONFIG_DIR=~/.claude-usage/<계정> "$CLAUDE" auth login
```

확장 버전이 바뀌면 경로의 `2.1.314`도 바꿔야 합니다. `claude setup-token`으로 만든 토큰은 사용량 조회 권한이 없어 쓸 수 없습니다.

### 토큰 갱신

| 토큰 | 유효 기간 |
|---|---|
| 액세스 토큰 | 약 8시간 |
| 리프레시 토큰 | 약 27~29일 (2026-10-31 기준 잔여) |

액세스 토큰은 만료되면 CLI가 리프레시 토큰으로 갱신하는 것으로 예상합니다. **실제 만료 후 갱신은 아직 확인되지 않았습니다.** 2026-10-31 오전 9시 50분 이후에도 값이 정상으로 나오면 확인된 것입니다.

리프레시 토큰이 갱신 때 연장되는지도 미확인입니다. 연장되지 않으면 약 한 달마다 재로그인이 필요합니다.

### 오류 표시

| 카드 문구 | 의미 | 조치 |
|---|---|---|
| `조회 실패 (로그인 확인 필요)` | 로그인 만료이거나 CLI 문구가 바뀜 | 재로그인 후에도 같으면 `lib/claude-usage/fetcher.ts`의 문구 해석 수정 |
| `조회 실패` | CLI 실행 오류 | `pm2 logs t0mark`에서 `[ClaudeUsage]` 확인 |
| `데이터 로드 실패` | API 자체 실패 | `~/.claude-usage/` 폴더 존재 여부와 서버 로그 확인 |

## 외부 연동과 설정

환경변수는 `.env.local`에 있습니다. 항목 목록은 `.env.local.example`을 참고하세요.

| 연동 | 환경변수 |
|---|---|
| OpenAI (GPT 번역·요약) | `OPENAI_API_KEY` |
| Google (세미나) | `GOOGLE_CREDENTIALS_PATH`, `SEMINAR_FOLDER_ID`, `PAPER_LIST_SHEET_ID`, `PAPER_LIST_SHEET_GID` |
| Notion (TODO 동기화) | `NOTION_API_KEY`, `NOTION_TODO_PARENT_PAGE_ID` |
| Claude CLI (선택) | `CLAUDE_CLI_PATH` |

`.env.local`과 `google-credentials.json`은 git에서 제외되어 있습니다.

## 시스템 서비스와 포트

| 포트 | 범위 | 서비스 |
|---|---|---|
| 5000 | 전체 | t0mark 웹 서버 |
| 22 | 전체 | SSH |
| 2222 | 전체 | 미확인 (권한 없이 프로세스 조회 불가) |
| 111 | 전체 | rpcbind |
| 631 | 로컬 | CUPS 프린터 |

- 실행 중인 주요 시스템 서비스: ssh, cron, NetworkManager, cups, avahi-daemon, bluetooth, lightdm, rpcbind
- 리버스 프록시와 터널: nginx, caddy, cloudflared, tailscale, ngrok 모두 실행 중인 프로세스가 없습니다.
- VS Code Remote 서버는 접속 중일 때 로컬 포트를 추가로 사용합니다.

## 운영 주의사항

### 디스크 공간

다음 빌드 전에 공간을 확보하세요. 지금 상태로 빌드하면 실패할 수 있습니다.

| 대상 | 크기 | 비고 |
|---|---|---|
| 사용하지 않는 VS Code 서버 3개 버전 | 약 1.8GB | 필요하면 VS Code가 다시 내려받음 |
| `.next/cache/webpack` | 빌드마다 증가 | 다음 빌드에서 재생성, 빌드만 느려짐 |
| `/var/swap` | 2GB | 현재 스왑은 zram만 사용 중. 삭제 전 스왑 설정 확인 필요 |

```bash
cd ~/.vscode-server/cli/servers && rm -rf Stable-2d0b7506a36c1d6db9a466440131a8e01eab2289 Stable-645f29cc3176500b4b5762ba887cf2a7f0ffdf2c Stable-6d62b1d5dace93a33b3a6d3eca1317bd5e15bcb1
```

### 2026-10-31 빌드 실패 기록

디스크가 가득 차 `ENOSPC`로 빌드가 실패했고 기존 산출물이 지워졌습니다. `.next/cache/webpack`(1.3GB)을 지운 뒤 다시 빌드하고 `pm2 restart`로 복구했습니다.
