# SEQRET FE

고객, 이사업체, 현장 작업자가 이사 작업 범위와 변경·완료 기록을 함께 확인하는 반응형 웹·PWA입니다. 프론트엔드는 정적 Vite 앱으로 배포하며 FastAPI 백엔드와 직접 통신합니다.

## 현재 상태

역할별 핵심 화면과 데모 상호작용을 구현한 UI 프로토타입입니다. 화면 데이터는 대부분 예시 값이며, 공통 API 클라이언트만 준비된 상태라 인증·저장·AI 분석·업로드·버전 잠금의 실제 백엔드 연동은 완료되지 않았습니다.

제품 범위와 수락 기준은 [PRD v2](docs/prd-v2.md)에서 확인합니다.

## 기술 구성

- React 19 + TypeScript
- Vite 8
- React Router 7
- TanStack Query 5
- Tailwind CSS 4
- Base UI
- vite-plugin-pwa
- pnpm 11

## 로컬 실행

### 요구 사항

- Node.js `20.19+` 또는 `22.12+`
- pnpm `11+`

### 설치 및 실행

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

기본 개발 서버는 `http://localhost:5173`에서 실행됩니다.

`.env.local`에서 FastAPI 주소를 지정합니다.

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

브라우저에 공개되는 Vite 환경변수이므로 비밀키나 서비스 계정 키를 넣으면 안 됩니다.

## 주요 명령어

| 명령어 | 용도 |
|---|---|
| `pnpm dev` | Vite 개발 서버 실행 |
| `pnpm typecheck` | TypeScript 프로젝트 검사 |
| `pnpm lint` | ESLint 검사 |
| `pnpm test:unit` | 개발용 signed upload proxy 보안 회귀 검사 |
| `pnpm test:e2e` | Chromium 주요 사용자 흐름 검사 |
| `pnpm build` | 타입 검사 후 정적 프로덕션 빌드 생성 |
| `pnpm preview` | `dist/` 빌드 결과 로컬 미리보기 |

## 라우트

| 경로 | 화면 |
|---|---|
| `/` | 역할 선택 화면 |
| `/consumer` | 소비자 모바일 플로우 |
| `/consumer/capture` | 소비자 촬영 플로우 |
| `/provider` | 이사업체 데스크톱 화면으로 이동 |
| `/provider/web` | 이사업체 데스크톱 플로우 |
| `/crew` | 현장 작업자 모바일 플로우 |
| `/design-system` | 디자인 시스템 검수 화면 |

## 프로젝트 구조

```text
src/
├─ main.tsx                         # 브라우저 진입점
├─ app/
│  ├─ router.tsx                   # 라우트와 페이지 단위 코드 분할
│  ├─ providers.tsx                # 전역 Provider
│  └─ styles.css                   # Tailwind 및 전역 토큰
├─ pages/                           # URL 단위 화면 조합
│  ├─ consumer/
│  ├─ provider/
│  ├─ crew/
│  └─ not-found/
├─ features/                       # 역할별 업무 규칙과 화면
├─ api/
│  └─ client.ts                    # FastAPI 공통 요청 클라이언트
├─ components/
│  ├─ layout/                      # 공통 레이아웃
│  └─ ui/                          # 재사용 UI 컴포넌트
├─ lib/                             # 범용 유틸리티
└─ pwa/
   └─ register-service-worker.ts   # 서비스 워커 등록
```

새 기능은 URL 조합이면 `pages`, 업무 규칙과 상호작용이면 `features`, 여러 기능에서 재사용하는 표현 컴포넌트면 `components`에 둡니다. OpenAPI 생성 코드를 도입하면 `src/api/generated/` 아래에 생성하고 직접 수정하지 않습니다.

## PWA와 배포

`pnpm build`는 `dist/`에 정적 앱, 웹 앱 매니페스트, 서비스 워커를 생성합니다. `vercel.json`은 React Router의 직접 URL 접근을 `index.html`로 연결합니다.

Vercel 설정값:

- Build Command: `pnpm build`
- Output Directory: `dist`
- Environment Variable: `VITE_API_BASE_URL`

배포 전 다음 검사를 모두 통과해야 합니다.

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
```
