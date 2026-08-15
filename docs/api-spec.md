# SEQRET REST API

## 한눈에 보기

| 항목 | 기준 |
| --- | --- |
| 업무 prefix | `/api/v1` |
| 로컬 API | `http://localhost:8000` |
| Frontend 환경변수 | `VITE_API_BASE_URL` |
| 인증 | `Authorization: Bearer <access-link-secret>` |
| 역할 | `customer`, `company_manager`, `field_worker` |
| 실행 계약 | 검증된 backend `main`의 비운영 `/openapi.json` |

이 문서는 endpoint를 빠르게 찾고 frontend 연동 규칙을 이해하기 위한 안내다. 실제 field, required 여부, response schema와 권한은 같은 backend revision의 OpenAPI를 우선한다.

## 베이스 URL

- **로컬 개발:** `http://localhost:8000`
- **Staging:** 배포 환경의 `VITE_API_BASE_URL`
- **Production:** canonical HTTPS endpoint 확정 필요

```bash
VITE_API_BASE_URL=http://localhost:8000
```

업무 요청은 운영 확인 route를 제외하고 `/api/v1` 아래로 보낸다.

## 인증 방식

- **공개** — 인증이 필요하지 않음
- **모든 참여자** — 유효한 `customer`, `company_manager`, `field_worker` 역할 링크
- **소비자·업체** — `customer` 또는 `company_manager`
- **현장기사** — `field_worker`
- **업체** — `company_manager`
- **본인** — 현재 역할 링크의 소유 참여자

```http
Authorization: Bearer <access-link-secret>
Accept: application/json
```

| 역할 | Backend 값 | 주요 행동 |
| --- | --- | --- |
| 소비자 | `customer` | 작업 작성, 범위 확인, 변경 승인·거절 |
| 업체 담당자 | `company_manager` | 범위·금액 제안, 공동확인, 역할 링크 관리 |
| 현장기사 | `field_worker` | 승인본 열람, 현장 차이와 증거 보고 |

access link는 로그인 계정이나 개인 신원 증명이 아니라 한 작업과 역할에 묶인 capability다.

---

## 엔드포인트 목록

아래 목록은 backend `main`의 실행 route를 기능별로 요약한 것이다. 실제 field, 상태 전이와 권한은 연동하는 revision의 OpenAPI를 확인한다.

### 작업과 역할 링크 (`/api/v1/move-jobs`)

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs` | 공개 | 작업과 초기 역할 capability 생성 |
| `GET` | `/api/v1/move-jobs/{job_id}` | 모든 참여자 | 작업·참여자·공간 구성 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/participants/{participant_id}/access-links` | 본인 | 자기 역할 링크 재발급 |
| `POST` | `/api/v1/move-jobs/{job_id}/access-links/{access_link_id}/revoke` | 업체·본인 | 역할 링크 철회 |

`POST /api/v1/move-jobs`는 세 역할의 secret을 한 번만 반환한다. 신뢰할 수 있는 생성 주체와 전달 채널이 정해지기 전에는 일반 사용자 화면에 연결하지 않는다.

---

### 촬영과 미디어

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/{job_id}/capture-sessions` | 모든 참여자 | 촬영 session 생성 |
| `POST` | `/api/v1/move-jobs/{job_id}/capture-sessions/{capture_session_id}/media-assets/upload` | 모든 참여자 | signed upload target 발급 |
| `POST` | `/api/v1/move-jobs/{job_id}/capture-sessions/{capture_session_id}/media-assets/{media_asset_id}/complete` | 모든 참여자 | 업로드 완료 확인과 검증 시작 |

---

### 작업범위와 공동확인

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/{job_id}/scope-versions` | 소비자·업체 | 불변 작업범위 version 생성 |
| `GET` | `/api/v1/move-jobs/{job_id}/scope-versions` | 모든 참여자 | 작업범위 version 이력 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/scope-versions/{scope_version_id}/approvals` | 소비자·업체 | 특정 version 확인 |

---

### 현장 변경

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/{job_id}/change-requests` | 현장기사 | 현장 변경요청 생성 |
| `GET` | `/api/v1/move-jobs/{job_id}/change-requests` | 모든 참여자 | 변경요청 목록 조회 |
| `GET` | `/api/v1/move-jobs/{job_id}/change-requests/{change_request_id}/evidence/{media_asset_id}/read-url` | 소비자·업체 | 검증된 증거의 제한 시간 read URL 발급 |
| `POST` | `/api/v1/move-jobs/{job_id}/change-requests/{change_request_id}/clarification` | 소비자·업체 | 변경 설명 요청 |
| `POST` | `/api/v1/move-jobs/{job_id}/change-requests/{change_request_id}/explanation` | 현장기사 | 현장기사 설명 제출 |
| `POST` | `/api/v1/move-jobs/{job_id}/change-requests/{change_request_id}/decision` | 소비자·업체 | 변경 승인·거절 |

현재 backend는 변경요청 생성·설명을 현장기사에, 증거 열람·설명 요청·결정을 소비자와 업체에 허용한다. PRD의 최종 권한과 다르므로 첫 E2E 연동 전에 제품 권한을 확정하고 backend 계약을 맞춘다.

---

### 완료, 감사와 알림

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/{job_id}/completion-confirmations` | 소비자·업체 | 완료 확인 생성 |
| `GET` | `/api/v1/move-jobs/{job_id}/completion-confirmations` | 모든 참여자 | 완료 확인 이력 조회 |
| `GET` | `/api/v1/move-jobs/{job_id}/audit-events` | 모든 참여자 | 감사 이력 조회 |
| `GET` | `/api/v1/move-jobs/{job_id}/notifications` | 모든 참여자 | 참여자 알림 이력 조회 |

완료 확인, 외부 알림과 PDF는 PRD상 P1이다. route가 존재하더라도 P0 화면에 자동 편입하지 않는다.

---

### 내부 Background Job

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/{job_id}/background-jobs` | 업체 | 보존 삭제 등 background job 생성 |
| `GET` | `/api/v1/move-jobs/{job_id}/background-jobs` | 모든 참여자 | job 상태와 오류 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/background-jobs/{background_job_id}/retry` | 업체 | 실패·lease 만료 job 재실행 |

### 운영 확인

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `GET` | `/healthz` | 공개 | process bootstrap 확인 |
| `GET` | `/readyz` | 공개 | database readiness 확인 |
| `GET` | `/edgez` | 공개 | public edge 경로 확인 |

---

## 공통 요청 규칙

- JSON 요청은 `Content-Type: application/json`을 사용한다.
- field 이름과 값 표현은 OpenAPI를 그대로 따른다.
- frontend가 camelCase와 snake_case를 임의 변환하지 않는다.
- 화면 예시 ID를 실제 작업, version, participant와 변경요청 ID 대신 사용하지 않는다.
- OpenAPI에 없는 header나 query parameter를 임의로 계약처럼 추가하지 않는다.
- 모든 mutation에 공통 `Idempotency-Key`가 확정된 것은 아니다. endpoint별 계약을 확인한다.

## 공통 응답 규칙

- `204 No Content`는 body 없이 성공으로 처리한다.
- secret 또는 signed URL을 포함한 응답은 `Cache-Control: no-store`다.
- 승인본, 확인과 변경 상태는 server 응답을 기준으로 표시한다.
- 민감 응답을 PWA cache, localStorage, sessionStorage, IndexedDB, log와 analytics에 남기지 않는다.

## 오류 처리

현재 공통 오류 body는 FastAPI의 `detail` 형태다.

```json
{
  "detail": "요청을 처리할 수 없습니다."
}
```

| Status | 의미 | Frontend 처리 |
| ---: | --- | --- |
| `400` | 잘못된 요청 또는 업무 조건 | 입력과 복구 행동 안내 |
| `401` | secret 없음·만료·유효하지 않음 | 자동 재시도 중단, 유효한 역할 링크 요청 |
| `403` | 역할 권한 부족 | 역할 경계 안내, 허용되지 않은 CTA 제거 |
| `404` | resource 없음 또는 다른 작업 경계 | 존재 여부를 추측하지 않고 접근 불가 처리 |
| `409` | 최신 version 또는 상태 충돌 | 최신 상태 재조회와 비교·재입력 |
| `422` | schema validation 실패 | field 단위 오류 표시 |
| `429` | 요청 제한 초과 | `Retry-After` 이후 재시도 |
| `5xx` | server 또는 provider 실패 | 기존 입력 보존과 재시도 안내 |

별도 machine error code는 모든 endpoint에 확정돼 있지 않다. frontend는 `detail`을 안전하게 읽되 민감값이 오류 수집 도구로 전달되지 않도록 한다.

---

## 미디어 업로드

### 업로드 흐름

1. capture session을 만든다.
2. media upload target을 요청한다.
3. backend가 `upload_url`과 `upload_headers`를 반환한다.
4. 받은 URL과 header를 수정하지 않고 object storage에 `PUT`한다.
5. upload complete endpoint를 호출한다.
6. backend worker가 object key, MIME type, 크기, generation과 hash를 검증한다.
7. `READY` 또는 `FAILED` 상태를 backend에서 조회한다.

### Signed Target 규칙

- signed URL은 opaque 문자열이다.
- decode, 재직렬화, query 정렬, hostname 변환과 기본 port 제거를 하지 않는다.
- `upload_headers`의 모든 key와 value를 그대로 적용한다.
- 현재 backend가 발급하는 GCS upload에는 `Content-Type`과 `x-goog-if-generation-match: 0`이 모두 포함된다.
- frontend가 upload complete 요청에 object generation을 직접 보내지 않는다.
- signed URL과 header를 cache, log, analytics와 error report에 남기지 않는다.

```json
{
  "media_asset_id": "uuid",
  "upload_url": "https://opaque-signed-target.example/...",
  "upload_headers": {
    "Content-Type": "image/png",
    "x-goog-if-generation-match": "0"
  }
}
```

예시보다 실제 OpenAPI response를 우선한다.

### Browser CORS

- API CORS와 GCS bucket CORS는 별도다.
- 실제 frontend canonical HTTPS origin만 허용한다.
- bucket은 같은 origin과 `PUT`, `Content-Type`, `x-goog-if-generation-match`를 허용해야 한다.
- wildcard origin을 사용하지 않는다.
- 배포 후 browser preflight와 create-only upload를 함께 검증한다.

---

## Frontend 연동 규칙

### Query

- server state는 TanStack Query로 조회한다.
- 민감 응답은 persistence plugin으로 저장하지 않는다.
- `401`, `403`, `404`, `409`, `422`, `429`를 network·5xx와 같이 자동 재시도하지 않는다.
- 승인과 변경 직전에는 최신 version을 다시 검증한다.

### Mutation

- CTA 하나는 하나의 업무 command에 대응한다.
- 제출 중 중복 클릭을 막고 성공 후 관련 query를 무효화한다.
- `409`에서도 사용자의 입력을 보존한다.
- timeout으로 성공 여부가 불명확하면 상태 조회 후 재시도한다.
- 승인본, 금액과 권한에는 낙관적 update를 사용하지 않는다.

### 공통 Client 필수 기능

- memory에 있는 Bearer secret을 명시적으로 전달
- FastAPI `detail` parsing
- `Retry-After` 처리
- signed PUT와 민감값 redaction
- 역할별 query·mutation hook
- request cancel과 timeout 정책
- OpenAPI 기반 type 생성 또는 runtime schema 검증

## 변경 절차

1. PRD에서 제품 행동과 우선순위를 확정한다.
2. Backend 계약에서 path, schema, 역할, 상태 전이, 오류와 멱등성을 정의한다.
3. Backend code와 test를 구현한다.
4. 같은 revision의 OpenAPI에 반영한다.
5. Frontend type과 client를 갱신하고 E2E를 검증한다.

호환성을 깨는 변경은 기존 field 의미를 바꾸지 않고 새 API 또는 schema version으로 추가한다. frontend와 backend가 함께 전환된 뒤 이전 계약을 제거한다.
