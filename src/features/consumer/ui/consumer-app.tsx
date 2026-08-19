import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightIcon as ArrowRight,
  ArchiveIcon as Archive,
  BellIcon as Bell,
  BuildingApartmentIcon,
  BuildingOfficeIcon,
  CalendarBlankIcon as Calendar,
  CameraIcon as Camera,
  CaretDownIcon as CaretDown,
  CaretLeftIcon as CaretLeft,
  CaretRightIcon as CaretRight,
  CheckIcon as Check,
  CopyIcon as Copy,
  CubeIcon as Cube,
  HouseIcon as Home,
  HouseLineIcon,
  KeyIcon as Key,
  MagnifyingGlassIcon as MagnifyingGlass,
  NotepadIcon as Notepad,
  PackageIcon as Package,
  ShareNetworkIcon as ShareNetwork,
  ShieldCheckIcon as ShieldCheck,
  SquaresFourIcon as SquaresFour,
  StairsIcon as Stairs,
  TrendUpIcon as TrendUp,
  TrashIcon as Trash,
  TruckIcon as Truck,
  WarningCircleIcon as WarningCircle,
} from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { mockApiEnabled, mockConnectionCodes } from "@/api/mock-api";
import { movingItemAssetForName, movingItemCategoryForName, type MovingItemCategory } from "@/components/moving-item-assets";
import { MovingItemIcon } from "@/components/moving-item-icon";
import { AgreementOverview } from "@/components/layout/agreement-overview";
import { ActiveMoveCard, FilterChip, InventoryQuantityRow, MoveJourneyProgress } from "@/components/layout/app-primitives";
import { ConnectedProfile } from "@/components/layout/connected-profile";
import { AgreementHistorySheet } from "@/components/layout/agreement-history-sheet";
import { MobileAppShell, MobileDetailHeader, MobileDetailTabs, MobilePageHeader, type MobileNavItem } from "@/components/layout/mobile-app-shell";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { customerDisplayNameStorageKey, useAuth } from "@/features/auth/model/auth-context";
import { CustomerOnboardingSheet, moveDraftStorageKey } from "@/features/auth/ui/customer-onboarding-sheet";
import { AddressSearchInput } from "@/features/consumer/ui/address-search-input";
import {
  apiErrorMessage,
  confirmScopeReview,
  decideChangeProposal,
  decideCompletionRequest,
  getCompletionSummary,
  getChangeProposal,
  getScopeReview,
  listMoveJobs,
  listFieldIssues,
  listNotifications,
  patchMoveJob,
  requestScopeRevision,
  deleteMoveJob,
  workflowKeys,
  type CompletionSummary,
  type Connection,
  type FieldIssue,
  type MoveJob,
  type MoveLocationConditions,
  type MockMoveSummary,
  type ScopeLocationConditions,
  type ScopeReview,
} from "@/features/workflow/api/workflow-api";
import { notificationCopy, notificationDateFormatter } from "@/features/workflow/model/notification-copy";

type ConsumerTab = "home" | "move" | "more" | "notifications";
type ConsumerMoveView = "list" | "info" | "items" | "agreement";
type MoveInfoEditor = "schedule" | MoveStopKind;

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
const residenceIcons = {
  아파트: <BuildingApartmentIcon aria-hidden="true" size="var(--icon-sm)" />,
  "빌라·연립": <HouseLineIcon aria-hidden="true" size="var(--icon-sm)" />,
  오피스텔: <BuildingOfficeIcon aria-hidden="true" size="var(--icon-sm)" />,
  단독주택: <Home aria-hidden="true" size="var(--icon-sm)" />,
};

const residenceFromApi: Record<MoveLocationConditions["residence_type"], string> = { apartment: "아파트", villa: "빌라·연립", officetel: "오피스텔", house: "단독주택", studio: "기타", other: "기타", unknown: "기타" };
const residenceToApi: Record<string, MoveLocationConditions["residence_type"]> = { 아파트: "apartment", "빌라·연립": "villa", 오피스텔: "officetel", 단독주택: "house" };

function accessNoteValue(note: string | null, label: string) {
  return note?.split("\n").find((line) => line.startsWith(`${label}: `))?.slice(label.length + 2) ?? "";
}

function defaultMoveStop(kind: MoveStopKind, scope: ScopeReview | undefined, job?: MoveJob): MoveStopDraft {
  const location = job?.locations.find((item) => item.kind === kind);
  const conditions = location?.conditions;
  const floor = conditions?.floor.status === "known" && conditions.floor.value !== null
    ? conditions.floor.value < 1 ? "반지하" : conditions.floor.value >= 5 ? "5층 이상" : `${conditions.floor.value}층`
    : "1층";
  return {
    address: location?.label ?? (kind === "origin" ? scope?.job.origin_summary ?? "" : scope?.job.destination_summary ?? ""),
    detailAddress: accessNoteValue(conditions?.access_note ?? null, "상세 주소"),
    elevator: conditions?.elevator === "unavailable" ? "없음" : "있음",
    floor,
    ladder: accessNoteValue(conditions?.access_note ?? null, "사다리차") === "사용" ? "사용" : "사용 안 함",
    memo: accessNoteValue(conditions?.access_note ?? null, "메모"),
    parking: conditions?.parking_access === "available" ? "가능" : "불가능",
    residenceType: conditions ? residenceFromApi[conditions.residence_type] : "아파트",
  };
}

function moveStopApiConditions(stop: MoveStopDraft): MoveLocationConditions {
  const floorValue = stop.floor === "반지하" ? -1 : stop.floor === "5층 이상" ? 5 : Number.parseInt(stop.floor, 10);
  const notes = [stop.detailAddress && `상세 주소: ${stop.detailAddress}`, `사다리차: ${stop.ladder}`, stop.memo && `메모: ${stop.memo}`].filter(Boolean);
  return {
    residence_type: residenceToApi[stop.residenceType] ?? "other",
    floor: Number.isFinite(floorValue) ? { status: "known", value: floorValue } : { status: "unknown", value: null },
    elevator: stop.elevator === "있음" ? "available" : "unavailable",
    stairs: "unknown",
    parking_access: stop.parking === "가능" ? "available" : "unavailable",
    carry_distance: { status: "unknown", value_m: null },
    access_note: notes.join("\n") || null,
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

export function ConsumerApp() {
  const { session } = useAuth();
  return session?.actor.role === "customer" ? <ConnectedConsumerApp key={session.actor.job_id} /> : <NewCustomerApp />;
}

function NewCustomerApp() {
  const { connect } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [moveStartOpen, setMoveStartOpen] = useState(false);
  const requestedTab = params.get("tab") as ConsumerTab | null;
  const tab: ConsumerTab = requestedTab === "move" || requestedTab === "more" ? requestedTab : "home";
  const customerName = window.sessionStorage.getItem(customerDisplayNameStorageKey)?.trim() || "고객";
  const setTab = (next: ConsumerTab) => setParams(next === "home" ? {} : { tab: next, ...(next === "move" ? { view: "list" } : {}) }, { replace: true });
  const disconnect = () => { window.sessionStorage.removeItem(customerDisplayNameStorageKey); navigate("/"); };

  return <>
    <MobileAppShell current={tab} eyebrow={`고객 · ${customerName}`} header={tab === "home" ? <HomeHeader customerName={customerName} /> : tab === "move" ? <MoveListSafeArea /> : false} items={tabs} onChange={setTab} title={tab === "home" ? "홈" : tab === "move" ? "내 이사" : "더보기"}>
      {tab === "home" ? <EmptyCustomerHome onStart={() => setMoveStartOpen(true)} /> : null}
      {tab === "move" ? <EmptyMoveList onNewMove={() => setMoveStartOpen(true)} /> : null}
      {tab === "more" ? <ConnectedProfile connected={false} displayName={customerName} onDisconnect={disconnect} roleLabel="고객" /> : null}
    </MobileAppShell>
    <CustomerMoveStartSheet connect={connect} onConnected={() => { window.sessionStorage.removeItem(customerDisplayNameStorageKey); setParams({ tab: "move", view: "list" }, { replace: true }); }} onNewMove={() => { setMoveStartOpen(false); setOnboardingOpen(true); }} onOpenChange={setMoveStartOpen} open={moveStartOpen} />
    <CustomerOnboardingSheet onOpenChange={setOnboardingOpen} open={onboardingOpen} />
  </>;
}

function EmptyCustomerHome({ onStart }: { onStart: () => void }) {
  return <div className="pb-[var(--bottom-rail-height)]"><section className="px-[var(--content-gutter)]"><NewMoveHero onStart={onStart} /></section><section className="mx-[var(--content-gutter)] mt-4 ui-card p-5 shadow-[var(--shadow-card)]"><h2 className="text-ui-component font-black">진행 중인 이사가 없어요</h2><p className="mt-2 text-sm leading-6 text-ink-600">새 이사를 만들면 촬영부터 공동확인까지 한곳에서 이어집니다.</p></section><PreventionSection /></div>;
}

function EmptyMoveList({ onNewMove }: { onNewMove: () => void }) {
  const [listTab, setListTab] = useState<"active" | "history">("active");
  return <div className="pb-28"><div className="bg-surface px-[var(--content-gutter)] pt-5"><div className="flex items-center justify-between gap-3"><h1 className="text-ui-section">내 이사</h1><button className="min-h-11 whitespace-nowrap px-2 text-ui-control text-primary-700" onClick={onNewMove} type="button">+ 새 이사</button></div><div className="mt-6 grid grid-cols-2 border-b border-line" role="tablist" aria-label="이사 목록"><button aria-selected={listTab === "active"} className={`relative min-h-11 text-ui-control ${listTab === "active" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("active")} role="tab" type="button">진행 중 0</button><button aria-selected={listTab === "history"} className={`relative min-h-11 text-ui-control ${listTab === "history" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("history")} role="tab" type="button">기록 0</button></div></div><div className="px-[var(--content-gutter)]"><section className="mt-8 ui-card px-5 py-8 text-center shadow-[var(--shadow-card)]"><Archive aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><h2 className="mt-4 text-ui-component">{listTab === "active" ? "진행 중인 이사가 없어요" : "아직 이사 기록이 없어요"}</h2><p className="mt-2 text-ui-support text-ink-600">{listTab === "active" ? "새 이사를 시작하면 진행 상황을 여기에서 확인할 수 있어요." : "이사가 완료되면 최종 기록을 여기에서 확인할 수 있어요."}</p><Button className="mt-5 w-full" onClick={onNewMove}>새 이사 시작</Button></section></div></div>;
}

function ConnectedConsumerApp() {
  const { session, clearSession, connect } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("tab") as ConsumerTab | null;
  const tab = requestedTab && validTabs.has(requestedTab) ? requestedTab : "home";
  const requestedView = params.get("view") as ConsumerMoveView | null;
  const moveView = requestedView && validMoveViews.has(requestedView) ? requestedView : "list";
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [moveStartOpen, setMoveStartOpen] = useState(false);
  const [moveActionsOpen, setMoveActionsOpen] = useState(false);
  const [moveInfoEditor, setMoveInfoEditor] = useState<MoveInfoEditor | null>(null);
  const selectedJobId = params.get("job") ?? session!.actor.job_id;
  const connection: Connection = { accessToken: session!.accessToken, jobId: selectedJobId };

  const queryClient = useQueryClient();
  const moveListQuery = useQuery({ queryKey: workflowKeys.moves(session!.actor.role), queryFn: () => listMoveJobs(session!.accessToken) });
  const scopeQuery = useQuery({
    queryKey: workflowKeys.scope(selectedJobId),
    queryFn: () => getScopeReview(connection),
    refetchInterval: (query) => query.state.data ? (query.state.data.quote ? false : 2_000) : false,
  });
  const storedCustomerName = window.sessionStorage.getItem(customerDisplayNameStorageKey)?.trim();
  const activeCustomerName = storedCustomerName || session!.actor.display_name || scopeQuery.data?.job.customer_display_name || "고객";
  const completionQuery = useQuery({ queryKey: workflowKeys.completion(selectedJobId), queryFn: () => getCompletionSummary(connection) });
  const issuesQuery = useQuery({ queryKey: workflowKeys.fieldIssues(selectedJobId), queryFn: () => listFieldIssues(connection), refetchInterval: mockApiEnabled ? 2_000 : false });
  const notificationsQuery = useQuery({ enabled: tab === "notifications", queryKey: workflowKeys.notifications(selectedJobId), queryFn: () => listNotifications(connection) });
  const deleteMutation = useMutation({
    mutationFn: (jobId: string) => deleteMoveJob({ accessToken: session!.accessToken, jobId }),
    onSuccess: async (_result, deletedJobId) => {
      await queryClient.invalidateQueries({ queryKey: workflowKeys.moves(session!.actor.role) });
      const remaining = moveListQuery.data?.moves.find((move) => move.job.id !== deletedJobId);
      if (!remaining) {
        window.sessionStorage.setItem(customerDisplayNameStorageKey, activeCustomerName);
        clearSession();
      } else if (deletedJobId === selectedJobId) {
        openMove(remaining.job.id);
      }
      setMoveActionsOpen(false);
      setMoveView("list");
    },
  });

  const setTab = (next: ConsumerTab) => {
    setMoveInfoEditor(null);
    if (next === "home") setParams({}, { replace: true });
    else if (next === "move") setParams({ tab: "move", view: "list" }, { replace: true });
    else setParams({ tab: next }, { replace: true });
  };
  const setMoveView = (view: ConsumerMoveView) => { setMoveInfoEditor(null); setParams({ tab: "move", view, ...(view === "list" ? {} : { job: selectedJobId }) }, { replace: true }); };
  const openAgreement = () => setMoveView("agreement");
  const openMove = (jobId: string = selectedJobId) => { setMoveInfoEditor(null); setParams({ tab: "move", view: "info", job: jobId }, { replace: true }); };
  const disconnect = () => { clearSession(); navigate("/"); };

  const header = tab === "home"
    ? <HomeHeader customerName={activeCustomerName} onBell={() => setTab("notifications")} />
    : tab === "move"
      ? moveInfoEditor
        ? <MobilePageHeader onBack={() => setMoveInfoEditor(null)} title={moveInfoEditor === "schedule" ? "서비스 예정 일시" : moveInfoEditor === "origin" ? "출발지 정보 수정" : "도착지 정보 수정"} />
        : moveView === "list"
        ? <MoveListSafeArea />
        : <MoveHeader onBack={() => setMoveView("list")} onMore={() => setMoveActionsOpen(true)} scope={scopeQuery.data} />
       : tab === "notifications"
         ? <NotificationsHeader onBack={() => setTab("home")} />
         : tab === "more" ? false : undefined;

  return (
    <>
    <MobileAppShell current={tab} eyebrow={`고객 · ${activeCustomerName}`} header={header} items={tabs} onChange={setTab} onProfile={() => setTab("more")} showNav={tab !== "move" || moveView === "list"} title={tab === "home" ? "홈" : tab === "move" ? "내 이사" : "더보기"}>
      {tab === "home" ? <HomeTab completion={completionQuery.data} onOpenAgreement={openAgreement} onOpenMove={() => openMove()} onStartMove={() => setMoveStartOpen(true)} scope={scopeQuery.data} /> : null}
      {tab === "move" ? <ConsumerMoveTab completion={completionQuery.data} connection={connection} editor={moveInfoEditor} issues={issuesQuery.data} key={`${selectedJobId}:${moveListQuery.data ? "loaded" : "loading"}`} moveJobs={moveListQuery.data?.moves} onCapture={() => navigate(`/consumer/capture?mode=video&job=${encodeURIComponent(selectedJobId)}`)} onEditorChange={setMoveInfoEditor} onManualAdd={() => navigate(`/consumer/capture?mode=manual&job=${encodeURIComponent(selectedJobId)}`)} onNewMove={() => setMoveStartOpen(true)} onOpen={(jobId) => openMove(jobId)} onOpenCompletion={() => navigate(`/consumer/completion?job=${encodeURIComponent(selectedJobId)}`)} onOpenQuote={() => navigate(`/consumer/quote?job=${encodeURIComponent(selectedJobId)}`)} onViewChange={setMoveView} scope={scopeQuery.data} view={moveView} /> : null}
      {tab === "notifications" ? <CustomerNotifications error={notificationsQuery.error} notifications={notificationsQuery.data} pending={notificationsQuery.isPending} /> : null}
      {tab === "more" ? <ConnectedProfile displayName={activeCustomerName} expiresAt={session!.actor.expires_at} onDisconnect={disconnect} permissions={session!.actor.permissions} roleLabel="고객" /> : null}
    </MobileAppShell>
    <CustomerMoveStartSheet connect={connect} onConnected={() => setMoveView("list")} onNewMove={() => { setMoveStartOpen(false); setOnboardingOpen(true); }} onOpenChange={setMoveStartOpen} open={moveStartOpen} />
    <CustomerOnboardingSheet onOpenChange={setOnboardingOpen} open={onboardingOpen} />
    <MoveActionsSheet canDelete={Boolean(scopeQuery.data && !scopeQuery.data.proposal_id)} error={deleteMutation.error} onDelete={() => deleteMutation.mutate(selectedJobId)} onOpenChange={setMoveActionsOpen} open={moveActionsOpen} pending={deleteMutation.isPending} />
    </>
  );
}

function HomeHeader({ customerName, onBell }: { customerName: string; onBell?: () => void }) {
  return (
    <header className="flex items-center justify-between bg-canvas px-[var(--content-gutter)] pb-4 pt-[max(16px,env(safe-area-inset-top))]">
      <h1 className="text-ui-section leading-8 font-extrabold tracking-[var(--tracking-display)]">{customerName}님,<br />어떤 이사를 준비할까요?</h1>
      {onBell ? <button aria-label="알림 확인" className="grid size-9 place-items-center rounded-full text-ink-900 hover:bg-surface-muted" onClick={onBell} type="button"><Bell aria-hidden="true" size="var(--icon-sm)" /></button> : null}
    </header>
  );
}

function NotificationsHeader({ onBack }: { onBack: () => void }) {
  return <header className="app-safe-header sticky top-0 z-[var(--z-sticky)] grid min-h-[68px] grid-cols-[48px_1fr_48px] items-center bg-surface px-2"><button aria-label="홈으로 돌아가기" className="grid size-11 place-items-center rounded-full" onClick={onBack} type="button"><CaretLeft aria-hidden="true" size="var(--icon-category)" weight="bold" /></button><h1 className="text-center text-ui-section font-black">알림</h1><span /></header>;
}

function CustomerNotifications({ error, notifications, pending }: { error?: unknown; notifications?: Awaited<ReturnType<typeof listNotifications>>; pending?: boolean }) {
  const items = [...(notifications ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return <div className="px-[var(--content-gutter)] pb-28 pt-5"><h2 className="text-ui-section font-black tracking-[var(--tracking-display)]">작업 알림</h2><p className="mt-2 text-sm text-ink-600">작업범위와 현장 변경, 완료 요청 소식을 보여드려요.</p>{pending ? <p className="mt-8 text-center text-sm text-ink-600">알림을 불러오는 중입니다.</p> : error ? <p className="mt-6 rounded-xl bg-danger-bg p-4 text-sm font-bold text-danger-ink" role="alert">{apiErrorMessage(error)}</p> : items.length ? <div className="mt-6 divide-y divide-line border-y border-line">{items.map((notification) => { const copy = notificationCopy[notification.event_type]; const warning = notification.event_type === "analysis_failed.v1" || notification.event_type === "change_requested.v1"; return <article className="flex gap-3 py-5" key={notification.id}><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${warning ? "bg-warning-bg text-warning-ink" : "bg-primary-50 text-primary-700"}`}>{warning ? <WarningCircle aria-hidden="true" size="var(--icon-md)" /> : <Notepad aria-hidden="true" size="var(--icon-md)" />}</span><div className="min-w-0"><span className={`text-xs font-extrabold ${warning ? "text-warning-ink" : "text-primary-700"}`}>{copy.label}</span><h3 className="mt-1 text-ui-component font-black">{copy.title}</h3><p className="mt-1 text-sm leading-5 text-ink-600">{copy.description}</p><p className="mt-2 text-ui-micro text-ink-400">{notificationDateFormatter.format(new Date(notification.created_at))}</p></div></article>; })}</div> : <section className="mt-8 border-y border-line py-10 text-center"><Bell aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><p className="mt-3 font-extrabold">알림이 없어요</p></section>}</div>;
}

function MoveHeader({ onBack, onMore, scope }: { onBack: () => void; onMore?: () => void; scope: ScopeReview | undefined }) {
  const title = scope?.job.origin_summary ? `${scope.job.origin_summary} 이사` : "내 이사";
  return <MobileDetailHeader backLabel="이사 목록으로 돌아가기" onBack={onBack} onMore={onMore} title={title} />;
}

function CustomerMoveStartSheet({ connect, onConnected, onNewMove, onOpenChange, open }: { connect: ReturnType<typeof useAuth>["connect"]; onConnected: () => void | Promise<void>; onNewMove: () => void; onOpenChange: (open: boolean) => void; open: boolean }) {
  const [mode, setMode] = useState<"choice" | "code">("choice");
  const [secret, setSecret] = useState(mockApiEnabled ? mockConnectionCodes.main : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = (next: boolean) => {
    if (!next) {
      setMode("choice");
      setError(null);
    }
    onOpenChange(next);
  };
  const chooseCode = () => {
    setSecret(mockApiEnabled ? mockConnectionCodes.main : "");
    setError(null);
    setMode("code");
  };
  const submit = async () => {
    if (!secret.trim() || pending) return;
    setPending(true);
    setError(null);
    try {
      await connect(secret, "customer");
      close(false);
      await onConnected();
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  return <Sheet onOpenChange={close} open={open}><SheetContent><SheetHeader><SheetTitle>이사를 시작해요</SheetTitle><SheetDescription>새로 시작하거나 이사 연결 코드로 기존 이사를 불러올 수 있어요.</SheetDescription></SheetHeader>{mode === "choice" ? <div className="grid gap-3 px-4 pb-5 sm:grid-cols-2"><Button aria-label="새 이사 시작하기" className="h-auto min-h-0 flex-col items-stretch justify-start gap-0 rounded-[var(--radius-feature)] border-line bg-surface p-3 text-left shadow-[var(--shadow-card)] hover:border-primary-300 hover:bg-surface" onClick={onNewMove} size="cta" type="button" variant="outline"><span className="grid h-24 place-items-center overflow-hidden rounded-[var(--radius-card)] p-2"><img alt="" aria-hidden="true" className="size-16 object-contain" decoding="async" src="/moving-items/moving-box.png" /></span><span className="mt-3 block text-ui-component font-black text-ink-900">새 이사 시작</span><span className="mt-1 block text-ui-data font-normal leading-5 text-ink-600">이사 정보를 입력해<br />새로 시작해요</span></Button><Button aria-label="이사 연결 코드로 불러오기" className="h-auto min-h-0 flex-col items-stretch justify-start gap-0 rounded-[var(--radius-feature)] border-line bg-surface p-3 text-left shadow-[var(--shadow-card)] hover:border-primary-300 hover:bg-surface" onClick={chooseCode} size="cta" type="button" variant="outline"><span className="grid h-24 place-items-center overflow-hidden rounded-[var(--radius-card)] p-2"><img alt="" aria-hidden="true" className="size-16 object-contain" decoding="async" src="/moving-items/sofa.png" /></span><span className="mt-3 block text-ui-component font-black text-ink-900">연결 코드 입력</span><span className="mt-1 block text-ui-data font-normal leading-5 text-ink-600">기존 이사 상황을<br />불러와요</span></Button></div> : <div className="px-5 pb-2"><Label htmlFor="customer-move-invite-code">이사 연결 코드</Label><Input autoCapitalize="characters" autoComplete="one-time-code" autoFocus className="mt-2" id="customer-move-invite-code" onChange={(event) => setSecret(event.target.value)} placeholder="MOVE-XXXXXXXX" spellCheck={false} value={secret} />{error ? <p className="mt-3 text-sm font-bold text-danger-ink" role="alert">{error}</p> : null}<SheetFooter className="grid grid-cols-[92px_minmax(0,1fr)] gap-2"><Button onClick={() => { setError(null); setMode("choice"); }} variant="secondary">이전</Button><Button disabled={!secret.trim() || pending} onClick={() => { void submit(); }}><Key aria-hidden="true" />{pending ? "연결 중" : "내 이사 불러오기"}</Button></SheetFooter></div>}</SheetContent></Sheet>;
}

function MoveActionsSheet({ canDelete, error, onDelete, onOpenChange, open, pending }: { canDelete: boolean; error: unknown; onDelete: () => void; onOpenChange: (open: boolean) => void; open: boolean; pending: boolean }) {
  return <Sheet onOpenChange={onOpenChange} open={open}><SheetContent><SheetHeader><SheetTitle>이사를 삭제할까요?</SheetTitle><SheetDescription>{canDelete ? "견적서를 받기 전인 이사만 삭제할 수 있어요." : "이미 견적서를 받아 삭제할 수 없어요."}</SheetDescription></SheetHeader>{error ? <p className="mx-4 rounded-xl bg-danger-bg p-3 text-sm font-bold text-danger-ink" role="alert">{apiErrorMessage(error)}</p> : null}<SheetFooter className="grid grid-cols-2 gap-2"><SheetClose render={<Button variant="secondary" />}>계속 사용</SheetClose><Button disabled={!canDelete || pending} onClick={onDelete} variant="destructive"><Trash aria-hidden="true" />{pending ? "삭제하는 중" : "이사 삭제"}</Button></SheetFooter></SheetContent></Sheet>;
}

function MoveListSafeArea() {
  return <span aria-hidden="true" className="app-safe-header block bg-surface" />;
}

function HomeTab({ completion, onOpenAgreement, onOpenMove, onStartMove, scope }: { completion: CompletionSummary | undefined; onOpenAgreement: () => void; onOpenMove: () => void; onStartMove?: () => void; scope: ScopeReview | undefined }) {
  const job = scope?.job ?? completion?.job;
  const scheduledAt = job?.scheduled_at ? new Date(job.scheduled_at) : null;
  const dDay = scheduledAt ? Math.max(0, Math.ceil((scheduledAt.getTime() - renderStartedAt) / 86_400_000)) : null;
  const requiresScopeReview = scope?.scope.status === "customer_review";
  const completed = scope?.scope.status === "confirmed";
  const completionRequested = completion?.completion_request?.status === "requested";
  const actionTitle = completionRequested ? "작업 완료 내용 확인" : requiresScopeReview ? "작업범위와 금액 확인" : completed ? "공동확인 내용 보기" : scope ? "촬영 결과 확인" : "촬영·짐 입력 시작";
  const actionMeta = scope ? `${scope.job.company_display_name ?? "이사업체"} 제안 · ${money(scope.quote?.total_amount_krw)} · ${scope.scope.version_label}` : "짐을 촬영하거나 직접 입력해 범위를 만들어 주세요";
  const currentStep = completionRequested || completed ? 4 : requiresScopeReview ? 3 : scope?.quote ? 2 : 1;

  return (
    <div className="pb-[var(--bottom-rail-height)]">
      {onStartMove ? <section className="px-[var(--content-gutter)]"><NewMoveHero onStart={onStartMove} /></section> : null}

      <div className="mx-[var(--content-gutter)]"><ActiveMoveCard heading="진행 중인 이사 1건" leading={<span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700"><Truck aria-hidden="true" size="var(--icon-md)" /></span>} meta={<>{scheduledAt ? dateFormatter.format(scheduledAt) : "일정 확인 중"} {dDay !== null ? <b className="text-primary-700">· D-{dDay}</b> : null}</>} onOpen={onOpenMove} route={job ? `${job.origin_summary ?? "출발지"} → ${job.destination_summary ?? "도착지"}` : "이사 정보를 불러오는 중"}>
        <MoveJourneyProgress current={currentStep} />
        <div className="mt-3 border-t border-line pt-3">
          <p className="flex min-w-0 items-baseline gap-2 whitespace-nowrap"><strong className="shrink-0 text-ui-support text-primary-700">{actionTitle}</strong><span className="ml-auto min-w-0 truncate text-right text-ui-data text-ink-600">{actionMeta}</span></p><Button className="mt-2 w-full" onClick={scope ? onOpenAgreement : onOpenMove} size="cta">{scope ? "지금 확인" : "이사 정보 열기"}</Button>
        </div>
      </ActiveMoveCard></div>

      <PreventionSection />
      {completion?.completion_request?.status === "requested" ? <p className="sr-only">완료 확인 요청이 도착했습니다.</p> : null}
    </div>
  );
}

function NewMoveHero({ onStart }: { onStart: () => void }) {
  return <button className="ui-card ui-card-outlined ui-card-tinted press-static relative min-h-[174px] w-full overflow-hidden rounded-[var(--radius-feature)] px-5 py-4 text-left" onClick={onStart} type="button"><span className="relative z-10 block max-w-[62%]"><strong className="block text-ui-component font-extrabold tracking-[var(--tracking-display)]">60초 촬영으로<br />준비를 시작해요</strong><span className="mt-1.5 block text-ui-data leading-5 text-ink-600">짐 목록과 작업조건 초안을 만들어요</span><span className="mt-4 flex items-center gap-1 whitespace-nowrap text-ui-control text-primary-700">새 이사 시작하기 <ArrowRight aria-hidden="true" size="var(--icon-xs)" weight="bold" /></span></span><img alt="휴대폰으로 이삿짐 상자를 촬영하는 모습" className="absolute -right-2 bottom-0 w-[140px] max-w-none" height="213" src="/move-capture-hero.png" width="170" /></button>;
}

function PreventionSection() {
  return <section className="mt-4 px-[var(--content-gutter)] py-5"><h2 className="text-ui-component">추가금이 생기는 순간</h2><p className="mt-1 text-sm text-ink-600">미리 확인하면 당일 변경을 줄일 수 있어요</p><div className="no-scrollbar -mx-[var(--content-gutter)] mt-4 flex snap-x scroll-px-[var(--content-gutter)] gap-3 overflow-x-auto px-[var(--content-gutter)] pb-1"><PreventionCard iconSrc="/prevention-elevator.png" label="작업조건 차이" title="엘리베이터·계단 조건이 달랐어요" /><PreventionCard iconSrc="/prevention-package-box.png" label="짐 목록 차이" title="촬영 후 큰 짐이 추가됐어요" /><PreventionCard iconSrc="/prevention-toolbox.png" label="추가 작업" title="분해·설치 작업이 빠졌어요" /></div></section>;
}

function PreventionCard({ iconSrc, label, title }: { iconSrc: string; label: string; title: string }) {
  return <article className="flex min-h-[160px] w-[156px] shrink-0 snap-start flex-col items-center ui-card p-3 text-center shadow-[var(--shadow-card)]"><span className="grid size-14 place-items-center"><img alt="" aria-hidden="true" className="size-14 object-contain" height="56" loading="lazy" src={iconSrc} width="56" /></span><div className="mt-auto pt-3"><p className="text-xs font-extrabold text-primary-700">{label}</p><h3 className="mt-1.5 text-ui-support leading-5 font-extrabold">{title}</h3></div></article>;
}

function ConsumerMoveList({ moveJobs, onNewMove, onOpen }: { moveJobs: MockMoveSummary[] | undefined; onNewMove?: () => void; onOpen: (jobId: string) => void }) {
  const [listTab, setListTab] = useState<"active" | "history">("active");
  const activeMoves = moveJobs?.filter((move) => move.job.status !== "completed" && move.job.status !== "canceled") ?? [];
  const historyMoves = moveJobs?.filter((move) => move.job.status === "completed") ?? [];
  const visibleMoves = listTab === "active" ? activeMoves : historyMoves;
  return <div className="pb-28">
    <div className="bg-surface px-[var(--content-gutter)] pt-5"><div className="flex items-center justify-between gap-3"><h1 className="text-ui-section">내 이사</h1>{onNewMove ? <button className="min-h-11 whitespace-nowrap px-2 text-ui-control text-primary-700" onClick={onNewMove} type="button">+ 새 이사</button> : null}</div>
    <div className="mt-6 grid grid-cols-2 border-b border-line" role="tablist" aria-label="이사 목록">
      <button aria-selected={listTab === "active"} className={`relative min-h-11 text-ui-control ${listTab === "active" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("active")} role="tab" type="button">진행 중 {activeMoves.length}</button>
      <button aria-selected={listTab === "history"} className={`relative min-h-11 text-ui-control ${listTab === "history" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("history")} role="tab" type="button">기록 {historyMoves.length}</button>
    </div></div><div className="px-[var(--content-gutter)]">
    {visibleMoves.length ? <div className="mt-5 space-y-3">{visibleMoves.map((move) => <MockMoveCard key={move.job.id} move={move} onOpen={() => onOpen(move.job.id)} />)}</div> : <section className="mt-5 ui-card px-5 py-8 text-center"><Archive aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><h2 className="mt-3 font-black">{listTab === "active" ? "진행 중인 이사가 없어요" : "완료된 이사가 없어요"}</h2></section>}
    </div>
  </div>;
}

function MockMoveCard({ move, onOpen }: { move: MockMoveSummary; onOpen: () => void }) {
  const scheduledAt = move.job.scheduled_at ? new Date(move.job.scheduled_at) : null;
  const hasQuote = Boolean(move.quote);
  const completionArrived = move.completion_request_status === "requested";
  const statusLabel = completionArrived ? "확인서 도착" : hasQuote ? "견적서 도착" : move.company_participation_status === "company_not_invited" ? "링크 보내기 전" : "업체 연결됨 · 견적 대기";
  const currentStep = completionArrived || move.scope_status === "confirmed" ? 4 : move.scope_status === "customer_review" || move.scope_status === "revision_requested" ? 3 : move.quote ? 2 : 1;
  return <button className="press-static w-full ui-card p-5 text-left shadow-[var(--shadow-card)]" onClick={onOpen} type="button"><span className={`inline-flex h-[var(--status-height)] items-center rounded-full px-3 text-ui-status ${completionArrived ? "bg-warning-bg text-warning-ink" : hasQuote ? "bg-primary-50 text-primary-700" : "bg-surface-muted text-ink-600"}`}>{statusLabel}</span><strong className="mt-3 flex items-center justify-between gap-3 text-ui-section"><span className="min-w-0 truncate">{move.job.locations[0]?.label ?? "출발지"} → {move.job.locations[1]?.label ?? "도착지"}</span><CaretRight aria-hidden="true" className="shrink-0 text-ink-400" size="var(--icon-sm)" /></strong><span className="mt-2 block text-ui-support text-ink-600">{scheduledAt ? fullDateFormatter.format(scheduledAt) : "일정 확인 중"}</span><span className="mt-5 block border-t border-line pt-4 text-sm">{hasQuote ? <>현재 확인서 <b>{move.version_label}</b><span className="mx-2 text-line">|</span><b className="text-primary-700">{money(move.quote?.total_amount_krw)}</b></> : <span className="text-ink-600">아직 견적서를 받지 않았어요</span>}</span>{hasQuote ? <MoveJourneyProgress current={currentStep} /> : null}<span className="mt-4 grid grid-cols-3 divide-x divide-line text-center text-xs text-ink-600"><span><Package aria-hidden="true" className="mx-auto mb-1" size="var(--icon-sm)" />짐 {move.item_count}개</span><span><Notepad aria-hidden="true" className="mx-auto mb-1" size="var(--icon-sm)" />{hasQuote ? `확인서 ${move.version_label}` : "초안"}</span><span><TrendUp aria-hidden="true" className="mx-auto mb-1" size="var(--icon-sm)" />변경 {move.adjustment_count}건</span></span></button>;
}

function storedMoveInfoOverrides(jobId: string): MoveInfoOverrides {
  if (!jobId) return { schedule: null, stops: {} };
  try {
    const stored = window.sessionStorage.getItem(`${moveDraftStorageKey}:${jobId}`);
    return stored ? JSON.parse(stored) as MoveInfoOverrides : { schedule: null, stops: {} };
  } catch {
    return { schedule: null, stops: {} };
  }
}

function ConsumerMoveTab({ completion, connection, editor, issues, moveJobs, onCapture, onEditorChange, onManualAdd, onNewMove, onOpen, onOpenCompletion, onOpenQuote, onViewChange, scope, view }: { completion: CompletionSummary | undefined; connection: Connection; editor: MoveInfoEditor | null; issues: FieldIssue[] | undefined; moveJobs: MockMoveSummary[] | undefined; onCapture: () => void; onEditorChange: (editor: MoveInfoEditor | null) => void; onManualAdd: () => void; onNewMove?: () => void; onOpen: (jobId: string) => void; onOpenCompletion: () => void; onOpenQuote: () => void; onViewChange: (view: ConsumerMoveView) => void; scope: ScopeReview | undefined; view: ConsumerMoveView }) {
  const queryClient = useQueryClient();
  const selectedJob = moveJobs?.find((move) => move.job.id === connection.jobId)?.job;
  const initialOverrides = () => mockApiEnabled ? storedMoveInfoOverrides(connection.jobId) : {
    schedule: selectedJob?.scheduled_at ? dateTimeLocalValue(new Date(selectedJob.scheduled_at)) : null,
    stops: Object.fromEntries((["origin", "destination"] as const).map((kind) => [kind, defaultMoveStop(kind, scope, selectedJob)])),
  } as MoveInfoOverrides;
  const [infoOverrides, setInfoOverrides] = useState<MoveInfoOverrides>(initialOverrides);
  const updateMutation = useMutation({
    mutationFn: (next: MoveInfoOverrides) => patchMoveJob(connection, {
      scheduled_at: next.schedule ? new Date(next.schedule).toISOString() : undefined,
      locations: (["origin", "destination"] as const).map((kind) => {
        const stop = next.stops[kind] ?? defaultMoveStop(kind, scope, selectedJob);
        return { kind, label: stop.address, conditions: moveStopApiConditions(stop) };
      }),
    }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["workflow", "moves"] }); },
  });
  const changeInfoOverrides = (next: MoveInfoOverrides) => {
    setInfoOverrides(next);
    if (mockApiEnabled) window.sessionStorage.setItem(`${moveDraftStorageKey}:${connection.jobId}`, JSON.stringify(next));
    updateMutation.mutate(next);
  };
  const fallbackLocationConditions = (["origin", "destination"] as const).map((kind) => moveStopLocationConditions(kind, infoOverrides.stops[kind] ?? defaultMoveStop(kind, scope, selectedJob)));
  const canEdit = !scope?.proposal_id;
  if (view === "list") return <ConsumerMoveList moveJobs={moveJobs} onNewMove={onNewMove} onOpen={onOpen} />;
  if (view === "info" && editor) return <MoveInfo canEdit={canEdit} editor={editor} key={editor} onChange={changeInfoOverrides} onEditorChange={onEditorChange} scope={scope} value={infoOverrides} />;
  return <><MoveTabs current={view} onChange={onViewChange} />{view === "info" ? <><MoveInfo canEdit={canEdit} editor={null} onChange={changeInfoOverrides} onEditorChange={onEditorChange} scope={scope} value={infoOverrides} />{updateMutation.error ? <p className="mx-[var(--content-gutter)] -mt-24 rounded-xl bg-danger-bg p-3 text-sm font-bold text-danger-ink" role="alert">{apiErrorMessage(updateMutation.error)}</p> : null}</> : null}{view === "items" ? <ConsumerInventory onCapture={onCapture} onManualAdd={onManualAdd} scope={scope} /> : null}{view === "agreement" ? <ConsumerAgreement completion={completion} connection={connection} fallbackLocationConditions={fallbackLocationConditions} issues={issues} key={connection.jobId} onOpenCompletion={onOpenCompletion} onOpenQuote={onOpenQuote} scope={scope} /> : null}</>;
}

function MoveTabs({ current, onChange }: { current: ConsumerMoveView; onChange: (view: ConsumerMoveView) => void }) {
  const items: Array<{ id: ConsumerMoveView; label: string }> = [{ id: "info", label: "이사 정보" }, { id: "items", label: "짐 목록" }, { id: "agreement", label: "확인서" }];
  return <MobileDetailTabs current={current} items={items} label="내 이사 메뉴" onChange={onChange} />;
}

function MoveInfo({ canEdit, editor, onChange, onEditorChange, scope, value }: { canEdit: boolean; editor: MoveInfoEditor | null; onChange: (value: MoveInfoOverrides) => void; onEditorChange: (editor: MoveInfoEditor | null) => void; scope: ScopeReview | undefined; value: MoveInfoOverrides }) {
  const sourceSchedule = scope?.job.scheduled_at ? new Date(scope.job.scheduled_at) : null;
  const getStop = (kind: MoveStopKind) => value.stops[kind] ?? defaultMoveStop(kind, scope);
  const [scheduleDraft, setScheduleDraft] = useState(() => value.schedule ?? dateTimeLocalValue(sourceSchedule));
  const [stopDraft, setStopDraft] = useState<MoveStopDraft | null>(() => editor && editor !== "schedule" ? { ...getStop(editor) } : null);
  const scheduledAt = value.schedule ? new Date(value.schedule) : sourceSchedule;
  const dDay = scheduledAt ? Math.max(0, Math.ceil((scheduledAt.getTime() - renderStartedAt) / 86_400_000)) : null;

  const saveStop = () => {
    if (!editor || editor === "schedule" || !stopDraft?.address.trim()) return;
    onChange({ ...value, stops: { ...value.stops, [editor]: { ...stopDraft, address: stopDraft.address.trim(), detailAddress: stopDraft.detailAddress.trim(), memo: stopDraft.memo.trim() } } });
    onEditorChange(null);
  };

  if (editor === "schedule") return <div className="flex min-h-[calc(100dvh-var(--header-height))] flex-col bg-surface"><ScheduleEditor onChange={setScheduleDraft} value={scheduleDraft} /><SheetFooter className="mt-auto"><Button className="w-full" disabled={!scheduleDraft} onClick={() => { onChange({ ...value, schedule: scheduleDraft }); onEditorChange(null); }} size="cta">일정 저장</Button></SheetFooter></div>;
  if (editor) return <MoveStopPage draft={stopDraft} onDraftChange={setStopDraft} onSave={saveStop} />;

  return (
    <div className="space-y-2.5 px-[var(--content-gutter)] pb-28 pt-3">
      <InfoCard title="이사 일정"><div className="flex items-center gap-3"><Calendar aria-hidden="true" className="shrink-0" size="var(--icon-category)" /><span className="min-w-0 flex-1 text-ui-body leading-5">{scheduledAt ? fullDateFormatter.format(scheduledAt) : "일정을 입력해 주세요"}</span>{dDay !== null ? <span className="whitespace-nowrap rounded-lg bg-primary-50 px-2 py-1.5 text-ui-data text-primary-700">D-{dDay}</span> : null}{canEdit ? <button className="min-h-11 whitespace-nowrap px-1 text-ui-control text-primary-700" onClick={() => onEditorChange("schedule")} type="button">수정</button> : null}</div></InfoCard>
      <InfoCard title="이동 경로"><div className="relative pl-12"><span aria-hidden="true" className="absolute top-[14px] bottom-[14px] left-[12px] w-0.5 bg-primary-600" /><RoutePoint label="출발지" onEdit={canEdit ? () => onEditorChange("origin") : undefined} stop={getStop("origin")} /><RoutePoint destination label="도착지" onEdit={canEdit ? () => onEditorChange("destination") : undefined} stop={getStop("destination")} /></div></InfoCard>
      <aside className="flex items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3 text-sm text-ink-600"><TrendUp aria-hidden="true" size="var(--icon-sm)" /> {canEdit ? "견적이 확정되기 전까지 기본정보를 수정할 수 있어요." : "견적이 생성되어 기본정보가 잠겼어요."}</aside>
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

function RoutePoint({ destination = false, label, onEdit, stop }: { destination?: boolean; label: string; onEdit?: () => void; stop: MoveStopDraft }) {
  const conditions = [stop.residenceType, stop.floor, `엘리베이터 ${stop.elevator}`, `사다리차 ${stop.ladder}`, `주차 ${stop.parking}`].filter(Boolean);
  return <div className={destination ? "relative mt-6" : "relative"}><span aria-hidden="true" className="absolute top-1 -left-[46px] size-5 rounded-full border-[5px] border-primary-600 bg-surface" /><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-ui-data text-primary-700">{label}</p><strong className="mt-0.5 block text-ui-support">{stop.address || `${label}를 입력해 주세요`}</strong>{stop.detailAddress ? <span className="mt-0.5 block text-xs text-ink-600">{stop.detailAddress}</span> : null}</div>{onEdit ? <button className="min-h-11 whitespace-nowrap px-1 text-ui-control text-primary-700" onClick={onEdit} type="button">수정</button> : null}</div><div className="mt-1.5 flex flex-wrap gap-1.5">{conditions.map((condition) => <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-ui-micro text-ink-600" key={condition}>{condition}</span>)}</div></div>;
}

function MoveStopPage({ draft, onDraftChange, onSave }: { draft: MoveStopDraft | null; onDraftChange: (draft: MoveStopDraft) => void; onSave: () => void }) {
  const update = <K extends keyof MoveStopDraft>(key: K, value: MoveStopDraft[K]) => draft && onDraftChange({ ...draft, [key]: value });
  return <div className="min-h-[calc(100dvh-var(--header-height))] bg-canvas">{draft ? <div className="space-y-2"><section className="space-y-4 bg-surface px-5 py-6"><div><Label className="text-ui-component" htmlFor="move-address">주소</Label><div className="mt-2"><AddressSearchInput id="move-address" onChange={(value) => update("address", value)} value={draft.address} /></div></div><div><Input id="move-detail-address" onChange={(event) => update("detailAddress", event.target.value)} placeholder="상세 주소 입력 (동/호수 등)" value={draft.detailAddress} /></div></section><section className="flex flex-col gap-8 bg-surface px-5 py-6"><ChoiceGroup appearance="outlined" columns={3} label="층수" onChange={(value) => update("floor", value)} options={floorOptions} scroll value={draft.floor} /><ChoiceGroup columns={2} label="사다리차 사용 여부" onChange={(value) => update("ladder", value)} options={ladderOptions} value={draft.ladder ?? "사용 안 함"} /><ChoiceGroup columns={2} label="엘리베이터 유무" onChange={(value) => update("elevator", value)} options={elevatorOptions} value={draft.elevator} /><ChoiceGroup columns={2} label="주차 가능 여부" onChange={(value) => update("parking", value)} options={parkingOptions} value={draft.parking === "가능" ? "가능" : "불가능"} /><ChoiceGroup appearance="outlined" columns={3} icons={residenceIcons} label="거주지 형태" onChange={(value) => update("residenceType", value)} options={residenceOptions} value={draft.residenceType ?? "아파트"} /></section></div> : null}<SheetFooter><Button className="w-full" disabled={!draft?.address.trim()} onClick={onSave} size="cta">변경 내용 저장</Button></SheetFooter></div>;
}

function ConsumerInventory({ onCapture, onManualAdd, scope }: { onCapture: () => void; onManualAdd: () => void; scope: ScopeReview | undefined }) {
  const [openCategory, setOpenCategory] = useState<MovingItemCategory | "">("");
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const groups = scope?.scope.room_groups ?? [];
  const allItems = groups.flatMap((group) => group.items).filter((item) => movingItemAssetForName(item.description) !== null);
  const categories: MovingItemCategory[] = ["가구", "가전", "기타"];
  const quantityFor = (itemKey: string) => quantities[itemKey] ?? 1;
  const totalCount = allItems.reduce((total, item) => total + quantityFor(item.item_key), 0);
  const visibleItems = allItems.filter((item) => quantityFor(item.item_key) > 0 && (!openCategory || movingItemCategoryForName(item.description) === openCategory) && item.description.toLocaleLowerCase("ko-KR").includes(query.trim().toLocaleLowerCase("ko-KR")));
  const updateQuantity = (itemKey: string, next: number) => setQuantities((current) => ({ ...current, [itemKey]: Math.max(0, next) }));

  return <div className="px-[var(--content-gutter)] pb-24 pt-4">
    <label className="flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-3 focus-within:border-primary-400 focus-within:ring-3 focus-within:ring-primary-100" htmlFor="inventory-search"><MagnifyingGlass aria-hidden="true" className="shrink-0 text-ink-400" size="var(--icon-md)" /><input className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-400" data-slot="input-proxy" id="inventory-search" onChange={(event) => setQuery(event.target.value)} placeholder="짐 이름 검색" type="search" value={query} /></label>
    <div className="no-scrollbar -mx-[var(--content-gutter)] mt-4 flex gap-2 overflow-x-auto px-[var(--content-gutter)] pb-1">
      <FilterChip active={!openCategory} onClick={() => setOpenCategory("")}>전체 {totalCount}</FilterChip>
      {categories.map((category) => <FilterChip active={openCategory === category} key={category} onClick={() => setOpenCategory(category)}>{category}</FilterChip>)}
    </div>
    <div className="mt-4 space-y-2">
      {visibleItems.map((item) => { const quantity = quantityFor(item.item_key); return <InventoryQuantityRow icon={<InventoryItemIcon name={item.description} />} key={item.item_key} name={item.description} onDecrease={() => updateQuantity(item.item_key, quantity - 1)} onIncrease={() => updateQuantity(item.item_key, quantity + 1)} onRemove={() => updateQuantity(item.item_key, 0)} quantity={quantity} reviewRequired={item.review_required} />; })}
      {visibleItems.length === 0 ? <div className="rounded-2xl border border-line bg-surface px-4 py-8 text-center"><Package aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><p className="mt-3 font-extrabold">짐이 없습니다.</p><p className="mt-1 text-sm text-ink-600">품목 직접 선택이나 AI 영상 촬영으로 짐을 추가해 주세요.</p></div> : null}
    </div>
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[calc(var(--z-sticky)-1)] flex justify-center">
      <div className="pointer-events-auto grid w-full max-w-[var(--shell-mobile)] grid-cols-2 gap-2 bg-surface px-[var(--content-gutter)] pt-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
        <Button className="min-w-0" onClick={onManualAdd} size="cta" variant="outline"><Cube aria-hidden="true" /> 품목 직접 선택</Button>
        <Button className="min-w-0" onClick={onCapture} size="cta"><Camera aria-hidden="true" weight="fill" /> AI 영상 촬영</Button>
      </div>
    </div>
  </div>;
}

function InventoryItemIcon({ name }: { name: string }) {
  return <MovingItemIcon name={name} />;
}

function ConsumerAgreement({ completion, connection, fallbackLocationConditions, issues, onOpenCompletion, onOpenQuote, scope }: { completion: CompletionSummary | undefined; connection: Connection; fallbackLocationConditions: ScopeLocationConditions[]; issues: FieldIssue[] | undefined; onOpenCompletion: () => void; onOpenQuote: () => void; scope: ScopeReview | undefined }) {
  const queryClient = useQueryClient();
  const [issueOpen, setIssueOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: workflowKeys.root(connection.jobId) }), queryClient.invalidateQueries({ queryKey: workflowKeys.moves(connection.accessToken) })]);
  const issue = issues?.find((item) => item.status === "customer_review" && item.change_proposal_id);
  const resolvedIssue = issues?.find((item) => item.status === "approved" || item.status === "rejected");
  const displayIssue = completion?.completion_request ? resolvedIssue : issue ?? issues?.find((item) => item.status !== "approved" && item.status !== "rejected");
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
  if (!scope.quote) return <CompanyInvitationEmpty connectionCode={scope.job.job_code} itemCount={scope.scope.item_count} key={connection.jobId} />;
  const quoteNeedsReview = scope.scope.status === "customer_review" && !completion?.completion_request;

  return (
    <div className="space-y-2.5 px-[var(--content-gutter)] pb-28 pt-3">
      {quoteNeedsReview ? <QuoteArrivalCard companyName={scope.job.company_display_name} onOpen={onOpenQuote} scope={scope} /> : <AgreementOverview fallbackLocationConditions={fallbackLocationConditions} onOpenHistory={() => setHistoryOpen(true)} scope={scope} showCurrentStatus={false}>
        {completion?.completion_request ? <CompletionReportCard completion={completion} onOpen={onOpenCompletion} /> : null}
        {displayIssue ? <FieldReportCard companyName={scope.job.company_display_name} issue={displayIssue} onOpen={() => setIssueOpen(true)} /> : null}
      </AgreementOverview>}
      {displayIssue ? <FieldChangeSheet error={decisionMutation.error} issue={displayIssue} loading={proposalQuery.isLoading} onDecision={(decision, note) => decisionMutation.mutate({ decision, note })} onOpenChange={setIssueOpen} open={issueOpen} pending={decisionMutation.isPending} proposal={proposalQuery.data} readOnly={!issue} /> : null}
      <AgreementHistorySheet fallbackLocationConditions={fallbackLocationConditions} issue={resolvedIssue} onOpenChange={setHistoryOpen} open={historyOpen} scope={scope} />
    </div>
  );
}

function QuoteArrivalCard({ companyName, onOpen, scope }: { companyName: string | null; onOpen: () => void; scope: ScopeReview }) {
  return <section className="ui-card p-3"><span className="inline-flex rounded-full border border-warning px-2.5 py-0.5 text-ui-status text-warning-ink">확인 필요</span><h2 className="mt-1.5 text-lg font-black">견적서가 도착했어요</h2><p className="mt-0.5 text-ui-data text-ink-600">업체가 작업 범위와 금액을 제안했어요</p><div className="mt-2 flex items-center justify-between gap-3 text-ui-micro text-ink-400"><span className="min-w-0 truncate">견적 제안 · {companyName ?? "이사업체"} · {scope.scope.version_label}</span><span className="shrink-0 font-bold text-warning-ink">내 확인 대기</span></div><button className="mt-2 flex min-h-11 w-full items-center justify-between rounded-[var(--radius-control)] border border-line px-4 text-ui-data hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" onClick={onOpen} type="button">견적서 확인 <CaretRight aria-hidden="true" size="var(--icon-sm)" /></button></section>;
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
  onDecision: (decision: "approve" | "request_clarification", note?: string) => void;
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
  const evidenceUrl = proposal?.evidence_media[0]?.read_url ?? null;
  const reportedAt = fullDateFormatter.format(new Date(issue.reported_at));
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="!transition-none [&>button]:top-[max(10px,env(safe-area-inset-top))] [&>button]:bg-ink-900/70 [&>button]:text-white [&>button]:hover:bg-ink-900/80" presentation="page">
    <SheetTitle className="sr-only">현장 변경 확인</SheetTitle><SheetDescription className="sr-only">{issue.title} · 현장기사 보고</SheetDescription>
    {loading ? <div className="grid min-h-dvh place-items-center text-sm text-ink-600">변경안을 불러오는 중입니다.</div> : <div>
      <figure className="relative grid h-[320px] place-items-center bg-ink-900 text-center text-sm text-white/80">
        {evidenceUrl ? <img alt={`${issue.title} 현장 증거`} className="h-full w-full object-cover" height="420" src={evidenceUrl} width="480" /> : <p className="px-6">서버에서 열람 가능한 증거 사진을 아직 제공하지 않았어요.</p>}
        {proposal?.evidence_media.length ? <span className="absolute right-4 bottom-12 rounded-full bg-ink-900/70 px-2.5 py-1 text-ui-control text-white">1 / {proposal.evidence_media.length}</span> : null}
      </figure>
      <div className="relative -mt-10 min-h-[calc(100dvh-300px)] rounded-t-[var(--radius-feature)] bg-surface px-5 pb-4 pt-8">
        <h3 className="text-left text-lg leading-7 font-black tracking-[var(--tracking-display)]">{proposal?.title ?? issue.title}</h3>
        <p className="mt-3 text-left text-sm text-ink-600">{reportedAt} · 현장기사</p>
        {proposal ? <section className="mt-7 ui-card p-4"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700"><Stairs aria-hidden="true" size="var(--icon-md)" /></span><h4 className="text-lg font-black">{proposal.title}</h4></div><dl className="mt-4 grid grid-cols-[88px_minmax(0,1fr)] gap-y-3 text-sm"><dt className="text-ink-600">사유</dt><dd>{proposal.reason}</dd></dl><div className="mt-5 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center tabular-nums"><div><span className="text-xs text-ink-600">기존 금액</span><strong className="mt-1 block text-ui-support">{money(previous)}</strong></div><div><span className="text-xs text-ink-600">추가 금액</span><strong className="mt-1 block text-ui-support text-danger-ink">{adjustment > 0 ? "+" : ""}{money(adjustment)}</strong></div><div><span className="text-xs text-ink-600">변경 후</span><strong className="mt-1 block text-ui-support">{money(total)}</strong></div></div></section> : <section className="mt-6 ui-card p-4"><h4 className="text-lg font-black">{issue.title}</h4><p className="mt-2 text-sm leading-6 text-ink-600">{issue.description}</p></section>}
        {error ? <p className="mt-3 text-sm font-bold text-danger">{apiErrorMessage(error)}</p> : null}
      </div>
    </div>}
    {!readOnly && proposal ? <SheetFooter className="grid gap-2 border-t-0"><Button className="w-full whitespace-nowrap" disabled={pending} onClick={() => onDecision("approve")} size="cta">변경 승인하기 {adjustment > 0 ? "+" : ""}{money(adjustment)}</Button><Button className="w-full whitespace-nowrap" disabled={pending} onClick={() => setRequestOpen(true)} variant="ghost">수정 요청</Button></SheetFooter> : null}
    <Sheet onOpenChange={setRequestOpen} open={requestOpen}><SheetContent className="flex min-h-[340px] flex-col" nested><SheetHeader><SheetTitle>수정 요청</SheetTitle><SheetDescription>변경이 필요한 내용을 업체에 알려주세요.</SheetDescription></SheetHeader><div className="px-4"><Label htmlFor="change-request">요청 내용</Label><Textarea className="mt-2 min-h-28" id="change-request" onChange={(event) => setRequestText(event.target.value)} placeholder="예: 추가 시간과 운반 인원을 다시 확인해 주세요." value={requestText} /></div><SheetFooter className="mt-auto"><Button className="w-full" disabled={!requestText.trim() || pending} onClick={() => { onDecision("request_clarification", requestText.trim()); setRequestOpen(false); }} size="cta">수정 요청 보내기</Button></SheetFooter></SheetContent></Sheet>
  </SheetContent></Sheet>;
}

function CompanyInvitationEmpty({ connectionCode, itemCount }: { connectionCode: string; itemCount: number }) {
  const [copied, setCopied] = useState(false);
  const inviteText = `SEQRET 이사 연결 코드\n${connectionCode}`;
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(connectionCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permissions are handled by the browser.
    }
  };
  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: inviteText, title: "SEQRET 이사 연결" });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyInvite();
  };
  const sharingDisabled = itemCount === 0;
  return <main className="px-[var(--content-gutter)] pb-28 pt-8">
    <h1 className="whitespace-nowrap text-ui-component font-black tracking-[var(--tracking-display)]">업체와 함께 확인할 차례예요</h1>
    <p className="mt-4 max-w-[340px] text-sm leading-6 text-ink-600">이사업체를 초대해 검수 결과를 함께 확인하고 정확한 견적을 받아보세요.</p>

    <section className="mt-8">
      <h2 className="text-ui-component font-black">이사 연결 코드</h2>
      <div className="mt-3 rounded-[var(--radius-feature)] border border-line bg-surface px-4">
        <div className="flex min-h-[76px] items-center gap-3 border-b border-line"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700"><Key aria-hidden="true" size="var(--icon-md)" /></span><span className="min-w-0 flex-1"><strong className="block font-mono text-base tracking-wide">{connectionCode}</strong><span className="mt-1 block text-sm text-ink-600">고객·업체·기사가 같은 코드를 사용해요</span></span></div>
        <div className="flex min-h-[76px] items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-success-bg text-success-ink"><ShieldCheck aria-hidden="true" size="var(--icon-md)" weight="fill" /></span><span className="min-w-0 flex-1"><strong className="block text-sm">열람 가능한 정보</strong><span className="mt-1 block text-sm text-ink-600">작업범위 · 촬영 근거 · 견적 작성</span></span></div>
      </div>
    </section>

    <div className="mt-6 space-y-2.5">
      <Button className="w-full" disabled={sharingDisabled} onClick={() => void shareInvite()} size="cta"><ShareNetwork aria-hidden="true" />공유</Button>
      <Button className="w-full" disabled={sharingDisabled} onClick={() => void copyInvite()} size="cta" variant="outline">{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}코드 복사</Button>
    </div>
    <div className="mt-7 flex items-start gap-3 rounded-[var(--radius-control)] bg-primary-50 px-4 py-4 text-sm leading-5 text-ink-600"><ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-success-ink" size="var(--icon-sm)" /><p><strong className="block text-ink-900">연결 해제 후에도 다시 들어올 수 있어요</strong><span className="mt-1 block">이 코드를 보관했다가 역할을 선택해 같은 이사에 다시 연결하세요.</span></p></div>
  </main>;
}

function CompletionReportCard({ completion, onOpen }: { completion: CompletionSummary; onOpen: () => void }) {
  const request = completion.completion_request!;
  const resolved = request.status === "confirmed" || request.status === "issue_reported";
  const statusLabel = request.status === "confirmed" ? "완료 확인됨" : request.status === "issue_reported" ? "문제 접수됨" : "확인 필요";
  const responseLabel = request.status === "requested" ? "내 확인 대기" : request.status === "confirmed" ? "확인 완료" : "문제 접수 완료";
  return <section className="ui-card p-3"><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-ui-status ${resolved ? "border-success text-success" : "border-warning text-warning-ink"}`}>{statusLabel}</span><h2 className="mt-1.5 text-lg font-black">작업 완료 내용이 도착했어요</h2><p className="mt-0.5 text-ui-data text-ink-600">기사 제출 내용을 확인해 주세요</p><div className="mt-2 flex items-center justify-between gap-3 text-ui-micro text-ink-400"><span className="min-w-0 truncate">작업 완료 · 현장기사 기록</span><span className={`shrink-0 font-bold ${resolved ? "text-success" : "text-warning-ink"}`}>{responseLabel}</span></div><button className="mt-2 flex min-h-11 w-full items-center justify-between rounded-[var(--radius-control)] border border-line px-4 text-ui-data hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" onClick={onOpen} type="button">완료 내용 확인 <CaretRight aria-hidden="true" size="var(--icon-sm)" /></button></section>;
}

export function QuoteDecisionPage({ connection, fallbackLocationConditions, onBack, onResolved, scope }: { connection: Connection; fallbackLocationConditions: ScopeLocationConditions[]; onBack: () => void; onResolved: () => void | Promise<void>; scope: ScopeReview }) {
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [reason, setReason] = useState("");
  const mutation = useMutation({
    mutationFn: (input: { action: "confirm" } | { action: "revise"; reason: string }) => input.action === "confirm" ? confirmScopeReview(connection, scope.scope.id) : requestScopeRevision(connection, scope.scope.id, input.reason),
    onSuccess: async () => { setRevisionOpen(false); await onResolved(); onBack(); },
  });
  return <div className="min-h-dvh bg-canvas"><MobilePageHeader onBack={onBack} title={`${scope.scope.version_label} 확인서`} /><div className="space-y-3 px-[var(--content-gutter)] pb-28 pt-3"><AgreementOverview fallbackLocationConditions={fallbackLocationConditions} scope={scope} showCurrentStatus={false} showVersionHeader={false} />{mutation.error ? <p className="text-sm font-bold text-danger-ink" role="alert">{apiErrorMessage(mutation.error)}</p> : null}</div><SheetFooter className="grid gap-1"><Button className="w-full" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: "confirm" })} size="cta"><Check aria-hidden="true" /> 이대로 확인</Button><Button className="mx-auto min-h-9 px-3 text-sm" disabled={mutation.isPending} onClick={() => setRevisionOpen(true)} variant="ghost">수정 요청</Button></SheetFooter><Sheet onOpenChange={setRevisionOpen} open={revisionOpen}><SheetContent><SheetHeader><SheetTitle>업체에 수정을 요청할까요?</SheetTitle><SheetDescription>바뀌어야 할 항목, 작업 또는 금액을 구체적으로 알려주세요.</SheetDescription></SheetHeader><div className="px-5"><Label htmlFor="scope-revision-reason">수정 요청 내용</Label><Textarea className="mt-2 min-h-32" id="scope-revision-reason" maxLength={2000} onChange={(event) => setReason(event.target.value)} placeholder="예: 냉장고 수량을 2대로 바꾸고 작업 인원을 다시 확인해 주세요." value={reason} /></div><SheetFooter><Button className="w-full" disabled={!reason.trim() || mutation.isPending} onClick={() => mutation.mutate({ action: "revise", reason: reason.trim() })} size="cta">수정 요청 보내기</Button></SheetFooter></SheetContent></Sheet></div>;
}

export function CompletionDecisionPage({ completion, connection, onBack, onResolved }: { completion: CompletionSummary; connection: Connection; onBack: () => void; onResolved: () => void | Promise<void> }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [problemType, setProblemType] = useState<"missing_work" | "damage" | "amount" | "other">("missing_work");
  const [description, setDescription] = useState("");
  const [unrecordedExtraCharge, setUnrecordedExtraCharge] = useState(false);
  const request = completion.completion_request!;
  const mutation = useMutation({ mutationFn: (input: Parameters<typeof decideCompletionRequest>[2]) => decideCompletionRequest(connection, request.completion_request_id, input), onSuccess: async () => { setReportOpen(false); await onResolved(); onBack(); } });
  const requested = request.status === "requested";
  const heroAsset = completion.completion_media[0];
  const checklistItems = completion.checklist.items ?? [];
  return <div className="min-h-dvh bg-canvas"><MobilePageHeader onBack={onBack} title="작업 완료 확인" />
    <figure className="relative h-[320px] bg-ink-900">
      {heroAsset?.content_type.startsWith("image/") ? <img alt="작업 완료 사진" className="h-full w-full object-cover" height="420" src={heroAsset.read_url} width="480" /> : heroAsset ? <video className="h-full w-full object-cover" controls src={heroAsset.read_url} /> : <div className="grid h-full place-items-center text-sm text-white/80">완료 사진이 없습니다.</div>}
      {completion.completion_media.length ? <span className="absolute right-4 bottom-12 rounded-full bg-ink-900/70 px-2.5 py-1 text-ui-control text-white">1 / {completion.completion_media.length}</span> : null}
    </figure>
       <div className="relative -mt-10 min-h-[calc(100dvh-300px)] rounded-t-[var(--radius-feature)] bg-surface px-5 pb-4 pt-8">
       <h3 className="text-lg leading-7 font-black tracking-[var(--tracking-display)]">작업을 완료 했어요</h3>
       <p className="mt-3 text-sm text-ink-600">완료 제출 · 현장기사</p>
       <section className="mt-6"><dl className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-surface-muted p-4"><dt className="text-ink-600">작업 시간</dt><dd className="mt-1 font-extrabold">{completion.duration_minutes ?? "–"}분</dd></div><div className="rounded-xl bg-surface-muted p-4"><dt className="text-ink-600">현장 변경</dt><dd className="mt-1 font-extrabold">{completion.field_changes.length}건</dd></div></dl>{completion.completion_media.length === 0 ? <p className="mt-4 rounded-xl bg-warning-bg p-3 text-sm text-warning-ink">완료 사진이 제출되지 않았습니다.</p> : null}</section>
       <details className="mt-6 ui-card p-4" open><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-left"><strong className="text-lg font-black">금액 내역</strong><CaretDown aria-hidden="true" className="shrink-0 text-ink-400" size="var(--icon-sm)" /></summary>{completion.quote ? <div className="mt-3 border-t border-line pt-3 text-sm tabular-nums"><div className="flex items-center justify-between gap-3"><span className="text-ink-600">기본 견적</span><strong>{money(completion.quote.base_amount_krw)}</strong></div>{completion.quote.adjustments.map((adjustment) => <div className="mt-3 flex items-center justify-between gap-3 text-ink-600" key={`${adjustment.label}-${adjustment.amount_krw}`}><span>{adjustment.label}</span><strong className="text-ink-900">{adjustment.amount_krw > 0 ? "+" : ""}{money(adjustment.amount_krw)}</strong></div>)}<div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3"><span>변경 후 금액</span><strong className="text-lg font-black">{money(completion.quote.total_amount_krw)}</strong></div></div> : <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-sm"><span>변경 후 금액</span><strong className="text-lg font-black">{money(completion.final_amount_krw)}</strong></div>}</details>
       <details className="mt-6 ui-card p-4"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-left"><span><strong className="text-lg font-black">체크리스트</strong><span className="ml-2 text-sm text-ink-600">{completion.checklist.completed_count}/{completion.checklist.total_count}</span></span><CaretDown aria-hidden="true" className="shrink-0 text-ink-400" size="var(--icon-sm)" /></summary><div className="mt-3 border-t border-line pt-3">{checklistItems.length ? <div className="space-y-1">{checklistItems.map((item) => <div className="flex min-h-11 items-center gap-3 text-sm" key={item.key}><span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${item.confirmed ? "border-primary-600 bg-primary-600 text-white" : "border-line text-transparent"}`}><Check aria-hidden="true" size="0.875rem" weight="bold" /></span><span className={item.confirmed ? "text-ink-900" : "text-ink-600"}>{item.label}</span></div>)}</div> : null}<p className={`${checklistItems.length ? "mt-3 border-t border-line pt-3 " : ""}text-sm leading-6 text-ink-600`}>{completion.checklist.completed_count === completion.checklist.total_count ? "모든 작업을 완료했어요." : `${completion.checklist.completed_count}개 작업을 완료했어요.`}</p></div></details>
      {request.problem_report ? <p className="mt-4 rounded-xl bg-danger-bg p-3 text-sm leading-6 text-danger-ink">접수 내용 · {request.problem_report.description}</p> : null}
      {mutation.error ? <p className="mt-3 text-sm font-bold text-danger-ink" role="alert">{apiErrorMessage(mutation.error)}</p> : null}
    </div>
    {requested ? <SheetFooter className="grid gap-2 border-t-0"><Button className="w-full whitespace-nowrap" disabled={mutation.isPending} onClick={() => mutation.mutate({ decision: "confirm", unrecorded_extra_charge: false })} size="cta"><Check aria-hidden="true" /> 완료 확인</Button><Button className="w-full whitespace-nowrap" disabled={mutation.isPending} onClick={() => setReportOpen(true)} variant="ghost"><WarningCircle aria-hidden="true" /> 문제 신고</Button></SheetFooter> : null}
    <Sheet onOpenChange={setReportOpen} open={reportOpen}><SheetContent nested><SheetHeader><SheetTitle>완료 내용에 문제가 있나요?</SheetTitle><SheetDescription>업체가 확인할 수 있도록 문제 유형과 사실을 남겨주세요.</SheetDescription></SheetHeader><div className="space-y-4 px-5"><label className="block text-sm font-extrabold">문제 유형<Select className="mt-2" onChange={(event) => setProblemType(event.target.value as typeof problemType)} value={problemType}><option value="missing_work">누락 작업</option><option value="damage">파손</option><option value="amount">금액</option><option value="other">기타</option></Select></label><label className="block text-sm font-extrabold">문제 설명<Textarea className="mt-2 min-h-32" maxLength={2000} onChange={(event) => setDescription(event.target.value)} placeholder="확인이 필요한 사실을 구체적으로 적어주세요." value={description} /></label><label className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-4 text-sm font-bold"><input checked={unrecordedExtraCharge} onChange={(event) => setUnrecordedExtraCharge(event.target.checked)} type="checkbox" />확인서에 없는 추가금이 있었어요</label></div><SheetFooter><Button className="w-full" disabled={!description.trim() || mutation.isPending} onClick={() => mutation.mutate({ decision: "report_issue", problem_type: problemType, problem_description: description.trim(), unrecorded_extra_charge: unrecordedExtraCharge })} size="cta" variant="destructive">문제 신고 보내기</Button></SheetFooter></SheetContent></Sheet>
  </div>;
}
