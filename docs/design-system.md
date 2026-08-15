---
name: SEQRET
description: 소비자·이사업체·현장기사가 작업범위, 버전, 금액과 다음 행동을 빠르게 이해하도록 만든 라이트 모드 기반의 모바일 우선 디자인 시스템.

colors:
  background: "#F4F5F9"
  foreground: "#191927"
  card: "#FFFFFF"
  card-foreground: "#191927"
  primary: "#4F46E5"
  primary-hover: "#4338CA"
  primary-soft: "#EEF2FF"
  primary-muted: "#E0E7FF"
  muted-foreground: "#8E90A0"
  secondary-foreground: "#4B4B5C"
  border: "#E9EAF2"
  success: "#17A46B"
  success-background: "#E6F7EF"
  warning: "#F5A623"
  warning-background: "#FFF6E5"
  destructive: "#E5484D"
  destructive-background: "#FDECEC"
  kakao: "#FEE500"
  focus-ring: "#818CF8"

typography:
  font-sans:
    fontFamily: "'Pretendard', Inter, ui-sans-serif, system-ui, sans-serif"
    description: "본문과 UI 전체에 사용한다."
  screen-title:
    fontSize: "24px ~ 28px"
    fontWeight: 800
    lineHeight: "32px ~ 36px"
  sheet-title:
    fontSize: "22px"
    fontWeight: 800
    lineHeight: "30px"
  card-title:
    fontSize: "17px"
    fontWeight: 700
    lineHeight: "24px"
  body:
    fontSize: "13px ~ 15px"
    fontWeight: "500 ~ 700"
    lineHeight: "19px ~ 22px"
  caption:
    fontSize: "11px ~ 12px"
    fontWeight: "600 ~ 700"

rounded:
  control: "1rem"
  button: "1rem"
  card: "1.5rem"
  sheet: "28px 28px 0 0"
  full: "9999px"

spacing:
  base: "Tailwind 기본 4px 단위"
  screen-x: "20px ~ 24px"
  card-padding: "16px ~ 20px"
  control-gap: "8px ~ 12px"
  section-gap: "20px ~ 28px"

utilities:
  mobile-stage:
    description: "데스크톱에서 모바일 화면을 중앙에 보여주는 데모 배경"
    className: "mobile-stage"
  mobile-frame:
    description: "소비자·업체 모바일·현장기사 기준 화면"
    className: "mobile-frame"
  focus-ring:
    description: "키보드 포커스 표시"
    css: "3px solid #818CF8; outline-offset: 2px"

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

## Overview

SEQRET은 거래 상태를 오해 없이 전달하는 것을 시각적 장식보다 우선한다.

- 소비자·업체·현장기사가 현재 작업, 버전, 금액과 다음 행동을 빠르게 구분한다.
- 승인, 거절, 설명 요청처럼 결과가 다른 행동을 명확하게 나눈다.
- 상태는 색상만으로 전달하지 않고 문장, 아이콘과 label을 함께 사용한다.
- 소비자와 현장기사는 모바일에서 한 손으로 핵심 과업을 완료할 수 있어야 한다.
- AI 결과와 확인 기록의 효력을 과장하지 않는다.

**Key Characteristics**

- 밝은 회색 canvas와 흰색 surface를 사용하는 라이트 모드
- Indigo 기반의 primary action과 version 강조
- 성공·대기·위험을 구분하는 semantic color
- 390px mobile frame을 기준으로 한 역할별 흐름
- border와 surface 차이를 중심으로 한 낮은 elevation
- Pretendard 기반의 한국어 우선 typography

## Colors

### Brand Accent

- **Primary** (`{colors.primary}` — `#4F46E5`): 주요 CTA, 현재 단계, 선택 상태
- **Primary Hover** (`{colors.primary-hover}` — `#4338CA`): 주요 CTA hover
- **Primary Soft** (`{colors.primary-soft}` — `#EEF2FF`): 선택 영역과 약한 강조 배경
- **Primary Muted** (`{colors.primary-muted}` — `#E0E7FF`): primary badge와 보조 강조

### Surface

- **Background** (`{colors.background}` — `#F4F5F9`): 화면 전체 canvas
- **Card** (`{colors.card}` — `#FFFFFF`): 카드, 입력 영역, sheet와 고정 CTA
- **Border** (`{colors.border}` — `#E9EAF2`): 카드·입력·구분선

### Text

- **Foreground** (`{colors.foreground}` — `#191927`): 제목과 핵심 본문
- **Secondary Foreground** (`{colors.secondary-foreground}` — `#4B4B5C`): 설명과 보조 행동
- **Muted Foreground** (`{colors.muted-foreground}` — `#8E90A0`): 시간, metadata, 비활성 설명

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

| Role | Size | Weight | Use |
| --- | --- | ---: | --- |
| screen-title | 24~28px | 800 | 현재 과업, 최종 금액 |
| sheet-title | 22px | 800 | bottom sheet 제목 |
| card-title | 17px | 700 | 카드 단위 제목 |
| body | 13~15px | 500~700 | 설명, 목록, 입력, 버튼 |
| caption | 11~12px | 600~700 | 상태, 시간, 부가 정보 |

### Principles

- 숫자와 금액에는 천 단위 구분과 `원` 단위를 표시한다.
- 버전은 `v3`, 변경요청은 `CR-01`처럼 같은 표기법을 사용한다.
- 한 화면에는 최상위 제목을 하나만 둔다.
- 긴 안내보다 현재 상태와 다음 행동을 먼저 보여준다.

## Layout

### Spacing System

- **Base unit**: Tailwind 기본 4px
- **Screen padding**: 20~24px
- **Card padding**: 16~20px
- **Control gap**: 8~12px
- **Section gap**: 20~28px

### Mobile Frame

- 최소 지원 너비는 320px이다.
- 소비자, 업체 mobile과 현장기사 화면은 최대 390px을 기준으로 한다.
- 실제 mobile에서는 viewport 전체를 사용한다.
- 768px 이상 demo 환경에서는 390×844px frame과 32px radius를 사용한다.
- 하단 CTA는 safe area를 고려한 sticky 영역에 둔다.

### Provider Desktop

- 다건 관리, 견적 검토와 운영처럼 넓은 정보가 필요한 업체 화면에만 사용한다.
- 핵심 상태와 CTA는 첫 viewport 안에 둔다.
- 좁은 viewport에서는 table을 숨기지 않고 가로 scroll 또는 card로 전환한다.

## Elevation & Depth

| Level | Treatment | Use |
| --- | --- | --- |
| Canvas | `#F4F5F9` | 화면 배경 |
| Surface | 흰색 배경 | 카드, 입력, CTA 영역 |
| Bordered | `1px solid #E9EAF2` | 정보 단위와 입력 경계 |
| Selected | primary border + soft background | 선택된 항목과 현재 단계 |
| Overlay | 반투명 backdrop + white sheet | modal, bottom sheet |

과도한 shadow와 glassmorphism을 사용하지 않는다. 깊이는 surface, border와 spacing으로 표현한다.

## Shapes

| Token | Value | Use |
| --- | --- | --- |
| `rounded-2xl` | 16px | Button, 입력, 작은 정보 영역 |
| `rounded-3xl` | 24px | 기본 Card |
| `rounded-t-[28px]` | 상단 28px | Sheet |
| `rounded-full` | 9999px | Badge, icon button, 진행 표시 |

## Components

공통 component의 실제 variant와 class는 `src/components/ui`를 단일 원본으로 사용한다.

### Buttons

| Variant | Use |
| --- | --- |
| `default` | 현재 화면의 primary CTA |
| `outline` | 이전 정보 열람과 보조 행동 |
| `secondary` | 카드 내부의 약한 강조 행동 |
| `ghost` | 가벼운 탐색과 inline action |
| `destructive` | 링크 폐기, 삭제와 위험 행동 |
| `kakao` | 역할 링크 카카오톡 공유에만 사용 |

크기는 `cta` 56px, `default` 48px, `chip` 40px, `icon` 40×40px을 사용한다. 한 화면에 primary CTA를 여러 개 두지 않는다.

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

### Sheet

- 현재 화면을 떠나지 않고 짧은 입력이나 확인이 필요한 경우 사용한다.
- 제목, 설명, 본문, 고정 footer 순서를 유지한다.
- 닫기 button, backdrop과 Esc 동작을 제공한다.
- 금액 승인과 삭제에는 대상과 결과가 드러나는 button 문구를 사용한다.

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
| Mobile baseline | 390~767px | 소비자·기사·업체 mobile 전체 흐름 |
| Tablet/Desktop | 768px 이상 | mobile demo frame 또는 업체 업무 layout |
| Wide desktop | 1280px 이상 | 업체 table과 summary card 다열 배치 |

## Iteration Guide

- 색상을 바꿀 때는 `src/app/styles.css`의 token부터 수정한다.
- 새 상태를 추가할 때는 의미, 문구, Badge variant와 복구 행동을 함께 정의한다.
- 새 component를 만들기 전에 `src/components/ui`의 조합과 variant로 해결 가능한지 확인한다.
- feature에서 반복되는 입력과 상태 표현은 공통 component로 승격한다.
- token이나 component contract가 바뀌면 이 문서와 실제 사용 화면을 같은 변경에서 검토한다.
