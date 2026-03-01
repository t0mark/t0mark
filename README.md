
[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=safari&logoColor=white)](https://t0mark.github.io/t0mark)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/%ED%98%84%EC%9B%85-%EC%96%91-531931339/)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:iwagoho@gmail.com)

# t0mark — Personal Portfolio

AI Robotics Engineer 양현웅의 개인 포트폴리오 웹사이트입니다.

## Tech Stack

- **Framework** — Next.js 15 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS
- **Deployment** — Vercel

## Pages

| Route | Description |
|-------|-------------|
| `/` | 전공 지식 네트워크 그래프 (vis-network) |
| `/cv` | 이력서 (학력 · 인턴십 · 프로젝트 · 수상 · 자격증) |
| `/calendar` | Google Calendar + D-DAY · Tasks · TODO |
| `/graduate` | 대학원 정보 (연구 분야 · 동향 · 학회 · 학습 가이드) |
| `/ml` | Machine Learning 분류 체계 인터랙티브 인포그래픽 |
| `/posts` | Coming Soon |
| `/projects` | Coming Soon |

## API Routes

| Endpoint | Description |
|----------|-------------|
| `GET /api/calendar` | `data/calendar-data.yaml` → JSON |
| `GET /api/graduate/hardware` | `data/graduate/hardware.json` |
| `GET /api/graduate/campus` | `data/graduate/campus-buildings.json` |

## Getting Started

```bash
npm install
npm run dev
npm run dev -- -H 0.0.0.0
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
t0mark/
├── app/                  # Next.js App Router pages & API routes
├── components/           # React components
│   ├── layout/           # Navbar
│   ├── home/             # NetworkGraph (vis-network)
│   ├── calendar/         # D-DAY, Tasks, Progress, TODO
│   └── graduate/         # 탭 컴포넌트 + HardwarePanel + CampusMap
├── data/                 # YAML / JSON 데이터
├── public/images/        # 정적 이미지 에셋
├── types/                # TypeScript 타입 정의
└── docs/                 # 기존 Vanilla HTML 소스 (참조용)
```
