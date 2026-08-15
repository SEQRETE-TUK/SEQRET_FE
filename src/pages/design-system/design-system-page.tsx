import {
  ArrowLeftIcon as ArrowLeft,
  CameraIcon as Camera,
  CheckIcon as Check,
  CaretRightIcon as ChevronRight,
  ArrowSquareOutIcon as ExternalLink,
  HouseIcon as Home,
} from "@phosphor-icons/react";
import {
  SecurityStatusIcon as ShieldCheck,
} from "@/components/icons";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListGroup, ListRow, PriorityFacts } from "@/components/layout/app-primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const navigation = [
  ["principles", "사용 원칙"],
  ["foundations", "기초"],
  ["components", "컴포넌트"],
  ["patterns", "화면 패턴"],
  ["roles", "역할별 적용"],
  ["quality", "검수 기준"],
] as const;

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

const colors = [
  { name: "Primary", token: "--color-accent", use: "주요 CTA · 선택 · 현재 단계", className: "bg-primary-600" },
  { name: "Primary soft", token: "--color-accent-50", use: "선택 배경 · 정보 상태", className: "bg-primary-50" },
  { name: "Ink", token: "--color-ink", use: "제목 · 본문 핵심 정보", className: "bg-ink-900" },
  { name: "Muted ink", token: "--color-ink-2", use: "설명 · 보조 상태", className: "bg-ink-600" },
  { name: "Surface", token: "--color-paper-2", use: "앱 화면 · 시트 · 입력 표면", className: "bg-surface" },
  { name: "Rule", token: "--color-rule", use: "목록 구분 · 입력 테두리", className: "bg-line" },
  { name: "Success", token: "--color-success", use: "완료 · 연결됨", className: "bg-success" },
  { name: "Warning", token: "--color-warning", use: "대기 · 현장 주의", className: "bg-warning" },
  { name: "Danger", token: "--color-danger", use: "오류 · 종료 · 거절", className: "bg-danger" },
];

const typeScale = [
  { name: "화면 제목", spec: "28–32 / 1.2 · 800", className: "text-[30px] leading-[1.2] font-extrabold", sample: "이사 준비 현황" },
  { name: "상단 제목", spec: "22 / 1.27 · 800", className: "text-[22px] leading-7 font-extrabold", sample: "오늘 작업" },
  { name: "섹션 제목", spec: "22 / 1.3 · 800", className: "app-section-title", sample: "확인할 내용" },
  { name: "본문", spec: "16 / 1.5 · 500", className: "text-base leading-6", sample: "현재 상태와 다음 작업을 설명합니다." },
  { name: "보조 정보", spec: "14 / 1.43 · 500", className: "text-sm leading-5 text-ink-600", sample: "1월 15일 화요일 · 오전 10:00" },
  { name: "상태", spec: "12 / 1.33 · 700", className: "text-xs font-bold text-primary-700", sample: "확인 대기" },
];

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

const roleGuides = [
  {
    role: "고객",
    intent: "내 결정이 필요한 변경과 현재 합의 기준을 놓치지 않게 한다.",
    order: "결정 요청 → 현재 버전·금액 → 기록과 준비",
    primary: "범위·변경·완료 확인",
  },
  {
    role: "이사업체",
    intent: "운영이 멈춘 지점과 처리 순서를 빠르게 판단한다.",
    order: "우선 처리 → 현재 기준 → 배차·현장 변경·문서",
    primary: "범위·배차·현장 이슈 처리",
  },
  {
    role: "현장기사",
    intent: "도착 후 행동을 순서대로 수행하고 기록을 남긴다.",
    order: "체크인·다음 행동 → 확인된 범위 → 경로·배차 → 현장 기록",
    primary: "체크인 또는 작업 이어가기",
  },
];

const checks = [
  "상단 제목만 읽어도 화면의 목적을 알 수 있다.",
  "스크롤 전 영역에 현재 상태와 다음 행동이 보인다.",
  "같은 위계의 텍스트는 같은 크기·두께·색을 사용한다.",
  "44px 미만의 터치 영역과 12px 미만의 본문 텍스트가 없다.",
  "아이콘 없이도 버튼과 목록의 의미를 이해할 수 있다.",
  "오류·대기·빈 상태가 원인과 다음 행동을 함께 설명한다.",
  "320·375·414·768px에서 가로 스크롤과 잘림이 없다.",
];

export function DesignSystemPage() {
  return (
    <main className="min-h-dvh bg-canvas text-ink-900" id="main-content">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-line bg-surface/98 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center justify-between gap-4 px-5 lg:px-8">
          <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink-600" to="/">
            <ArrowLeft aria-hidden="true" className="size-4" />
            서비스로 돌아가기
          </Link>
          <Badge variant="primary">Product UI v1.4</Badge>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:px-8">
        <aside className="no-scrollbar overflow-x-auto border-b border-line px-5 py-3 lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:overflow-visible lg:border-r lg:border-b-0 lg:px-0 lg:py-8">
          <nav aria-label="디자인 시스템 목차" className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col lg:pr-8">
            {navigation.map(([id, label]) => (
              <a className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-ink-600 hover:bg-surface-muted" href={`#${id}`} key={id}>
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 px-5 pb-24 lg:px-0">
          <section className="border-b border-line py-12 md:py-16">
            <p className="text-sm font-bold text-primary-700">SEQRET 디자인 시스템</p>
            <h1 className="mt-3 max-w-[760px] text-[34px] leading-[1.18] font-extrabold tracking-[-0.045em] md:text-[48px]">
              제품 화면의 공통 기준
            </h1>
            <p className="mt-5 max-w-[720px] text-base leading-7 text-ink-600 md:text-lg">
              고객·이사업체·현장기사가 같은 이사 정보를 서로 다른 역할로 확인할 때, 상태와 다음 행동을 일관되게 전달하기 위한 기준입니다.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Button nativeButton={false} render={<Link to="/consumer" />}>고객 화면 보기 <ChevronRight aria-hidden="true" /></Button>
              <Button nativeButton={false} render={<Link to="/provider" />} variant="outline">업체 화면 보기</Button>
              <Button nativeButton={false} render={<Link to="/crew" />} variant="outline">현장 화면 보기</Button>
            </div>
          </section>

          <DocSection id="principles" kicker="01" title="사용 원칙" summary="화면을 구성하기 전에 정보의 역할을 먼저 정합니다.">
            <div className="grid border-t border-line md:grid-cols-2">
              {principles.map((item, index) => (
                <article className="border-b border-line py-5 md:px-5 md:first:pl-0 md:nth-[2n]:border-l" key={item.title}>
                  <p className="text-xs font-bold text-ink-400">{String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 text-lg font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-600">{item.body}</p>
                </article>
              ))}
            </div>
          </DocSection>

          <DocSection id="foundations" kicker="02" title="기초" summary="Pretendard, 중립 표면, 인디고 상호작용색, 4px 간격 체계를 사용합니다.">
            <Subsection title="색상 역할">
              <div className="border-t border-line">
                {colors.map((color) => (
                  <div className="grid min-h-16 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 border-b border-line py-3 sm:grid-cols-[2.5rem_9rem_12rem_minmax(0,1fr)]" key={color.token}>
                    <span aria-hidden="true" className={`size-8 rounded-lg border border-line ${color.className}`} />
                    <strong className="text-sm">{color.name}</strong>
                    <code className="hidden text-xs text-ink-600 sm:block">{color.token}</code>
                    <span className="col-start-2 text-sm text-ink-600 sm:col-start-auto">{color.use}</span>
                  </div>
                ))}
              </div>
            </Subsection>

            <Subsection title="타이포그래피">
              <div className="border-t border-line">
                {typeScale.map((type) => (
                  <div className="grid gap-2 border-b border-line py-5 md:grid-cols-[9rem_minmax(0,1fr)]" key={type.name}>
                    <div>
                      <strong className="block text-sm">{type.name}</strong>
                      <span className="mt-1 block text-xs text-ink-600">{type.spec}</span>
                    </div>
                    <p className={type.className}>{type.sample}</p>
                  </div>
                ))}
              </div>
            </Subsection>

            <Subsection title="간격과 형태">
              <dl className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">
                <TokenFact term="간격" description="4 · 8 · 12 · 16 · 24 · 32px" />
                <TokenFact term="화면 여백" description="16–24px" />
                <TokenFact term="목록 행" description="최소 64px" />
                <TokenFact term="입력·버튼" description="12px 모서리" />
                <TokenFact term="작업 카드" description="16px 모서리" />
                <TokenFact term="하단 시트" description="28px 상단 모서리" />
              </dl>
            </Subsection>
          </DocSection>

          <DocSection id="components" kicker="03" title="컴포넌트" summary="공통 컴포넌트는 상태와 행동의 차이를 분명하게 보여야 합니다.">
            <Subsection title="아이콘">
              <div className="max-w-[680px] border-y border-line">
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
              <p className="mt-4 max-w-[680px] text-sm leading-6 text-ink-600">
                시스템 아이콘은 Phosphor 한 세트만 사용합니다. 텍스트만으로 충분한 곳에는 아이콘을 추가하지 않고, 아이콘만으로 의미를 전달하지 않습니다.
              </p>
            </Subsection>

            <Subsection title="버튼">
              <div className="flex flex-wrap gap-2">
                <Button>다음 단계</Button>
                <Button variant="outline">이전</Button>
                <Button variant="secondary">임시 저장</Button>
                <Button variant="destructive">연결 종료</Button>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink-600">주요 버튼은 화면 또는 시트 하나에 한 개를 기본으로 합니다. 동일 위계의 버튼을 나란히 반복하지 않습니다.</p>
            </Subsection>

            <Subsection title="입력">
              <div className="max-w-[440px]">
                <Label htmlFor="design-system-address">출발지 표시명</Label>
                <Input className="mt-2" id="design-system-address" placeholder="예: 성수동 아파트" />
                <p className="mt-2 text-sm text-ink-600">입력 목적이 분명한 라벨과 실제 형식에 가까운 예시를 제공합니다.</p>
              </div>
            </Subsection>

            <Subsection title="상태와 목록 행">
              <div className="max-w-[560px]">
                <ListGroup className="mt-0" variant="plain">
                  <ListRow description="고객 확인 대기" end="v1.0">범위와 견적</ListRow>
                  <ListRow description="차량·현장기사 배정 완료" end={<Badge variant="success">확정</Badge>}>배차</ListRow>
                  <ListRow
                    description="완료 사진과 최종 금액"
                    leading={<img alt="완료 사진 예시" className="size-[72px] rounded-xl object-cover" height="72" loading="lazy" src="/room-after-evidence.png" width="72" />}
                  >완료 기록</ListRow>
                </ListGroup>
              </div>
              <p className="mt-4 max-w-[560px] text-sm leading-6 text-ink-600">목록은 left·contents·right 영역으로 구성합니다. 사진이 판단 근거일 때만 왼쪽 썸네일을 쓰고, 설정·기록 목록은 바깥 카드 없이 화면 구분선으로 묶습니다.</p>
            </Subsection>

            <Subsection title="다음 작업 카드">
              <article className="app-panel max-w-[560px] p-5">
                <p className="text-sm font-bold text-primary-700">다음 작업</p>
                <h3 className="mt-1 text-[22px] leading-7 font-extrabold">업체가 보낸 범위와 견적을 확인해 주세요</h3>
                <div className="mt-4 border-t border-line pt-3">
                  <PriorityFacts items={[{ label: "버전", value: "v1.0" }, { label: "확인 금액", value: "480,000원" }, { label: "작업", value: "24개" }]} />
                </div>
                <Button className="mt-5 w-full">범위와 견적 확인</Button>
              </article>
            </Subsection>
          </DocSection>

          <DocSection id="patterns" kicker="04" title="화면 패턴" summary="페이지 유형마다 정보가 나타나는 순서를 고정합니다.">
            <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-ink-600">
                    <th className="px-3 py-4 font-bold">화면</th>
                    <th className="px-3 py-4 font-bold">상단</th>
                    <th className="px-3 py-4 font-bold">본문</th>
                    <th className="px-3 py-4 font-bold">마지막</th>
                  </tr>
                </thead>
                <tbody>
                  {patterns.map((pattern) => (
                    <tr className="border-b border-line align-top" key={pattern.name}>
                      <th className="px-3 py-4 font-extrabold">{pattern.name}</th>
                      <td className="px-3 py-4 text-ink-600">{pattern.first}</td>
                      <td className="px-3 py-4 text-ink-600">{pattern.middle}</td>
                      <td className="px-3 py-4 text-ink-600">{pattern.last}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Subsection title="모바일 홈 구조">
              <div className="max-w-[390px] overflow-hidden border-y border-line bg-surface">
                <div className="border-b border-line bg-surface px-5 py-4"><p className="text-[22px] font-black tracking-[-0.055em]">SEQRET</p></div>
                <div className="p-5">
                  <p className="text-sm font-bold text-primary-700">8월 23일 이사 · D-7</p>
                  <h3 className="mt-2 text-[28px] leading-9 font-extrabold">고객님, 확인할 내용이 있어요</h3>
                  <div className="mt-5 rounded-[var(--radius-card)] border border-primary-100 bg-primary-50/70 p-5">
                    <Badge variant="primary">공동확인 대기</Badge>
                    <p className="mt-4 text-xl font-extrabold">업체가 작업 범위를 제안했어요</p>
                    <p className="mt-2 text-sm text-ink-600">v1.0 · 1,200,000원 · 4개 항목</p>
                    <Button className="mt-5 w-full">변경 내용 확인</Button>
                  </div>
                  <p className="mt-7 text-lg font-extrabold">현재 기준</p>
                  <div className="mt-3 overflow-hidden border-y border-line">
                    <ExampleRow title="작업 범위" meta="v1.0 · 고객 확인 대기" />
                    <ExampleRow title="확인 금액" meta="1,200,000원" />
                    <ExampleRow title="이사 경로" meta="성수동 → 합정동" />
                  </div>
                </div>
              </div>
            </Subsection>
          </DocSection>

          <DocSection id="roles" kicker="05" title="역할별 적용" summary="같은 기능이라도 역할의 판단 순서에 맞춰 첫 화면을 다르게 구성합니다.">
            <div className="border-t border-line">
              {roleGuides.map((guide) => (
                <article className="grid gap-3 border-b border-line py-6 md:grid-cols-[8rem_minmax(0,1fr)]" key={guide.role}>
                  <h3 className="text-xl font-extrabold">{guide.role}</h3>
                  <dl className="grid gap-3 text-sm sm:grid-cols-3">
                    <div><dt className="font-bold">목적</dt><dd className="mt-1 leading-5 text-ink-600">{guide.intent}</dd></div>
                    <div><dt className="font-bold">정보 순서</dt><dd className="mt-1 leading-5 text-ink-600">{guide.order}</dd></div>
                    <div><dt className="font-bold">주요 행동</dt><dd className="mt-1 leading-5 text-ink-600">{guide.primary}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </DocSection>

          <DocSection id="quality" kicker="06" title="검수 기준" summary="화면 완성 여부는 장식이 아니라 이해·행동·상태 전달로 판단합니다.">
            <ol className="border-t border-line">
              {checks.map((check, index) => (
                <li className="flex min-h-16 items-start gap-3 border-b border-line py-4" key={check}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success-bg text-success-ink"><Check aria-hidden="true" className="size-4" /></span>
                  <span className="pt-1 text-sm leading-5 font-semibold">{check}</span>
                  <span className="ml-auto pt-1 text-xs font-bold text-ink-400">{String(index + 1).padStart(2, "0")}</span>
                </li>
              ))}
            </ol>

            <Subsection title="참고 기준">
              <div className="grid gap-2 text-sm">
                <ReferenceLink href="https://designsystem.line.me/" label="LINE Design System" description="내비게이션, 타이포그래피, 컴포넌트 기준" />
                <ReferenceLink href="https://seed-design.io/" label="SEED Design System" description="Foundation → Component → Pattern 구조" />
                <ReferenceLink href="https://developers-apps-in-toss.toss.im/design/components.html" label="Apps in Toss" description="모바일 공통 컴포넌트의 역할과 조합" />
                <div className="flex min-h-14 items-center gap-3 border-b border-line py-3">
                  <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-primary-700" />
                  <span className="min-w-0"><strong className="block">프로젝트 레퍼런스 이미지</strong><span className="mt-0.5 block text-ink-600">짐싸·이사로·숨고·미소의 정보 밀도와 화면 구조를 참고하며 시각 복제는 하지 않습니다.</span></span>
                </div>
              </div>
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
  kicker,
  summary,
  title,
}: {
  children: ReactNode;
  id: string;
  kicker: string;
  summary: string;
  title: string;
}) {
  return (
    <section className="scroll-mt-20 border-b border-line py-12 md:py-16" id={id}>
      <div className="mb-8">
        <p className="text-xs font-extrabold text-primary-700">{kicker}</p>
        <h2 className="mt-2 text-[28px] leading-9 font-extrabold tracking-[-0.04em] md:text-[32px]">{title}</h2>
        <p className="mt-3 max-w-[680px] text-base leading-6 text-ink-600">{summary}</p>
      </div>
      {children}
    </section>
  );
}

function Subsection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="mt-10 first:mt-0">
      <h3 className="mb-4 text-lg font-extrabold">{title}</h3>
      {children}
    </section>
  );
}

function TokenFact({ description, term }: { description: string; term: string }) {
  return (
    <div className="bg-surface p-4">
      <dt className="text-sm font-bold">{term}</dt>
      <dd className="mt-1 text-sm text-ink-600">{description}</dd>
    </div>
  );
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
      <span className="flex min-h-12 items-center justify-center rounded-xl bg-surface-muted text-ink-600">{example}</span>
      <strong className="text-sm">{label}</strong>
      <span className="col-start-2 text-sm leading-5 text-ink-600 sm:col-start-auto">{description}</span>
    </div>
  );
}

function ExampleRow({
  icon,
  meta,
  title,
  tone = "neutral",
}: {
  icon?: "camera";
  meta: string;
  title: string;
  tone?: "neutral" | "primary" | "success" | "warning";
}) {
  const toneClass = tone === "primary" ? "text-primary-700" : tone === "success" ? "text-success-ink" : tone === "warning" ? "text-warning-ink" : "text-ink-600";
  return (
    <div className="flex min-h-16 items-center gap-3 border-b border-line px-1 last:border-b-0">
      {icon === "camera" ? <Camera aria-hidden="true" className="size-5 shrink-0 text-primary-700" /> : null}
      <span className="min-w-0 flex-1"><strong className="block text-sm">{title}</strong><span className={`mt-0.5 block text-sm ${toneClass}`}>{meta}</span></span>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-400" />
    </div>
  );
}

function ReferenceLink({ description, href, label }: { description: string; href: string; label: string }) {
  return (
    <a className="interactive-row flex min-h-14 items-center gap-3 border-b border-line py-3" href={href} rel="noreferrer" target="_blank">
      <ExternalLink aria-hidden="true" className="size-5 shrink-0 text-primary-700" />
      <span className="min-w-0 flex-1"><strong className="block">{label}</strong><span className="mt-0.5 block text-ink-600">{description}</span></span>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-400" />
    </a>
  );
}
