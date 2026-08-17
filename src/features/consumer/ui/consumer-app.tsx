import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightIcon as ArrowRight,
  ArchiveIcon as Archive,
  ArmchairIcon as Armchair,
  BedIcon as Bed,
  BellIcon as Bell,
  CalendarBlankIcon as Calendar,
  CameraIcon as Camera,
  CaretDownIcon as CaretDown,
  CaretLeftIcon as CaretLeft,
  CaretRightIcon as CaretRight,
  CaretUpIcon as CaretUp,
  CheckIcon as Check,
  ChatCircleDotsIcon as ChatCircleDots,
  CubeIcon as Cube,
  DeskIcon as Desk,
  DotsThreeVerticalIcon as MoreVertical,
  ElevatorIcon as Elevator,
  HouseIcon as Home,
  LampIcon as Lamp,
  MagnifyingGlassIcon as MagnifyingGlass,
  MinusIcon as Minus,
  NotepadIcon as Notepad,
  PackageIcon as Package,
  PlusIcon as Plus,
  SquaresFourIcon as SquaresFour,
  StairsIcon as Stairs,
  TelevisionSimpleIcon as Television,
  TrendUpIcon as TrendUp,
  TruckIcon as Truck,
  XIcon as X,
} from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { mockApiEnabled } from "@/api/mock-api";
import { ConnectedProfile } from "@/components/layout/connected-profile";
import { MobileAppShell, type MobileNavItem } from "@/components/layout/mobile-app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/model/auth-context";
import { CustomerOnboardingSheet } from "@/features/auth/ui/customer-onboarding-sheet";
import {
  apiErrorMessage,
  decideChangeProposal,
  getCompletionSummary,
  getChangeProposal,
  getScopeReview,
  listFieldIssues,
  workflowKeys,
  type CompletionSummary,
  type Connection,
  type FieldIssue,
  type ScopeReview,
} from "@/features/workflow/api/workflow-api";

type ConsumerTab = "home" | "move" | "more";
type ConsumerMoveView = "list" | "info" | "items" | "agreement";

const moneyFormatter = new Intl.NumberFormat("ko-KR");
const renderStartedAt = Date.now();
const dateFormatter = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" });
const fullDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});
const money = (value: number | null | undefined) => value == null ? "금액 확인 중" : `${moneyFormatter.format(value)}원`;

type MoveStopKind = "origin" | "destination";
type ElevatorOption = "있음" | "없음" | "확인 필요";
type ParkingOption = "가능" | "불가능" | "확인 필요";
type MoveStopDraft = {
  address: string;
  detailAddress: string;
  elevator: ElevatorOption;
  floor: string;
  memo: string;
  parking: ParkingOption;
};
type MoveInfoOverrides = {
  schedule: string | null;
  stops: Partial<Record<MoveStopKind, MoveStopDraft>>;
};

const floorOptions = ["반지하", "1층", "2층", "3층", "4층", "5층 이상"];
const elevatorOptions: ElevatorOption[] = ["있음", "없음", "확인 필요"];
const parkingOptions: ParkingOption[] = ["가능", "불가능", "확인 필요"];

function dateTimeLocalValue(date: Date | null) {
  if (!date) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const tabs: MobileNavItem<ConsumerTab>[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "move", label: "내 이사", icon: Notepad },
  { id: "more", label: "더보기", icon: SquaresFour },
];
const validTabs = new Set<ConsumerTab>(tabs.map(({ id }) => id));
const validMoveViews = new Set<ConsumerMoveView>(["list", "info", "items", "agreement"]);

export function ConsumerGuestApp() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const requested = params.get("tab") as ConsumerTab | null;
  const tab = requested && validTabs.has(requested) ? requested : "home";
  const setTab = (next: ConsumerTab) => setParams(next === "home" ? {} : { tab: next, ...(next === "move" ? { view: "list" } : {}) }, { replace: true });
  const header = tab === "home" ? <HomeHeader customerName="고객" onBell={() => setTab("move")} /> : tab === "move" ? <MoveListSafeArea /> : undefined;
  return <>
    <MobileAppShell current={tab} eyebrow="고객" header={header} items={tabs} onChange={setTab} onProfile={() => setTab("more")} title={tab === "home" ? "홈" : tab === "move" ? "내 이사" : "더보기"}>
      {tab === "home" ? <GuestHome onStart={() => setOnboardingOpen(true)} /> : null}
      {tab === "move" ? <EmptyMoveList onNewMove={() => setOnboardingOpen(true)} /> : null}
      {tab === "more" ? <div className="mobile-screen"><h1 className="text-[28px] font-black">더보기</h1><p className="mt-3 text-sm leading-6 text-ink-600">새 이사를 만들면 이사 기록과 연결 정보가 여기에 표시됩니다.</p><Button className="mt-6 w-full" onClick={() => navigate("/")} variant="outline">역할 선택으로 돌아가기</Button></div> : null}
    </MobileAppShell>
    <CustomerOnboardingSheet onOpenChange={setOnboardingOpen} open={onboardingOpen} />
  </>;
}

export function ConsumerApp() {
  const { session, clearSession } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("tab") as ConsumerTab | null;
  const tab = requestedTab && validTabs.has(requestedTab) ? requestedTab : "home";
  const requestedView = params.get("view") as ConsumerMoveView | null;
  const moveView = requestedView && validMoveViews.has(requestedView) ? requestedView : "list";
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const connection: Connection = { accessToken: session!.accessToken, jobId: session!.actor.job_id };

  const scopeQuery = useQuery({ queryKey: workflowKeys.scope(session!.actor.job_id), queryFn: () => getScopeReview(connection) });
  const completionQuery = useQuery({ queryKey: workflowKeys.completion(session!.actor.job_id), queryFn: () => getCompletionSummary(connection) });
  const issuesQuery = useQuery({ queryKey: workflowKeys.fieldIssues(session!.actor.job_id), queryFn: () => listFieldIssues(connection) });

  const setTab = (next: ConsumerTab) => {
    if (next === "home") setParams({}, { replace: true });
    else if (next === "move") setParams({ tab: "move", view: "list" }, { replace: true });
    else setParams({ tab: "more" }, { replace: true });
  };
  const setMoveView = (view: ConsumerMoveView) => setParams({ tab: "move", view }, { replace: true });
  const openAgreement = () => setMoveView("agreement");
  const disconnect = () => { clearSession(); navigate("/"); };

  const header = tab === "home"
    ? <HomeHeader customerName={session!.actor.display_name} onBell={openAgreement} />
    : tab === "move"
      ? moveView === "list"
        ? <MoveListSafeArea />
        : <MoveHeader onBack={() => setMoveView("list")} onMore={() => setTab("more")} scope={scopeQuery.data} />
      : undefined;

  return (
    <>
    <MobileAppShell current={tab} eyebrow={`고객 · ${session!.actor.display_name}`} header={header} items={tabs} onChange={setTab} onProfile={() => setTab("more")} title={tab === "home" ? "홈" : tab === "move" ? "내 이사" : "더보기"}>
      {tab === "home" ? <HomeTab completion={completionQuery.data} onOpenAgreement={openAgreement} onOpenMove={() => setMoveView("info")} onStartMove={() => setOnboardingOpen(true)} scope={scopeQuery.data} /> : null}
      {tab === "move" ? <ConsumerMoveTab completion={completionQuery.data} connection={connection} issues={issuesQuery.data} onCapture={() => navigate("/consumer/capture?mode=video")} onManualAdd={() => navigate("/consumer/capture?mode=manual")} onNewMove={() => setOnboardingOpen(true)} onViewChange={setMoveView} scope={scopeQuery.data} view={moveView} /> : null}
      {tab === "more" ? <ConnectedProfile detail="이사 기록에 연결됨" displayName={session!.actor.display_name} onDisconnect={disconnect} roleLabel="고객" /> : null}
    </MobileAppShell>
    <CustomerOnboardingSheet onOpenChange={setOnboardingOpen} open={onboardingOpen} />
    </>
  );
}

function HomeHeader({ customerName, onBell }: { customerName: string; onBell: () => void }) {
  return (
    <header className="app-safe-header flex items-start justify-between bg-surface px-[var(--content-gutter)] pb-3 pt-4">
      <h1 className="text-[25px] leading-[1.32] font-black tracking-[-0.05em]">{customerName}님,<br />어떤 이사를 준비할까요?</h1>
      <button aria-label="알림 확인" className="mt-1 grid size-11 place-items-center rounded-full text-ink-900 hover:bg-surface-muted" onClick={onBell} type="button"><Bell aria-hidden="true" size={28} /></button>
    </header>
  );
}

function MoveHeader({ onBack, onMore, scope }: { onBack: () => void; onMore: () => void; scope: ScopeReview | undefined }) {
  const title = scope?.job.origin_summary ? `${scope.job.origin_summary} 이사` : "내 이사";
  return (
    <header className="app-safe-header sticky top-0 z-[var(--z-sticky)] grid min-h-[68px] grid-cols-[48px_1fr_48px] items-center bg-surface/98 px-2 backdrop-blur">
      <button aria-label="이사 목록으로 돌아가기" className="grid size-11 place-items-center rounded-full hover:bg-surface-muted" onClick={onBack} type="button"><CaretLeft aria-hidden="true" size={28} weight="bold" /></button>
      <h1 className="truncate text-center text-[22px] font-black tracking-[-0.04em]">{title}</h1>
      <button aria-label="더보기" className="grid size-11 place-items-center rounded-full hover:bg-surface-muted" onClick={onMore} type="button"><MoreVertical aria-hidden="true" size={27} weight="bold" /></button>
    </header>
  );
}

function MoveListSafeArea() {
  return <span aria-hidden="true" className="app-safe-header block bg-surface" />;
}

function HomeTab({ completion, onOpenAgreement, onOpenMove, onStartMove, scope }: { completion: CompletionSummary | undefined; onOpenAgreement: () => void; onOpenMove: () => void; onStartMove: () => void; scope: ScopeReview | undefined }) {
  const scheduledAt = scope?.job.scheduled_at ? new Date(scope.job.scheduled_at) : null;
  const dDay = scheduledAt ? Math.max(0, Math.ceil((scheduledAt.getTime() - renderStartedAt) / 86_400_000)) : null;
  const requiresScopeReview = scope?.scope.status === "customer_review";
  const completed = scope?.scope.status === "confirmed";
  const actionTitle = requiresScopeReview ? "작업범위와 금액 확인" : completed ? "공동확인 내용 보기" : "촬영 결과 확인";
  const actionMeta = scope ? `${scope.job.company_display_name ?? "이사업체"} 제안 · ${money(scope.quote?.total_amount_krw)} · ${scope.scope.version_label}` : "최신 제안을 불러오는 중";
  const currentStep = requiresScopeReview ? 2 : completed ? 3 : 1;

  return (
    <div className="pb-[calc(var(--bottom-rail-height)+2rem)]">
      <section className="px-[var(--content-gutter)]"><NewMoveHero onStart={onStartMove} /></section>

      <section className="mx-[var(--content-gutter)] mt-4 rounded-[var(--radius-feature)] border border-line bg-surface p-3 shadow-[var(--shadow-card)]">
        <h2 className="text-[17px] font-black">진행 중인 이사 1건</h2>
        <button className="mt-1.5 flex min-h-13 w-full items-center gap-3 text-left" onClick={onOpenMove} type="button">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700"><Truck aria-hidden="true" size={27} /></span>
          <span className="min-w-0 flex-1"><strong className="block truncate text-[17px]">{scope ? `${scope.job.origin_summary ?? "출발지"} → ${scope.job.destination_summary ?? "도착지"}` : "이사 정보를 불러오는 중"}</strong><span className="mt-1 block text-sm text-ink-600">{scheduledAt ? dateFormatter.format(scheduledAt) : "일정 확인 중"} {dDay !== null ? <b className="text-primary-700">· D-{dDay}</b> : null}</span></span>
          <CaretRight aria-hidden="true" className="shrink-0 text-ink-400" size={24} />
        </button>
        <JourneyProgress current={currentStep} />
        <div className="mt-2.5 rounded-2xl bg-primary-50 p-2.5">
          <button className="w-full text-left" onClick={onOpenAgreement} type="button"><strong className="block text-[15px] text-primary-700">{actionTitle}</strong><span className="mt-0.5 block text-[13px] text-ink-600">{actionMeta}</span><span className="mt-2 flex min-h-10 w-full items-center justify-center rounded-xl bg-primary-600 text-[15px] font-extrabold text-white">지금 확인</span></button>
        </div>
      </section>

      <PreventionSection />
      {completion?.completion_request?.status === "requested" ? <p className="sr-only">완료 확인 요청이 도착했습니다.</p> : null}
    </div>
  );
}

function NewMoveHero({ onStart }: { onStart: () => void }) {
  return <button className="relative min-h-[174px] w-full overflow-hidden rounded-[var(--radius-feature)] bg-primary-50 px-5 py-4 text-left ring-1 ring-primary-100" onClick={onStart} type="button"><span className="relative z-10 block max-w-[62%]"><strong className="block text-[22px] leading-[1.28] font-black tracking-[-0.04em]">60초 촬영으로<br />준비를 시작해요</strong><span className="mt-1.5 block text-[13px] leading-5 text-ink-600">짐 목록과 작업조건 초안을 만들어요</span><span className="mt-3 flex items-center gap-1 whitespace-nowrap text-sm font-extrabold text-primary-700">새 이사 시작하기 <ArrowRight aria-hidden="true" size={18} weight="bold" /></span></span><img alt="휴대폰으로 이삿짐 상자를 촬영하는 모습" className="absolute -right-6 -bottom-3 w-[170px] max-w-none" height="213" src="/move-capture-hero.png" width="170" /></button>;
}

function PreventionSection() {
  return <section className="mt-4 bg-primary-50/70 px-[var(--content-gutter)] py-5"><h2 className="text-[20px] font-black tracking-[-0.035em]">추가금이 생기는 순간</h2><p className="mt-1 text-sm text-ink-600">미리 확인하면 당일 변경을 줄일 수 있어요</p><div className="no-scrollbar -mx-[var(--content-gutter)] mt-4 flex snap-x gap-3 overflow-x-auto px-[var(--content-gutter)] pb-1"><PreventionCard iconSrc="/prevention-condition.svg" label="작업조건 차이" title="엘리베이터·계단 조건이 달랐어요" /><PreventionCard iconSrc="/prevention-inventory.svg" label="짐 목록 차이" title="촬영 후 큰 짐이 추가됐어요" /><PreventionCard iconSrc="/prevention-work.svg" label="추가 작업" title="분해·설치 작업이 빠졌어요" /></div></section>;
}

function GuestHome({ onStart }: { onStart: () => void }) {
  return <div className="pb-[calc(var(--bottom-rail-height)+2rem)]"><section className="px-[var(--content-gutter)]"><NewMoveHero onStart={onStart} /></section><section className="mx-[var(--content-gutter)] mt-4 rounded-[var(--radius-feature)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]"><h2 className="text-[17px] font-black">진행 중인 이사가 없어요</h2><p className="mt-2 text-sm leading-6 text-ink-600">새 이사를 만들면 촬영부터 공동확인까지 한곳에서 이어집니다.</p></section><PreventionSection /></div>;
}

function JourneyProgress({ current }: { current: number }) {
  const steps = ["촬영과 짐 검수", "작업범위와\n금액 확인", "공동확인 완료"];
  return <ol className="mt-3 grid grid-cols-3">{steps.map((label, index) => { const step = index + 1; const done = step < current; const active = step === current; return <li className="relative text-center" key={label}>{index > 0 ? <span aria-hidden="true" className={`absolute top-3.5 right-1/2 h-0.5 w-full ${step <= current ? "bg-success" : "bg-line"}`} /> : null}<span className={`relative z-10 mx-auto grid size-7 place-items-center rounded-full border-2 text-xs font-black ${done ? "border-success bg-success text-white" : active ? "border-primary-600 bg-primary-600 text-white" : "border-line bg-surface text-ink-400"}`}>{done ? <Check aria-hidden="true" size={15} weight="bold" /> : step}</span><span className={`mt-1.5 block whitespace-pre-line text-[10px] leading-3.5 font-bold ${active ? "text-primary-700" : done ? "text-ink-900" : "text-ink-600"}`}>{label}</span></li>; })}</ol>;
}

function PreventionCard({ iconSrc, label, title }: { iconSrc: string; label: string; title: string }) {
  return <article className="flex min-h-[176px] w-[170px] shrink-0 snap-start flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)]"><span className="grid size-14 place-items-center rounded-2xl bg-surface-muted"><img alt="" aria-hidden="true" className="size-11 object-contain" height="44" loading="lazy" src={iconSrc} width="44" /></span><div className="mt-auto pt-4"><p className="text-[12px] font-extrabold text-primary-700">{label}</p><h3 className="mt-1.5 text-[15px] leading-5 font-extrabold">{title}</h3></div></article>;
}

function EmptyMoveList({ onNewMove }: { onNewMove: () => void }) {
  return <div className="px-[var(--content-gutter)] pb-28 pt-5"><div className="flex items-center justify-between gap-3"><h1 className="text-[30px] font-black tracking-[-0.05em]">내 이사</h1><button className="min-h-11 whitespace-nowrap px-2 text-sm font-extrabold text-primary-700" onClick={onNewMove} type="button">+ 새 이사</button></div><div className="mt-6 grid grid-cols-2 border-b border-line" role="tablist" aria-label="이사 목록"><button aria-selected="true" className="relative min-h-13 font-extrabold text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" role="tab" type="button">진행 중 0</button><button aria-selected="false" className="min-h-13 font-bold text-ink-600" role="tab" type="button">기록 0</button></div><section className="mt-8 rounded-[var(--radius-feature)] border border-line bg-surface px-5 py-8 text-center shadow-[var(--shadow-card)]"><Archive aria-hidden="true" className="mx-auto text-ink-400" size={34} /><h2 className="mt-4 text-lg font-black">아직 이사 기록이 없어요</h2><p className="mt-2 text-sm leading-6 text-ink-600">새 이사를 만들면 진행 상황과 최종 기록을 확인할 수 있어요.</p><Button className="mt-5 w-full" onClick={onNewMove}>새 이사 시작</Button></section></div>;
}

function ConsumerMoveList({ completion, onNewMove, onOpen, scope }: { completion: CompletionSummary | undefined; onNewMove: () => void; onOpen: () => void; scope: ScopeReview | undefined }) {
  const completed = completion?.job_status === "completed";
  const [listTab, setListTab] = useState<"active" | "history">(completed ? "history" : "active");
  const showCurrentMove = listTab === (completed ? "history" : "active");
  const scheduledAt = scope?.job.scheduled_at ? new Date(scope.job.scheduled_at) : null;
  const adjustmentCount = scope?.quote?.adjustments.length ?? 0;
  const historyCount = (completed ? 1 : 0) + (mockApiEnabled ? 2 : 0);
  return <div className="px-[var(--content-gutter)] pb-28 pt-5">
    <div className="flex items-center justify-between gap-3"><h1 className="text-[30px] font-black tracking-[-0.05em]">내 이사</h1><button className="min-h-11 whitespace-nowrap px-2 text-sm font-extrabold text-primary-700" onClick={onNewMove} type="button">+ 새 이사</button></div>
    <div className="mt-6 grid grid-cols-2 border-b border-line" role="tablist" aria-label="이사 목록">
      <button aria-selected={listTab === "active"} className={`relative min-h-13 font-extrabold ${listTab === "active" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("active")} role="tab" type="button">진행 중 {completed ? 0 : 1}</button>
      <button aria-selected={listTab === "history"} className={`relative min-h-13 font-extrabold ${listTab === "history" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("history")} role="tab" type="button">기록 {historyCount}</button>
    </div>
    {showCurrentMove ? <button className="mt-5 w-full rounded-[var(--radius-feature)] border border-line bg-surface p-5 text-left shadow-[var(--shadow-card)]" onClick={onOpen} type="button">
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${completed ? "bg-success-bg text-success-ink" : "bg-primary-50 text-primary-700"}`}>{completed ? "완료" : "진행 중"}</span>
      <strong className="mt-4 flex items-center justify-between gap-3 text-[20px] tracking-[-0.035em]"><span className="min-w-0 truncate">{scope ? `${scope.job.origin_summary ?? "출발지"} → ${scope.job.destination_summary ?? "도착지"}` : "이사 정보를 불러오는 중"}</span><CaretRight aria-hidden="true" className="shrink-0 text-ink-400" size={22} /></strong>
      <span className="mt-2 block text-sm text-ink-600">{scheduledAt ? fullDateFormatter.format(scheduledAt) : "일정 확인 중"}</span>
      <span className="mt-5 block border-t border-line pt-4 text-sm">{completed ? "최종" : "현재"} 확인서 <b>{scope?.scope.version_label ?? "–"}</b><span className="mx-2 text-line">|</span><b className="text-primary-700">{money(completion?.final_amount_krw ?? scope?.quote?.total_amount_krw)}</b></span>
      <span className="mt-4 grid grid-cols-3 divide-x divide-line text-center text-xs text-ink-600"><span><Package aria-hidden="true" className="mx-auto mb-1" size={20} />짐 {scope?.scope.item_count ?? "–"}개</span><span><Notepad aria-hidden="true" className="mx-auto mb-1" size={20} />확인서 {scope?.scope.version_label ?? "–"}</span><span><TrendUp aria-hidden="true" className="mx-auto mb-1" size={20} />변경 {adjustmentCount}건</span></span>
    </button> : listTab === "history" && mockApiEnabled ? <div className="mt-5 space-y-3"><MoveHistoryCard amount="1,430,000원" changes={1} date="2026년 5월 18일" destination="자양동 오피스텔" items={21} origin="성수동 원룸" version="v4" /><MoveHistoryCard amount="620,000원" changes={0} date="2025년 8월 25일" destination="성수동 원룸" items={12} origin="건대입구 원룸" version="v2" /></div> : <section className="mt-5 rounded-[var(--radius-feature)] border border-line bg-surface px-5 py-8 text-center"><Archive aria-hidden="true" className="mx-auto text-ink-400" size={32} /><h2 className="mt-3 font-black">{listTab === "active" ? "진행 중인 이사가 없어요" : "완료된 이사가 없어요"}</h2></section>}
  </div>;
}

function MoveHistoryCard({ amount, changes, date, destination, items, origin, version }: { amount: string; changes: number; date: string; destination: string; items: number; origin: string; version: string }) {
  return <article className="rounded-[var(--radius-feature)] border border-line bg-surface p-5"><span className="inline-flex rounded-full bg-success-bg px-3 py-1 text-xs font-extrabold text-success-ink"><Check aria-hidden="true" className="mr-1" size={15} weight="bold" />완료</span><h2 className="mt-4 text-[20px] font-black tracking-[-0.035em]">{origin} → {destination}</h2><p className="mt-2 text-sm text-ink-600">{date}</p><p className="mt-4 border-t border-line pt-4 text-sm">최종 확인서 <strong>{version}</strong><span className="mx-2 text-line">|</span>최종 금액 <strong className="text-primary-700">{amount}</strong></p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-600"><span className="inline-flex items-center gap-1"><Package aria-hidden="true" size={18} />짐 {items}개</span><span className="inline-flex items-center gap-1"><Notepad aria-hidden="true" size={18} />확인서 {version}</span><span className="inline-flex items-center gap-1"><TrendUp aria-hidden="true" size={18} />변경 {changes}건</span></div></article>;
}

function ConsumerMoveTab({ completion, connection, issues, onCapture, onManualAdd, onNewMove, onViewChange, scope, view }: { completion: CompletionSummary | undefined; connection: Connection; issues: FieldIssue[] | undefined; onCapture: () => void; onManualAdd: () => void; onNewMove: () => void; onViewChange: (view: ConsumerMoveView) => void; scope: ScopeReview | undefined; view: ConsumerMoveView }) {
  const [infoOverrides, setInfoOverrides] = useState<MoveInfoOverrides>({ schedule: null, stops: {} });
  if (view === "list") return <ConsumerMoveList completion={completion} onNewMove={onNewMove} onOpen={() => onViewChange("info")} scope={scope} />;
  return <><MoveTabs current={view} onChange={onViewChange} />{view === "info" ? <MoveInfo onChange={setInfoOverrides} scope={scope} value={infoOverrides} /> : null}{view === "items" ? <ConsumerInventory onCapture={onCapture} onManualAdd={onManualAdd} scope={scope} /> : null}{view === "agreement" ? <ConsumerAgreement completion={completion} connection={connection} issues={issues} scope={scope} /> : null}</>;
}

function MoveTabs({ current, onChange }: { current: ConsumerMoveView; onChange: (view: ConsumerMoveView) => void }) {
  const items: Array<{ id: ConsumerMoveView; label: string }> = [{ id: "info", label: "이사 정보" }, { id: "items", label: "짐 목록" }, { id: "agreement", label: "확인서" }];
  return <div aria-label="내 이사 메뉴" className="sticky top-[68px] z-[calc(var(--z-sticky)-1)] grid grid-cols-3 border-b border-line bg-surface" role="tablist">{items.map((item) => { const active = item.id === current; return <button aria-selected={active} className={`relative min-h-14 text-[15px] font-bold ${active ? "text-primary-700 after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} key={item.id} onClick={() => onChange(item.id)} role="tab" type="button">{item.label}</button>; })}</div>;
}

function MoveInfo({ onChange, scope, value }: { onChange: (value: MoveInfoOverrides) => void; scope: ScopeReview | undefined; value: MoveInfoOverrides }) {
  const sourceSchedule = scope?.job.scheduled_at ? new Date(scope.job.scheduled_at) : null;
  const [scheduleDraft, setScheduleDraft] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<MoveStopKind | null>(null);
  const [stopDraft, setStopDraft] = useState<MoveStopDraft | null>(null);
  const scheduledAt = value.schedule ? new Date(value.schedule) : sourceSchedule;
  const dDay = scheduledAt ? Math.max(0, Math.ceil((scheduledAt.getTime() - renderStartedAt) / 86_400_000)) : null;

  const defaultStop = (kind: MoveStopKind): MoveStopDraft => ({
    address: kind === "origin" ? scope?.job.origin_summary ?? "" : scope?.job.destination_summary ?? "",
    detailAddress: "",
    elevator: kind === "origin" ? "없음" : "있음",
    floor: kind === "origin" ? "3층" : "5층 이상",
    memo: "",
    parking: kind === "origin" ? "가능" : "확인 필요",
  });
  const getStop = (kind: MoveStopKind) => value.stops[kind] ?? defaultStop(kind);
  const openStopEditor = (kind: MoveStopKind) => {
    setEditingStop(kind);
    setStopDraft({ ...getStop(kind) });
  };
  const saveStop = () => {
    if (!editingStop || !stopDraft?.address.trim()) return;
    onChange({ ...value, stops: { ...value.stops, [editingStop]: { ...stopDraft, address: stopDraft.address.trim(), detailAddress: stopDraft.detailAddress.trim(), memo: stopDraft.memo.trim() } } });
    setEditingStop(null);
  };
  const openScheduleEditor = () => {
    setScheduleDraft(value.schedule ?? dateTimeLocalValue(sourceSchedule));
    setScheduleOpen(true);
  };

  return (
    <div className="space-y-2.5 px-[var(--content-gutter)] pb-28 pt-3">
      <InfoCard title="이사 일정"><div className="flex items-center gap-3"><Calendar aria-hidden="true" className="shrink-0" size={28} /><strong className="min-w-0 flex-1 text-[16px] leading-5">{scheduledAt ? fullDateFormatter.format(scheduledAt) : "일정을 입력해 주세요"}</strong>{dDay !== null ? <span className="whitespace-nowrap rounded-lg bg-primary-50 px-2 py-1.5 text-[13px] font-extrabold text-primary-700">D-{dDay}</span> : null}<button className="min-h-11 whitespace-nowrap px-1 text-sm font-extrabold text-primary-700" onClick={openScheduleEditor} type="button">수정</button></div></InfoCard>
      <InfoCard title="이동 경로"><div className="relative pl-12"><span aria-hidden="true" className="absolute top-4 bottom-4 left-[14px] w-0.5 bg-primary-600" /><RoutePoint label="출발지" onEdit={() => openStopEditor("origin")} stop={getStop("origin")} /><RoutePoint destination label="도착지" onEdit={() => openStopEditor("destination")} stop={getStop("destination")} /></div></InfoCard>
      <aside className="flex items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3 text-sm text-ink-600"><TrendUp aria-hidden="true" size={22} /> 처음 확인한 뒤 수정된 정보는 확인서 변경 이력에 기록돼요.</aside>

      <Sheet onOpenChange={setScheduleOpen} open={scheduleOpen}>
        <SheetContent presentation="page">
          <SheetHeader className="border-b border-line px-16 pb-5 pt-[max(18px,env(safe-area-inset-top))] text-center"><SheetTitle>이사 일정 수정</SheetTitle><SheetDescription>날짜와 시작 시간을 확인해 주세요.</SheetDescription></SheetHeader>
          <div className="px-5 py-6"><Label htmlFor="move-schedule">이사 날짜와 시간</Label><Input className="mt-2" id="move-schedule" onChange={(event) => setScheduleDraft(event.target.value)} type="datetime-local" value={scheduleDraft} /></div>
          <SheetFooter><Button className="w-full" disabled={!scheduleDraft} onClick={() => { onChange({ ...value, schedule: scheduleDraft }); setScheduleOpen(false); }} size="cta">일정 저장</Button></SheetFooter>
        </SheetContent>
      </Sheet>

      <MoveStopSheet draft={stopDraft} kind={editingStop} onDraftChange={setStopDraft} onOpenChange={(open) => { if (!open) setEditingStop(null); }} onSave={saveStop} />
    </div>
  );
}

function InfoCard({ children, title }: { children: ReactNode; title: string }) { return <section className="rounded-[var(--radius-card)] border border-line bg-surface p-3 shadow-[var(--shadow-card)]"><h2 className="mb-2.5 text-[16px] font-black">{title}</h2>{children}</section>; }

function RoutePoint({ destination = false, label, onEdit, stop }: { destination?: boolean; label: string; onEdit: () => void; stop: MoveStopDraft }) {
  const conditions = [stop.floor, `엘리베이터 ${stop.elevator}`, `주차 ${stop.parking}`];
  return <div className={destination ? "relative mt-6" : "relative"}><span aria-hidden="true" className="absolute top-1 -left-[46px] size-5 rounded-full border-[5px] border-primary-600 bg-surface" /><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-[13px] font-extrabold text-primary-700">{label}</p><strong className="mt-0.5 block text-[15px]">{stop.address || `${label}를 입력해 주세요`}</strong>{stop.detailAddress ? <span className="mt-0.5 block text-[12px] text-ink-600">{stop.detailAddress}</span> : null}</div><button className="min-h-11 whitespace-nowrap px-1 text-sm font-extrabold text-primary-700" onClick={onEdit} type="button">수정</button></div><div className="mt-1.5 flex flex-wrap gap-1.5">{conditions.map((condition, index) => <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${index === conditions.length - 1 && stop.parking === "확인 필요" ? "bg-warning-bg text-warning-ink" : "bg-surface-muted text-ink-600"}`} key={condition}>{condition}</span>)}</div></div>;
}

function ChoiceRow<T extends string>({ label, onChange, options, value }: { label: string; onChange: (value: T) => void; options: readonly T[]; value: T }) {
  return <fieldset><legend className="text-[15px] font-extrabold">{label}</legend><div className="mt-2 grid grid-cols-3 gap-2">{options.map((option) => <button aria-pressed={option === value} className={`min-h-12 rounded-xl border px-2 text-sm font-bold ${option === value ? "border-primary-600 bg-primary-50 text-primary-700" : "border-line bg-surface text-ink-600"}`} key={option} onClick={() => onChange(option)} type="button">{option}</button>)}</div></fieldset>;
}

function MoveStopSheet({ draft, kind, onDraftChange, onOpenChange, onSave }: { draft: MoveStopDraft | null; kind: MoveStopKind | null; onDraftChange: (draft: MoveStopDraft) => void; onOpenChange: (open: boolean) => void; onSave: () => void }) {
  const update = <K extends keyof MoveStopDraft>(key: K, value: MoveStopDraft[K]) => draft && onDraftChange({ ...draft, [key]: value });
  return <Sheet onOpenChange={onOpenChange} open={Boolean(kind)}><SheetContent presentation="page"><SheetHeader className="border-b border-line px-16 pb-5 pt-[max(18px,env(safe-area-inset-top))] text-center"><SheetTitle>{kind === "origin" ? "출발지" : "도착지"} 정보 수정</SheetTitle><SheetDescription>운반 조건이 달라지면 금액이 변경될 수 있어요.</SheetDescription></SheetHeader>{draft ? <div className="space-y-7 px-5 py-6"><section className="space-y-4"><div><Label htmlFor="move-address">주소</Label><Input className="mt-2" id="move-address" onChange={(event) => update("address", event.target.value)} value={draft.address} /></div><div><Label htmlFor="move-detail-address">상세 주소</Label><Input className="mt-2" id="move-detail-address" onChange={(event) => update("detailAddress", event.target.value)} placeholder="예: 301호" value={draft.detailAddress} /></div></section><section className="space-y-6 border-t border-line pt-6"><h3 className="text-[20px] font-black">운반 조건</h3><ChoiceRow label="층수" onChange={(value) => update("floor", value)} options={floorOptions} value={draft.floor} /><ChoiceRow label="엘리베이터" onChange={(value) => update("elevator", value)} options={elevatorOptions} value={draft.elevator} />{draft.elevator === "없음" ? <p className="rounded-xl border border-warning bg-warning-bg px-4 py-3 text-sm text-warning-ink">엘리베이터가 없으면 계단 운반 비용이 추가될 수 있어요.</p> : null}</section><section className="space-y-5 border-t border-line pt-6"><h3 className="text-[20px] font-black">차량 접근</h3><ChoiceRow label="건물 앞에 이사 차량이 정차할 수 있나요?" onChange={(value) => update("parking", value)} options={parkingOptions} value={draft.parking} /></section><section className="border-t border-line pt-6"><Label htmlFor="move-stop-memo">현장 메모 <span className="font-medium text-ink-400">(선택)</span></Label><Textarea className="mt-2" id="move-stop-memo" maxLength={200} onChange={(event) => update("memo", event.target.value)} placeholder="기사에게 알려둘 내용을 적어 주세요." value={draft.memo} /></section></div> : null}<SheetFooter><Button className="w-full" disabled={!draft?.address.trim()} onClick={onSave} size="cta">변경 내용 저장</Button></SheetFooter></SheetContent></Sheet>;
}

function ConsumerInventory({ onCapture, onManualAdd, scope }: { onCapture: () => void; onManualAdd: () => void; scope: ScopeReview | undefined }) {
  const [openRoom, setOpenRoom] = useState("");
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const groups = scope?.scope.room_groups ?? [];
  const allItems = groups.flatMap((group) => group.items);
  const quantityFor = (itemKey: string) => quantities[itemKey] ?? 1;
  const totalCount = allItems.reduce((total, item) => total + quantityFor(item.item_key), 0);
  const visibleItems = allItems.filter((item) => quantityFor(item.item_key) > 0 && (!openRoom || item.room_zone_id === openRoom) && item.description.toLocaleLowerCase("ko-KR").includes(query.trim().toLocaleLowerCase("ko-KR")));
  const updateQuantity = (itemKey: string, next: number) => setQuantities((current) => ({ ...current, [itemKey]: Math.max(0, next) }));

  return <div className="px-[var(--content-gutter)] pb-[calc(var(--bottom-rail-height)+7.5rem)] pt-4">
    <label className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring" htmlFor="inventory-search"><MagnifyingGlass aria-hidden="true" className="shrink-0 text-ink-400" size={23} /><input className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-400" id="inventory-search" onChange={(event) => setQuery(event.target.value)} placeholder="짐 이름 검색" type="search" value={query} /></label>
    <div className="no-scrollbar -mx-[var(--content-gutter)] mt-4 flex gap-2 overflow-x-auto px-[var(--content-gutter)] pb-1">
      <button aria-pressed={!openRoom} className={`min-h-11 whitespace-nowrap rounded-full border px-4 text-sm font-extrabold ${!openRoom ? "border-primary-600 bg-primary-50 text-primary-700" : "border-line bg-surface text-ink-600"}`} onClick={() => setOpenRoom("")} type="button">전체 {totalCount}</button>
      {groups.map((group) => <button aria-pressed={openRoom === group.room_zone_id} className={`min-h-11 whitespace-nowrap rounded-full border px-4 text-sm font-extrabold ${openRoom === group.room_zone_id ? "border-primary-600 bg-primary-50 text-primary-700" : "border-line bg-surface text-ink-600"}`} key={group.room_zone_id} onClick={() => setOpenRoom(group.room_zone_id)} type="button">{group.label}</button>)}
    </div>
    <div className="mt-4 space-y-2">
      {visibleItems.map((item) => { const quantity = quantityFor(item.item_key); return <article className="grid min-h-[76px] grid-cols-[44px_44px_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow-card)] min-[360px]:flex" key={item.item_key}>
        <button aria-label={`${item.description} 삭제`} className="grid size-11 shrink-0 place-items-center rounded-xl text-ink-400 hover:bg-surface-muted hover:text-ink-900" onClick={() => updateQuantity(item.item_key, 0)} type="button"><X aria-hidden="true" size={22} /></button>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><InventoryItemIcon name={item.description} /></span>
        <span className="min-w-0 flex-1"><strong className="block text-sm leading-5">{item.description}</strong>{item.review_required ? <span className="mt-0.5 block text-[11px] font-bold text-danger-ink">확인 필요</span> : null}</span>
        <span className="col-span-2 col-start-2 grid shrink-0 grid-cols-[44px_34px_44px] justify-self-end overflow-hidden rounded-xl border border-line bg-surface-muted min-[360px]:col-auto min-[360px]:justify-self-auto"><button aria-label={`${item.description} 수량 줄이기`} className="grid size-11 place-items-center" onClick={() => updateQuantity(item.item_key, quantity - 1)} type="button"><Minus aria-hidden="true" size={18} /></button><output aria-label={`${item.description} 수량`} className="grid min-h-11 place-items-center bg-surface text-sm font-black tabular-nums">{quantity}</output><button aria-label={`${item.description} 수량 늘리기`} className="grid size-11 place-items-center" onClick={() => updateQuantity(item.item_key, quantity + 1)} type="button"><Plus aria-hidden="true" size={18} /></button></span>
      </article>; })}
      {!scope ? <p className="py-5 text-sm text-ink-600">최신 짐 목록을 불러오는 중입니다.</p> : null}
      {scope && visibleItems.length === 0 ? <div className="rounded-2xl border border-line bg-surface px-4 py-8 text-center"><p className="font-extrabold">표시할 짐이 없어요</p><p className="mt-1 text-sm text-ink-600">검색어를 바꾸거나 짐을 다시 추가해 주세요.</p></div> : null}
    </div>
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-rail-height)+max(12px,env(safe-area-inset-bottom)))] z-[calc(var(--z-sticky)-1)] flex justify-center px-[var(--content-gutter)]">
      <div className="pointer-events-auto grid w-full max-w-[calc(var(--shell-mobile)-2*var(--content-gutter))] grid-cols-2 gap-2 rounded-[var(--radius-feature)] border border-line bg-surface/95 p-2 shadow-[var(--shadow-raised)] backdrop-blur">
        <Button className="min-w-0 px-2 text-[13px] min-[360px]:text-[14px]" onClick={onManualAdd} size="cta" variant="outline"><Cube aria-hidden="true" /> 품목 직접 선택</Button>
        <Button className="min-w-0 px-2 text-[13px] min-[360px]:text-[14px]" onClick={onCapture} size="cta"><Camera aria-hidden="true" weight="fill" /> AI 영상 촬영</Button>
      </div>
    </div>
  </div>;
}

function InventoryItemIcon({ name }: { name: string }) {
  const normalized = name.toLocaleLowerCase("ko-KR");
  if (normalized.includes("침대") || normalized.includes("매트리스")) return <Bed aria-hidden="true" size={23} weight="duotone" />;
  if (normalized.includes("책상") || normalized.includes("서랍")) return <Desk aria-hidden="true" size={23} weight="duotone" />;
  if (normalized.includes("의자") || normalized.includes("소파")) return <Armchair aria-hidden="true" size={23} weight="duotone" />;
  if (normalized.includes("tv") || normalized.includes("텔레비전")) return <Television aria-hidden="true" size={23} weight="duotone" />;
  if (normalized.includes("스탠드") || normalized.includes("조명")) return <Lamp aria-hidden="true" size={23} weight="duotone" />;
  return <Package aria-hidden="true" size={23} weight="duotone" />;
}

function ConsumerAgreement({ completion, connection, issues, scope }: { completion: CompletionSummary | undefined; connection: Connection; issues: FieldIssue[] | undefined; scope: ScopeReview | undefined }) {
  const queryClient = useQueryClient();
  const [issueOpen, setIssueOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [amountOpen, setAmountOpen] = useState(true);
  const refresh = () => queryClient.invalidateQueries({ queryKey: workflowKeys.root(connection.jobId) });
  const issue = issues?.find((item) => item.status === "customer_review" && item.change_proposal_id);
  const displayIssue = issue ?? issues?.[0];
  const proposalId = displayIssue?.change_proposal_id;
  const proposalQuery = useQuery({
    enabled: Boolean(proposalId),
    queryKey: [...workflowKeys.root(connection.jobId), "change-proposal", proposalId],
    queryFn: () => getChangeProposal(connection, proposalId!),
  });
  const decisionMutation = useMutation({
    mutationFn: (decision: "approve" | "reject" | "request_clarification") => decideChangeProposal(connection, issue!.change_proposal_id!, { decision }),
    onSuccess: async () => { setIssueOpen(false); await refresh(); },
  });
  if (!scope) return <div className="px-[var(--content-gutter)] py-8 text-sm text-ink-600">확인서를 불러오는 중입니다.</div>;

  const pending = scope.scope.status === "customer_review";
  const baseAmount = scope.quote?.base_amount_krw;
  const totalAmount = scope.quote?.total_amount_krw;

  return (
    <div className="space-y-2.5 px-[var(--content-gutter)] pb-28 pt-3">
      <AgreementVersionBar onOpenHistory={() => setHistoryOpen(true)} version={scope.scope.version_label} />
      {displayIssue ? <FieldReportCard companyName={scope.job.company_display_name} issue={displayIssue} onOpen={() => setIssueOpen(true)} /> : null}
      <section className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-[16px] font-black">금액 내역</h2><p className="mt-0.5 text-[12px] text-ink-600">기존 합의 {money(baseAmount)}</p></div><button aria-expanded={amountOpen} aria-label={amountOpen ? "금액 내역 접기" : "금액 내역 펼치기"} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface-muted" onClick={() => setAmountOpen((open) => !open)} type="button">{amountOpen ? <CaretUp aria-hidden="true" size={20} /> : <CaretDown aria-hidden="true" size={20} />}</button></div>
        {amountOpen ? <div className="mt-3 divide-y divide-dashed divide-line border-y border-line"><div className="flex items-center justify-between py-3 text-sm"><span>기본 견적</span><strong className="tabular-nums">{money(baseAmount)}</strong></div>{scope.quote?.adjustments.map((item) => <div className="flex items-start justify-between gap-4 py-3 text-sm" key={`${item.label}-${item.amount_krw}`}><span className="min-w-0"><span className="mr-1.5 inline-flex rounded-md border border-warning px-1.5 py-0.5 text-[10px] font-extrabold text-warning-ink">추가</span>{item.label}</span><strong className="shrink-0 tabular-nums text-warning-ink">{item.amount_krw > 0 ? "+" : ""}{money(item.amount_krw)}</strong></div>)}</div> : null}
        <div className="mt-3 flex items-end justify-between gap-3"><strong className="text-[15px]">변경 후 금액</strong><strong className="text-[27px] tracking-[-0.04em] tabular-nums">{money(totalAmount)}</strong></div>
        <button className="mt-2 flex min-h-11 w-full items-center justify-center gap-1 whitespace-nowrap text-[13px] font-extrabold text-ink-600" onClick={() => setAmountOpen((open) => !open)} type="button">내역 {amountOpen ? "접기" : "펼치기"} {amountOpen ? <CaretUp aria-hidden="true" size={16} /> : <CaretDown aria-hidden="true" size={16} />}</button>
      </section>
      <section className="rounded-[var(--radius-card)] border border-line bg-surface p-3"><p className="text-[12px] text-ink-600">현재 상황</p><h2 className="mt-0.5 text-[18px] font-black"><span className="text-primary-700">{pending ? "업체 확인 완료" : "공동확인 완료"}</span> · {issue ? "현장 변경 확인" : "작업 범위 확인"}</h2><AgreementProgress pending={pending} /><p className="mt-2 text-[12px] text-ink-600">{pending ? "작업 범위와 금액을 확인하면 양측 확인이 완료돼요." : "고객과 업체가 같은 버전의 작업 범위를 확인했어요."}</p></section>
      <section className="rounded-[var(--radius-card)] border border-line bg-surface p-3"><h2 className="text-[12px] text-ink-600">확인할 작업</h2><ConfirmedRow icon={<Cube aria-hidden="true" size={21} weight="duotone" />} label="작업 범위" value={`짐 ${scope.scope.item_count}개 · ${scope.scope.included_works.slice(0, 2).join(" · ")}`} /><ConfirmedRow icon={<Stairs aria-hidden="true" size={21} weight="duotone" />} label="출발지 조건" value="계단 3층 · 주차 가능" /><ConfirmedRow icon={<Elevator aria-hidden="true" size={21} weight="duotone" />} label="도착지 조건" value="엘리베이터 · 주차 확인" /></section>
      {completion?.final_amount_krw ? <p className="sr-only">완료 기준 최종 금액 {money(completion.final_amount_krw)}</p> : null}
      {displayIssue ? <FieldChangeSheet error={decisionMutation.error} issue={displayIssue} loading={proposalQuery.isLoading} onDecision={(decision) => decisionMutation.mutate(decision)} onOpenChange={setIssueOpen} open={issueOpen} pending={decisionMutation.isPending} proposal={proposalQuery.data} readOnly={!issue} /> : null}
      <AgreementHistorySheet issue={displayIssue} onOpenChange={setHistoryOpen} open={historyOpen} scope={scope} />
    </div>
  );
}

function AgreementVersionBar({ onOpenHistory, version }: { onOpenHistory: () => void; version: string }) {
  return <div className="-mt-2 mb-1 flex min-h-11 items-center justify-between"><p className="text-[13px] text-ink-600">현재 버전 <strong className="ml-1 text-ink-900">{version}</strong></p><button className="flex min-h-11 items-center gap-1 text-[13px] font-extrabold text-primary-700" onClick={onOpenHistory} type="button">변경 이력 <CaretRight aria-hidden="true" size={17} weight="bold" /></button></div>;
}

function FieldReportCard({ companyName, issue, onOpen }: { companyName: string | null; issue: FieldIssue; onOpen: () => void }) {
  const awaitingCustomer = issue.status === "customer_review";
  const resolved = issue.status === "approved" || issue.status === "rejected";
  const statusLabel = awaitingCustomer ? "확인 필요" : resolved ? "처리 완료" : "업체 처리 중";
  const responseLabel = awaitingCustomer ? "내 확인 대기" : resolved ? "확인 완료" : "변경안 대기";
  return <section className="rounded-[var(--radius-card)] border border-line bg-surface p-3"><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${resolved ? "border-success text-success" : "border-warning text-warning-ink"}`}>{statusLabel}</span><h2 className="mt-1.5 text-[18px] font-black">현장 보고 <b className="text-primary-700">1건</b>이 도착했어요</h2><p className="mt-0.5 text-[13px] text-ink-600">{issue.title}</p><p className="mt-1 line-clamp-2 text-[12px] text-ink-400">{issue.description}</p><div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-ink-400"><span className="min-w-0 truncate">현장기사 보고 · {companyName ?? "이사업체"} 기록</span><span className={`shrink-0 font-bold ${resolved ? "text-success" : "text-warning-ink"}`}>{responseLabel}</span></div><button className="mt-2 flex min-h-11 w-full items-center justify-between rounded-xl border border-line px-4 text-[13px] font-extrabold hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" onClick={onOpen} type="button">보고 내용 확인 <CaretRight aria-hidden="true" size={18} /></button></section>;
}

function FieldChangeSheet({ error, issue, loading, onDecision, onOpenChange, open, pending, proposal, readOnly }: {
  error: Error | null;
  issue: FieldIssue;
  loading: boolean;
  onDecision: (decision: "approve" | "reject" | "request_clarification") => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending: boolean;
  proposal: Awaited<ReturnType<typeof getChangeProposal>> | undefined;
  readOnly: boolean;
}) {
  const adjustment = proposal?.quote.adjustments.at(-1)?.amount_krw ?? 0;
  const total = proposal?.quote.total_amount_krw ?? 0;
  const previous = total - adjustment;
  const evidenceUrl = proposal?.evidence_media[0]?.read_url ?? (issue.evidence_media_asset_ids.length ? "/elevator-outage-evidence.png" : null);
  const reportedAt = fullDateFormatter.format(new Date(issue.reported_at));
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="max-h-[calc(100dvh-12px)]">
    <SheetHeader><SheetTitle>현장 변경 확인</SheetTitle><SheetDescription>{issue.title} · 현장기사 보고</SheetDescription></SheetHeader>
    {loading ? <div className="grid min-h-72 place-items-center text-sm text-ink-600">변경안을 불러오는 중입니다.</div> : <div>
      {evidenceUrl ? <figure className="px-5"><img alt={`${issue.title} 현장 증거`} className="aspect-[4/3] w-full rounded-[var(--radius-card)] object-cover" height="360" src={evidenceUrl} width="480" /><figcaption className="mt-2 text-xs text-ink-400">현장 영상 · {reportedAt}</figcaption></figure> : null}
      <div className="px-5 pt-5">
      <h3 className="text-[24px] leading-8 font-black tracking-[-0.04em]">엘리베이터가 멈춰<br />계단 운반이 필요해요</h3>
      <p className="mt-2 text-sm text-ink-600">{reportedAt} · 현장기사</p>
      {proposal ? <><div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center rounded-xl border border-line px-3 py-3 text-center text-sm font-extrabold"><span>기존 승인본 {proposal.base_scope_version_label}</span><ArrowRight aria-hidden="true" className="text-ink-400" /><span className="text-primary-700">변경 제안 v4</span></div><section className="mt-5"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700"><Stairs aria-hidden="true" size={24} /></span><h4 className="text-lg font-black">{proposal.title}</h4></div><dl className="mt-4 grid grid-cols-[88px_minmax(0,1fr)] gap-y-3 text-sm"><dt className="text-ink-600">사유</dt><dd>{proposal.reason}</dd><dt className="text-ink-600">예상 추가 시간</dt><dd>+1시간</dd></dl></section><section className="mt-5 grid grid-cols-3 divide-x divide-line rounded-xl border border-line py-4 text-center tabular-nums"><div><span className="text-xs text-ink-600">기존 ({proposal.base_scope_version_label})</span><strong className="mt-1 block text-[15px]">{money(previous)}</strong></div><div><span className="text-xs text-ink-600">추가 금액</span><strong className="mt-1 block text-[15px] text-danger-ink">{adjustment > 0 ? "+" : ""}{money(adjustment)}</strong></div><div><span className="text-xs text-ink-600">변경 후 (v4)</span><strong className="mt-1 block text-[15px]">{money(total)}</strong></div></section><aside className="mt-4 rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-800">{readOnly ? "처리된 변경안과 당시 금액을 보여드려요." : `승인 전까지 ${proposal.base_scope_version_label}가 유지돼요.`}</aside></> : <section className="mt-5 rounded-xl border border-line p-4"><h4 className="text-lg font-black">{issue.title}</h4><p className="mt-2 text-sm leading-6 text-ink-600">{issue.description}</p><p className="mt-3 text-xs text-ink-400">업체가 변경 범위와 금액을 제안하면 이 보고서에 함께 표시돼요.</p></section>}
      {error ? <p className="mt-3 text-sm font-bold text-danger">{apiErrorMessage(error)}</p> : null}
      </div>
    </div>}
    {!readOnly && proposal ? <SheetFooter className="grid grid-cols-2 gap-2"><Button className="col-span-2 whitespace-nowrap" disabled={pending} onClick={() => onDecision("approve")} size="cta">변경 승인하기 · {adjustment > 0 ? "+" : ""}{money(adjustment)}</Button><Button className="whitespace-nowrap" disabled={pending} onClick={() => onDecision("request_clarification")} variant="outline"><ChatCircleDots aria-hidden="true" /> 설명 요청</Button><Button className="whitespace-nowrap text-danger-ink" disabled={pending} onClick={() => onDecision("reject")} variant="outline"><X aria-hidden="true" /> 거절</Button></SheetFooter> : null}
  </SheetContent></Sheet>;
}

function AgreementHistorySheet({ issue, onOpenChange, open, scope }: { issue: FieldIssue | undefined; onOpenChange: (open: boolean) => void; open: boolean; scope: ScopeReview }) {
  const versionMatch = /^v(\d+)$/i.exec(scope.scope.version_label);
  const previousVersion = versionMatch && Number(versionMatch[1]) > 1 ? `v${Number(versionMatch[1]) - 1}` : "이전 기준";
  const adjustments = scope.quote?.adjustments ?? [];
  const reportDate = issue?.reported_at ? fullDateFormatter.format(new Date(issue.reported_at)) : null;
  return <Sheet onOpenChange={onOpenChange} open={open}><SheetContent presentation="page"><SheetHeader className="border-b border-line px-16 pb-5 pt-[max(18px,env(safe-area-inset-top))] text-center"><SheetTitle>변경 이력</SheetTitle><SheetDescription>{scope.job.title} · 공동확인서</SheetDescription></SheetHeader><div className="px-5 py-6"><p className="text-[17px] leading-6 font-extrabold">작업 범위와 금액이 어떻게 바뀌었는지 확인할 수 있어요.</p><ol className="relative mt-7 ml-3 border-l-2 border-line pl-7"><li className="relative pb-8"><span aria-hidden="true" className="absolute top-0 -left-[37px] size-4 rounded-full border-[3px] border-success bg-surface" /><details open><summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3"><span><span className="inline-flex rounded-md border border-success px-2 py-0.5 text-[11px] font-extrabold text-success">현재 버전</span><strong className="mt-2 block text-[20px]">{scope.scope.version_label} · 현재 확인서</strong></span><CaretDown aria-hidden="true" className="mt-2 shrink-0 text-ink-400" size={20} /></summary><div className="mt-3 rounded-xl border border-line bg-surface p-4 text-sm"><p>짐 {scope.scope.item_count}개 · 작업 {scope.scope.work_count}개</p><p className="mt-3 border-t border-line pt-3 tabular-nums">금액 <strong className="float-right text-primary-700">{money(scope.quote?.total_amount_krw)}</strong></p>{adjustments.length ? <p className="mt-3 text-ink-600">변경 사유: {adjustments.map((item) => item.label).join(" · ")}</p> : null}<div className="mt-3 flex flex-wrap gap-2"><span className="rounded-md bg-success-bg px-2 py-1 text-xs font-bold text-success-ink">업체 확인</span><span className={`rounded-md px-2 py-1 text-xs font-bold ${scope.customer_confirmed_at ? "bg-success-bg text-success-ink" : "bg-warning-bg text-warning-ink"}`}>{scope.customer_confirmed_at ? "고객 확인" : "고객 확인 대기"}</span></div></div></details></li>{issue ? <li className="relative pb-8"><span aria-hidden="true" className="absolute top-1 -left-[37px] size-4 rounded-full border-[3px] border-primary-600 bg-surface" /><details><summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3"><span><strong className="block text-[18px]">현장 보고 · {issue.title}</strong>{reportDate ? <span className="mt-1 block text-sm text-ink-600">{reportDate}</span> : null}</span><CaretDown aria-hidden="true" className="mt-1 shrink-0 text-ink-400" size={20} /></summary><div className="mt-3 rounded-xl border border-line bg-surface p-4 text-sm"><p className="leading-6">{issue.description}</p><p className="mt-2 text-ink-600">처리 상태 · {issue.status === "approved" ? "승인" : issue.status === "rejected" ? "거절" : issue.status === "customer_review" ? "고객 확인 대기" : "업체 처리 중"}</p></div></details></li> : null}<li className="relative"><span aria-hidden="true" className="absolute top-1 -left-[37px] size-4 rounded-full border-[3px] border-line bg-surface" /><details><summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3"><span><strong className="block text-[18px]">{previousVersion} · 변경 전 기준</strong><span className="mt-1 block text-sm text-ink-600">현재 변경안의 기준 금액</span></span><CaretDown aria-hidden="true" className="mt-1 shrink-0 text-ink-400" size={20} /></summary><div className="mt-3 rounded-xl border border-line bg-surface p-4 text-sm"><p>변경 전 합의 금액 <strong className="float-right tabular-nums">{money(scope.quote?.base_amount_krw)}</strong></p><p className="mt-3 text-ink-600">이후 변경은 기존 기록을 덮어쓰지 않고 새 버전과 현장 보고로 이어져요.</p></div></details></li></ol></div></SheetContent></Sheet>;
}

function AgreementProgress({ pending }: { pending: boolean }) {
  const steps = ["짐 확인", "업체 확인", "고객 확인", "완료 확인"];
  const current = pending ? 3 : 4;
  return <ol className="mt-3 grid grid-cols-4">{steps.map((label, index) => { const step = index + 1; const done = step < current; const active = step === current; return <li className="relative text-center" key={label}>{index > 0 ? <span aria-hidden="true" className={`absolute top-3 right-1/2 h-0.5 w-full ${step <= current ? done ? "bg-success" : "bg-primary-600" : "bg-line"}`} /> : null}<span className={`relative z-10 mx-auto grid size-6 place-items-center rounded-full border-2 text-[10px] font-black ${done ? "border-success bg-success text-white" : active ? "border-primary-600 bg-primary-600 text-white" : "border-line bg-surface-muted text-ink-400"}`}>{done ? <Check aria-hidden="true" size={13} weight="bold" /> : step}</span><span className={`mt-1 block text-[9px] font-bold ${active ? "text-primary-700" : done ? "text-success" : "text-ink-600"}`}>{label}</span></li>; })}</ol>;
}

function ConfirmedRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex min-h-11 items-center gap-2.5 border-b border-line last:border-b-0"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700">{icon}</span><strong className="text-[13px]">{label}</strong><span className="ml-auto max-w-[58%] truncate text-right text-[12px] text-ink-600">{value}</span><CaretRight aria-hidden="true" className="text-ink-400" size={16} /></div>;
}
