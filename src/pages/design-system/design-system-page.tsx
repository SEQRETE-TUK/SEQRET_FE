import {
  ArrowLeftIcon as ArrowLeft,
  CameraIcon as Camera,
  HouseIcon as Home,
} from "@phosphor-icons/react";
import {
  SecurityStatusIcon as ShieldCheck,
} from "@/components/icons";
import { useState, type ComponentProps, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIndicator } from "@/components/ui/check-indicator";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { FilterChip, ListGroup, ListRow } from "@/components/layout/app-primitives";
import { Input } from "@/components/ui/input";
import { InfoList, type InfoListColumn } from "@/components/ui/info-list";
import { Label } from "@/components/ui/label";
import { designSystemNavigation } from "./design-system-data";
import { DesignSystemRail } from "./design-system-rail";

const principles = [
  {
    title: "한 화면에는 하나의 우선 행동",
    body: "상태를 먼저 설명하고, 지금 처리할 작업 하나를 가장 강하게 표시합니다.",
  },
  {
    title: "카드는 경계가 필요한 작업에만",
    body: "다음 작업·견적·증빙처럼 한 덩어리로 판단해야 할 때만 카드를 사용합니다.",
  },
  {
    title: "설정과 기록은 목록으로",
    body: "마이페이지·이력·작업 순서는 구분선 기반 목록으로 빠르게 탐색하게 합니다.",
  },
  {
    title: "이미지는 근거가 있을 때만",
    body: "현장 사진과 완료 증빙처럼 판단에 필요한 이미지에만 공간을 배정합니다.",
  },
];

const systemLayers = [
  {
    title: "계약",
    source: "design-system.md",
    body: "원칙, 타입 위계, 간격, 상태와 컴포넌트 사용 조건을 정의합니다.",
  },
  {
    title: "토큰",
    source: "tokens.css",
    body: "색상, 타입 크기, 4px 간격, 형태와 동작 값을 단일 원본으로 관리합니다.",
  },
  {
    title: "구현",
    source: "ui → layout → workflow",
    body: "primitive를 조합해 역할별 업무 패턴을 만들고 임의 값을 반복하지 않습니다.",
  },
  {
    title: "표본",
    source: "/design-system",
    body: "토큰의 실측값, 실제 컴포넌트, 사용 계약과 화면 순서를 함께 검수합니다.",
  },
] as const;

const colorGroups = [
  {
    name: "기본 표면과 콘텐츠",
    colors: [
      { name: "Paper", token: "--color-paper", use: "앱 전체 배경" },
      { name: "Paper 2", token: "--color-paper-2", use: "카드 · 입력 · 시트 표면" },
      { name: "Paper 3", token: "--color-paper-3", use: "보조 표면 · hover 배경" },
      { name: "Stage", token: "--color-stage", use: "넓은 화면 작업 영역" },
      { name: "Ink", token: "--color-ink", use: "제목 · 본문 핵심 정보" },
      { name: "Ink 2", token: "--color-ink-2", use: "설명 · 보조 상태" },
      { name: "Muted", token: "--color-muted", use: "시간 · metadata · 비활성 설명" },
      { name: "Rule", token: "--color-rule", use: "목록 구분 · 입력 테두리" },
      { name: "Overlay", token: "--color-overlay", use: "modal · sheet backdrop" },
    ],
  },
  {
    name: "브랜드와 상호작용",
    colors: [
      { name: "Primary soft", token: "--color-accent-50", use: "선택 배경 · 정보 상태" },
      { name: "Primary pale", token: "--color-accent-100", use: "선택 보조 배경" },
      { name: "Primary focus", token: "--color-accent-400", use: "focus · 보조 강조" },
      { name: "Primary", token: "--color-accent", use: "주요 CTA · 선택 · 현재 단계" },
      { name: "Primary hover", token: "--color-accent-hover", use: "hover · 활성 강조" },
      { name: "Primary strong", token: "--color-accent-strong", use: "강한 primary 텍스트" },
      { name: "Primary ink", token: "--color-accent-ink", use: "primary 위 텍스트" },
      { name: "Focus", token: "--color-focus", use: "keyboard focus ring" },
    ],
  },
  {
    name: "상태",
    colors: [
      { name: "Success", token: "--color-success", use: "완료 · 연결됨" },
      { name: "Success background", token: "--color-success-bg", use: "완료 상태 배경" },
      { name: "Success ink", token: "--color-success-ink", use: "완료 상태 텍스트" },
      { name: "Warning", token: "--color-warning", use: "대기 · 현장 주의" },
      { name: "Warning background", token: "--color-warning-bg", use: "대기 상태 배경" },
      { name: "Warning ink", token: "--color-warning-ink", use: "대기 상태 텍스트" },
      { name: "Danger", token: "--color-danger", use: "오류 · 종료 · 거절" },
      { name: "Danger background", token: "--color-danger-bg", use: "오류 상태 배경" },
      { name: "Danger ink", token: "--color-danger-ink", use: "오류 상태 텍스트" },
    ],
  },
] as const;

const typeScale = [
  { name: "페이지 제목", className: "text-ui-title-lg", sample: "짐확정 디자인 시스템", sizeToken: "--text-title-lg", lineToken: "--line-screen", weightToken: "--display-weight", trackingToken: "--tracking-display" },
  { name: "단계 제목", className: "text-ui-step-title", sample: "업체와 함께 확인할 차례예요", sizeToken: "--text-step-title", lineToken: "--line-screen", weightToken: "--display-weight", trackingToken: "--tracking-display" },
  { name: "섹션 제목", className: "text-ui-section", sample: "확인할 내용", sizeToken: "--text-xl", lineToken: "--line-section", weightToken: "--weight-strong", trackingToken: "--tracking-none" },
  { name: "컴포넌트 제목", className: "text-ui-component", sample: "작업 범위와 금액", sizeToken: "--text-component", lineToken: "--line-component", weightToken: "--weight-component", trackingToken: "--tracking-none" },
  { name: "목록 제목", className: "text-ui-list-title", sample: "범위와 견적", sizeToken: "--text-list-title", lineToken: "--line-list-title", weightToken: "--weight-list-title", trackingToken: "--tracking-none" },
  { name: "본문", className: "text-ui-body", sample: "현재 상태와 다음 작업을 설명합니다.", sizeToken: "--text-md", lineToken: "--line-body", weightToken: "--weight-body", trackingToken: "--tracking-none" },
  { name: "보조 정보", className: "text-ui-support text-ink-600", sample: "1월 15일 화요일 · 오전 10:00", sizeToken: "--text-support", lineToken: "--line-support", weightToken: "--weight-support", trackingToken: "--tracking-none" },
  { name: "버튼", className: "text-ui-button", sample: "다음 단계", sizeToken: "--text-control", lineToken: "--line-control", weightToken: "--weight-button", trackingToken: "--tracking-none" },
  { name: "컨트롤", className: "text-ui-control", sample: "변경 내용 확인", sizeToken: "--text-control", lineToken: "--line-control", weightToken: "--weight-control", trackingToken: "--tracking-none" },
  { name: "목록 설명", className: "text-ui-list-detail text-ink-600", sample: "고객 확인 대기", sizeToken: "--text-list-detail", lineToken: "--line-list-detail", weightToken: "--weight-list-detail", trackingToken: "--tracking-none" },
  { name: "데이터", className: "text-ui-data tabular-nums", sample: "v1.0 · 480,000원", sizeToken: "--text-data", lineToken: "--line-data", weightToken: "--weight-data", trackingToken: "--tracking-none" },
  { name: "상태·라벨", className: "text-ui-status text-primary-700", sample: "확인 대기", sizeToken: "--text-xs", lineToken: "--line-label", weightToken: "--weight-status", trackingToken: "--tracking-none" },
  { name: "미세 정보", className: "text-ui-micro text-ink-600", sample: "방금 전 · 작업 ID", sizeToken: "--text-micro", lineToken: "--line-label", weightToken: "--weight-micro", trackingToken: "--tracking-none" },
] as const;

const spacingScale = [
  { name: "3XS", token: "--space-3xs", use: "아이콘 내부·미세 정렬" },
  { name: "2XS", token: "--space-2xs", use: "인접한 조작·라벨 간격" },
  { name: "XS", token: "--space-xs", use: "컨트롤 내부 여백" },
  { name: "SM", token: "--space-sm", use: "기본 카드 여백" },
  { name: "Control gap", token: "--control-gap", use: "버튼 아이콘·라벨 사이" },
  { name: "Compact inset", token: "--control-compact-padding-x", use: "조밀 버튼 좌우 패딩" },
  { name: "Control inset", token: "--control-padding-x", use: "기본 버튼·입력 좌우 패딩" },
  { name: "Row block", token: "--list-row-padding-y", use: "목록 행 상하 패딩" },
  { name: "Gutter", token: "--content-gutter", use: "화면 좌우 여백" },
  { name: "MD", token: "--space-md", use: "넓은 화면 여백·섹션 내부" },
  { name: "LG", token: "--space-lg", use: "섹션 사이 분리" },
  { name: "XL", token: "--space-xl", use: "큰 문맥 전환" },
] as const;

const radiusScale = [
  { name: "Component", token: "--radius-component", use: "버튼·입력·카드·일반 surface" },
  { name: "Sheet", token: "--radius-sheet", use: "하단 시트의 상단 모서리" },
] as const;

const patterns = [
  {
    name: "홈",
    first: "일정 맥락과 지금 필요한 결정",
    middle: "현재 확인된 버전·금액·경로",
    last: "기록 바로가기 · 역할별 하단 내비게이션",
  },
  {
    name: "작업 목록",
    first: "목록 범위와 완료 수",
    middle: "상태가 있는 구분선 행",
    last: "필요할 때만 하단 CTA",
  },
  {
    name: "작업 상세",
    first: "결정 대상과 상태",
    middle: "근거 · 값 · 변경 이력",
    last: "승인 또는 수정 중 한 행동",
  },
  {
    name: "마이페이지",
    first: "이름 · 역할 · 연결 상태",
    middle: "계정과 기록 목록",
    last: "보안 안내 · 연결 종료",
  },
  {
    name: "하단 시트",
    first: "행동을 설명하는 제목",
    middle: "입력 또는 선택 항목",
    last: "취소보다 강한 완료 CTA",
  },
  {
    name: "빈 화면",
    first: "현재 비어 있는 대상",
    middle: "빈 이유와 다음 조건",
    last: "실행 가능한 경우에만 CTA",
  },
];

type PatternItem = (typeof patterns)[number];

const patternColumns: Array<InfoListColumn<PatternItem>> = [
  { id: "screen", label: "화면", cellClassName: "text-ui-control", render: (pattern) => pattern.name },
  { id: "top", label: "상단", cellClassName: "text-sm leading-5 text-ink-600", render: (pattern) => pattern.first },
  { id: "body", label: "본문", cellClassName: "text-sm leading-5 text-ink-600", render: (pattern) => pattern.middle },
  { id: "last", label: "마지막", cellClassName: "text-sm leading-5 text-ink-600", render: (pattern) => pattern.last },
];

export function DesignSystemPage() {
  const [exampleChoice, setExampleChoice] = useState("있음");

  return (
    <main className="min-h-dvh bg-canvas text-ink-900" id="main-content">
      <div className="mx-auto max-w-[1440px] lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10 lg:pr-8">
        <DesignSystemRail groups={designSystemNavigation} />

        <div className="min-w-0 px-5 pb-24 lg:px-0">
          <section className="border-b border-line pt-10 pb-14 md:pt-12 md:pb-16">
            <h1 className="min-w-0 max-w-[760px] break-keep text-ui-title-lg font-extrabold tracking-[var(--tracking-brand)] [overflow-wrap:anywhere]">
              짐확정 디자인 시스템
            </h1>
            <p className="mt-4 max-w-[720px] text-ui-support text-ink-600">
              고객·이사업체·현장기사가 같은 이사 정보를 서로 다른 역할로 확인할 때, 상태와 다음 행동을 일관되게 전달하기 위한 기준입니다.
            </p>
          </section>

          <DocSection id="principles" title="사용 원칙" summary="화면을 구성하기 전에 정보의 역할을 먼저 정합니다.">
            <Subsection id="system-connection" title="문서와 구현의 연결">
              <div className="border-t border-line">
                {systemLayers.map((layer) => (
                  <div className="grid gap-2 border-b border-line px-4 py-4 sm:grid-cols-[6rem_11rem_minmax(0,1fr)] sm:items-start" key={layer.title}>
                    <strong className="text-ui-control leading-5">{layer.title}</strong>
                    <code className="text-xs leading-5 text-ink-600">{layer.source}</code>
                    <p className="text-sm leading-5 text-ink-600">{layer.body}</p>
                  </div>
                ))}
              </div>
            </Subsection>

            <Subsection id="product-principles" title="제품 원칙">
              <div className="grid border-t border-line md:grid-cols-2">
              {principles.map((item) => (
                <article className="border-b border-line px-4 py-5 md:nth-[2n]:border-l" key={item.title}>
                  <h3 className="text-ui-component leading-6 font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-600">{item.body}</p>
                </article>
              ))}
              </div>
            </Subsection>
          </DocSection>

          <DocSection id="foundations" title="기초" summary="Pretendard, 중립 표면, 인디고 상호작용색, 4px 간격 체계를 사용합니다.">
            <section className="scroll-mt-20 mt-8 first:mt-0" id="color-roles">
              <div className="space-y-8">
                {colorGroups.map((group) => (
                  <section key={group.name}>
                    <h3 className="mb-3 text-ui-component">{group.name}</h3>
                    <div className="grid gap-px overflow-hidden rounded-[var(--radius-component)] bg-line [grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]">
                      {group.colors.map((color) => (
                        <article className="min-w-0 bg-surface" key={color.token}>
                          <div aria-hidden="true" className="h-24 w-full sm:h-28" style={{ backgroundColor: `var(${color.token})` }} />
                          <div className="border-t border-line p-3">
                            <strong className="block text-sm">{color.name}</strong>
                            <span className="mt-1 block min-h-10 text-xs leading-5 text-ink-600">{color.use}</span>
                            <code className="mt-2 block break-all text-xs text-ink-600">{color.token}</code>
                            <span className="mt-1 block break-all"><TokenValue token={color.token} /></span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <Subsection id="typography-scale" title="타이포그래피">
              <TypeScaleList />
            </Subsection>

            <Subsection id="spacing-and-shape" title="간격과 형태">
              <TokenTileList aria-label="간격 토큰">
                {spacingScale.map((space) => (
                  <li className="min-w-0 bg-surface p-4" key={space.token}>
                    <div className="flex items-start justify-between gap-3">
                      <strong className="text-ui-control">{space.name}</strong>
                      <TokenValue token={space.token} />
                    </div>
                    <span aria-hidden="true" className="mt-5 block h-2 max-w-full rounded-full bg-primary-600" style={{ width: `min(calc(var(${space.token}) * 2), 100%)` }} />
                    <p className="mt-4 text-sm text-ink-600">{space.use}</p>
                    <code className="mt-1 block break-all text-xs text-ink-400">{space.token}</code>
                  </li>
                ))}
              </TokenTileList>

              <h4 className="mt-8 mb-3 text-ui-component">모서리</h4>
              <TokenTileList aria-label="모서리 토큰">
                {radiusScale.map((radius) => (
                  <li className="min-w-0 bg-surface p-4" key={radius.token}>
                    <span aria-hidden="true" className="block size-14 border border-primary-200 bg-primary-50" style={{ borderRadius: `var(${radius.token})` }} />
                    <strong className="mt-4 block text-ui-control">{radius.name}</strong>
                    <p className="mt-1 text-sm text-ink-600">{radius.use}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <code className="break-all text-xs text-ink-400">{radius.token}</code>
                      <TokenValue token={radius.token} />
                    </div>
                  </li>
                ))}
              </TokenTileList>

            </Subsection>
          </DocSection>

          <DocSection id="components" title="컴포넌트" summary="공통 컴포넌트는 상태와 행동의 차이를 분명하게 보여야 합니다.">
            <ComponentSpecimen
              id="icon-standard"
              title="아이콘"
            >
              <div className="max-w-[680px]">
                <IconRule
                  label="하단 내비게이션"
                  description="모든 탭에 같은 fill 아이콘 계열을 쓰고, 선택 상태는 색과 라벨 두께로만 구분합니다."
                  example={(
                    <span className="flex items-center gap-4">
                      <Home aria-label="홈 비활성" className="text-ink-400" size="var(--icon-md)" weight="fill" />
                      <Home aria-label="홈 활성" className="text-primary-700" size="var(--icon-md)" weight="fill" />
                    </span>
                  )}
                />
                <IconRule
                  label="뒤로가기·닫기·더보기"
                  description="조작 아이콘은 regular 20–24px로 사용합니다."
                  example={<ArrowLeft aria-label="뒤로가기" size="var(--icon-sm)" weight="regular" />}
                />
                <IconRule
                  label="상태·경고·보안"
                  description="본문과 함께 bold 18–20px로 표시합니다."
                  example={<ShieldCheck aria-label="안전하게 연결됨" className="text-success-ink" size="var(--icon-sm)" weight="bold" />}
                />
                <IconRule
                  label="서비스 카테고리"
                  description="실제 사진이 더 적절하지 않은 분류에만 duotone 28–36px를 사용합니다."
                  example={<Camera aria-label="촬영" className="text-primary-700" size="var(--icon-category)" weight="duotone" />}
                />
              </div>
            </ComponentSpecimen>

            <ComponentSpecimen
              id="button-standard"
              title="버튼"
            >
              <h4 className="text-ui-support font-semibold">행동 위계</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button>다음 단계</Button>
                <Button variant="outline">이전</Button>
                <Button variant="secondary">임시 저장</Button>
                <Button variant="destructiveSoft">연결 해제</Button>
                <Button variant="destructive">연결 종료</Button>
              </div>
              <div className="mt-5 max-w-[560px] border-t border-line pt-5">
                <h4 className="text-ui-support font-semibold">크기와 배치</h4>
                <div className="mt-2 grid gap-3 sm:grid-cols-3 sm:items-end">
                  <Button size="chip" variant="secondary">조밀 32</Button>
                  <Button>기본 44</Button>
                  <Button size="cta">주요 CTA 44</Button>
                </div>
              </div>
            </ComponentSpecimen>

            <ComponentSpecimen id="filter-chip-standard" title="필터 칩">
              <div className="flex flex-wrap gap-2">
                <FilterChip active onClick={() => undefined}>전체 12</FilterChip>
                <FilterChip onClick={() => undefined}>거실 5</FilterChip>
                <FilterChip onClick={() => undefined}>침실 3</FilterChip>
              </div>
            </ComponentSpecimen>

            <ComponentSpecimen id="selection-standard" title="선택과 상태">
              <div className="grid gap-6 md:grid-cols-2">
                <ChoiceGroup columns={2} label="엘리베이터 유무" onChange={setExampleChoice} options={["있음", "없음"]} value={exampleChoice} />
                <div>
                  <h4 className="text-ui-support font-semibold">업무 상태</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="primary">확인 대기</Badge>
                    <Badge variant="success">완료</Badge>
                    <Badge variant="warning">주의</Badge>
                    <Badge variant="danger">오류</Badge>
                    <Badge>보조 정보</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="text-ui-support font-semibold">확인 표시</h4>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-ui-support font-bold text-primary-700"><CheckIndicator />시간 협의 가능</span>
                </div>
              </div>
            </ComponentSpecimen>

            <ComponentSpecimen
              id="input-standard"
              title="입력"
            >
              <div className="max-w-[440px]">
                <Label htmlFor="design-system-address">출발지 표시명</Label>
                <Input className="mt-2" id="design-system-address" placeholder="예: 성수동 아파트" />
              </div>
            </ComponentSpecimen>

            <ComponentSpecimen
              id="list-standard"
              title="목록"
            >
              <div className="max-w-[560px]">
                <ListGroup className="mt-0" variant="plain">
                  <ListRow description="고객 확인 대기" end="v1.0">범위와 견적</ListRow>
                  <ListRow description="차량·현장기사 배정 완료" end={<Badge variant="success">확정</Badge>}>배차</ListRow>
                  <ListRow
                    description="완료 사진과 최종 금액"
                    leading={<img alt="완료 사진 예시" className="size-[72px] rounded-[var(--radius-component)] object-cover" height="72" loading="lazy" src="/room-after-evidence.png" width="72" />}
                  >완료 기록</ListRow>
                </ListGroup>
              </div>
            </ComponentSpecimen>

          </DocSection>

          <DocSection id="patterns" title="조합 규칙" summary="페이지 유형마다 상태·근거·행동이 나타나는 순서를 고정합니다.">
            <Subsection id="screen-order" title="화면 유형별 순서">
              <InfoList
                aria-label="화면 유형별 정보 순서"
                columns={patternColumns}
                getKey={(pattern) => pattern.name}
                gridTemplateColumns="7rem repeat(3, minmax(0, 1fr))"
                items={patterns}
                minWidth="760px"
                variant="contained"
              />
            </Subsection>
          </DocSection>
        </div>
      </div>
    </main>
  );
}

function DocSection({
  children,
  id,
  summary,
  title,
}: {
  children: ReactNode;
  id: string;
  summary: string;
  title: string;
}) {
  return (
    <section className="scroll-mt-20 py-10 md:py-12" id={id}>
      <div className="mb-6">
        <h2 className="min-w-0 text-ui-section [overflow-wrap:anywhere]">{title}</h2>
        <p className="mt-2 max-w-[680px] text-ui-support leading-6 text-ink-600">{summary}</p>
      </div>
      {children}
    </section>
  );
}

function Subsection({ children, id, title }: { children: ReactNode; id?: string; title: string }) {
  return (
    <section className="scroll-mt-20 mt-8 first:mt-0" id={id}>
      <h3 className="mb-3 text-ui-component leading-6 font-bold">{title}</h3>
      {children}
    </section>
  );
}

function ComponentSpecimen({
  children,
  id,
  title,
}: {
  children: ReactNode;
  id: string;
  title: string;
}) {
  return (
    <section className="scroll-mt-20 mt-8 first:mt-0" id={id}>
      <h3 className="text-ui-component leading-6 font-bold">{title}</h3>
      <div className="mt-4 rounded-[var(--radius-component)] bg-surface p-4 md:p-5">
        {children}
      </div>
    </section>
  );
}

function TypeScaleList() {
  return (
    <ul aria-label="타이포그래피 역할" className="divide-y divide-line overflow-hidden rounded-[var(--radius-component)] bg-surface">
      {typeScale.map((type) => (
        <li className="grid gap-4 px-4 py-5 md:grid-cols-[minmax(0,1fr)_minmax(22rem,0.85fr)] md:items-center md:gap-8" key={type.name}>
          <p className={type.className}>{type.sample}</p>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-ink-600">
              <strong className="text-ui-control text-ink-900">{type.name}</strong>
              <span className="tabular-nums"><TokenValue token={type.sizeToken} /> / <TokenValue token={type.lineToken} /> · <TokenValue token={type.weightToken} /> · <TokenValue token={type.trackingToken} /></span>
            </div>
            <code className="mt-1 block break-all text-xs leading-4 text-ink-400">{type.sizeToken} · {type.lineToken} · {type.weightToken} · {type.trackingToken}</code>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TokenTileList({ children, ...props }: { children: ReactNode } & ComponentProps<"ul">) {
  return (
    <ul
      className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-component)] bg-line sm:grid-cols-2 xl:grid-cols-4"
      {...props}
    >
      {children}
    </ul>
  );
}

function TokenValue({ token }: { token: string }) {
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return <code className="text-xs text-ink-600">{value || token}</code>;
}

function IconRule({
  description,
  example,
  label,
}: {
  description: string;
  example: ReactNode;
  label: string;
}) {
  return (
    <div className="grid min-h-20 grid-cols-[4rem_minmax(0,1fr)] items-center gap-4 border-b border-line py-4 last:border-b-0 sm:grid-cols-[6rem_10rem_minmax(0,1fr)]">
      <span className="flex min-h-12 items-center justify-center rounded-[var(--radius-component)] bg-surface-muted text-ink-600">{example}</span>
      <strong className="text-sm">{label}</strong>
      <span className="col-start-2 text-sm leading-5 text-ink-600 sm:col-start-auto">{description}</span>
    </div>
  );
}
