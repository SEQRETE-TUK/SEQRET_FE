---
name: SEQRET
description: 소비자·이사업체·현장 작업자가 범위, 근거, 버전, 금액과 다음 행동을 같은 기록으로 이해하는 모바일 우선 업무형 디자인 시스템.

colors:
  background: "--color-paper"
  foreground: "--color-ink"
  card: "--color-paper-2"
  card-foreground: "--color-ink"
  primary: "--color-accent"
  primary-hover: "--color-accent-hover"
  primary-soft: "--color-accent-50"
  primary-muted: "--color-accent-100"
  muted-foreground: "--color-muted"
  secondary-foreground: "--color-ink-2"
  border: "--color-rule"
  success: "--color-success"
  success-background: "--color-success-bg"
  warning: "--color-warning"
  warning-background: "--color-warning-bg"
  destructive: "--color-danger"
  destructive-background: "--color-danger-bg"
  kakao: "--color-kakao"
  focus-ring: "--color-focus"

typography:
  font-sans:
    fontFamily: "'Pretendard', Inter, ui-sans-serif, system-ui, sans-serif"
    description: "본문과 UI 전체에 사용한다."
  section-title:
    fontSize: "--text-xl"
    fontWeight: "--weight-strong"
    lineHeight: "28px"
  card-title:
    fontSize: "--text-component"
    fontWeight: "--weight-component"
    lineHeight: "24px"
  body:
    fontSize: "--text-md"
    fontWeight: "--weight-body"
    lineHeight: "24px"
  control:
    fontSize: "--text-control"
    fontWeight: "--weight-control"
    lineHeight: "20px"
  supporting:
    fontSize: "--text-support"
    fontWeight: "--weight-support"
    lineHeight: "20px"
  data:
    fontSize: "--text-data"
    fontWeight: "--weight-data"
    lineHeight: "20px"
  label:
    fontSize: "--text-xs"
    fontWeight: "--weight-strong"
    lineHeight: "16px"

rounded:
  small: "--radius-small"
  control: "--radius-control"
  card: "--radius-card"
  feature: "--radius-feature"
  sheet: "--radius-sheet"
  full: "--radius-pill"

spacing:
  base: "--space-3xs"
  screen-x: "--content-gutter"
  card-padding: "--space-sm ~ --space-md"
  control-gap: "--space-2xs ~ --space-xs"
  section-gap: "--space-md ~ --space-lg"

icons:
  family: "@phosphor-icons/react"
  system: "regular 20px ~ 24px"
  navigation: "regular/fill 24px"
  status: "bold 18px ~ 20px"
  category: "duotone 28px ~ 36px"

utilities:
  mobile-stage:
    description: "집중 업무 열을 데스크톱 중앙에 배치하는 배경"
    className: "mobile-stage"
  mobile-frame:
    description: "고객·업체·현장기사의 최대 432px 집중 업무 열"
    className: "mobile-frame"
  focus-ring:
    description: "키보드 포커스 표시"
    css: "2px solid var(--color-focus); outline-offset: var(--rule-fine)"

components:
  button-primary:
    base: "Button variant=default"
    usage: "현재 화면의 가장 중요한 진행 행동"
  button-outline:
    base: "Button variant=outline"
    usage: "보조 행동과 이전 정보 열람"
  button-secondary:
    base: "Button variant=secondary"
    usage: "카드 내부의 강조가 약한 행동"
  button-destructive:
    base: "Button variant=destructive"
    usage: "링크 폐기와 삭제처럼 되돌리기 어려운 행동"
  badge-status:
    base: "Badge"
    variants: "primary | neutral | success | warning | danger"
    usage: "진행·완료·대기·위험 상태"
  card:
    base: "Card + CardHeader + CardContent + CardFooter"
    usage: "작업범위, 금액, 증거와 상태의 한 단위"
  sheet:
    base: "Sheet + SheetHeader + SheetFooter"
    usage: "현재 흐름을 유지한 짧은 입력과 확인"
---

# SEQRET 디자인 시스템

> 단일 원본 체계: `design-system.md`(계약) · `tokens.css`(값) · `src/pages/design-system/design-system-data.ts`(문서 목차) · 실제 공용 컴포넌트(동작) · `/design-system`(검수 표본)

## 정보 소유권

같은 사실을 여러 파일에서 독립적으로 관리하지 않는다. 색상·크기·간격·그림자의 실제 값은 `tokens.css`만 수정하고, 이 문서와 `/design-system`에는 토큰 이름을 표시한다. `/design-system`의 색상과 간격 실측값은 브라우저의 계산된 CSS 값을 읽어 표시한다.

| 정보 | 단일 원본 | 다른 위치의 역할 |
|---|---|---|
| 원칙과 사용 조건 | `design-system.md` | 페이지에는 검수용 요약만 표시 |
| 색상·타입·간격·형태·동작 값 | `tokens.css` | `src/app/styles.css`는 Tailwind 이름만 연결 |
| 문서 섹션과 사이드바 항목 | `src/pages/design-system/design-system-data.ts` | rail과 본문 anchor가 같은 ID 사용 |
| 컴포넌트 API와 상태 | `src/components/ui` | `/design-system`은 실제 컴포넌트를 그대로 렌더링 |
| 제품 조합 패턴 | `src/components/layout`·`src/components/workflow` | 역할별 화면은 해당 패턴을 조합 |

## Overview

SEQRET은 거래 상태를 오해 없이 전달하는 것을 시각적 장식보다 우선한다.

- 소비자·업체·현장기사가 현재 작업, 버전, 금액과 다음 행동을 빠르게 구분한다.
- 승인, 거절, 설명 요청처럼 결과가 다른 행동을 명확하게 나눈다.
- 상태는 색상만으로 전달하지 않고 문장, 아이콘과 label을 함께 사용한다.
- 소비자와 현장기사는 모바일에서 한 손으로 핵심 과업을 완료할 수 있어야 한다.
- AI 결과와 확인 기록의 효력을 과장하지 않는다.

**Key Characteristics**

- 밝은 중립 canvas와 흰 surface를 사용하는 라이트 모드
- Indigo 기반의 primary action과 version 강조
- 성공·대기·위험을 구분하는 semantic color
- 320–432px 집중 업무 열과 4개 하단 메뉴를 기준으로 한 역할별 흐름
- border와 surface 차이를 중심으로 한 낮은 elevation
- Pretendard 기반의 한국어 우선 typography

## Documentation Architecture

디자인 시스템은 설명 문서와 실제 구현을 분리하되 같은 변경에서 함께 검수한다.

| 계층 | 단일 원본 | 책임 |
| --- | --- | --- |
| 계약 | `design-system.md` | 원칙, 타입 위계, 간격, 상태와 컴포넌트 사용 조건 |
| 토큰 | `tokens.css` | 색상, 글자 크기, 4px 간격, 형태, 동작의 실제 값 |
| 구현 | `src/components/ui` → `layout` → `workflow` | primitive에서 역할별 업무 패턴까지 조합 |
| 표본 | `/design-system` | 토큰 실측, 실제 컴포넌트, 사용 계약, 화면 순서 검수 |

전시 페이지는 `사용 원칙 → 기초 → 컴포넌트 → 조합 규칙`만 보여준다. 각 컴포넌트 표본에는 이름, 목적, 사용 계약과 실제 렌더링을 함께 제공한다. 역할 안내·검수 문구·외부 참고 링크처럼 구현의 원천이 아닌 정보는 전시 페이지에 반복하지 않는다.

## Colors

### Brand Accent

- **Primary** (`{colors.primary}`): 주요 CTA, 현재 단계, 선택 상태
- **Primary Hover** (`{colors.primary-hover}`): 주요 CTA hover
- **Primary Soft** (`{colors.primary-soft}`): 선택 영역과 약한 강조 배경
- **Primary Muted** (`{colors.primary-muted}`): primary badge와 보조 강조

### Surface

- **Background** (`{colors.background}`): 화면 전체 canvas
- **Card** (`{colors.card}`): 작업 카드, 입력 영역, sheet와 고정 CTA
- **Border** (`{colors.border}`): 목록 구분·입력·작업 카드 경계

### Text

- **Foreground** (`{colors.foreground}`): 제목과 핵심 본문
- **Secondary Foreground** (`{colors.secondary-foreground}`): 설명과 보조 행동
- **Muted Foreground** (`{colors.muted-foreground}`): 시간, metadata, 비활성 설명

### Semantic

| 의미 | 색상 | 배경 | 사용 |
| --- | --- | --- | --- |
| 성공 | `{colors.success}` | `{colors.success-background}` | 공동확인, 제출 완료, 안전 통과 |
| 대기·주의 | `{colors.warning}` | `{colors.warning-background}` | 응답 대기, 검토 필요, AI 확인 필요 |
| 위험·거절 | `{colors.destructive}` | `{colors.destructive-background}` | 삭제, 거절, 실패, 금액 증가 |

semantic color는 장식용으로 사용하지 않는다. 금액 증가와 오류는 색상뿐 아니라 `+150,000원`, `변경 후 총액`, `다시 시도`처럼 의미와 행동을 함께 표시한다.

## Typography

### Font Stack

- **Sans**: Pretendard → Inter → system UI
- 기본 본문 굵기: 500
- 기본 자간: `-0.2px`

### Hierarchy

| Role | Size / Line height | Weight | Tracking | Use |
| --- | --- | ---: | --- | --- |
| section-title | 20 / 28px | 700 | −0.025em | 화면과 서로 다른 판단 단위의 제목 |
| component-title | 17 / 24px | 600 | 0 | 카드와 목록 묶음 제목 |
| body | 16 / 24px | 400 | 0 | 설명, 입력과 주요 목록 내용 |
| control | 14 / 20px | 500 | 0 | 버튼, 탭과 짧은 조작 label |
| supporting | 14 / 20px | 400 | 0 | 시간, metadata와 보조 설명 |
| data | 13 / 20px | 600 | 0 | 버전, 금액과 조밀한 실측값 |
| status-label | 12 / 16px | 700 | 0 | 상태, 버전과 짧은 label |

### Principles

- 숫자와 금액에는 천 단위 구분과 `원` 단위를 표시한다.
- 버전은 `v3`, 변경요청은 `CR-01`처럼 같은 표기법을 사용한다.
- 한 화면에는 최상위 제목을 하나만 둔다.
- 긴 안내보다 현재 상태와 다음 행동을 먼저 보여준다.

## Layout

### Spacing System

- **Base unit**: `tokens.css`의 4pt semantic spacing scale
- **Screen padding**: 20~24px
- **Card padding**: 16~20px
- **Control gap**: 8~12px
- **Section gap**: 24~32px

| 단계 | Token | Value | Use |
| --- | --- | ---: | --- |
| 3XS | `--space-3xs` | 4px | 아이콘 내부와 미세 정렬 |
| 2XS | `--space-2xs` | 8px | 인접한 조작과 label 사이 |
| XS | `--space-xs` | 12px | control 내부와 작은 묶음 |
| SM | `--space-sm` | 16px | 기본 card padding |
| Gutter | `--content-gutter` | 20~24px | mobile 화면 좌우 여백 |
| MD | `--space-md` | 24px | section 내부와 작업 묶음 |
| LG | `--space-lg` | 32px | 서로 다른 판단 단위 사이 |
| XL | `--space-xl` | 40px | 큰 문맥 전환 |

### Control and Layout Metrics

| 대상 | Value | Rule |
| --- | ---: | --- |
| 작은 Button | `--control-compact` · 32px | 데스크톱의 필터와 짧은 inline action |
| 기본 Button | `--control-default` · 36px | 데스크톱의 일반 행동 |
| Mobile CTA·Input | `--control-touch` · 44px | 모바일 조작과 입력의 최소 터치 영역 |
| List row | 64px 이상 | 제목, 보조 정보와 상태를 포함 |
| Card inset | 16~20px | 정보 밀도에 맞춰 두 값 중 선택 |
| Mobile gutter | 20~24px | 320~432px viewport에 적용 |
| Section rhythm | 24~32px | 같은 문맥은 24px, 문맥 전환은 32px |

LIKELION TUK의 조밀한 control 단계에서 `32px → 36px → 44px`의 역할 분리를 참고한다. SEQRET은 실제 버튼 높이를 이 세 단계로 제한하고, `(pointer: coarse)` 환경에서는 작은 버튼도 최소 44px 터치 영역을 확보한다.

### Mobile Frame

- 최소 지원 너비는 320px이다.
- 고객, 업체 mobile과 현장기사 화면은 최대 432px을 기준으로 한다.
- 실제 mobile에서는 viewport 전체를 사용한다.
- 768px 이상에서도 가짜 휴대폰 테두리 없이 실제 웹의 집중 업무 열로 보여준다.
- 하단 CTA는 safe area를 고려한 sticky 영역에 둔다.

### Provider Desktop

- 다건 관리, 견적 검토와 운영처럼 넓은 정보가 필요한 업체 화면에만 사용한다.
- 핵심 상태와 CTA는 첫 viewport 안에 둔다.
- 좁은 viewport에서는 table을 숨기지 않고 가로 scroll 또는 card로 전환한다.

## Elevation & Depth

| Level | Treatment | Use |
| --- | --- | --- |
| Canvas | `--color-paper` | 화면 배경 |
| Surface | `--color-paper-2` | 카드, 입력, CTA 영역 |
| Bordered | `1px solid --color-rule` | 정보 단위와 입력 경계 |
| Selected | primary border + soft background | 선택된 항목과 현재 단계 |
| Overlay | 반투명 backdrop + white sheet | modal, bottom sheet |

과도한 shadow와 glassmorphism을 사용하지 않는다. 깊이는 surface, border와 spacing으로 표현한다.

## Shapes

| Token | Value | Use |
| --- | --- | --- |
| `--radius-small` | 6px | 작은 상태 영역과 조밀한 내부 surface |
| `--radius-control` | 8px | Button, 입력, 선택 control |
| `--radius-card` | 10px | 목록과 구분해야 하는 일반 Card |
| `--radius-feature` | 12px | Hero, 현재 작업처럼 상위 surface |
| `--radius-sheet` | 상단 16px | Sheet |
| `rounded-full` | 9999px | Badge, icon button, 진행 표시 |

일반 card에는 shadow를 사용하지 않는다. 고정 navigation, 떠 있는 action bar와 sheet처럼 실제로 다른 층에 놓인 surface에만 raised shadow를 사용한다.

## Icons

시스템 아이콘은 `@phosphor-icons/react` 한 세트만 사용한다. 같은 기능은 역할이나 화면이 달라도 같은 glyph를 유지하고, 상태가 바뀔 때는 다른 모양으로 교체하지 않는다.

| 위치 | Weight | Size | 규칙 |
| --- | --- | --- | --- |
| 하단 내비게이션 비활성 | `regular` | `--icon-md` · 24px | 현재 위치가 아닌 메뉴 |
| 하단 내비게이션 활성 | 같은 아이콘의 `fill` | `--icon-md` · 24px | 모양은 유지하고 상태만 강조 |
| 뒤로가기·닫기·더보기 | `regular` | `--icon-sm`~`--icon-md` · 20~24px | 조작 버튼의 이름을 `aria-label`로 제공 |
| 상태·경고·보안 | `bold` | `--icon-xs`~`--icon-sm` · 16~20px | 색상과 아이콘만 두지 않고 상태 문장을 함께 표시 |
| 서비스·물품 카테고리 | `duotone` | `--icon-category` · 32px | 실제 사진이나 전용 이미지가 더 적절하지 않을 때만 사용 |

- `--icon-xs: 16px`, `--icon-sm: 20px`, `--icon-md: 24px`, `--icon-category: 32px`를 표준 크기로 사용한다.
- 의미 없는 제목 옆 장식, 모든 카드의 앞자리, 설명을 반복하는 아이콘은 넣지 않는다.
- 큰 서비스 소개·현장 근거·빈 화면에는 아이콘보다 실제 사진이나 목적에 맞는 일러스트를 우선한다.
- 아이콘만 있는 버튼은 접근 가능한 이름을 제공하고, 장식 아이콘은 `aria-hidden="true"`로 숨긴다.
- 다른 아이콘 패키지나 서로 다른 아이콘 스타일을 섞지 않는다.

## Screen Architecture

모든 역할 화면은 같은 앱 셸·토큰·하단 탐색을 공유한다. 본문 구조는 역할이 실제로 판단하는 순서에 맞춰 다르게 구성한다.

1. **Header** — 역할·사용자, 현재 화면명, 필요한 화면에서만 새로고침을 둔다.
2. **Role home** — 고객은 준비 여정, 업체는 운영 큐, 현장기사는 시각·경로·안전 행동을 우선한다. 같은 hero card 구조를 복제하지 않는다.
3. **Bottom navigation** — 역할별 `홈 / 핵심업무 / 기록 / 마이` 네 영역을 같은 위치와 높이로 유지한다.
4. **Task list** — 제목, 상태, 한 줄 설명을 64px 이상 구분선 행으로 보여준다. 초대도 같은 작업 행으로 제공한다.
5. **Task detail** — 모바일은 전체 높이 page surface, 768px 이상은 중앙 dialog로 연다. 짧은 수정·선택만 하단 sheet로 분리한다.
6. **Primary action** — 한 상세 화면에는 결과가 분명한 주요 행동 하나만 둔다.

### Role home composition

| 역할 | 첫 판단 | 권장 구조 | 피해야 할 반복 |
| --- | --- | --- | --- |
| 고객 | 다음에 무엇을 확인해야 하는가 | 다음 확인 → 이사 경로와 단계 → 촬영 중심 준비 도구 → 사진 근거 | 동일 크기 아이콘 메뉴 3개, 운영 지표 나열 |
| 업체 | 어디에서 운영이 멈췄는가 | 작업명과 경로 → 우선 처리 → 번호가 있는 운영 큐 → 범위·이슈·견적 기준값 | 고객용 여정 카드 복제, 모든 상태를 badge로 표현 |
| 현장기사 | 언제 어디서 무엇부터 해야 하는가 | 시작 시각 → 출발·도착 경로 → 안전 안내 → 체크인·이슈·완료 순서 | 큰 홍보 문구, 견적 정보, 현장과 무관한 바로가기 |

공통성은 색·타이포·터치 영역·상태 문법에서 만든다. 화면마다 같은 `큰 제목 → 보라색 카드 → 요약 카드`를 반복해 통일성을 만들지 않는다.

### Shared transaction patterns

모든 역할이 같은 기록을 본다는 원칙은 아래 다섯 패턴으로 구현한다. 역할별 홈의 구조는 달라도 이 패턴의 용어와 값은 같아야 한다.

| 패턴 | 반드시 포함할 정보 | 사용 규칙 |
| --- | --- | --- |
| `WorkContext` | 작업 코드·이름, 일정, 출발→도착, 현재 범위 버전, 상태 | 홈과 상세에서 사용자가 어떤 이사를 보고 있는지 먼저 고정한다. |
| `HandoffStatus` | 현재 담당 역할, 다음 행동, 기존 승인본에 미치는 영향, 마지막 변경 시각 | `대기 중`만 쓰지 않고 누가 무엇을 해야 하는지 문장으로 쓴다. |
| `MoneyBreakdown` | 기본 금액, 조정 항목, 증감 부호, 제안·결과 총액 | 결정 화면에서 총액만 단독으로 표시하지 않는다. 숫자는 tabular numeral을 사용한다. |
| `ConfirmationStatus` | 업체·고객을 분리한 확인 여부와 시각 | 확인을 결제·서명·책임 인정처럼 표현하지 않는다. |
| `ActivityTimeline` | 행위자, 행동, 시각, 결과 | 기록 탭은 바로가기 모음이 아니라 변경·확인 이력으로 구성한다. |

제품 단계는 `시작·촬영 → 범위 공동확인 → 배차 → 현장 진행 → 완료 확인` 순서로 고정한다. 현장 이슈는 현장 단계에서 필요할 때만 생기는 분기이며 별도의 필수 선형 단계로 만들지 않는다.

업무 상세의 정보 순서는 `작업 맥락 → 현재 담당과 다음 행동 → 판단할 버전·금액·근거 → 주요 행동 → 이전 기록`을 따른다. AI 분석 실패나 일부 업로드 실패에서도 성공한 입력과 촬영 자료를 유지하고, 재시도 또는 직접 입력 행동을 같은 맥락에서 제공한다.

### Page inventory

| 경로·표면 | 사용자에게 보여야 하는 것 | 역할 |
| --- | --- | --- |
| `/` 역할 선택 | 고객·업체·현장기사의 차이, 메모리 보안 안내, 연결 CTA | 서비스의 단일 진입점 |
| 고객 연결 sheet | 새 이사/보안코드 tab, 2단계 이사 정보, 오류·로딩 | 고객 세션 생성·복귀 |
| 업체·기사 연결 sheet | 보안코드 입력과 Mock 안내, 연결 오류 | 초대 기반 역할 연결 |
| `/consumer` 홈 | 다음 확인, 현재 이사 경로·진행 단계, 촬영 중심 준비 도구, 사진 기록 안내 | 고객의 다음 행동 결정 |
| `/consumer?tab=work` | 업체 초대, 범위·견적, 현장 변경, 완료 확인 작업 목록 | 고객 업무 처리 |
| `/consumer?tab=records` | 공동확인·현장 변경·완료 기록 | 거래 기준과 이력 확인 |
| `/consumer?tab=my` | 연결 주체, 기록·보안 메뉴, 연결 종료 확인 sheet | 접근 정보 관리 |
| `/consumer/capture` | 연결된 이사명, 촬영/분석/검토 단계, 구역별 미디어와 AI 초안 | 사진 근거 수집·사용자 검토 |
| `/provider` 홈 | 현재 이사와 경로, 우선 처리, 번호가 있는 운영 큐, 실제 범위·이슈·견적 | 모바일 업체 운영 판단 |
| `/provider?tab=work` | 기사 초대, 견적, 현장 변경, 배차, 완료 문서 작업 목록 | 업체의 핵심 운영 |
| `/provider?tab=records` | 범위·배차·이슈·완료 기록 | 변경 이력 확인 |
| `/provider?tab=my` | 업체 연결 상태와 연결 종료 확인 sheet | 접근 정보 관리 |
| `/provider/web` | 같은 업체 운영 작업을 넓은 업무 열로 제공 | 데스크톱 운영 |
| `/crew` 홈 | 시작 시각, 출발·도착 경로, 안전 안내, 첫 현장 행동과 진행 순서 | 현장 브리핑 |
| `/crew?tab=work` | 체크인, 사진 근거 이슈 보고, 완료 제출 | 현장 핵심 작업 |
| `/crew?tab=records` | 실제 체크인·이슈·완료 기록 | 현장 기록 확인 |
| `/crew?tab=my` | 기사 연결 상태와 연결 종료 확인 sheet | 접근 정보 관리 |
| `/design-system` | token, component, 상태와 pattern 예시 | 구현·검수 기준 |
| `*` | 잘못된 주소 안내와 홈 복귀 | 오류 복구 |

### Overlay rules

- 짧은 생성·입력·확인은 sheet 하나에서 처리하고, 화면 전체 업무는 하단 navigation의 독립 tab으로 둔다.
- 연결 종료처럼 세션을 잃는 행동은 반드시 결과를 설명하는 확인 sheet를 거친다.
- sheet 제목과 닫기 버튼은 항상 보이고, footer의 주요 행동은 safe area 위에 고정한다.
- 하단 sheet 안에 다른 sheet를 열지 않는다. 전체 높이 task detail에서는 짧은 수정 입력 하나만 하단 sheet로 분리할 수 있다.
- tab과 역할별 현재 위치는 URL query에 반영해 새로고침·뒤로가기가 예측 가능해야 한다.

| Density | Use | Rule |
| --- | --- | --- |
| Summary | 역할 홈 | 제목·상태·한 줄 설명만 표시 |
| Browse | 초대·후보·범위 목록 | 구분선과 44px 이상 터치 영역 사용 |
| Review | 견적·변경·완료 상세 | 버전·근거·금액·결정 순서 유지 |
| Capture | 미디어 작업 | 구역·파일 상태를 먼저, 업로드 CTA는 하단에 고정 |

Sheet는 화면을 떠나지 않고 짧게 처리할 수 있는 단일 작업에 사용한다. 전체 앱 흐름을 한 sheet에 넣거나 sheet 안에 다시 card를 중첩하지 않는다. 768px 이상에서는 같은 내용을 중앙 dialog로 전환한다.

## Components

primitive의 실제 variant와 class는 `src/components/ui`, 업무 구조는 `src/components/workflow`를 단일 원본으로 사용한다.

### Specimen contract

`/design-system`에서 각 컴포넌트는 아래 네 항목을 같은 순서로 전시한다.

1. **이름** — 구현과 같은 컴포넌트 이름을 사용한다.
2. **목적** — 어떤 정보나 행동을 구분하는지 한 문장으로 설명한다.
3. **사용 계약** — 사용 조건, 피해야 할 조합과 접근성 조건을 명시한다.
4. **실제 표본** — 제품에서 import한 실제 primitive 또는 pattern을 렌더링한다.

variant를 나열하는 것만으로 끝내지 않고 기본, 선택, 대기, 오류, disabled처럼 사용자가 실제로 마주치는 상태를 검수한다. 코드 전시를 위해 제품 컴포넌트를 복제하지 않는다.

### Buttons

| Variant | Use |
| --- | --- |
| `default` | 현재 화면의 primary CTA |
| `outline` | 이전 정보 열람과 보조 행동 |
| `secondary` | 카드 내부의 약한 강조 행동 |
| `ghost` | 가벼운 탐색과 inline action |
| `destructive` | 링크 폐기, 삭제와 위험 행동 |
| `kakao` | 역할 링크 카카오톡 공유에만 사용 |

| Size | Height | Use |
| --- | ---: | --- |
| `chip` | 32px | 데스크톱의 필터와 짧은 inline action |
| `default` | 36px | 입력과 나란히 쓰는 일반 행동 |
| `cta` | 44px | 화면 또는 sheet의 단일 우선 행동 |
| `icon` | 36×36px | 아이콘만 있는 조작. 접근 가능한 이름을 제공한다. |

모바일의 `(pointer: coarse)` 환경에서는 모든 크기의 터치 영역을 최소 44px로 확장한다. 크기 차이는 label과 좌우 padding, 배치 맥락으로 구분하며 한 화면에 primary CTA를 여러 개 두지 않는다.

### Badges

| Variant | Meaning |
| --- | --- |
| `primary` | 진행 중, 현재 version, 활성 상태 |
| `neutral` | 예정, 미시작, 부가 정보 |
| `success` | 공동확인, 제출, 검증 완료 |
| `warning` | 응답 대기, 검토 필요, 불확실 |
| `danger` | 실패, 거절, 만료, 위험 |

Badge만으로 상태를 설명하지 않는다. 가까운 제목이나 본문에서 누가 무엇을 해야 하는지 함께 작성한다.

### Cards

- 한 card에는 하나의 판단 대상이나 정보 단위만 담는다.
- 제목과 설명은 `CardHeader`, 실제 값은 `CardContent`, 행동은 `CardFooter`에 배치한다.
- card 전체가 눌리는 것처럼 보이면 전체를 실제 interactive element로 만든다.
- summary 화면에서 같은 모양의 card를 반복하지 않는다. 경계가 필요한 우선 작업 1개와 구분선 목록·수치를 조합한다.

### Form controls

- `Label`, `Input`, `Select`, `Textarea`를 사용해 label, focus, invalid, disabled 상태를 통일한다.
- 모든 입력에는 고유한 `name`과 목적에 맞는 `type`, `inputMode`, `autoComplete`를 제공한다.
- placeholder는 label을 대신하지 않는다.

### Sheet

- 현재 화면을 떠나지 않고 짧은 입력이나 확인이 필요한 경우 사용한다.
- 제목, 설명, 본문, 고정 footer 순서를 유지한다.
- 닫기 button, backdrop과 Esc 동작을 제공한다.
- 금액 승인과 삭제에는 대상과 결과가 드러나는 button 문구를 사용한다.

### List rows and tabs

- 목록 행은 `left / contents / right` 세 영역으로 구성한다. 왼쪽에는 실제 근거 이미지나 항목 이해에 필요한 아이콘만 둔다.
- 설정·기록 목록은 `ListGroup`/`ListRow`, 다중 보조 정보 목록은 `InfoList`를 사용한다. 목록에는 항목 사이 구분선만 두고 위·아래 외곽선은 두지 않는다.
- 사진은 완료·현장 증빙처럼 사진 자체가 판단 근거일 때 72px 썸네일로 제공하고 `alt`, `width`, `height`, 지연 로딩을 함께 적용한다.
- 같은 화면의 동등한 콘텐츠 전환은 44–48px 높이의 underline tab을 사용한다. 선택 상태는 굵기·텍스트 색·2px indicator로 표시한다.

## Product States

| 상태 | Variant | 반드시 함께 보여줄 정보 |
| --- | --- | --- |
| 초안 | neutral | 작성자, 수정 중 또는 남은 항목 |
| 확인 대기 | warning | 누구의 확인이 필요한지 |
| 공동확인 완료 | success | version ID와 확인 주체 |
| 승인본 | primary 또는 success | `잠김`, version ID, 수정 시 새 version 생성 안내 |
| 변경 요청 | warning | 기준 version, 사유, 증감액, 응답 대기 주체 |
| 변경 승인 | success | 이전·결과 version과 최종 총액 |
| 변경 거절 | danger 또는 neutral | 기존 승인본과 총액이 유지됨 |
| AI 확인 필요 | warning | 사용자가 확인할 질문과 근거 |
| 실패 | danger | 실패 원인, 보존된 data와 복구 행동 |

## Content Principles

- 작업범위는 양측이 `확인`하고 현장 변경은 소비자가 `승인` 또는 `거절`한다.
- `확정`이라고 쓸 때 무엇이 확정됐는지 함께 적는다.
- AI는 `찾았습니다`보다 `후보로 제안했어요`, `확인이 필요해요`처럼 초안임을 드러낸다.
- 역할 링크를 로그인이나 개인 신원 확인으로 표현하지 않는다.
- `분쟁 없음`, `안심 보장`, `미승인 추가금 0원`처럼 법적·금전적 효력을 보장하는 표현을 사용하지 않는다.
- 오류 message에는 원인뿐 아니라 다음 행동을 제공한다.

## Do's and Don'ts

### Do

- semantic token과 공통 component variant를 먼저 사용한다.
- 상태, 역할, version과 금액을 실제 server data 기준으로 표시한다.
- 위험한 행동에는 대상과 결과를 button 문구에 포함한다.
- loading, empty, error, expired와 permission denied 상태를 함께 설계한다.
- icon-only button에 접근 가능한 이름을 제공한다.

### Don't

- feature component에 같은 hex 색상을 반복해서 hard-code하지 않는다.
- AI 결과를 사용자 확인 전 확정 정보처럼 표시하지 않는다.
- demo 이름과 금액을 실제 data처럼 고정하지 않는다.
- 상태를 색상 또는 icon 하나로만 구분하지 않는다.
- disabled button만 두고 비활성 이유를 숨기지 않는다.

## Responsive Behavior

| 구간 | 기준 | Key Changes |
| --- | --- | --- |
| Small mobile | 320~389px | 한 열, 고정 CTA, 정보 요약 우선 |
| Mobile baseline | 432px 이하 | 고객·현장기사·업체 mobile 전체 흐름 |
| Tablet/Desktop | 768px 이상 | mobile demo frame 또는 업체 업무 layout |
| Wide desktop | 1280px 이상 | 업체 table과 summary card 다열 배치 |

## Iteration Guide

- 색상을 바꿀 때는 루트 `tokens.css`의 token부터 수정한다.
- 새 상태를 추가할 때는 의미, 문구, Badge variant와 복구 행동을 함께 정의한다.
- 새 component를 만들기 전에 `src/components/ui`의 조합과 variant로 해결 가능한지 확인한다.
- feature에서 반복되는 입력과 상태 표현은 공통 component로 승격한다.
- token이나 component contract가 바뀌면 이 문서와 실제 사용 화면을 같은 변경에서 검토한다.
- 장식용 icon·가짜 통계·업무와 무관한 안내는 넣지 않는다. 사진은 실제 근거·완료 기록처럼 사진 자체가 정보일 때만 사용한다.

## Reference Principles

- [LINE Design System](https://designsystem.line.me/)의 명확한 핵심 과업과 연속된 화면 경험 원칙을 역할 홈→작업→sheet 복귀 구조에 적용한다.
- [LINE LIFF View](https://designsystem.line.me/LDSG/components/systems/liff-view-en/)의 집중된 단일 작업용 subwindow 원칙을 짧은 입력·확인 sheet에 적용한다.
- [당근 SEED](https://seed-design.io/docs)의 semantic `fg/bg/stroke` 역할과 foundation-first 운영 방식을 token→primitive→workflow 계층에 적용한다.
- [SEED GitHub](https://github.com/daangn/seed-design)처럼 플랫폼과 feature가 임의 값을 만들지 않고 한 token 원본을 공유한다.
- [Toss 앱인토스 디자인 시스템](https://developers-apps-in-toss.toss.im/design/components.html)의 목록·탭·하단 CTA 같은 공통 언어를 참고하되, 전용 자산은 복제하지 않고 제품 맥락에 맞는 구조 원칙만 적용한다.
- [shadcn/ui](https://ui.shadcn.com/docs)는 패키지 전체를 덧붙이는 대신 기존 Base UI primitive와 CVA variant를 조합하는 코드 소유 방식으로 사용한다.
- [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)의 URL 상태, focus-visible, semantic control, safe area, 이미지 크기, 파괴적 행동 확인 기준을 모바일 공통 규칙으로 사용한다.
- [Trading Dashboard Design](https://github.com/january2w0/trading-dashboard-design)의 `DESIGN.md → token data → specimen component → design-system page` 분리와 spacing 실측 표본 구조를 참고한다. 글자 크기·두께·간격 전시 방식만 적용하고 dark palette, font family와 dense desktop control 크기는 가져오지 않는다.
- [Likelion TUK](https://github.com/january2w0/likelion-tuk)의 `buttonVariants` 크기 분리와 조밀한 문서 사이드바를 참고한다. SEQRET은 기존 색과 surface를 유지하면서 32·36·44px control, 6·8·10·12·16px shape 단계로 조정하고 모바일 터치 영역은 44px 이상을 보장한다.
- 외부 디자인 시스템의 시각적 모양이나 브랜드 자산은 복제하지 않는다. 정보 위계, 상태, 접근성, component governance 원칙만 참고한다.
