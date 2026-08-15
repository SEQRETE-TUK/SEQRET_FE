# SEQRET 기술 스택

사용 기술, 책임과 기준 원본을 정의한다. 시스템 간 관계와 데이터 흐름은 [아키텍처](architecture.md)를 따른다.

## 상태 표기

| 상태 | 의미 |
| --- | --- |
| 사용 중 | 현재 저장소 또는 백엔드 `main`에 구현되어 있다. |
| 기반만 있음 | 공통 설정·client는 있으나 실제 제품 흐름과 연동되지 않았다. |
| 배포 검증 | staging에서 실제 provider 경로가 검증됐다. |
| 목표 | 설계에는 포함되지만 활성화 또는 E2E 검증이 남았다. |
| 조건부 | 제품 범위나 운영 필요가 확정될 때만 사용한다. |

## Frontend

버전의 단일 원본은 루트 `package.json`과 `pnpm-lock.yaml`이다. 이 문서는 역할과 선택 이유를 설명하며 패치 버전을 중복 관리하지 않는다.

| 영역 | 기술 | 현재 기준 | 상태 | 역할·선정 이유 |
| --- | --- | --- | --- | --- |
| Language | TypeScript | 5.x | 사용 중 | 역할별 상태와 API 계약을 정적으로 검증한다. |
| UI runtime | React | 19.2.4 | 사용 중 | 역할별 화면과 재사용 가능한 UI를 component로 구성한다. |
| Build | Vite | 8.2.1 | 사용 중 | 빠른 개발 서버와 정적 build를 제공한다. |
| Routing | React Router | 7.18.2 | 사용 중 | 소비자, 업체 mobile·web, 현장기사 route를 lazy loading한다. |
| Server state | TanStack Query | 5.101.4 | 기반만 있음 | API cache, retry, stale 정책과 mutation 상태를 관리한다. |
| Styling | Tailwind CSS | 4.3.3 | 사용 중 | token 기반 utility styling과 responsive layout을 구성한다. |
| Headless UI | Base UI | 1.7.0 | 사용 중 | 접근 가능한 Button·Dialog 기반 primitive를 제공한다. |
| Variant | CVA | 0.7.1 | 사용 중 | Button과 Badge variant를 타입 안전하게 관리한다. |
| Icon | Lucide React | 1.14.0 | 사용 중 | 일관된 선형 icon을 제공한다. |
| Font | Pretendard | 5.2.5 | 사용 중 | 한국어 UI 가독성을 제공한다. |
| PWA | vite-plugin-pwa, Workbox | 1.3.0, 7.4.1 | 기반만 있음 | 설치형 shell과 service worker 갱신을 지원한다. 서버 상태·비밀값은 cache하지 않는다. |
| Hosting | Vercel | 별도 배포 설정 | 목표 | preview와 정적 frontend 배포를 제공한다. canonical HTTPS origin 확정이 필요하다. |

### Frontend 기준 파일

| 파일 | 책임 |
| --- | --- |
| `package.json` | 의존성과 실행 script |
| `vite.config.ts` | React, Tailwind, PWA build 설정 |
| `src/app/router.tsx` | route 구성 |
| `src/app/providers.tsx` | TanStack Query 공통 정책 |
| `src/api/client.ts` | HTTP 요청 공통 기반 |
| `src/app/styles.css` | 디자인 token과 global behavior |
| `vercel.json` | SPA hosting rewrite |

## Backend

백엔드 상세 버전과 구현 상태의 단일 원본은 `SEQRETE-TUK/SEQRET_BE`의 `pyproject.toml`, lockfile, 최신 `main` 코드와 OpenAPI다.

| 영역 | 기술 | 상태 | 역할·선정 이유 |
| --- | --- | --- | --- |
| Language | Python 3.13 | 사용 중 | FastAPI·AI ecosystem과 장기 지원 범위를 활용한다. |
| HTTP API | FastAPI | 사용 중 | 비동기 API, dependency 기반 인증과 OpenAPI 생성을 제공한다. |
| Validation | Pydantic | 사용 중 | 요청·응답과 외부 경계 schema를 검증한다. |
| ORM | SQLAlchemy | 사용 중 | domain persistence와 transaction 경계를 관리한다. |
| Migration | Alembic | 사용 중 | 단일 선형 database migration 이력을 관리한다. |
| Database | PostgreSQL / Cloud SQL | 사용 중 | 버전, 승인, 감사와 outbox의 transaction 원본이다. |
| Cache·rate limit | Redis / Memorystore | 사용 중 | cache와 fixed-window rate limit 보조에 사용한다. 원본 데이터는 저장하지 않는다. |
| API runtime | Docker / Cloud Run | 배포 검증 | stateless API container와 revision rollback을 제공한다. |
| Private worker | Cloud Run | 배포 검증 | Cloud Tasks의 인증된 media·AI 작업을 처리한다. |
| Long-running job | Cloud Run Jobs | 사용 중 | 보존 삭제, 정합성 점검과 복구성 작업을 수행한다. |

## Media, AI, Messaging

| 영역 | 기술 | 상태 | 역할·경계 |
| --- | --- | --- | --- |
| Object storage | Google Cloud Storage | 배포 검증 | 비공개 media, generation-pinned read·delete와 signed upload를 제공한다. |
| Task queue | Cloud Tasks | 배포 검증 | retry와 처리율 제한이 필요한 일대일 비동기 command를 전달한다. |
| Event fan-out | Pub/Sub | 조건부·일부 사용 | 하나의 domain event를 여러 consumer가 처리할 때만 사용한다. |
| AI runtime | Vertex AI / Gemini | 사용 중 | 영상·이미지에서 수정 가능한 짐 목록 초안을 생성한다. 가격·책임을 판정하지 않는다. |
| Event reliability | Transactional Outbox | 사용 중 | DB commit과 event 발행 사이의 유실을 방지한다. |
| Schedule | Cloud Scheduler | 배포 검증 | outbox relay와 정기 작업을 실행한다. |

## Infrastructure and Operations

| 영역 | 기술 | 상태 | 역할 |
| --- | --- | --- | --- |
| IaC | Terraform | 사용 중 | staging·운영 resource를 재현 가능하게 관리한다. |
| Edge | Cloud Load Balancing, Cloud Armor | 사용 중 | API의 단일 외부 진입점과 기본 공격 방어를 제공한다. |
| Secret | Secret Manager, Cloud IAM | 사용 중 | 비밀값과 service별 최소 권한을 관리한다. |
| Registry | Artifact Registry | 사용 중 | digest 기반 container artifact를 보관한다. |
| CI/CD | GitHub Actions | 사용 중 | test, migration, Terraform, canary와 promotion을 자동화한다. |
| Logging·Metric | Cloud Logging, Cloud Monitoring | 사용 중 | runtime log, metric과 alert를 수집한다. |
| Telemetry | OpenTelemetry | 사용 중 | application 계측을 provider 중립적으로 유지한다. |

## 선택 원칙

- 제품 상태는 React local state가 아니라 backend transaction 원본에서 가져온다.
- 화면에서 직접 provider SDK를 호출하지 않는다. signed URL upload를 제외한 business 동작은 API를 거친다.
- 핵심 domain code는 GCS, Cloud Tasks, Vertex AI 같은 provider SDK와 직접 결합하지 않고 Port·adapter 경계를 사용한다.
- Cloud Tasks는 command성 일대일 작업, Pub/Sub은 다중 consumer event에만 사용한다.
- Redis, browser cache와 PWA cache는 승인본·감사 이력의 원본이 아니다.
- 새로운 library는 현재 stack으로 해결하기 어려운 문제와 제거 비용을 설명할 수 있을 때만 추가한다.
