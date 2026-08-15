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
| 확인 revision | `397d6f1b8af51a09617684d37b54024004381b12` (2026-08-16 확인) |

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
- **초대 대상** — 아직 수락하지 않은 `pending` 역할 링크. `/me`와 자기 초대 수락·거절만 가능

```http
Authorization: Bearer <access-link-secret>
Accept: application/json
```

| 역할 | Backend 값 | 주요 행동 |
| --- | --- | --- |
| 소비자 | `customer` | 작업 작성, 업체 초대, AI 초안 검수, 범위 확인, 변경·완료 결정 |
| 업체 담당자 | `company_manager` | 범위·금액 제안, 기사 초대, 배차, 현장 변경 견적, 완료 요청 |
| 현장기사 | `field_worker` | 승인본 열람, 체크인, 현장 차이와 증거 보고, 완료 제출 |

access link는 로그인 계정이나 개인 신원 증명이 아니라 한 작업과 역할에 묶인 capability다. 소비자→업체, 수락한 업체→현장기사 순서로 초대하며, 상위 초대를 철회하거나 재발급하면 연결된 하위 초대도 철회된다.

---

## 엔드포인트 목록

아래 목록은 확인 revision의 실제 route를 기능별로 요약한 것이다. 현재 OpenAPI에는 업무 operation 57개와 운영 확인 operation 3개가 있다. 일반 제품 화면은 화면 단위 조회·command를 우선하고, 호환·운영 route는 별도로 구분한다.

### 온보딩과 역할 초대

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/onboarding` | 공개 | 소비자 작업과 소비자 전용 capability 하나 생성 |
| `GET` | `/api/v1/me` | 모든 link | 현재 역할·초대 상태·허용 permission 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/invitations` | 소비자·업체 | 다음 역할 초대와 one-time secret 발급 |
| `GET` | `/api/v1/move-jobs/{job_id}/invitations` | 소비자·업체 | 본인이 발급했거나 받은 초대 목록 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/invitations/{invitation_id}/accept` | 초대 대상 | 대기 중인 초대 수락 |
| `POST` | `/api/v1/move-jobs/{job_id}/invitations/{invitation_id}/decline` | 초대 대상 | 대기 중인 초대 거절과 link 철회 |
| `POST` | `/api/v1/move-jobs/{job_id}/invitations/{invitation_id}/revoke` | 발급자 | 발급한 초대와 연결된 하위 초대 철회 |
| `POST` | `/api/v1/move-jobs/{job_id}/invitations/{invitation_id}/reissue` | 발급자 | 기존 link를 철회하고 초대 재발급 |

초대 상태는 `pending`, `accepted`, `declined`, `expired`, `revoked`다. `pending` link는 `/me`와 자기 초대 수락·거절 외 업무 API를 호출할 수 없다. secret은 한 번만 반환되며 `Cache-Control: no-store`다.

### 작업과 역할 링크 호환 route

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs` | 공개 | 작업과 세 역할의 초기 capability를 함께 생성하는 신뢰 bootstrap |
| `GET` | `/api/v1/move-jobs/{job_id}` | 모든 참여자 | 작업·참여자·공간 구성 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/participants/{participant_id}/access-links` | 본인 | 자기 역할 링크 재발급 |
| `POST` | `/api/v1/move-jobs/{job_id}/access-links/{access_link_id}/revoke` | 업체·본인 | 역할 링크와 위임한 하위 초대 철회 |

일반 사용자 onboarding은 `POST /move-jobs/onboarding`과 invitation 흐름을 사용한다. `POST /move-jobs`는 신뢰할 수 있는 생성 주체와 전달 채널이 필요한 호환 route다.

---

### 촬영, 미디어와 AI 분석

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/{job_id}/capture-sessions` | 모든 참여자 | 참여자 소유 촬영 session 생성 |
| `GET` | `/api/v1/move-jobs/{job_id}/capture-sessions` | 본인 | 본인 촬영 session·미디어·분석 상태 복구 |
| `POST` | `/api/v1/move-jobs/{job_id}/capture-sessions/{capture_session_id}/media-assets/upload` | 본인 | signed upload target 발급 |
| `POST` | `/api/v1/move-jobs/{job_id}/capture-sessions/{capture_session_id}/media-assets/{media_asset_id}/complete` | 본인 | 업로드 완료 확인과 비동기 검증 시작 |
| `POST` | `/api/v1/move-jobs/{job_id}/capture-sessions/{capture_session_id}/submit` | 본인 | `READY` 촬영을 동결하고 AI 분석 요청 |
| `GET` | `/api/v1/move-jobs/{job_id}/capture-sessions/{capture_session_id}/analysis` | 본인 | 분석 대기·실행·완료·실패 상태 조회 |

촬영 제출 뒤에는 해당 session의 미디어를 추가하거나 변경할 수 없다. 분석 응답은 provider task ID나 내부 오류 원문을 노출하지 않는다.

### 고객 AI 초안 검토

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/move-jobs/{job_id}/analysis-review` | 소비자 | 공간별 미디어 수, 실패 수와 AI 초안 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/analysis-review/complete` | 소비자 | 고객 수정·직접 추가를 반영한 불변 검토본 제출 |

AI 초안에는 항목 출처, confidence와 확인 필요 여부가 포함된다. 완료 command는 정확한 원본 version을 기준으로 하며 오래된 원본이나 다른 내용의 중복 제출은 `409`다.

---

### 작업범위·견적과 공동확인

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/move-jobs/{job_id}/scope-review` | 소비자·업체 | 현재 범위·견적·미디어·수정요청·양측 확인 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/scope-proposals` | 업체 | 현재 범위를 기준으로 새 범위·원화 견적 제안 |
| `POST` | `/api/v1/move-jobs/{job_id}/scope-review/revision-request` | 소비자 | 현재 업체 제안에 수정 요청 |
| `POST` | `/api/v1/move-jobs/{job_id}/scope-review/confirm` | 소비자 | 현재 제안 확인과 양측 범위 잠금 |

`scope-review`는 일반 프론트 화면용 실행 계약이다. 제안은 `base_amount_krw + adjustments = total_amount_krw`를 만족해야 하며, 새 제안은 기존 확인을 승계하지 않는다.

### 작업범위 호환 route

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/{job_id}/scope-versions` | 소비자·업체 | 불변 작업범위 version 생성 |
| `GET` | `/api/v1/move-jobs/{job_id}/scope-versions` | 모든 참여자 | 작업범위 version 이력 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/scope-versions/{scope_version_id}/approvals` | 소비자·업체 | 특정 version 확인 |

이 route들은 원본 domain과 호환용으로 유지한다. 일반 범위 화면은 `scope-review`와 `scope-proposals`를 우선한다.

---

### 배차와 현장 준비

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/{job_id}/dispatch/setup` | 업체 | 작업 요구사항과 차량·인력 후보 snapshot 등록 |
| `GET` | `/api/v1/move-jobs/{job_id}/dispatch` | 업체 | 요구 자원·후보·충돌·현재 선택 조회 |
| `PUT` | `/api/v1/move-jobs/{job_id}/dispatch` | 업체 | 차량·대표 기사·작업자를 원자적으로 확정하고 알림 생성 |
| `GET` | `/api/v1/move-jobs/{job_id}/field-brief` | 현장기사 | 최신 승인 범위·일정·현장 조건·배정 자원·checklist 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/check-ins` | 현장기사 | 예정일 당일 checklist 확인과 도착 체크인 |

배차 상태는 `setup_required`, `ready`, `stale`, `confirmed`다. `PUT /dispatch`는 차량 용량, 인원, 기술, 자격과 대표 기사 포함 여부를 함께 검증한다.

---

### 현장 이슈와 변경 제안

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/{job_id}/field-issues` | 현장기사 | 범위 밖 작업·파손 위험·현장 장애와 증거 보고 |
| `GET` | `/api/v1/move-jobs/{job_id}/field-issues` | 업체·현장기사 | 이슈와 변경 제안 처리 상태 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/change-proposals` | 업체 | 현장 이슈를 변경 범위·원화 견적 제안으로 전환 |
| `GET` | `/api/v1/move-jobs/{job_id}/change-proposals/{proposal_id}` | 소비자·업체 | 사유·증거·기존 범위·견적·결정 기록 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/change-proposals/{proposal_id}/decision` | 소비자 | 승인·거절·설명 요청 |
| `POST` | `/api/v1/move-jobs/{job_id}/change-proposals/{proposal_id}/explanation` | 업체 | 소비자의 설명 요청에 답변 |

현장기사는 가격 없이 사실과 증거를 보고하고, 업체가 변경안과 금액을 제안하며, 소비자가 최종 결정한다. 거절과 설명 요청에는 note가 필수이고 기존 승인본과 총액은 유지된다.

### 현장 변경 호환 route

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/{job_id}/change-requests` | 현장기사 | 현장 변경요청 생성 |
| `GET` | `/api/v1/move-jobs/{job_id}/change-requests` | 모든 참여자 | 변경요청 이력 조회 |
| `GET` | `/api/v1/move-jobs/{job_id}/change-requests/{change_request_id}/evidence/{media_asset_id}/read-url` | 소비자·업체 | 검증된 증거의 제한 시간 read URL 발급 |
| `POST` | `/api/v1/move-jobs/{job_id}/change-requests/{change_request_id}/clarification` | 소비자·업체 | 변경 설명 요청 |
| `POST` | `/api/v1/move-jobs/{job_id}/change-requests/{change_request_id}/explanation` | 현장기사 | 현장기사 설명 제출 |
| `POST` | `/api/v1/move-jobs/{job_id}/change-requests/{change_request_id}/decision` | 소비자·업체 | 변경 승인·거절 |

일반 프론트는 역할 책임과 화면 조회가 분리된 `field-issues`와 `change-proposals` 흐름을 우선한다.

---

### 완료, 문서와 기록

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/{job_id}/completion-submissions` | 대표 현장기사 | 완료 checklist·실제 근무·현장 확인·선택적 미디어 제출 |
| `GET` | `/api/v1/move-jobs/{job_id}/completion-summary` | 업체·요청받은 소비자 | 완료·최종 금액·변경·요청·문서 상태 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/completion-requests` | 업체 | 최신 완료 제출에 대한 7일 소비자 확인 요청 |
| `POST` | `/api/v1/move-jobs/{job_id}/completion-requests/{request_id}/revoke` | 업체 | 처리되지 않은 완료 요청 철회 |
| `POST` | `/api/v1/move-jobs/{job_id}/completion-requests/{request_id}/decision` | 소비자 | 완료 확인 또는 문제 신고 |
| `GET` | `/api/v1/move-jobs/{job_id}/documents/archive` | 업체 | 견적·변경·완료·결정 PDF와 manifest ZIP 다운로드 |

완료 사진은 선택 사항이며 필수 checklist, 작업자 근무와 현장 고객 확인은 필요하다. 문제 신고는 책임을 자동 판정하지 않고 문제 유형과 설명을 별도 기록한다. 문서 archive가 준비되지 않았으면 `409`다.

### 완료·감사·알림 호환 route

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/{job_id}/completion-confirmations` | 소비자·업체 | 완료 확인 생성 |
| `GET` | `/api/v1/move-jobs/{job_id}/completion-confirmations` | 모든 참여자 | 완료 확인 이력 조회 |
| `GET` | `/api/v1/move-jobs/{job_id}/audit-events` | 모든 참여자 | 감사 이력 조회 |
| `GET` | `/api/v1/move-jobs/{job_id}/notifications` | 모든 참여자 | 참여자 알림 이력 조회 |

일반 완료 화면은 `completion-summary`와 `completion-requests`를 사용한다. 전체 감사·알림 목록은 현재 제품 화면 계약에서 제외한다.

---

### 내부 Background Job

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/move-jobs/{job_id}/background-jobs` | 업체 | 보존 삭제 등 background job 생성 |
| `GET` | `/api/v1/move-jobs/{job_id}/background-jobs` | 모든 참여자 | job 상태와 오류 조회 |
| `POST` | `/api/v1/move-jobs/{job_id}/background-jobs/{background_job_id}/retry` | 업체 | 실패·lease 만료 job 재실행 |

내부 운영 기능이며 일반 frontend에 노출하지 않는다.

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
- 역할 secret은 URL query에 넣지 않고 frontend route fragment 또는 memory로 전달한다.

## 공통 응답 규칙

- `204 No Content`는 body 없이 성공으로 처리한다.
- 모든 JSON 응답의 `x-request-id`를 장애 추적에 사용할 수 있다.
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
| `503` | database 또는 storage provider 사용 불가 | 입력 보존, 일시 장애 안내와 수동 재시도 |
| `500`·기타 `5xx` | server 또는 provider 실패 | 기존 입력 보존과 재시도 안내 |

별도 machine error code는 모든 endpoint에 확정돼 있지 않다. frontend는 `detail`을 안전하게 읽되 민감값이 오류 수집 도구로 전달되지 않도록 한다.

---

## 미디어 업로드

### 업로드 흐름

1. capture session을 만들거나 기존 본인 session을 조회해 복구한다.
2. media upload target을 요청한다.
3. backend가 `upload_url`과 `upload_headers`를 반환한다.
4. 받은 URL과 header를 수정하지 않고 object storage에 `PUT`한다.
5. upload complete endpoint를 호출한다.
6. backend worker가 object key, MIME type, 크기, generation과 hash를 검증한다.
7. session 조회에서 미디어가 `READY` 또는 `FAILED`인지 확인한다.
8. `READY` inventory 촬영을 submit해 분석을 요청한다.
9. analysis endpoint에서 `pending`, `dispatching`, `queued`, `running`, `completed`, `failed` 상태를 조회한다.

### Signed Target 규칙

- signed URL은 opaque 문자열이다.
- decode, 재직렬화, query 정렬, hostname 변환과 기본 port 제거를 하지 않는다.
- `upload_headers`의 모든 key와 value를 그대로 적용한다.
- 현재 backend가 발급하는 GCS upload에는 `Content-Type`과 `x-goog-if-generation-match: 0`이 모두 포함된다.
- frontend가 upload complete 요청에 object generation을 직접 보내지 않는다.
- signed URL과 header를 cache, log, analytics와 error report에 남기지 않는다.
- 제출된 capture session에는 미디어를 추가하거나 다시 완료 처리하지 않는다.
- 허용 형식은 `image/jpeg`, `image/png`, `video/mp4`다. 이미지는 최대 20 MiB, 영상은 최대 200 MiB다.
- 미디어 목적은 `inventory`, `condition`, `change_evidence`, `completion`이다.

```json
{
  "asset": {
    "id": "uuid",
    "capture_session_id": "uuid",
    "room_zone_id": "uuid",
    "media_purpose": "inventory",
    "status": "pending_upload",
    "content_type": "image/png",
    "expected_size_bytes": 123456,
    "actual_size_bytes": null,
    "sha256_hex": null,
    "created_at": "2026-08-16T09:00:00+09:00",
    "uploaded_at": null
  },
  "upload_url": "https://opaque-signed-target.example/...",
  "upload_headers": {
    "Content-Type": "image/png",
    "x-goog-if-generation-match": "0"
  },
  "expires_at": "2026-08-16T09:15:00+09:00"
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
- 역할별 첫 진입에서는 `/api/v1/me`의 role, invitation과 permissions를 기준으로 허용 화면을 결정한다.

### Mutation

- CTA 하나는 하나의 업무 command에 대응한다.
- 제출 중 중복 클릭을 막고 성공 후 관련 query를 무효화한다.
- `409`에서도 사용자의 입력을 보존한다.
- timeout으로 성공 여부가 불명확하면 상태 조회 후 재시도한다.
- 승인본, 금액과 권한에는 낙관적 update를 사용하지 않는다.

### 공통 Client 필수 기능

- memory에 있는 Bearer secret을 명시적으로 전달
- `/me` 기반 역할·초대·permission 확인
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
