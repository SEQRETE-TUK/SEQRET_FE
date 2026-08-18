import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon as ArrowLeft,
  ArrowRightIcon as ArrowRight,
  ArchiveIcon as Archive,
  BellIcon as Bell,
  CalendarBlankIcon as Calendar,
  CameraIcon as Camera,
  CaretDownIcon as CaretDown,
  CaretLeftIcon as CaretLeft,
  CaretRightIcon as CaretRight,
  CheckIcon as Check,
  CubeIcon as Cube,
  HouseIcon as Home,
  MagnifyingGlassIcon as MagnifyingGlass,
  NotepadIcon as Notepad,
  PackageIcon as Package,
  SquaresFourIcon as SquaresFour,
  StairsIcon as Stairs,
  TrendUpIcon as TrendUp,
  TruckIcon as Truck,
  WarningCircleIcon as WarningCircle,
} from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { mockApiEnabled } from "@/api/mock-api";
import { MovingItemIcon, movingItemAssetForName } from "@/components/moving-item-icon";
import { AgreementOverview } from "@/components/layout/agreement-overview";
import { ActiveMoveCard, FilterChip, InventoryQuantityRow, MoveJourneyProgress } from "@/components/layout/app-primitives";
import { ConnectedProfile } from "@/components/layout/connected-profile";
import { MobileAppShell, MobileDetailHeader, MobileDetailTabs, MobileHeaderButton, MobilePageHeader, type MobileNavItem } from "@/components/layout/mobile-app-shell";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/model/auth-context";
import { CustomerOnboardingSheet, moveDraftStorageKey } from "@/features/auth/ui/customer-onboarding-sheet";
import { AddressSearchInput } from "@/features/consumer/ui/address-search-input";
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
  type ScopeLocationConditions,
  type ScopeReview,
} from "@/features/workflow/api/workflow-api";

type ConsumerTab = "home" | "move" | "more" | "notifications";
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

type MoveHistoryRecord = { amount: string; changes: number; date: string; destination: string; items: number; origin: string; version: string };
const moveHistoryRecords: MoveHistoryRecord[] = [
  { amount: "1,430,000원", changes: 1, date: "2026년 5월 18일", destination: "자양동 오피스텔", items: 21, origin: "성수동 원룸", version: "v4" },
  { amount: "620,000원", changes: 0, date: "2025년 8월 25일", destination: "성수동 원룸", items: 12, origin: "건대입구 원룸", version: "v2" },
];

type MoveStopKind = "origin" | "destination";
type ElevatorOption = "있음" | "없음";
type LadderOption = "사용" | "사용 안 함";
type ParkingOption = "가능" | "불가능";
type MoveStopDraft = {
  address: string;
  detailAddress: string;
  elevator: ElevatorOption;
  floor: string;
  ladder: LadderOption;
  memo: string;
  parking: ParkingOption;
  residenceType: string;
};
type MoveInfoOverrides = {
  schedule: string | null;
  stops: Partial<Record<MoveStopKind, MoveStopDraft>>;
};

const floorOptions = ["반지하", "1층", "2층", "3층", "4층", "5층 이상"];
const ladderOptions: LadderOption[] = ["사용", "사용 안 함"];
const elevatorOptions: ElevatorOption[] = ["있음", "없음"];
const parkingOptions: ParkingOption[] = ["가능", "불가능"];
const residenceOptions = ["아파트", "빌라·연립", "오피스텔", "단독주택"];

function defaultMoveStop(kind: MoveStopKind, scope: ScopeReview | undefined): MoveStopDraft {
  return {
    address: kind === "origin" ? scope?.job.origin_summary ?? "" : scope?.job.destination_summary ?? "",
    detailAddress: "",
    elevator: kind === "origin" ? "없음" : "있음",
    floor: kind === "origin" ? "3층" : "5층 이상",
    ladder: "사용 안 함",
    memo: "",
    parking: kind === "origin" ? "가능" : "불가능",
    residenceType: kind === "origin" ? "아파트" : "오피스텔",
  };
}

function moveStopLocationConditions(kind: MoveStopKind, stop: MoveStopDraft): ScopeLocationConditions {
  return {
    location_id: kind,
    kind,
    conditions: {
      residence_type: stop.residenceType,
      floor: stop.floor,
      elevator: stop.elevator,
      ladder: stop.ladder,
      parking_access: stop.parking,
      ...(stop.memo ? { access_note: stop.memo } : {}),
    },
  };
}

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
const validTabs = new Set<ConsumerTab>([...tabs.map(({ id }) => id), "notifications"]);
const validMoveViews = new Set<ConsumerMoveView>(["list", "info", "items", "agreement"]);

export function ConsumerGuestApp() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const requested = params.get("tab") as ConsumerTab | null;
  const tab = requested && validTabs.has(requested) ? requested : "home";
  const setTab = (next: ConsumerTab) => setParams(next === "home" ? {} : { tab: next, ...(next === "move" ? { view: "list" } : {}) }, { replace: true });
  const header = tab === "home" ? <HomeHeader customerName="고객" onBell={() => setTab("notifications")} /> : tab === "move" ? <MoveListSafeArea /> : tab === "notifications" ? <NotificationsHeader onBack={() => setTab("home")} /> : tab === "more" ? false : undefined;
  return <>
    <MobileAppShell current={tab} eyebrow="고객" header={header} items={tabs} onChange={setTab} onProfile={() => setTab("more")} title={tab === "home" ? "홈" : tab === "move" ? "내 이사" : "더보기"}>
      {tab === "home" ? <GuestHome onStart={() => setOnboardingOpen(true)} /> : null}
      {tab === "move" ? <EmptyMoveList onNewMove={() => setOnboardingOpen(true)} /> : null}
      {tab === "notifications" ? <CustomerNotifications /> : null}
      {tab === "more" ? <div className="mobile-screen"><h1 className="text-ui-section font-black">더보기</h1><p className="mt-3 text-sm leading-6 text-ink-600">새 이사를 만들면 이사 기록과 연결 정보가 여기에 표시됩니다.</p><Button className="mt-6 w-full" onClick={() => navigate("/")} variant="outline">역할 선택으로 돌아가기</Button></div> : null}
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
    else setParams({ tab: next }, { replace: true });
  };
  const setMoveView = (view: ConsumerMoveView) => setParams({ tab: "move", view }, { replace: true });
  const openAgreement = () => setMoveView("agreement");
  const disconnect = () => { clearSession(); navigate("/"); };

  const header = tab === "home"
    ? <HomeHeader customerName={session!.actor.display_name} onBell={() => setTab("notifications")} />
    : tab === "move"
      ? moveView === "list"
        ? <MoveListSafeArea />
        : <MoveHeader onBack={() => setMoveView("list")} onMore={() => setTab("more")} scope={scopeQuery.data} />
       : tab === "notifications"
         ? <NotificationsHeader onBack={() => setTab("home")} />
         : tab === "more" ? false : undefined;

  return (
    <>
    <MobileAppShell current={tab} eyebrow={`고객 · ${session!.actor.display_name}`} header={header} items={tabs} onChange={setTab} onProfile={() => setTab("more")} showNav={tab !== "move" || moveView === "list"} title={tab === "home" ? "홈" : tab === "move" ? "내 이사" : "더보기"}>
      {tab === "home" ? <HomeTab completion={completionQuery.data} onOpenAgreement={openAgreement} onOpenMove={() => setMoveView("info")} onStartMove={() => setOnboardingOpen(true)} scope={scopeQuery.data} /> : null}
      {tab === "move" ? <ConsumerMoveTab completion={completionQuery.data} connection={connection} issues={issuesQuery.data} onCapture={() => navigate("/consumer/capture?mode=video")} onManualAdd={() => navigate("/consumer/capture?mode=manual")} onNewMove={() => setOnboardingOpen(true)} onViewChange={setMoveView} scope={scopeQuery.data} view={moveView} /> : null}
      {tab === "notifications" ? <CustomerNotifications issues={issuesQuery.data} scope={scopeQuery.data} /> : null}
      {tab === "more" ? <ConnectedProfile displayName={session!.actor.display_name} expiresAt={session!.actor.expires_at} onDisconnect={disconnect} permissions={session!.actor.permissions} roleLabel="고객" /> : null}
    </MobileAppShell>
    <CustomerOnboardingSheet onOpenChange={setOnboardingOpen} open={onboardingOpen} />
    </>
  );
}

function HomeHeader({ customerName, onBell }: { customerName: string; onBell: () => void }) {
  return (
    <header className="flex items-center justify-between bg-canvas px-[var(--content-gutter)] pb-4 pt-[max(16px,env(safe-area-inset-top))]">
      <h1 className="text-ui-section leading-8 font-extrabold tracking-[var(--tracking-display)]">{customerName}님,<br />어떤 이사를 준비할까요?</h1>
      <button aria-label="알림 확인" className="grid size-9 place-items-center rounded-full text-ink-900 hover:bg-surface-muted" onClick={onBell} type="button"><Bell aria-hidden="true" size="var(--icon-sm)" /></button>
    </header>
  );
}

function NotificationsHeader({ onBack }: { onBack: () => void }) {
  return <header className="app-safe-header sticky top-0 z-[var(--z-sticky)] grid min-h-[68px] grid-cols-[48px_1fr_48px] items-center bg-surface px-2"><button aria-label="홈으로 돌아가기" className="grid size-11 place-items-center rounded-full" onClick={onBack} type="button"><CaretLeft aria-hidden="true" size="var(--icon-category)" weight="bold" /></button><h1 className="text-center text-ui-section font-black">알림</h1><span /></header>;
}

function CustomerNotifications({ issues, scope }: { issues?: FieldIssue[]; scope?: ScopeReview }) {
  const report = issues?.[0];
  const quoteArrived = scope?.scope.status === "customer_review" || mockApiEnabled;
  const hasNews = Boolean(report || quoteArrived);
  return <div className="px-[var(--content-gutter)] pb-28 pt-5"><h2 className="text-ui-section font-black tracking-[var(--tracking-display)]">새로 도착한 소식</h2><p className="mt-2 text-sm text-ink-600">현장 보고와 새 견적만 모아서 보여드려요.</p>{hasNews ? <div className="mt-6 divide-y divide-line border-y border-line">{report ? <article className="flex gap-3 py-5"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-warning-bg text-warning-ink"><WarningCircle aria-hidden="true" size="var(--icon-md)" /></span><div className="min-w-0"><span className="text-xs font-extrabold text-warning-ink">현장 보고</span><h3 className="mt-1 text-ui-component font-black">{report.title}</h3><p className="mt-1 line-clamp-2 text-sm leading-5 text-ink-600">{report.description}</p></div></article> : null}{quoteArrived ? <article className="flex gap-3 py-5"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><Notepad aria-hidden="true" size="var(--icon-md)" /></span><div className="min-w-0"><span className="text-xs font-extrabold text-primary-700">견적 도착</span><h3 className="mt-1 text-ui-component font-black">작업 범위와 금액이 도착했어요</h3><p className="mt-1 text-sm leading-5 text-ink-600">{scope ? `${scope.scope.version_label} · ${money(scope.quote?.total_amount_krw)}` : "확인서에서 제안 내용을 확인해 주세요."}</p></div></article> : null}</div> : <section className="mt-8 border-y border-line py-10 text-center"><Bell aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><p className="mt-3 font-extrabold">새 알림이 없어요</p></section>}</div>;
}

function MoveHeader({ onBack, onMore, scope }: { onBack: () => void; onMore: () => void; scope: ScopeReview | undefined }) {
  const title = scope?.job.origin_summary ? `${scope.job.origin_summary} 이사` : "내 이사";
  return <MobileDetailHeader backLabel="이사 목록으로 돌아가기" onBack={onBack} onMore={onMore} title={title} />;
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
    <div className="pb-[var(--bottom-rail-height)]">
      <section className="px-[var(--content-gutter)]"><NewMoveHero onStart={onStartMove} /></section>

      <div className="mx-[var(--content-gutter)]"><ActiveMoveCard heading="진행 중인 이사 1건" leading={<span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700"><Truck aria-hidden="true" size="var(--icon-md)" /></span>} meta={<>{scheduledAt ? dateFormatter.format(scheduledAt) : "일정 확인 중"} {dDay !== null ? <b className="text-primary-700">· D-{dDay}</b> : null}</>} onOpen={onOpenMove} route={scope ? `${scope.job.origin_summary ?? "출발지"} → ${scope.job.destination_summary ?? "도착지"}` : "이사 정보를 불러오는 중"}>
        <MoveJourneyProgress current={currentStep} />
        <div className="mt-3 border-t border-line pt-3">
          <p className="flex min-w-0 items-baseline gap-2 whitespace-nowrap"><strong className="shrink-0 text-ui-support text-primary-700">{actionTitle}</strong><span className="ml-auto min-w-0 truncate text-right text-ui-data text-ink-600">{actionMeta}</span></p><button className="mt-2 flex min-h-10 w-full items-center justify-center rounded-xl bg-primary-600 text-ui-support font-extrabold text-white" onClick={onOpenAgreement} type="button">지금 확인</button>
        </div>
      </ActiveMoveCard></div>

      <PreventionSection />
      {completion?.completion_request?.status === "requested" ? <p className="sr-only">완료 확인 요청이 도착했습니다.</p> : null}
    </div>
  );
}

function NewMoveHero({ onStart }: { onStart: () => void }) {
  return <button className="ui-card ui-card-outlined ui-card-tinted press-static relative min-h-[174px] w-full overflow-hidden rounded-[var(--radius-feature)] px-5 py-4 text-left" onClick={onStart} type="button"><span className="relative z-10 block max-w-[62%]"><strong className="block text-ui-section leading-7 font-extrabold tracking-[var(--tracking-display)]">60초 촬영으로<br />준비를 시작해요</strong><span className="mt-1.5 block text-ui-data leading-5 text-ink-600">짐 목록과 작업조건 초안을 만들어요</span><span className="mt-4 flex items-center gap-1 whitespace-nowrap text-ui-control text-primary-700">새 이사 시작하기 <ArrowRight aria-hidden="true" size="var(--icon-xs)" weight="bold" /></span></span><img alt="휴대폰으로 이삿짐 상자를 촬영하는 모습" className="absolute -right-2 bottom-0 w-[140px] max-w-none" height="213" src="/move-capture-hero.png" width="170" /></button>;
}

function PreventionSection() {
  return <section className="mt-4 px-[var(--content-gutter)] py-5"><h2 className="text-ui-component">추가금이 생기는 순간</h2><p className="mt-1 text-sm text-ink-600">미리 확인하면 당일 변경을 줄일 수 있어요</p><div className="no-scrollbar -mx-[var(--content-gutter)] mt-4 flex snap-x scroll-px-[var(--content-gutter)] gap-3 overflow-x-auto px-[var(--content-gutter)] pb-1"><PreventionCard iconSrc="/prevention-condition.svg" label="작업조건 차이" title="엘리베이터·계단 조건이 달랐어요" /><PreventionCard iconSrc="/prevention-inventory.svg" label="짐 목록 차이" title="촬영 후 큰 짐이 추가됐어요" /><PreventionCard iconSrc="/prevention-work.svg" label="추가 작업" title="분해·설치 작업이 빠졌어요" /></div></section>;
}

function GuestHome({ onStart }: { onStart: () => void }) {
  return <div className="pb-[var(--bottom-rail-height)]"><section className="px-[var(--content-gutter)]"><NewMoveHero onStart={onStart} /></section><section className="mx-[var(--content-gutter)] mt-4 ui-card p-5 shadow-[var(--shadow-card)]"><h2 className="text-ui-component font-black">진행 중인 이사가 없어요</h2><p className="mt-2 text-sm leading-6 text-ink-600">새 이사를 만들면 촬영부터 공동확인까지 한곳에서 이어집니다.</p></section><PreventionSection /></div>;
}

function PreventionCard({ iconSrc, label, title }: { iconSrc: string; label: string; title: string }) {
  return <article className="flex min-h-[176px] w-[170px] shrink-0 snap-start flex-col items-center ui-card p-4 text-center shadow-[var(--shadow-card)]"><span className="grid size-14 place-items-center rounded-2xl bg-surface-muted"><img alt="" aria-hidden="true" className="size-11 object-contain" height="44" loading="lazy" src={iconSrc} width="44" /></span><div className="mt-auto pt-4"><p className="text-xs font-extrabold text-primary-700">{label}</p><h3 className="mt-1.5 text-ui-support leading-5 font-extrabold">{title}</h3></div></article>;
}

function EmptyMoveList({ onNewMove }: { onNewMove: () => void }) {
  return <div className="pb-28"><div className="bg-surface px-[var(--content-gutter)] pt-5"><div className="flex items-center justify-between gap-3"><h1 className="text-ui-section">내 이사</h1><button className="min-h-11 whitespace-nowrap px-2 text-ui-control text-primary-700" onClick={onNewMove} type="button">+ 새 이사</button></div><div className="mt-6 grid grid-cols-2 border-b border-line" role="tablist" aria-label="이사 목록"><button aria-selected="true" className="relative min-h-11 text-ui-control text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" role="tab" type="button">진행 중 0</button><button aria-selected="false" className="min-h-11 text-ui-control text-ink-600" role="tab" type="button">기록 0</button></div></div><div className="px-[var(--content-gutter)]"><section className="mt-8 ui-card px-5 py-8 text-center shadow-[var(--shadow-card)]"><Archive aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><h2 className="mt-4 text-ui-component">아직 이사 기록이 없어요</h2><p className="mt-2 text-ui-support text-ink-600">새 이사를 만들면 진행 상황과 최종 기록을 확인할 수 있어요.</p><Button className="mt-5 w-full" onClick={onNewMove}>새 이사 시작</Button></section></div></div>;
}

function ConsumerMoveList({ completion, onNewMove, onOpen, scope }: { completion: CompletionSummary | undefined; onNewMove: () => void; onOpen: () => void; scope: ScopeReview | undefined }) {
  const completed = completion?.job_status === "completed";
  const [listTab, setListTab] = useState<"active" | "history">(completed ? "history" : "active");
  const showCurrentMove = listTab === (completed ? "history" : "active");
  const scheduledAt = scope?.job.scheduled_at ? new Date(scope.job.scheduled_at) : null;
  const adjustmentCount = scope?.quote?.adjustments.length ?? 0;
  const historyCount = (completed ? 1 : 0) + (mockApiEnabled ? moveHistoryRecords.length : 0);
  const [selectedHistory, setSelectedHistory] = useState<MoveHistoryRecord | null>(null);
  const infoOverrides = storedMoveInfoOverrides();
  const fallbackLocationConditions = (["origin", "destination"] as const).map((kind) => moveStopLocationConditions(kind, infoOverrides.stops[kind] ?? defaultMoveStop(kind, scope)));
  return <div className="pb-28">
    <div className="bg-surface px-[var(--content-gutter)] pt-5"><div className="flex items-center justify-between gap-3"><h1 className="text-ui-section">내 이사</h1><button className="min-h-11 whitespace-nowrap px-2 text-ui-control text-primary-700" onClick={onNewMove} type="button">+ 새 이사</button></div>
    <div className="mt-6 grid grid-cols-2 border-b border-line" role="tablist" aria-label="이사 목록">
      <button aria-selected={listTab === "active"} className={`relative min-h-11 text-ui-control ${listTab === "active" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("active")} role="tab" type="button">진행 중 {completed ? 0 : 1}</button>
      <button aria-selected={listTab === "history"} className={`relative min-h-11 text-ui-control ${listTab === "history" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("history")} role="tab" type="button">기록 {historyCount}</button>
    </div></div><div className="px-[var(--content-gutter)]">
    {showCurrentMove ? <button className="press-static mt-5 w-full ui-card p-5 text-left shadow-[var(--shadow-card)]" onClick={onOpen} type="button">
      <span className={`inline-flex h-[var(--status-height)] items-center rounded-full px-3 text-ui-status ${completed ? "bg-success-bg text-success-ink" : "bg-primary-50 text-primary-700"}`}>{completed ? "완료" : "진행 중"}</span>
      <strong className="mt-4 flex items-center justify-between gap-3 text-ui-section"><span className="min-w-0 truncate">{scope ? `${scope.job.origin_summary ?? "출발지"} → ${scope.job.destination_summary ?? "도착지"}` : "이사 정보를 불러오는 중"}</span><CaretRight aria-hidden="true" className="shrink-0 text-ink-400" size="var(--icon-sm)" /></strong>
      <span className="mt-2 block text-ui-support text-ink-600">{scheduledAt ? fullDateFormatter.format(scheduledAt) : "일정 확인 중"}</span>
      <span className="mt-5 block border-t border-line pt-4 text-sm">{completed ? "최종" : "현재"} 확인서 <b>{scope?.scope.version_label ?? "–"}</b><span className="mx-2 text-line">|</span><b className="text-primary-700">{money(completion?.final_amount_krw ?? scope?.quote?.total_amount_krw)}</b></span>
      <span className="mt-4 grid grid-cols-3 divide-x divide-line text-center text-xs text-ink-600"><span><Package aria-hidden="true" className="mx-auto mb-1" size="var(--icon-sm)" />짐 {scope?.scope.item_count ?? "–"}개</span><span><Notepad aria-hidden="true" className="mx-auto mb-1" size="var(--icon-sm)" />확인서 {scope?.scope.version_label ?? "–"}</span><span><TrendUp aria-hidden="true" className="mx-auto mb-1" size="var(--icon-sm)" />변경 {adjustmentCount}건</span></span>
    </button> : listTab === "history" && mockApiEnabled ? <div className="mt-5 space-y-3">{moveHistoryRecords.map((record) => <MoveHistoryCard key={`${record.date}-${record.version}`} onOpen={() => setSelectedHistory(record)} record={record} />)}</div> : <section className="mt-5 ui-card px-5 py-8 text-center"><Archive aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><h2 className="mt-3 font-black">{listTab === "active" ? "진행 중인 이사가 없어요" : "완료된 이사가 없어요"}</h2></section>}
    </div><ArchivedAgreementSheet fallbackLocationConditions={fallbackLocationConditions} onOpenChange={(open) => { if (!open) setSelectedHistory(null); }} record={selectedHistory} scope={scope} />
  </div>;
}

function MoveHistoryCard({ onOpen, record }: { onOpen: () => void; record: MoveHistoryRecord }) {
  const { amount, changes, date, destination, items, origin, version } = record;
  return <button aria-label={`${origin}에서 ${destination} 이전 확인서 ${version} 보기`} className="press-static w-full ui-card p-5 text-left" onClick={onOpen} type="button"><span className="inline-flex rounded-full bg-success-bg px-3 py-1 text-xs font-extrabold text-success-ink"><Check aria-hidden="true" className="mr-1" size="var(--icon-xs)" weight="bold" />완료</span><strong className="mt-4 block text-ui-section font-black tracking-[var(--tracking-display)]">{origin} → {destination}</strong><span className="mt-2 block text-sm text-ink-600">{date}</span><span className="mt-4 block border-t border-line pt-4 text-sm">최종 확인서 <b>{version}</b><span className="mx-2 text-line">|</span>최종 금액 <b className="text-primary-700">{amount}</b></span><span className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-600"><span className="inline-flex items-center gap-1"><Package aria-hidden="true" size="var(--icon-sm)" />짐 {items}개</span><span className="inline-flex items-center gap-1"><Notepad aria-hidden="true" size="var(--icon-sm)" />확인서 {version}</span><span className="inline-flex items-center gap-1"><TrendUp aria-hidden="true" size="var(--icon-sm)" />변경 {changes}건</span></span></button>;
}

function ArchivedAgreementSheet({ fallbackLocationConditions, onOpenChange, record, scope }: { fallbackLocationConditions: ScopeLocationConditions[]; onOpenChange: (open: boolean) => void; record: MoveHistoryRecord | null; scope: ScopeReview | undefined }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  if (!record || !scope) return null;
  const totalAmount = Number(record.amount.replace(/[^\d]/g, ""));
  const adjustments = scope.quote?.adjustments ?? [];
  const archivedScope: ScopeReview = {
    ...scope,
    job: { ...scope.job, origin_summary: record.origin, destination_summary: record.destination },
    scope: { ...scope.scope, item_count: record.items, status: "confirmed", version_label: record.version },
    quote: { base_amount_krw: totalAmount - adjustments.reduce((sum, item) => sum + item.amount_krw, 0), adjustments, total_amount_krw: totalAmount },
    collaboration_status: "confirmed",
    agreement_notice: "고객과 업체가 함께 확인하고 작업 완료 시점에 확정한 최종 기록입니다.",
    customer_confirmed_at: scope.customer_confirmed_at ?? scope.company_confirmed_at,
  };
  return <><Sheet onOpenChange={(open) => { if (!open) setHistoryOpen(false); onOpenChange(open); }} open><SheetContent presentation="page" showClose={false}><MobilePageHeader onBack={() => { setHistoryOpen(false); onOpenChange(false); }} title={`이전 확인서 ${record.version}`} /><div className="space-y-2.5 px-[var(--content-gutter)] pb-28 pt-3"><AgreementOverview fallbackLocationConditions={fallbackLocationConditions} onOpenHistory={() => setHistoryOpen(true)} scope={archivedScope} /></div></SheetContent></Sheet><AgreementHistorySheet issue={undefined} onOpenChange={setHistoryOpen} open={historyOpen} scope={archivedScope} /></>;
}

function storedMoveInfoOverrides(): MoveInfoOverrides {
  try {
    const stored = window.sessionStorage.getItem(moveDraftStorageKey);
    return stored ? JSON.parse(stored) as MoveInfoOverrides : { schedule: null, stops: {} };
  } catch {
    return { schedule: null, stops: {} };
  }
}

function ConsumerMoveTab({ completion, connection, issues, onCapture, onManualAdd, onNewMove, onViewChange, scope, view }: { completion: CompletionSummary | undefined; connection: Connection; issues: FieldIssue[] | undefined; onCapture: () => void; onManualAdd: () => void; onNewMove: () => void; onViewChange: (view: ConsumerMoveView) => void; scope: ScopeReview | undefined; view: ConsumerMoveView }) {
  const [infoOverrides, setInfoOverrides] = useState<MoveInfoOverrides>(storedMoveInfoOverrides);
  const changeInfoOverrides = (next: MoveInfoOverrides) => { setInfoOverrides(next); window.sessionStorage.setItem(moveDraftStorageKey, JSON.stringify(next)); };
  const fallbackLocationConditions = (["origin", "destination"] as const).map((kind) => moveStopLocationConditions(kind, infoOverrides.stops[kind] ?? defaultMoveStop(kind, scope)));
  if (view === "list") return <ConsumerMoveList completion={completion} onNewMove={onNewMove} onOpen={() => onViewChange("info")} scope={scope} />;
  return <><MoveTabs current={view} onChange={onViewChange} />{view === "info" ? <MoveInfo onChange={changeInfoOverrides} scope={scope} value={infoOverrides} /> : null}{view === "items" ? <ConsumerInventory onCapture={onCapture} onManualAdd={onManualAdd} scope={scope} /> : null}{view === "agreement" ? <ConsumerAgreement completion={completion} connection={connection} fallbackLocationConditions={fallbackLocationConditions} issues={issues} scope={scope} /> : null}</>;
}

function MoveTabs({ current, onChange }: { current: ConsumerMoveView; onChange: (view: ConsumerMoveView) => void }) {
  const items: Array<{ id: ConsumerMoveView; label: string }> = [{ id: "info", label: "이사 정보" }, { id: "items", label: "짐 목록" }, { id: "agreement", label: "확인서" }];
  return <MobileDetailTabs current={current} items={items} label="내 이사 메뉴" onChange={onChange} />;
}

function MoveInfo({ onChange, scope, value }: { onChange: (value: MoveInfoOverrides) => void; scope: ScopeReview | undefined; value: MoveInfoOverrides }) {
  const sourceSchedule = scope?.job.scheduled_at ? new Date(scope.job.scheduled_at) : null;
  const [scheduleDraft, setScheduleDraft] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<MoveStopKind | null>(null);
  const [stopDraft, setStopDraft] = useState<MoveStopDraft | null>(null);
  const scheduledAt = value.schedule ? new Date(value.schedule) : sourceSchedule;
  const dDay = scheduledAt ? Math.max(0, Math.ceil((scheduledAt.getTime() - renderStartedAt) / 86_400_000)) : null;

  const getStop = (kind: MoveStopKind) => value.stops[kind] ?? defaultMoveStop(kind, scope);
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
      <InfoCard title="이사 일정"><div className="flex items-center gap-3"><Calendar aria-hidden="true" className="shrink-0" size="var(--icon-category)" /><span className="min-w-0 flex-1 text-ui-body leading-5">{scheduledAt ? fullDateFormatter.format(scheduledAt) : "일정을 입력해 주세요"}</span>{dDay !== null ? <span className="whitespace-nowrap rounded-lg bg-primary-50 px-2 py-1.5 text-ui-data text-primary-700">D-{dDay}</span> : null}<button className="min-h-11 whitespace-nowrap px-1 text-ui-control text-primary-700" onClick={openScheduleEditor} type="button">수정</button></div></InfoCard>
      <InfoCard title="이동 경로"><div className="relative pl-12"><span aria-hidden="true" className="absolute top-[14px] bottom-[14px] left-[12px] w-0.5 bg-primary-600" /><RoutePoint label="출발지" onEdit={() => openStopEditor("origin")} stop={getStop("origin")} /><RoutePoint destination label="도착지" onEdit={() => openStopEditor("destination")} stop={getStop("destination")} /></div></InfoCard>
      <aside className="flex items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3 text-sm text-ink-600"><TrendUp aria-hidden="true" size="var(--icon-sm)" /> 처음 확인한 뒤 수정된 정보는 확인서 변경 이력에 기록돼요.</aside>

      <Sheet onOpenChange={setScheduleOpen} open={scheduleOpen}>
        <SheetContent presentation="page" showClose={false}>
          <MobilePageHeader onBack={() => setScheduleOpen(false)} title="서비스 예정 일시" />
          {scheduleOpen ? <ScheduleEditor onChange={setScheduleDraft} value={scheduleDraft} /> : null}
          <SheetFooter><Button className="w-full" disabled={!scheduleDraft} onClick={() => { onChange({ ...value, schedule: scheduleDraft }); setScheduleOpen(false); }} size="cta">일정 저장</Button></SheetFooter>
        </SheetContent>
      </Sheet>

      <MoveStopSheet draft={stopDraft} kind={editingStop} onDraftChange={setStopDraft} onOpenChange={(open) => { if (!open) setEditingStop(null); }} onSave={saveStop} />
    </div>
  );
}

function ScheduleEditor({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const selected = value ? new Date(value) : null;
  const [month, setMonth] = useState(() => selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date());
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const timeValue = selected ? `${String(selected.getHours()).padStart(2, "0")}:${String(selected.getMinutes()).padStart(2, "0")}` : "";
  const timeOptions = Array.from({ length: 23 }, (_, index) => { const minutes = 7 * 60 + index * 30; return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; });
  if (timeValue && !timeOptions.includes(timeValue)) timeOptions.unshift(timeValue);
  const chooseDate = (day: number) => {
    const next = new Date(month.getFullYear(), month.getMonth(), day, selected?.getHours() ?? 9, selected?.getMinutes() ?? 0);
    onChange(dateTimeLocalValue(next));
  };
  const chooseTime = (time: string) => {
    if (!selected) return;
    const [hour, minute] = time.split(":").map(Number);
    const next = new Date(selected);
    next.setHours(hour, minute, 0, 0);
    onChange(dateTimeLocalValue(next));
  };
  const moveMonth = (amount: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));

  return <div className="px-5 py-7">
    <div className="flex items-center justify-between gap-4">
      <button aria-label="이전 달" className="grid size-11 place-items-center rounded-[var(--radius-control)] border border-line text-ink-600" onClick={() => moveMonth(-1)} type="button"><CaretLeft aria-hidden="true" size="var(--icon-md)" weight="bold" /></button>
      <strong className="text-ui-section tracking-[var(--tracking-display)] tabular-nums">{month.getFullYear()}. {String(month.getMonth() + 1).padStart(2, "0")}</strong>
      <button aria-label="다음 달" className="grid size-11 place-items-center rounded-[var(--radius-control)] border border-line text-ink-600" onClick={() => moveMonth(1)} type="button"><CaretRight aria-hidden="true" size="var(--icon-md)" weight="bold" /></button>
    </div>
    <div className="mt-6 grid grid-cols-7 border-b border-line pb-3 text-center text-sm font-bold text-ink-600">
      {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => <span className={index === 0 ? "text-danger-ink" : index === 6 ? "text-primary-700" : undefined} key={day}>{day}</span>)}
    </div>
    <div className="mt-3 grid grid-cols-7 gap-y-2 text-center">
      {Array.from({ length: firstDay }, (_, index) => <span aria-hidden="true" className="h-11" key={`blank-${index}`} />)}
      {Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const weekday = (firstDay + index) % 7;
        const active = selected?.getFullYear() === month.getFullYear() && selected.getMonth() === month.getMonth() && selected.getDate() === day;
        return <button aria-label={`${month.getMonth() + 1}월 ${day}일`} aria-pressed={active} className={`relative mx-auto grid size-11 place-items-center rounded-full text-ui-component font-bold ${active ? "bg-primary-600 text-white" : weekday === 0 ? "text-danger-ink" : weekday === 6 ? "text-primary-700" : "text-ink-900"}`} key={day} onClick={() => chooseDate(day)} type="button">{day}</button>;
      })}
    </div>
    <section className="mt-8 border-t-8 border-canvas pt-7">
      <div className="flex items-center justify-between gap-3"><h3 className="text-ui-section font-black">서비스 시작 시간</h3><span className="text-sm font-bold text-ink-600"><Check aria-hidden="true" className="mr-1 inline-block rounded-md bg-success p-0.5 text-white" size="var(--icon-sm)" />시간 협의 가능</span></div>
      <Select aria-label="서비스 시작 시간" className="mt-4 h-14" disabled={!selected} onChange={(event) => chooseTime(event.target.value)} value={timeValue}>
        {!selected ? <option value="">날짜를 먼저 선택해 주세요</option> : null}
        {timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
      </Select>
    </section>
  </div>;
}

function InfoCard({ children, title }: { children: ReactNode; title: string }) { return <section className="ui-card p-3 shadow-[var(--shadow-card)]"><h2 className="mb-2.5 text-base font-black">{title}</h2>{children}</section>; }

function RoutePoint({ destination = false, label, onEdit, stop }: { destination?: boolean; label: string; onEdit: () => void; stop: MoveStopDraft }) {
  const conditions = [stop.residenceType, stop.floor, `엘리베이터 ${stop.elevator}`, `사다리차 ${stop.ladder}`, `주차 ${stop.parking}`].filter(Boolean);
  return <div className={destination ? "relative mt-6" : "relative"}><span aria-hidden="true" className="absolute top-1 -left-[46px] size-5 rounded-full border-[5px] border-primary-600 bg-surface" /><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-ui-data text-primary-700">{label}</p><strong className="mt-0.5 block text-ui-support">{stop.address || `${label}를 입력해 주세요`}</strong>{stop.detailAddress ? <span className="mt-0.5 block text-xs text-ink-600">{stop.detailAddress}</span> : null}</div><button className="min-h-11 whitespace-nowrap px-1 text-ui-control text-primary-700" onClick={onEdit} type="button">수정</button></div><div className="mt-1.5 flex flex-wrap gap-1.5">{conditions.map((condition) => <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-ui-micro text-ink-600" key={condition}>{condition}</span>)}</div></div>;
}

function MoveStopSheet({ draft, kind, onDraftChange, onOpenChange, onSave }: { draft: MoveStopDraft | null; kind: MoveStopKind | null; onDraftChange: (draft: MoveStopDraft) => void; onOpenChange: (open: boolean) => void; onSave: () => void }) {
  const update = <K extends keyof MoveStopDraft>(key: K, value: MoveStopDraft[K]) => draft && onDraftChange({ ...draft, [key]: value });
  return <Sheet onOpenChange={onOpenChange} open={Boolean(kind)}><SheetContent presentation="page" showClose={false}><MobilePageHeader onBack={() => onOpenChange(false)} title={kind === "origin" ? "출발지 정보 수정" : "도착지 정보 수정"} />{draft ? <div className="space-y-2 bg-canvas pb-6"><section className="space-y-4 bg-surface px-5 py-6"><div><Label htmlFor="move-address">주소</Label><div className="mt-2"><AddressSearchInput id="move-address" onChange={(value) => update("address", value)} value={draft.address} /></div></div><div><Label htmlFor="move-detail-address">상세 주소</Label><Input className="mt-2" id="move-detail-address" onChange={(event) => update("detailAddress", event.target.value)} placeholder="예: 301호" value={draft.detailAddress} /></div></section><section className="space-y-6 bg-surface px-5 py-6"><ChoiceGroup appearance="outlined" label="층수" onChange={(value) => update("floor", value)} options={floorOptions} scroll value={draft.floor} /><ChoiceGroup columns={2} label="사다리차 사용 여부" onChange={(value) => update("ladder", value)} options={ladderOptions} value={draft.ladder ?? "사용 안 함"} /><ChoiceGroup columns={2} label="엘리베이터 유무" onChange={(value) => update("elevator", value)} options={elevatorOptions} value={draft.elevator} /><ChoiceGroup columns={2} label="주차 가능 여부" onChange={(value) => update("parking", value)} options={parkingOptions} value={draft.parking === "가능" ? "가능" : "불가능"} /><ChoiceGroup appearance="outlined" columns={2} label="거주지 형태" onChange={(value) => update("residenceType", value)} options={residenceOptions} value={draft.residenceType ?? "아파트"} /></section><section className="bg-surface px-5 py-6"><Label htmlFor="move-stop-memo">현장 메모 <span className="font-medium text-ink-400">(선택)</span></Label><Textarea className="mt-2" id="move-stop-memo" maxLength={200} onChange={(event) => update("memo", event.target.value)} placeholder="기사에게 알려둘 내용을 적어 주세요." value={draft.memo} /></section></div> : null}<SheetFooter><Button className="w-full" disabled={!draft?.address.trim()} onClick={onSave} size="cta">변경 내용 저장</Button></SheetFooter></SheetContent></Sheet>;
}

function ConsumerInventory({ onCapture, onManualAdd, scope }: { onCapture: () => void; onManualAdd: () => void; scope: ScopeReview | undefined }) {
  const [openRoom, setOpenRoom] = useState("");
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const groups = scope?.scope.room_groups ?? [];
  const allItems = groups.flatMap((group) => group.items).filter((item) => movingItemAssetForName(item.description) !== null);
  const quantityFor = (itemKey: string) => quantities[itemKey] ?? 1;
  const totalCount = allItems.reduce((total, item) => total + quantityFor(item.item_key), 0);
  const visibleItems = allItems.filter((item) => quantityFor(item.item_key) > 0 && (!openRoom || item.room_zone_id === openRoom) && item.description.toLocaleLowerCase("ko-KR").includes(query.trim().toLocaleLowerCase("ko-KR")));
  const updateQuantity = (itemKey: string, next: number) => setQuantities((current) => ({ ...current, [itemKey]: Math.max(0, next) }));

  return <div className="px-[var(--content-gutter)] pb-24 pt-4">
    <label className="flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-3 focus-within:border-primary-400 focus-within:ring-3 focus-within:ring-primary-100" htmlFor="inventory-search"><MagnifyingGlass aria-hidden="true" className="shrink-0 text-ink-400" size="var(--icon-md)" /><input className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-400" data-slot="input-proxy" id="inventory-search" onChange={(event) => setQuery(event.target.value)} placeholder="짐 이름 검색" type="search" value={query} /></label>
    <div className="no-scrollbar -mx-[var(--content-gutter)] mt-4 flex gap-2 overflow-x-auto px-[var(--content-gutter)] pb-1">
      <FilterChip active={!openRoom} onClick={() => setOpenRoom("")}>전체 {totalCount}</FilterChip>
      {groups.map((group) => <FilterChip active={openRoom === group.room_zone_id} key={group.room_zone_id} onClick={() => setOpenRoom(group.room_zone_id)}>{group.label}</FilterChip>)}
    </div>
    <div className="mt-4 space-y-2">
      {visibleItems.map((item) => { const quantity = quantityFor(item.item_key); return <InventoryQuantityRow icon={<InventoryItemIcon name={item.description} />} key={item.item_key} name={item.description} onDecrease={() => updateQuantity(item.item_key, quantity - 1)} onIncrease={() => updateQuantity(item.item_key, quantity + 1)} onRemove={() => updateQuantity(item.item_key, 0)} quantity={quantity} reviewRequired={item.review_required} />; })}
      {!scope ? <p className="py-5 text-sm text-ink-600">최신 짐 목록을 불러오는 중입니다.</p> : null}
      {scope && visibleItems.length === 0 ? <div className="rounded-2xl border border-line bg-surface px-4 py-8 text-center"><p className="font-extrabold">표시할 짐이 없어요</p><p className="mt-1 text-sm text-ink-600">검색어를 바꾸거나 짐을 다시 추가해 주세요.</p></div> : null}
    </div>
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[calc(var(--z-sticky)-1)] flex justify-center">
      <div className="app-fixed-action pointer-events-auto grid w-full max-w-[var(--shell-mobile)] grid-cols-2 gap-2 bg-surface px-[var(--content-gutter)] pt-3">
        <Button className="min-w-0 px-2 text-ui-data min-[360px]:text-sm" onClick={onManualAdd} size="cta" variant="outline"><Cube aria-hidden="true" /> 품목 직접 선택</Button>
        <Button className="min-w-0 px-2 text-ui-data min-[360px]:text-sm" onClick={onCapture} size="cta"><Camera aria-hidden="true" weight="fill" /> AI 영상 촬영</Button>
      </div>
    </div>
  </div>;
}

function InventoryItemIcon({ name }: { name: string }) {
  return <MovingItemIcon name={name} />;
}

function ConsumerAgreement({ completion, connection, fallbackLocationConditions, issues, scope }: { completion: CompletionSummary | undefined; connection: Connection; fallbackLocationConditions: ScopeLocationConditions[]; issues: FieldIssue[] | undefined; scope: ScopeReview | undefined }) {
  const queryClient = useQueryClient();
  const [issueOpen, setIssueOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
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
    mutationFn: ({ decision, note }: { decision: "approve" | "reject" | "request_clarification"; note?: string }) => decideChangeProposal(connection, issue!.change_proposal_id!, { decision, note }),
    onSuccess: async () => { setIssueOpen(false); await refresh(); },
  });
  if (!scope) return <div className="px-[var(--content-gutter)] py-8 text-sm text-ink-600">확인서를 불러오는 중입니다.</div>;

  return (
    <div className="space-y-2.5 px-[var(--content-gutter)] pb-28 pt-3">
      <AgreementOverview fallbackLocationConditions={fallbackLocationConditions} hasIssue={Boolean(issue)} onOpenHistory={() => setHistoryOpen(true)} scope={scope}>{displayIssue ? <FieldReportCard companyName={scope.job.company_display_name} issue={displayIssue} onOpen={() => setIssueOpen(true)} /> : null}</AgreementOverview>
      {completion?.final_amount_krw ? <p className="sr-only">완료 기준 최종 금액 {money(completion.final_amount_krw)}</p> : null}
      {displayIssue ? <FieldChangeSheet error={decisionMutation.error} issue={displayIssue} loading={proposalQuery.isLoading} onDecision={(decision, note) => decisionMutation.mutate({ decision, note })} onOpenChange={setIssueOpen} open={issueOpen} pending={decisionMutation.isPending} proposal={proposalQuery.data} readOnly={!issue} /> : null}
      <AgreementHistorySheet issue={displayIssue?.status === "approved" ? displayIssue : undefined} onOpenChange={setHistoryOpen} open={historyOpen} scope={scope} />
    </div>
  );
}

function FieldReportCard({ companyName, issue, onOpen }: { companyName: string | null; issue: FieldIssue; onOpen: () => void }) {
  const awaitingCustomer = issue.status === "customer_review";
  const resolved = issue.status === "approved" || issue.status === "rejected";
  const statusLabel = awaitingCustomer ? "확인 필요" : resolved ? "처리 완료" : "업체 처리 중";
  const responseLabel = awaitingCustomer ? "내 확인 대기" : resolved ? "확인 완료" : "변경안 대기";
  return <section className="ui-card p-3"><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-ui-status ${resolved ? "border-success text-success" : "border-warning text-warning-ink"}`}>{statusLabel}</span><h2 className="mt-1.5 text-lg font-black">현장 보고 <b className="text-primary-700">1건</b>이 도착했어요</h2><p className="mt-0.5 text-ui-data text-ink-600">{issue.title}</p><p className="mt-1 line-clamp-2 text-xs text-ink-400">{issue.description}</p><div className="mt-2 flex items-center justify-between gap-3 text-ui-micro text-ink-400"><span className="min-w-0 truncate">현장기사 보고 · {companyName ?? "이사업체"} 기록</span><span className={`shrink-0 font-bold ${resolved ? "text-success" : "text-warning-ink"}`}>{responseLabel}</span></div><button className="mt-2 flex min-h-11 w-full items-center justify-between rounded-[var(--radius-control)] border border-line px-4 text-ui-data hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" onClick={onOpen} type="button">보고 내용 확인 <CaretRight aria-hidden="true" size="var(--icon-sm)" /></button></section>;
}

function FieldChangeSheet({ error, issue, loading, onDecision, onOpenChange, open, pending, proposal, readOnly }: {
  error: Error | null;
  issue: FieldIssue;
  loading: boolean;
  onDecision: (decision: "approve" | "reject" | "request_clarification", note?: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending: boolean;
  proposal: Awaited<ReturnType<typeof getChangeProposal>> | undefined;
  readOnly: boolean;
}) {
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestText, setRequestText] = useState("");
  const adjustment = proposal?.quote.adjustments.at(-1)?.amount_krw ?? 0;
  const total = proposal?.quote.total_amount_krw ?? 0;
  const previous = total - adjustment;
  const evidenceUrl = proposal?.evidence_media[0]?.read_url ?? (issue.evidence_media_asset_ids.length ? "/elevator-outage-evidence.png" : null);
  const reportedAt = fullDateFormatter.format(new Date(issue.reported_at));
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="!transition-none [&>button]:bg-ink-900/70 [&>button]:text-white [&>button]:hover:bg-ink-900/80" presentation="page">
    <SheetTitle className="sr-only">현장 변경 확인</SheetTitle><SheetDescription className="sr-only">{issue.title} · 현장기사 보고</SheetDescription>
    {loading ? <div className="grid min-h-dvh place-items-center text-sm text-ink-600">변경안을 불러오는 중입니다.</div> : <div>
      <figure className="relative h-[320px] bg-ink-900">
        {evidenceUrl ? <img alt={`${issue.title} 현장 증거`} className="h-full w-full object-cover" height="420" src={evidenceUrl} width="480" /> : null}
        <span className="absolute right-4 bottom-12 rounded-full bg-ink-900/70 px-2.5 py-1 text-xs font-bold text-white">1 / 1</span>
      </figure>
      <div className="relative -mt-10 min-h-[calc(100dvh-300px)] rounded-t-[var(--radius-feature)] bg-surface px-5 pb-4 pt-8">
        <h3 className="whitespace-nowrap text-left text-lg leading-7 font-black tracking-[var(--tracking-display)]">엘리베이터가 멈춰 계단 운반이 필요해요</h3>
        <p className="mt-3 text-left text-sm text-ink-600">{reportedAt} · 현장기사</p>
        {proposal ? <section className="mt-7 ui-card p-4"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700"><Stairs aria-hidden="true" size="var(--icon-md)" /></span><h4 className="text-lg font-black">{proposal.title}</h4></div><dl className="mt-4 grid grid-cols-[88px_minmax(0,1fr)] gap-y-3 text-sm"><dt className="text-ink-600">사유</dt><dd>{proposal.reason}</dd><dt className="text-ink-600">예상 추가 시간</dt><dd>+1시간</dd></dl><div className="mt-5 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center tabular-nums"><div><span className="text-xs text-ink-600">기존 금액</span><strong className="mt-1 block text-ui-support">{money(previous)}</strong></div><div><span className="text-xs text-ink-600">추가 금액</span><strong className="mt-1 block text-ui-support text-danger-ink">{adjustment > 0 ? "+" : ""}{money(adjustment)}</strong></div><div><span className="text-xs text-ink-600">변경 후</span><strong className="mt-1 block text-ui-support">{money(total)}</strong></div></div></section> : <section className="mt-6 ui-card p-4"><h4 className="text-lg font-black">{issue.title}</h4><p className="mt-2 text-sm leading-6 text-ink-600">{issue.description}</p></section>}
        {error ? <p className="mt-3 text-sm font-bold text-danger">{apiErrorMessage(error)}</p> : null}
      </div>
    </div>}
    {!readOnly && proposal ? <SheetFooter className="grid gap-2 border-t-0"><Button className="w-full whitespace-nowrap" disabled={pending} onClick={() => onDecision("approve")} size="cta">변경 승인하기 · {adjustment > 0 ? "+" : ""}{money(adjustment)}</Button><Button className="w-full whitespace-nowrap" disabled={pending} onClick={() => setRequestOpen(true)} variant="ghost">수정 요청</Button></SheetFooter> : null}
    <Sheet onOpenChange={setRequestOpen} open={requestOpen}><SheetContent><SheetHeader><SheetTitle>수정 요청</SheetTitle><SheetDescription>변경이 필요한 내용을 업체에 알려주세요.</SheetDescription></SheetHeader><div className="px-4"><Label htmlFor="change-request">요청 내용</Label><Textarea className="mt-2 min-h-28" id="change-request" onChange={(event) => setRequestText(event.target.value)} placeholder="예: 추가 시간과 운반 인원을 다시 확인해 주세요." value={requestText} /></div><SheetFooter><Button className="w-full" disabled={!requestText.trim() || pending} onClick={() => { onDecision("request_clarification", requestText.trim()); setRequestOpen(false); }} size="cta">수정 요청 보내기</Button></SheetFooter></SheetContent></Sheet>
  </SheetContent></Sheet>;
}

function AgreementHistorySheet({ issue, onOpenChange, open, scope }: { issue: FieldIssue | undefined; onOpenChange: (open: boolean) => void; open: boolean; scope: ScopeReview }) {
  const [previousOpen, setPreviousOpen] = useState(false);
  const versionMatch = /^v(\d+)$/i.exec(scope.scope.version_label);
  const previousVersion = versionMatch && Number(versionMatch[1]) > 1 ? `v${Number(versionMatch[1]) - 1}` : "이전 기준";
  const adjustments = scope.quote?.adjustments ?? [];
  const reportDate = issue?.reported_at ? fullDateFormatter.format(new Date(issue.reported_at)) : null;
  const handleOpenChange = (next: boolean) => { if (!next) setPreviousOpen(false); onOpenChange(next); };
  const handleBack = () => { if (previousOpen) setPreviousOpen(false); else handleOpenChange(false); };

  return (
    <Sheet onOpenChange={handleOpenChange} open={open}>
      <SheetContent presentation="page" showClose={false}>
        <MobilePageHeader left={<MobileHeaderButton ariaLabel="뒤로가기" onClick={handleBack}><ArrowLeft aria-hidden="true" size="var(--icon-sm)" /></MobileHeaderButton>} title={previousOpen ? `${previousVersion} 확인서` : "변경 이력"} />
        {previousOpen ? (
          <div className="px-5 py-6">
            <section className="ui-card p-5">
              <span className="inline-flex rounded-md bg-surface-muted px-2 py-1 text-xs font-extrabold text-ink-600">이전 승인본</span>
              <h2 className="mt-3 text-ui-section font-black">{previousVersion} · 변경 전 기준</h2>
              <dl className="mt-5 divide-y divide-line border-y border-line text-sm">
                <div className="flex justify-between gap-4 py-3"><dt className="text-ink-600">짐 / 작업</dt><dd className="font-bold">짐 {scope.scope.item_count}개 · 작업 {scope.scope.work_count}개</dd></div>
                <div className="flex justify-between gap-4 py-3"><dt className="text-ink-600">합의 금액</dt><dd className="font-bold tabular-nums">{money(scope.quote?.base_amount_krw)}</dd></div>
              </dl>
              <p className="mt-4 text-sm leading-6 text-ink-600">이 기록은 현재 변경안이 적용되기 전 승인된 작업 범위입니다.</p>
            </section>
          </div>
        ) : (
          <div className="px-5 py-6">
            <ol className="relative ml-3 border-l-2 border-line pl-7">
              <li className="relative pb-8">
                <span aria-hidden="true" className="absolute top-0 -left-[37px] size-4 rounded-full border-[3px] border-success bg-surface" />
                <div className="flex min-h-11 items-start justify-between gap-3">
                  <span>
                    <span className="inline-flex rounded-md border border-success px-2 py-0.5 text-ui-micro font-extrabold text-success">현재 버전</span>
                    <strong className="mt-2 block text-ui-section">{scope.scope.version_label} · 현재 확인서</strong>
                  </span>
                  <button aria-label="이전 기록 확인" className="grid size-11 shrink-0 place-items-center rounded-full text-ink-400 hover:bg-surface-muted" onClick={() => setPreviousOpen(true)} type="button"><CaretRight aria-hidden="true" size="var(--icon-sm)" /></button>
                </div>
                <div className="mt-3 ui-card p-4 text-sm">
                  <p>짐 {scope.scope.item_count}개 · 작업 {scope.scope.work_count}개</p>
                  <p className="mt-3 border-t border-line pt-3 tabular-nums">금액 <strong className="float-right text-primary-700">{money(scope.quote?.total_amount_krw)}</strong></p>
                  {adjustments.length ? <p className="mt-3 text-ink-600">변경 사유: {adjustments.map((item) => item.label).join(" · ")}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-md bg-success-bg px-2 py-1 text-xs font-bold text-success-ink">업체 확인</span><span className={`rounded-md px-2 py-1 text-xs font-bold ${scope.customer_confirmed_at ? "bg-success-bg text-success-ink" : "bg-warning-bg text-warning-ink"}`}>{scope.customer_confirmed_at ? "고객 확인" : "고객 확인 대기"}</span></div>
                </div>
              </li>
              {issue ? <li className="relative pb-8">
                <span aria-hidden="true" className="absolute top-1 -left-[37px] size-4 rounded-full border-[3px] border-primary-600 bg-surface" />
                <details>
                  <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3">
                    <span><strong className="block text-lg">현장 보고 · {issue.title}</strong>{reportDate ? <span className="mt-1 block text-sm text-ink-600">{reportDate}</span> : null}</span>
                    <CaretDown aria-hidden="true" className="mt-1 shrink-0 text-ink-400" size="var(--icon-sm)" />
                  </summary>
                  <div className="mt-3 ui-card p-4 text-sm"><p className="leading-6">{issue.description}</p><p className="mt-2 text-ink-600">처리 상태 · {issue.status === "approved" ? "승인" : issue.status === "rejected" ? "거절" : issue.status === "customer_review" ? "고객 확인 대기" : "업체 처리 중"}</p></div>
                </details>
              </li> : null}
              <li className="relative">
                <span aria-hidden="true" className="absolute top-1 -left-[37px] size-4 rounded-full border-[3px] border-line bg-surface" />
                <button className="flex min-h-14 w-full items-start justify-between gap-3 text-left" onClick={() => setPreviousOpen(true)} type="button"><span><strong className="block text-lg">{previousVersion} · 변경 전 기준</strong><span className="mt-1 block text-sm text-ink-600">현재 변경안의 기준 금액</span></span><CaretRight aria-hidden="true" className="mt-1 shrink-0 text-ink-400" size="var(--icon-sm)" /></button>
              </li>
            </ol>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
