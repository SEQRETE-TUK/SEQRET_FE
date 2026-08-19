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
  focus-ring: "--color-focus"

typography:
  font-sans:
    fontFamily: "'Pretendard', Inter, ui-sans-serif, system-ui, sans-serif"
    description: "본문과 UI 전체에 사용한다."
  title-lg:
    fontSize: "--text-title-lg"
    fontWeight: "--display-weight"
    lineHeight: "--line-screen"
  step-title:
    fontSize: "--text-step-title"
    fontWeight: "--display-weight"
    lineHeight: "--line-screen"
  section-title:
    fontSize: "--text-xl"
    fontWeight: "--weight-strong"
    lineHeight: "--line-section"
  card-title:
    fontSize: "--text-component"
    fontWeight: "--weight-component"
    lineHeight: "--line-component"
  list-title:
    fontSize: "--text-list-title"
    fontWeight: "--weight-list-title"
    lineHeight: "--line-list-title"
  body:
    fontSize: "--text-md"
    fontWeight: "--weight-body"
    lineHeight: "--line-body"
  control:
    fontSize: "--text-control"
    fontWeight: "--weight-control"
    lineHeight: "--line-control"
  button:
    fontSize: "--text-control"
    fontWeight: "--weight-button"
    lineHeight: "--line-control"
  supporting:
    fontSize: "--text-support"
    fontWeight: "--weight-support"
    lineHeight: "--line-support"
  list-detail:
    fontSize: "--text-list-detail"
    fontWeight: "--weight-list-detail"
    lineHeight: "--line-list-detail"
  data:
    fontSize: "--text-data"
    fontWeight: "--weight-data"
    lineHeight: "--line-data"
  label:
    fontSize: "--text-xs"
    fontWeight: "--weight-status"
    lineHeight: "--line-label"
  micro:
    fontSize: "--text-micro"
    fontWeight: "--weight-micro"
    lineHeight: "--line-label"

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
  control-gap: "--control-compact-gap ~ --control-gap"
  section-gap: "--space-md ~ --space-lg"

icons:
  family: "@phosphor-icons/react"
  system: "regular 16px ~ 24px"
  navigation: "regular/fill 24px"
  status: "bold 16px ~ 20px"
  category: "duotone 32px"

utilities:
  mobile-stage:
    description: "집중 업무 열을 데스크톱 중앙에 배치하는 배경"
    className: "mobile-stage"
  mobile-frame:
    description: "고객·현장기사의 최대 432px 집중 업무 열"
    className: "mobile-frame"
  focus-ring:
    description: "키보드 포커스 표시"
    css: "control은 primary-400 border + primary-100 3px ring, link·button은 2px outline"

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
  choice-group:
    base: "ChoiceGroup"
    usage: "한 질문에서 하나의 짧은 값을 고르는 2~3열 segmented radio. 화면 전환 Tabs와 독립 Toggle에는 사용하지 않는다."
  card:
    base: "Card variant=plain|outlined"
    usage: "작업범위, 금액, 증거와 상태의 한 단위"
  sheet:
    base: "Sheet + SheetHeader + SheetFooter"
    usage: "현재 흐름을 유지한 입력·확인과 전체 높이 순차 업무"
  dialog:
    base: "Dialog + DialogHeader + DialogFooter"
    usage: "업체 console의 중앙 확인·편집과 이력 열람"
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
- 고객·현장기사의 320–432px 집중 업무 열과 3개 하단 메뉴
- 업체의 mobile 3개 하단 메뉴 → desktop 좌측 rail로 이어지는 반응형 console
- surface와 spacing을 중심으로 한 낮은 elevation
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
- **Border** (`{colors.border}`): 목록 내부 구분·입력·선택 control 경계

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
- 기본 본문 굵기: 400
- 본문·제목·UI 역할 자간: `0`. 브랜드 워드마크만 `--tracking-brand` 예외를 사용한다.

### Hierarchy

SEED의 `regular 400 / medium 500 / bold 700` 구조를 기준으로 한다. Pretendard에서 700이 과하게 보이는 컴포넌트 제목은 제품 보정값 600을 사용하고, 데이터는 500, 상태 label은 400으로 구분한다. 일반 제품 화면은 section-title을 최고 위계로 사용하고, `title-lg`와 `step-title`은 디자인 시스템 문서 제목과 onboarding·단계 전환처럼 제한된 표면에만 사용한다.

| Role | Size / Line height | Weight | Tracking | Use |
| --- | --- | ---: | --- | --- |
| title-lg | 30 / 36px | 800 | 0 | 디자인 시스템 문서와 넓은 표면의 단일 제목 |
| step-title | 25 / 36px | 800 | 0 | onboarding과 단계 전환의 핵심 문장 |
| section-title | 20 / 28px | 700 | 0 | 화면과 서로 다른 판단 단위의 제목 |
| component-title | 17 / 24px | 600 | 0 | 카드와 목록 묶음 제목 |
| list-title | 16 / 22px | 500 | 0 | 목록 행의 판단 대상 |
| body | 16 / 24px | 400 | 0 | 설명, 입력과 주요 목록 내용 |
| control | 14 / 19px | 600 | 0 | 버튼, 탭과 짧은 조작 label |
| supporting | 14 / 20px | 400 | 0 | 시간, metadata와 보조 설명 |
| list-detail | 13 / 18px | 400 | 0 | 목록 행의 상태와 보조 설명 |
| data | 13 / 18px | 500 | 0 | 버전, 금액과 조밀한 실측값 |
| status-label | 12 / 16px | 400 | 0 | Badge의 상태와 짧은 label |
| micro | 12 / 16px | 600 | 0 | 진행 단계, 보조 ID와 매우 짧은 metadata |

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

컴포넌트 내부 간격은 전역 간격 토큰을 임의 조합하지 않고 역할 토큰으로 고정한다.

| 역할 | 토큰 | 값 | 적용 |
|---|---|---:|---|
| 기본 control gap | `--control-gap` | 6px | 버튼 아이콘과 label 사이 |
| 조밀 control gap | `--control-compact-gap` | 4px | 32px 보조 버튼 내부 |
| 기본 control inset | `--control-padding-x` | 16px | 44px 버튼 좌우 padding |
| 조밀 control inset | `--control-compact-padding-x` | 14px | 32px 버튼 좌우 padding |
| field inset | `--field-padding-x` | 16px | input 좌우 padding |
| filter inset | `--filter-padding-x` | 12px | filter chip과 choice 좌우 padding |
| list row block | `--list-row-padding-y` | 12px | 목록 행 상하 padding |

### Control and Layout Metrics

| 대상 | Value | Rule |
| --- | ---: | --- |
| 작은 Button | `--control-compact` · 32px | 데스크톱의 필터와 짧은 inline action |
| 기본 Button·Mobile CTA·Input | `--control-touch` · 44px | 모든 기본 조작과 입력의 최소 터치 영역 |
| List row | 64px 이상 | 제목, 보조 정보와 상태를 포함 |
| Card inset | 16~20px | 정보 밀도에 맞춰 두 값 중 선택 |
| Mobile gutter | 20~24px | 320~432px viewport에 적용 |
| Section rhythm | 24~32px | 같은 문맥은 24px, 문맥 전환은 32px |

SEQRET의 버튼 높이는 `32px → 44px` 두 단계로 제한한다. 32px는 포인터 기반의 조밀한 보조 영역에서만 사용하고, mobile과 `(pointer: coarse)` 환경의 기본 조작은 44px를 사용한다. 주요 행동의 위계는 더 큰 높이가 아니라 variant와 너비로 구분한다.

### Mobile Frame

- 최소 지원 너비는 320px이다.
- 고객과 현장기사 화면은 최대 432px을 기준으로 한다.
- 실제 mobile에서는 viewport 전체를 사용한다.
- 768px 이상에서도 가짜 휴대폰 테두리 없이 실제 웹의 집중 업무 열로 보여준다.
- 하단 CTA는 safe area를 고려한 sticky 영역에 둔다.

### Provider Desktop

- `/provider`는 `/provider/web`으로 이동하며 업체 업무는 하나의 반응형 console에서 처리한다.
- 768px 미만은 `작업 / 현장 이슈 / 기사·배차` 3개 하단 메뉴, 768px 이상은 같은 메뉴의 좌측 rail을 사용한다.
- 1280px 이상 작업 화면은 작업 queue와 선택 작업 inspector를 두 열로 배치한다.
- 핵심 상태와 CTA는 첫 viewport 안에 둔다.
- 좁은 viewport에서는 검색과 작업 목록을 한 열로 쌓고, 표 형태의 조밀한 정보는 가로 scroll 또는 card로 전환한다.

## Elevation & Depth

| Level | Treatment | Use |
| --- | --- | --- |
| Canvas | `--color-paper` | 화면 배경 |
| Surface | `--color-paper-2` | 카드, 입력, CTA 영역 |
| Bordered | `1px solid --color-rule` | 입력과 선택 상태 경계 |
| Selected | primary border + soft background | 선택된 항목과 현재 단계 |
| Overlay | 반투명 backdrop + white sheet | modal, bottom sheet |

과도한 shadow와 glassmorphism을 사용하지 않는다. 깊이는 surface와 spacing으로 표현한다.

동작은 `--dur-micro` 120ms, `--dur-short` 220ms, `--dur-long` 420ms와 세 easing token을 사용한다. row·button은 짧은 hover·press feedback만 제공하고, sheet·dialog는 opacity와 transform으로 진입한다. `prefers-reduced-motion: reduce`에서는 animation과 transition을 사실상 제거한다.

## Shapes

| Token | Value | Use |
| --- | --- | --- |
| `--radius-small` | 6px | 작은 상태 영역과 조밀한 내부 surface |
| `--radius-control` | 8px | Button, 입력, 선택 control |
| `--radius-card` | 10px | 목록과 구분해야 하는 일반 Card |
| `--radius-feature` | 12px | Hero, 현재 작업처럼 상위 surface |
| `--radius-sheet` | 상단 16px | Sheet |
| `--radius-pill` | 9999px | Badge, icon button, 진행 표시 |

일반 card에는 shadow를 사용하지 않는다. 고정 navigation, 떠 있는 action bar와 sheet처럼 실제로 다른 층에 놓인 surface에만 raised shadow를 사용한다.

## Icons

시스템 아이콘은 `@phosphor-icons/react` 한 세트만 사용한다. 같은 기능은 역할이나 화면이 달라도 같은 glyph를 유지하고, 상태가 바뀔 때는 다른 모양으로 교체하지 않는다.

| 위치 | Weight | Size | 규칙 |
| --- | --- | --- | --- |
| 하단 내비게이션 비활성 | `regular` | `--icon-md` · 24px | 현재 위치가 아닌 메뉴 |
| 하단 내비게이션 활성 | 같은 아이콘의 `fill` | `--icon-md` · 24px | 모양은 유지하고 상태만 강조 |
| Button 내부 | glyph 기본 weight | `--icon-xs` · 16px | label을 보조하며 아이콘만으로 행동을 설명하지 않음 |
| 뒤로가기·닫기·더보기 | `regular` | `--icon-sm`~`--icon-md` · 20~24px | 조작 버튼의 이름을 `aria-label`로 제공 |
| 상태·경고·보안 | `bold` | `--icon-xs`~`--icon-sm` · 16~20px | 색상과 아이콘만 두지 않고 상태 문장을 함께 표시 |
| 서비스·물품 카테고리 | `duotone` | `--icon-category` · 32px | 실제 사진이나 전용 이미지가 더 적절하지 않을 때만 사용 |

- `--icon-xs: 16px`, `--icon-sm: 20px`, `--icon-md: 24px`, `--icon-category: 32px`를 표준 크기로 사용한다.
- 의미 없는 제목 옆 장식, 모든 카드의 앞자리, 설명을 반복하는 아이콘은 넣지 않는다.
- 큰 서비스 소개·현장 근거·빈 화면에는 아이콘보다 실제 사진이나 목적에 맞는 일러스트를 우선한다.
- 아이콘만 있는 버튼은 접근 가능한 이름을 제공하고, 장식 아이콘은 `aria-hidden="true"`로 숨긴다.
- 다른 아이콘 패키지나 서로 다른 아이콘 스타일을 섞지 않는다.

## Screen Architecture

모든 역할은 같은 token과 상태 문법을 사용한다. 고객·현장기사는 `MobileAppShell`, 업체는 `provider-console`을 사용하며 본문 구조는 역할이 실제로 판단하는 순서에 맞춘다.

1. **Header** — 역할·사용자, 현재 화면명, 필요한 화면에서만 알림·새로고침·연결 행동을 둔다.
2. **Role home** — 고객은 준비 여정, 업체는 작업 queue, 현장기사는 시각·경로·안전 행동을 우선한다. 같은 hero card 구조를 복제하지 않는다.
3. **Navigation** — 고객은 `홈 / 내 이사 / 더보기`, 현장기사는 `홈 / 내 작업 / 더보기`를 사용한다. 업체는 `작업 / 현장 이슈 / 기사·배차`를 mobile 하단 메뉴와 desktop rail에서 같은 순서로 유지한다.
4. **Task list** — 제목, 상태, 한 줄 설명을 64px 이상 구분선 행으로 보여준다. 초대도 같은 작업 행으로 제공한다.
5. **Task detail** — 역할별 tab·console 본문에서 문맥을 유지하고, 순차 업무·이력·현장 보고는 전체 높이 `Sheet presentation="page"`로 연다. 업체의 연결·범위 이력은 `Dialog`를 사용한다.
6. **Primary action** — 한 상세 화면에는 결과가 분명한 주요 행동 하나만 둔다.

### Role home composition

| 역할 | 첫 판단 | 권장 구조 | 피해야 할 반복 |
| --- | --- | --- | --- |
| 고객 | 다음에 무엇을 확인해야 하는가 | 다음 확인 → 이사 경로와 단계 → 촬영 중심 준비 도구 → 사진 근거 | 동일 크기 아이콘 메뉴 3개, 운영 지표 나열 |
| 업체 | 어디에서 운영이 멈췄는가 | 작업 queue와 선택 작업 맥락 → 범위·견적 → 현장 이슈 → 기사·배차 | 고객용 여정 카드 복제, 모든 상태를 badge로 표현 |
| 현장기사 | 언제 어디서 무엇부터 해야 하는가 | 시작 시각 → 출발·도착 경로 → 안전 안내 → 체크인·이슈·완료 순서 | 큰 홍보 문구, 견적 정보, 현장과 무관한 바로가기 |

공통성은 색·타이포·터치 영역·상태 문법에서 만든다. 화면마다 같은 `큰 제목 → 보라색 카드 → 요약 카드`를 반복해 통일성을 만들지 않는다.

### Shared transaction patterns

모든 역할이 같은 기록을 본다는 원칙은 아래 다섯 조합 규칙으로 구현한다. `WorkContext`는 공용 layout component이며 나머지는 역할 화면에서 같은 정보 순서를 유지하기 위한 계약이다.

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
| 업체·기사 연결 dialog·sheet | 초대 코드 입력, 대기 초대 확인과 연결 오류 | 초대 기반 역할 연결 |
| `/consumer` | 다음 확인, 현재 이사 경로·진행 단계, 촬영 중심 준비 도구 | 고객의 다음 행동 결정 |
| `/consumer?tab=move&view=list` | 연결된 이사와 새 이사 시작 행동 | 고객 작업 선택 |
| `/consumer?tab=move&view=…` | `info`, `items`, `agreement`에 이사 정보, 짐 목록, 공동확인·현장 변경·완료 확인 표시 | 고객 업무 상세 |
| `/consumer?tab=notifications` | 고객이 확인할 상태 변화와 관련 업무 이동 | 고객 알림 |
| `/consumer?tab=more` | 연결 주체, 촬영·개인정보 안내, 도움말, 연결 종료 sheet | 접근 정보 관리 |
| `/consumer/capture` | 연결된 이사명, 촬영/분석/검토 단계, 구역별 미디어와 AI 초안 | 사진 근거 수집·사용자 검토 |
| `/provider` | `/provider/web`으로 이동 | 업체 route 단일화 |
| `/provider/web?view=jobs` | `detail`·`quote` mode의 작업 queue, 선택 작업 inspector, 범위·견적 편집과 이력 | 업체 작업 운영 |
| `/provider/web?view=issues` | 현장 이슈, 변경 제안과 설명 보완 | 업체 현장 변경 처리 |
| `/provider/web?view=invite` | 기사 초대, 차량·인력 후보와 배차 확정 | 업체 배차 운영 |
| `/crew` | 시작 시각, 출발·도착 경로, 안전 안내와 다음 현장 행동 | 현장 브리핑 |
| `/crew?tab=work&view=list` | 배정 작업과 현재 상태 | 현장 작업 선택 |
| `/crew?tab=work&view=…` | `agreement`, `report`, `completion`에 승인본·체크인, 현장 이슈 보고, 완료 제출 표시 | 현장 업무 상세 |
| `/crew?tab=notifications` | 현장기사가 확인할 상태 변화와 관련 업무 이동 | 기사 알림 |
| `/crew?tab=more` | 기사 연결 상태, 촬영·개인정보 안내, 도움말, 연결 종료 sheet | 접근 정보 관리 |
| `/design-system` | token, component, 상태와 pattern 예시 | 구현·검수 기준 |
| `*` | 잘못된 주소 안내와 홈 복귀 | 오류 복구 |

### Overlay rules

- 짧은 생성·입력·확인은 sheet 하나에서 처리하고, 화면 전체 업무는 하단 navigation의 독립 tab으로 둔다.
- 연결 종료처럼 세션을 잃는 행동은 반드시 결과를 설명하는 확인 sheet를 거친다.
- sheet 제목과 닫기 버튼은 항상 보이고, footer의 주요 행동은 safe area 위에 고정한다.
- 전체 높이 page sheet에서는 수정 요청·문제 신고처럼 현재 판단에 종속된 짧은 입력만 `nested` sheet 한 단계로 열 수 있다. 일반 sheet를 연속으로 중첩하지 않는다.
- tab과 역할별 현재 위치는 URL query에 반영해 새로고침·뒤로가기가 예측 가능해야 한다.

| Density | Use | Rule |
| --- | --- | --- |
| Summary | 역할 홈 | 제목·상태·한 줄 설명만 표시 |
| Browse | 초대·후보·범위 목록 | 구분선과 44px 이상 터치 영역 사용 |
| Review | 견적·변경·완료 상세 | 버전·근거·금액·결정 순서 유지 |
| Capture | 미디어 작업 | 구역·파일 상태를 먼저, 업로드 CTA는 하단에 고정 |

Sheet는 현재 문맥에서 입력·결정하거나 순차 업무를 전체 높이로 처리할 때 사용한다. `presentation="page"`는 onboarding, 이력, 현장 보고와 `WorkflowTask` 상세에 사용하고, 업체 console의 연결·범위 이력은 별도 Dialog를 사용한다. viewport 크기만으로 Sheet와 Dialog를 자동 교체하지 않는다.

## Components

primitive의 실제 variant와 class는 `src/components/ui`, 업무 구조는 `src/components/workflow`를 단일 원본으로 사용한다.

### Specimen contract

`/design-system`은 `design-system-data.ts`의 목차와 실제 공용 컴포넌트를 사용한다.

1. **기초 실측** — 색상, 타입, 간격과 모서리는 browser computed value를 표시한다.
2. **이름** — 구현과 같은 컴포넌트·variant 이름을 사용한다.
3. **상태 비교** — 버튼 위계, 선택 상태, Badge 의미와 입력 형태를 한 표면에서 비교한다.
4. **실제 표본** — 제품에서 import한 primitive와 list pattern을 그대로 렌더링한다.

사용 조건과 접근성 계약은 이 문서가 소유하고 전시 페이지는 반복하지 않는다. 표본을 위해 제품 컴포넌트를 복제하거나 별도 전시용 variant를 만들지 않는다.

### Buttons

| Variant | Use |
| --- | --- |
| `default` | 현재 화면의 primary CTA |
| `outline` | 이전 정보 열람과 보조 행동 |
| `secondary` | 카드 내부의 약한 강조 행동 |
| `ghost` | 배경과 테두리 없이 표시하는 낮은 우선순위 행동 |
| `destructive` | 링크 폐기, 삭제와 위험 행동 |

| Size | Height | Use |
| --- | ---: | --- |
| `chip` | 32px | 데스크톱의 필터와 짧은 inline action |
| `default` | 44px | 일반 행동과 입력에 쓰는 기본 터치 영역 |
| `cta` | 44px | 화면 또는 sheet의 단일 우선 행동 |
| `icon` | 44×44px | 아이콘만 있는 조작. 접근 가능한 이름을 제공한다. |

모든 기본 조작은 44px 터치 영역을 사용한다. 크기 차이는 label과 좌우 padding, 배치 맥락으로 구분하며 한 화면에 primary CTA를 여러 개 두지 않는다.

`ghost`는 크기를 지정하지 않으면 compact 높이를 사용한다. 하단의 주요 보조 행동처럼 44px이 필요한 경우에만 `size="cta"`를 명시한다.
Button 안의 아이콘은 기본 16px이며 label을 보조한다. 아이콘 단독 행동은 `size="icon"`과 접근 가능한 이름을 함께 사용한다.

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

- 공용 `Card`는 `plain`과 `outlined` variant만 제공하며 header·content·footer 하위 primitive를 별도로 만들지 않는다.
- 한 card에는 하나의 판단 대상이나 정보 단위만 담는다.
- 기본 `plain` card는 외곽선 없이 surface와 주변 spacing으로 구분한다.
- 강조가 필요한 card는 `ui-card-tinted`로 primary soft surface를 사용한다.
- card와 배경 surface가 같아 경계가 사라지는 경우에만 `variant="outlined"`를 사용한다. border는 내부 구분선, 선택·경고 상태와 form control에도 사용할 수 있다.
- 주요 행동 hero, 상태 요약, 여러 행을 묶은 contained list도 card 범주에 포함한다.
- 내부 순서는 제목·설명 → 실제 값 → 행동으로 유지하고 semantic element를 화면 맥락에 맞춰 직접 선택한다.
- card 전체가 눌리는 것처럼 보이면 전체를 실제 interactive element로 만든다.
- summary 화면에서 같은 모양의 card를 반복하지 않는다. 경계가 필요한 우선 작업 1개와 구분선 목록·수치를 조합한다.

### Tailwind aliases

- `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`은 `tokens.css`의 canonical type scale에 매핑한다.
- 날짜, 금액, 상태처럼 읽어야 하는 값은 크기와 굵기를 따로 조합하지 않고 `text-ui-data`를 사용한다.
- 본문 입력은 `text-ui-body`, 목록 제목과 설명은 각각 `text-ui-list-title`, `text-ui-list-detail`을 사용한다.

### Form controls

- `Label`, `Input`, `Select`, `Textarea`를 사용해 label, focus, invalid, disabled 상태를 통일한다.
- 기본 Input·Select 높이는 44px이고 Textarea는 최소 96px이며 세 control 모두 semantic focus·danger ring을 공유한다.
- 모든 입력에는 고유한 `name`과 목적에 맞는 `type`, `inputMode`, `autoComplete`를 제공한다.
- placeholder는 label을 대신하지 않는다.

### Sheet

- 현재 화면을 떠나지 않고 짧은 입력이나 확인이 필요한 경우 사용한다.
- 제목, 설명, 본문, 고정 footer 순서를 유지한다.
- 닫기 button, backdrop과 Esc 동작을 제공한다.
- `presentation="page"`는 onboarding·이력·현장 보고·`WorkflowTask`처럼 전체 높이가 필요한 순차 업무에 사용하고, 여기서 파생되는 짧은 입력은 `nested` sheet 한 단계로 제한한다.
- 업체 console의 중앙 확인·이력은 `Dialog`를 사용한다. Dialog action은 좁은 화면에서 세로, 넓은 화면에서 오른쪽 정렬 행으로 배치한다.
- 금액 승인과 삭제에는 대상과 결과가 드러나는 button 문구를 사용한다.

### List rows and tabs

- 목록 행은 `left / contents / right` 세 영역으로 구성한다. 왼쪽에는 실제 근거 이미지나 항목 이해에 필요한 아이콘만 둔다.
- 설정·기록 목록은 `ListGroup`/`ListRow`, 다중 보조 정보 목록은 `InfoList`를 사용한다. 항목은 하나의 surface로 묶고 항목 사이에만 구분선을 두며 위·아래 외곽선은 두지 않는다.
- 업무 queue는 `WorkflowTask`, 제품 단계는 `ProgressSteps`, 현재 작업 식별은 `WorkContext`를 우선 사용한다.
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
| 배차 준비·충돌 | warning | 필요한 차량·인원, 충돌 사유와 다음 조정 행동 |
| 배차 확정·체크인 | success 또는 primary | 배정 snapshot, 대표 기사와 확인 시각 |
| 완료 제출·고객 확인 대기 | warning | 제출 주체, checklist와 고객이 결정할 내용 |
| 완료 확인 | success | 최종 금액, 완료 시각과 문서 상태 |
| 완료 문제 신고 | danger 또는 warning | 문제 유형, 설명과 업체의 다음 처리 |
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
- 표본 이름과 금액을 실제 data처럼 고정하지 않는다.
- 상태를 색상 또는 icon 하나로만 구분하지 않는다.
- disabled button만 두고 비활성 이유를 숨기지 않는다.

## Responsive Behavior

| 구간 | 기준 | Key Changes |
| --- | --- | --- |
| Small mobile | 320~389px | 한 열, 고정 CTA, 정보 요약 우선 |
| Mobile baseline | 432px 이하 | 고객·현장기사 집중 업무 열, 업체 3개 하단 메뉴 |
| Tablet/Desktop | 768px 이상 | 고객·기사 최대 432px 열, 업체 좌측 rail |
| Wide desktop | 1280px 이상 | 업체 작업 queue와 선택 작업 inspector 두 열 |

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
- [Likelion TUK](https://github.com/january2w0/likelion-tuk)의 `buttonVariants` 크기 분리와 조밀한 문서 사이드바를 참고한다. SEQRET은 기존 색과 surface를 유지하면서 32·44px control, 6·8·10·12·16px shape 단계로 조정하고 모바일 터치 영역은 44px 이상을 보장한다.
- 외부 디자인 시스템의 시각적 모양이나 브랜드 자산은 복제하지 않는다. 정보 위계, 상태, 접근성, component governance 원칙만 참고한다.
