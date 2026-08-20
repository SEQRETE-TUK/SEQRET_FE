import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArchiveIcon as Archive,
  BellIcon as Bell,
  BriefcaseIcon as BriefcaseBusiness,
  BuildingsIcon as Buildings,
  CameraIcon as Camera,
  ClockCounterClockwiseIcon as ClockCounterClockwise,

  CaretRightIcon as CaretRight,
  CheckIcon as Check,
  ChatCircleDotsIcon as ChatCircleDots,
  SquaresFourIcon as SquaresFour,
  HouseIcon as Home,
  KeyIcon as Key,
  PaperPlaneTiltIcon as PaperPlane,
  PackageIcon as Package,
  TruckIcon as Truck,
  WarningCircleIcon as WarningCircle,
  WrenchIcon as Wrench,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { mockApiEnabled, mockConnectionCodes } from "@/api/mock-api";
import { AgreementOverview } from "@/components/layout/agreement-overview";
import { AgreementHistorySheet } from "@/components/layout/agreement-history-sheet";
import { ActiveMoveCard, MoveJourneyProgress } from "@/components/layout/app-primitives";
import { ConnectedProfile } from "@/components/layout/connected-profile";
import { MobileAppShell, MobileDetailHeader, MobileDetailTabs, MobilePageHeader, type MobileNavItem } from "@/components/layout/mobile-app-shell";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth, type AuthSession } from "@/features/auth/model/auth-context";
import {
  asSupportedContentType,
  completeMediaUpload,
  createCaptureSession,
  createMediaUpload,
  getMediaConsentPolicy,
  uploadCaptureFile,
} from "@/features/capture/api/capture-api";
import {
  apiErrorMessage,
  getFieldBrief,
  getScopeReview,
  listFieldIssues,
  listMoveJobs,
  listNotifications,
  submitCompletion,
  workflowKeys,
  type Connection,
  type FieldIssue,
  type MockMoveSummary,
  type ScopeReview,
} from "@/features/workflow/api/workflow-api";
import { CrewIssueReport } from "@/features/crew/ui/crew-issue-report";
import { notificationCopy, notificationDateFormatter } from "@/features/workflow/model/notification-copy";
import { InvitationPanel } from "@/features/workflow/ui/workflow-shell";

type CrewTab = "home" | "work" | "more" | "notifications";
type CrewWorkView = "list" | "agreement" | "report" | "completion";

const items: MobileNavItem<CrewTab>[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "work", label: "내 작업", icon: BriefcaseBusiness },
  { id: "more", label: "더보기", icon: SquaresFour },
];
const validTabs = new Set<CrewTab>([...items.map(({ id }) => id), "notifications"]);
const validWorkViews = new Set<CrewWorkView>(["list", "agreement", "report", "completion"]);
const titles: Record<CrewTab, string> = { home: "SEQRET", work: "내 작업", more: "더보기", notifications: "알림" };
const dayFormatter = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" });
const timeFormatter = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
const issueStatusLabel = (status: string) => ({ open: "업체 처리 대기", customer_review: "고객 확인 대기", clarification_requested: "설명 보완 중", approved: "고객 승인", rejected: "고객 거절" })[status] ?? "상태 확인 중";

export function CrewApp() {
  const { session } = useAuth();
  return session?.actor.role === "field_worker" ? <ConnectedCrewApp key={session.actor.job_id} session={session} /> : <CrewGuestApp />;
}

function ConnectedCrewApp({ session }: { session: AuthSession }) {
  const { clearSession, connect, switchSession } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const requested = params.get("tab") as CrewTab | null;
  const tab = requested && validTabs.has(requested) ? requested : "home";
  const requestedView = params.get("view") as CrewWorkView | null;
  const workView = requestedView && validWorkViews.has(requestedView) ? requestedView : "list";
  const [inviteOpen, setInviteOpen] = useState(false);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab, workView]);
  const connection: Connection = { accessToken: session.accessToken, jobId: session.actor.job_id };
  const invitationPending = session.actor.invitation?.status === "pending";
  const briefQuery = useQuery({ enabled: !invitationPending, queryKey: workflowKeys.brief(connection.jobId), queryFn: () => getFieldBrief(connection) });
  const scopeQuery = useQuery({ enabled: !invitationPending, queryKey: workflowKeys.scope(connection.jobId), queryFn: () => getScopeReview(connection) });
  const issueQuery = useQuery({ enabled: !invitationPending, queryKey: workflowKeys.fieldIssues(connection.jobId), queryFn: () => listFieldIssues(connection), refetchInterval: mockApiEnabled && !invitationPending ? 2_000 : false });
  const notificationsQuery = useQuery({ enabled: !invitationPending && tab === "notifications", queryKey: workflowKeys.notifications(connection.jobId), queryFn: () => listNotifications(connection) });
  const moveListQuery = useQuery({ enabled: !invitationPending, queryKey: workflowKeys.moves(session.actor.role), queryFn: () => listMoveJobs(session.accessToken) });
  const changeTab = (next: CrewTab) => setParams(next === "home" ? {} : next === "work" ? { tab: "work", view: "list" } : { tab: next }, { replace: true });
  const changeWorkView = (view: CrewWorkView) => setParams({ tab: "work", view }, { replace: true });
  const refresh = () => queryClient.invalidateQueries({ queryKey: workflowKeys.root(connection.jobId) });
  const disconnect = () => { clearSession(); navigate("/"); };

  if (invitationPending) return <div className="mobile-stage min-h-dvh bg-canvas"><main className="mobile-frame min-h-dvh px-[var(--content-gutter)] py-8"><p className="text-sm font-extrabold text-primary-700">현장기사 초대</p><h1 className="mt-2 text-ui-section font-black">배정된 작업을 먼저 확인해 주세요</h1><p className="mt-2 text-sm leading-6 text-ink-600">수락하기 전에는 고객 주소와 작업범위를 불러오지 않습니다.</p><div className="mt-6"><InvitationPanel /></div></main></div>;

  const header = tab === "notifications" ? <CrewNotificationsHeader onBack={() => changeTab("home")} /> : tab === "home" ? <CrewHomeHeader onBell={() => changeTab("notifications")} /> : tab === "work" && workView !== "list" ? <CrewDetailHeader onBack={() => changeWorkView("list")} onMore={() => changeTab("more")} title={briefQuery.data?.job.title ?? "내 작업"} /> : <CrewSafeArea />;
  return (
    <>
    <MobileAppShell current={tab} eyebrow={`현장기사 · ${session.actor.display_name}`} header={header} items={items} onChange={changeTab} onProfile={() => changeTab("more")} onRefresh={tab === "more" ? undefined : refresh} root={tab === "home"} showNav={tab !== "work" || workView === "list"} title={titles[tab]}>
      {tab === "home" ? <CrewHome brief={briefQuery.data} displayName={session.actor.display_name} issueCount={issueQuery.data?.filter((issue) => issue.status !== "approved" && issue.status !== "rejected").length ?? 0} onInvite={() => setInviteOpen(true)} onWork={() => changeWorkView("agreement")} /> : null}
      {tab === "work" ? <CrewWork brief={briefQuery.data} connection={connection} issues={issueQuery.data ?? []} moveJobs={moveListQuery.data?.moves} onSelect={(jobId) => { const move = moveListQuery.data?.moves.find((item) => item.job.id === jobId); const participant = move?.job.participants.find((item) => item.role === "field_worker"); if (move && participant) switchSession({ actor: { ...session.actor, job_id: move.job.id, participant_id: participant.id, display_name: participant.display_name, invitation: null }, accessToken: mockApiEnabled ? session.accessToken : undefined }); }} onViewChange={changeWorkView} scope={scopeQuery.data} view={workView} /> : null}
      {tab === "notifications" ? <CrewNotifications error={notificationsQuery.error} notifications={notificationsQuery.data} onAction={() => setParams({ tab: "work", view: "agreement" }, { replace: true })} pending={notificationsQuery.isPending} /> : null}
      {tab === "more" ? <ConnectedProfile displayName={session.actor.display_name} expiresAt={session.actor.expires_at} onDisconnect={disconnect} permissions={session.actor.permissions} roleLabel="현장기사" /> : null}
    </MobileAppShell>
    <CrewInviteSheet connect={connect} onOpenChange={setInviteOpen} open={inviteOpen} />
    </>
  );
}

function CrewGuestApp() {
  const { clearSession, connect } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [inviteOpen, setInviteOpen] = useState(false);
  const requested = params.get("tab") as CrewTab | null;
  const tab = requested && validTabs.has(requested) ? requested : "home";
  const changeTab = (next: CrewTab) => setParams(next === "home" ? {} : next === "work" ? { tab: "work", view: "list" } : { tab: next }, { replace: true });
  return <>
    <MobileAppShell current={tab} eyebrow="현장기사" header={tab === "notifications" ? <CrewNotificationsHeader onBack={() => changeTab("home")} /> : tab === "home" ? <CrewHomeHeader onBell={() => changeTab("notifications")} /> : <CrewSafeArea />} items={items} onChange={changeTab} onProfile={() => changeTab("more")} root={tab === "home"} title={titles[tab]}>
      {tab === "home" ? <CrewGuestHome onInvite={() => setInviteOpen(true)} /> : null}
      {tab === "work" ? <CrewWorkList moveJobs={[]} onOpen={() => undefined} onSelect={() => undefined} /> : null}
      {tab === "notifications" ? <CrewNotifications onAction={() => setInviteOpen(true)} /> : null}
      {tab === "more" ? <ConnectedProfile connected={false} displayName="현장기사" onDisconnect={() => { clearSession(); navigate("/"); }} roleLabel="현장기사" /> : null}
    </MobileAppShell>
    <CrewInviteSheet connect={connect} onOpenChange={setInviteOpen} open={inviteOpen} />
  </>;
}

function CrewGuestHome({ onInvite }: { onInvite: () => void }) {
  return <div className="px-[var(--content-gutter)] pb-28 pt-4"><h1 className="text-ui-section leading-9 font-black tracking-[var(--tracking-display)]">배정된 이사를<br />연결해 주세요</h1><CrewInviteHero onInvite={onInvite} /><section className="mt-4 ui-card px-5 py-8 text-center"><Archive aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><h2 className="mt-3 text-ui-component">연결된 작업이 없어요</h2></section></div>;
}

function CrewInviteHero({ onInvite }: { onInvite: () => void }) {
  return <button className="mt-4 ui-card ui-card-outlined ui-card-tinted press-static relative min-h-[174px] w-full overflow-hidden rounded-[var(--radius-feature)] px-5 py-4 text-left" onClick={onInvite} type="button"><span className="relative z-10 block max-w-[62%]"><strong className="block text-ui-component font-extrabold tracking-[var(--tracking-display)]">연결 코드로<br />오늘 작업 연결하기</strong><span className="mt-1.5 block text-ui-data leading-5 text-ink-600">배정된 이사와 현장 정보를 한 번에 불러와요.</span><span className="mt-4 flex items-center gap-1 whitespace-nowrap text-ui-control text-primary-700">연결 코드 입력하기 <CaretRight aria-hidden="true" size="var(--icon-xs)" /></span></span><img alt="휴대폰으로 이삿짐을 확인하는 모습" className="absolute -right-2 bottom-0 w-[140px] max-w-none" height="213" src="/move-capture-hero.png" width="170" /></button>;
}

function CrewHomeHeader({ onBell }: { onBell: () => void }) {
  return <header className="app-safe-header relative z-[var(--z-sticky)] h-0 bg-canvas"><button aria-label="알림 확인" className="absolute top-[calc(env(safe-area-inset-top)+34px)] right-[var(--content-gutter)] grid size-9 place-items-center rounded-full text-ink-900 hover:bg-surface-muted" onClick={onBell} type="button"><Bell aria-hidden="true" size="var(--icon-md)" /></button></header>;
}

function CrewNotificationsHeader({ onBack }: { onBack: () => void }) {
  return <MobilePageHeader className="sticky top-0 z-[var(--z-sticky)] bg-surface/98 backdrop-blur" onBack={onBack} title="알림" />;
}

function CrewNotifications({ error, notifications, onAction, pending }: { error?: unknown; notifications?: Awaited<ReturnType<typeof listNotifications>>; onAction: () => void; pending?: boolean }) {
  const items = [...(notifications ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return <div className="px-[var(--content-gutter)] pb-28 pt-5"><h2 className="text-ui-section font-black tracking-[var(--tracking-display)]">작업 알림</h2><p className="mt-2 text-ui-support text-ink-600">배차와 확정된 작업범위 소식을 보여드려요.</p>{pending ? <p className="mt-8 text-center text-sm text-ink-600">알림을 불러오는 중입니다.</p> : error ? <p className="mt-6 rounded-xl bg-danger-bg p-4 text-sm font-bold text-danger-ink" role="alert">{apiErrorMessage(error)}</p> : items.length ? <div className="mt-6 divide-y divide-line border-y border-line">{items.map((notification) => { const copy = notificationCopy[notification.event_type]; return <article className="py-5" key={notification.id}><div className="flex gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-card)] bg-primary-50 text-primary-700"><ChatCircleDots aria-hidden="true" size="var(--icon-md)" /></span><div className="min-w-0"><span className="text-ui-status text-primary-700">{copy.label}</span><h3 className="mt-1 text-ui-component font-black">{copy.title}</h3><p className="mt-1 text-ui-support leading-5 text-ink-600">{copy.description}</p><p className="mt-2 text-ui-micro text-ink-400">{notificationDateFormatter.format(new Date(notification.created_at))}</p></div></div><button className="mt-4 flex min-h-11 w-full items-center justify-between border-t border-line pt-3 text-ui-control text-primary-700" onClick={onAction} type="button">작업 내용 확인 <CaretRight aria-hidden="true" size="var(--icon-xs)" /></button></article>; })}</div> : <section className="mt-8 border-y border-line py-10 text-center"><Bell aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><p className="mt-3 font-extrabold">알림이 없어요</p></section>}</div>;
}

function CrewSafeArea() {
  return <span aria-hidden="true" className="app-safe-header block bg-canvas" />;
}

function CrewInviteSheet({ connect, onOpenChange, open }: { connect: ReturnType<typeof useAuth>["connect"]; onOpenChange: (open: boolean) => void; open: boolean }) {
  const [secret, setSecret] = useState(mockApiEnabled ? mockConnectionCodes.main : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (!secret.trim() || pending) return;
    setPending(true);
    setError(null);
    try {
      await connect(secret, "field_worker");
      onOpenChange(false);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setPending(false);
    }
  };
  return <Sheet onOpenChange={onOpenChange} open={open}><SheetContent><SheetHeader><SheetTitle>이사 연결 코드 입력</SheetTitle><SheetDescription>고객·업체와 공유하는 코드를 입력하면 배정된 이사와 연결돼요.</SheetDescription></SheetHeader><div className="px-5 pb-2"><Input aria-label="이사 연결 코드" autoCapitalize="characters" className="mt-2" id="crew-invite-code" onChange={(event) => setSecret(event.target.value)} placeholder="MOVE-XXXXXXXX" value={secret} />{error ? <ErrorToast message={error} /> : null}</div><SheetFooter><Button className="w-full" disabled={!secret.trim() || pending} onClick={submit} size="cta"><Key aria-hidden="true" />{pending ? "연결 중" : "내 작업에 연결"}</Button></SheetFooter></SheetContent></Sheet>;
}

function CrewDetailHeader({ onBack, onMore, title }: { onBack: () => void; onMore: () => void; title: string }) {
  return <MobileDetailHeader backLabel="작업 목록으로 돌아가기" onBack={onBack} onMore={onMore} title={title} />;
}

function CrewWork({ brief, connection, issues, moveJobs, onSelect, onViewChange, scope, view }: {
  brief: Awaited<ReturnType<typeof getFieldBrief>> | undefined;
  connection: Connection;
  issues: Awaited<ReturnType<typeof listFieldIssues>>;
  moveJobs: MockMoveSummary[] | undefined;
  onSelect: (jobId: string) => void;
  onViewChange: (view: CrewWorkView) => void;
  scope: ScopeReview | undefined;
  view: CrewWorkView;
}) {
  if (view === "list") return <CrewWorkList moveJobs={moveJobs} onOpen={() => onViewChange("agreement")} onSelect={onSelect} />;
  return (
    <>
      <CrewDetailTabs current={view} onChange={onViewChange} />
      {view === "agreement" ? <CrewApprovedScope issue={issues[0]} scope={scope} /> : null}
      {view === "report" ? <CrewIssueReport brief={brief} connection={connection} issues={issues} /> : null}
      {view === "completion" ? <CrewCompletion brief={brief} connection={connection} issues={issues} scope={scope} /> : null}
    </>
  );
}

function CrewDetailTabs({ current, onChange }: { current: Exclude<CrewWorkView, "list">; onChange: (view: CrewWorkView) => void }) {
  const tabs: Array<{ id: Exclude<CrewWorkView, "list">; label: string }> = [{ id: "agreement", label: "확인서" }, { id: "report", label: "현장 보고" }, { id: "completion", label: "작업 완료" }];
  return <MobileDetailTabs current={current} items={tabs} label="작업 상세 메뉴" onChange={onChange} />;
}

function CrewWorkList({ moveJobs, onOpen, onSelect }: { moveJobs: MockMoveSummary[] | undefined; onOpen: () => void; onSelect: (jobId: string) => void }) {
  const [listTab, setListTab] = useState<"active" | "history">("active");
  const activeMoves = moveJobs?.filter((move) => move.job.status !== "completed" && move.job.status !== "canceled") ?? [];
  const historyMoves = moveJobs?.filter((move) => move.job.status === "completed") ?? [];
  const visibleMoves = listTab === "active" ? activeMoves : historyMoves;
  return <div className="pb-28">
    <div className="bg-surface px-[var(--content-gutter)] pt-5"><h1 className="text-ui-section">내 작업</h1><div className="mt-6 grid grid-cols-2 border-b border-line" role="tablist" aria-label="기사 작업 목록"><button aria-selected={listTab === "active"} className={`relative min-h-11 text-ui-control ${listTab === "active" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("active")} role="tab" type="button">진행 중 {activeMoves.length}</button><button aria-selected={listTab === "history"} className={`relative min-h-11 text-ui-control ${listTab === "history" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("history")} role="tab" type="button">작업 기록 {historyMoves.length}</button></div></div>
    <div className="px-[var(--content-gutter)]">{visibleMoves.length ? <div className="mt-5 space-y-3">{visibleMoves.map((move) => { const startAt = move.job.scheduled_at ? new Date(move.job.scheduled_at) : null; const completed = move.job.status === "completed"; return <button className="press-static w-full ui-card p-5 text-left shadow-[var(--shadow-card)]" key={move.job.id} onClick={() => { onSelect(move.job.id); onOpen(); }} type="button"><span className={`inline-flex h-[var(--status-height)] items-center rounded-full px-3 text-ui-status ${completed ? "bg-success-bg text-success-ink" : "bg-primary-50 text-primary-700"}`}>{completed ? "작업 완료" : "작업 예정"}</span><strong className="mt-4 flex items-center justify-between gap-3 text-ui-section"><span className="min-w-0 truncate">{move.job.locations[0]?.label ?? "출발지"} → {move.job.locations[1]?.label ?? "도착지"}</span><CaretRight aria-hidden="true" className="shrink-0 text-ink-400" size="var(--icon-sm)" /></strong><span className="mt-2 block text-ui-support text-ink-600">{startAt ? `${dayFormatter.format(startAt)} · ${timeFormatter.format(startAt)}` : "일정 확인 중"}</span><span className="mt-5 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center text-xs text-ink-600"><span><Package aria-hidden="true" className="mx-auto mb-1" size="var(--icon-sm)" />짐 {move.item_count}개</span><span><Wrench aria-hidden="true" className="mx-auto mb-1" size="var(--icon-sm)" />변경 {move.adjustment_count}건</span><span><Buildings aria-hidden="true" className="mx-auto mb-1" size="var(--icon-sm)" />{move.version_label}</span></span></button>; })}</div> : <section className="mt-5 ui-card px-5 py-8 text-center"><Archive aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><h2 className="mt-3 text-ui-component">{listTab === "active" ? "진행 중인 작업이 없어요" : "완료한 작업이 없어요"}</h2></section>}</div>
  </div>;
}

function CrewApprovedScope({ issue, scope }: { issue?: FieldIssue; scope: ScopeReview | undefined }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  if (!scope) return <div className="px-[var(--content-gutter)] py-8 text-sm text-ink-600">확인서를 불러오는 중입니다.</div>;
  return (
    <div className="space-y-2.5 px-[var(--content-gutter)] pb-28 pt-3">
      <AgreementOverview onOpenHistory={() => setHistoryOpen(true)} scope={scope} showCurrentStatus={false} />
      <CrewAgreementHistorySheet issue={issue} onOpenChange={setHistoryOpen} open={historyOpen} scope={scope} />
    </div>
  );
}

function CrewAgreementHistorySheet({ issue, onOpenChange, open, scope }: { issue?: FieldIssue; onOpenChange: (open: boolean) => void; open: boolean; scope: ScopeReview }) {
  return <AgreementHistorySheet issue={issue} onOpenChange={onOpenChange} open={open} scope={scope} />;
}

function CrewHome({ brief, displayName, issueCount, onInvite, onWork }: {
  brief: Awaited<ReturnType<typeof getFieldBrief>> | undefined;
  displayName: string;
  issueCount: number;
  onInvite: () => void;
  onWork: () => void;
}) {
  const startAt = brief?.start_at ? new Date(brief.start_at) : null;
  const workerName = mockApiEnabled ? "김민수" : brief?.lead_worker_name ?? (displayName.trim() || "기사");
  const salutation = workerName.endsWith("기사") ? `${workerName}님` : `${workerName} 기사님`;
  return (
    <div className="px-[var(--content-gutter)] pb-28 pt-4">
      <h1 className="text-ui-section leading-9 font-black tracking-[var(--tracking-display)]">{salutation},<br />오늘 작업을 준비해요</h1>
      <CrewInviteHero onInvite={onInvite} />
      {brief ? <><ActiveMoveCard heading="진행 중인 이사 1건" leading={<span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700"><Truck aria-hidden="true" size="var(--icon-md)" /></span>} meta={startAt ? `${dayFormatter.format(startAt)} · ${timeFormatter.format(startAt)}` : "일정 확인 중"} onOpen={onWork} route={<>{brief.masked_origin ?? "출발지"} → {brief.masked_destination ?? "도착지"}</>}><MoveJourneyProgress current={brief.completion_submission_id ? 4 : brief.checked_in_at ? 3 : 2} /><div className="mt-3 border-t border-line pt-3"><p className="flex min-w-0 items-baseline gap-2 whitespace-nowrap"><strong className="shrink-0 text-ui-support text-primary-700">작업범위 확인</strong><span className="ml-auto min-w-0 truncate text-right text-ui-data text-ink-600">최신 승인본과 현장 조건을 확인해요</span></p><button className="mt-2 flex min-h-10 w-full items-center justify-center rounded-xl bg-primary-600 text-ui-support font-extrabold text-white" onClick={onWork} type="button">지금 확인</button></div></ActiveMoveCard><aside className="mt-4 flex items-start gap-3 rounded-[var(--radius-card)] bg-warning-bg p-3 text-sm font-medium leading-5 text-warning-ink"><WarningCircle aria-hidden="true" className="mt-0.5 shrink-0" /><p>현장이 승인본과 다르면 추가 금액을 요구하지 말고 먼저 보고해 주세요. {issueCount > 0 ? `현재 보고 ${issueCount}건이 처리 중이에요.` : ""}</p></aside></> : <section className="mt-4 ui-card px-5 py-8 text-center"><ClockCounterClockwise aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><h2 className="mt-3 text-ui-component">업체의 작업 확정을 기다리고 있어요</h2><p className="mt-2 text-ui-support text-ink-600">배차와 작업범위가 확정되면 오늘 작업이 표시됩니다.</p></section>}
    </div>
  );
}

function CrewCompletion({ brief, connection, issues, scope }: {
  brief: Awaited<ReturnType<typeof getFieldBrief>> | undefined;
  connection: Connection;
  issues: Awaited<ReturnType<typeof listFieldIssues>>;
  scope: ScopeReview | undefined;
}) {
  const queryClient = useQueryClient();
  const items = useMemo(() => brief?.completion_check_items ?? [], [brief?.completion_check_items]);
  const [completionState, setCompletionState] = useState<Record<string, boolean>>({});
  const [onsiteConfirmed, setOnsiteConfirmed] = useState(false);
  const [photos, setPhotos] = useState<Array<{ file: File | null; id: string | null; url: string }>>(mockApiEnabled ? [
    { file: null, id: "mock-completion-1", url: "/room-after-evidence.png" },
    { file: null, id: "mock-completion-2", url: "/built-in-wardrobe-evidence.png" },
  ] : []);
  const checkedAt = brief?.checked_in_at ?? (mockApiEnabled ? brief?.start_at : null);
  const isCompleted = (key: string, confirmed: boolean) => confirmed || (completionState[key] ?? false);
  const completedCount = items.filter((item) => isCompleted(item.key, item.confirmed)).length;
  const unresolvedIssues = issues.filter((issue) => issue.status !== "approved" && issue.status !== "rejected");
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!brief) throw new Error("작업 정보를 불러오는 중입니다.");
      const roomZoneId = scope?.scope.room_groups[0]?.room_zone_id;
      if (!roomZoneId) throw new Error("완료 사진을 연결할 공간이 없습니다.");
      let completionMediaAssetIds = photos.flatMap((photo) => photo.id ? [photo.id] : []);
      const pendingFiles = photos.flatMap((photo) => photo.file ? [photo.file] : []);
      if (pendingFiles.length) {
        const policy = await getMediaConsentPolicy(connection);
        const capture = await createCaptureSession({ ...connection, consentPolicyVersion: policy.policy_version, privacyNoticeAcknowledged: true });
        const uploaded = await Promise.all(pendingFiles.map(async (file) => {
          const target = await createMediaUpload({ ...connection, captureSessionId: capture.id, contentLength: file.size, contentType: asSupportedContentType(file), mediaPurpose: "completion", roomZoneId });
          await uploadCaptureFile(target, file);
          return completeMediaUpload({ ...connection, captureSessionId: capture.id, mediaAssetId: target.asset.id });
        }));
        completionMediaAssetIds = [...completionMediaAssetIds, ...uploaded.map((asset) => asset.id)];
      }
      const now = new Date();
      const start = checkedAt ? new Date(checkedAt) : new Date(now.getTime() - 60_000);
      return submitCompletion(connection, {
        client_reference: crypto.randomUUID(),
        dispatch_id: brief.dispatch_id,
        scope_version_id: brief.scope_version_id,
        completion_media_asset_ids: completionMediaAssetIds,
        completed_check_keys: items.filter((item) => isCompleted(item.key, item.confirmed)).map((item) => item.key),
        worker_shifts: brief.assigned_workers.map((worker) => ({ worker_id: worker.worker_id, started_at: start.toISOString(), ended_at: now.toISOString() })),
        onsite_customer_confirmed: onsiteConfirmed,
        onsite_confirmed_at: onsiteConfirmed ? now.toISOString() : null,
        work_ended_at: now.toISOString(),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workflowKeys.brief(connection.jobId) }),
  });
  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = [...(event.target.files ?? [])].slice(0, Math.max(0, 3 - photos.length));
    setPhotos((current) => [...current, ...selected.map((file) => ({ file, id: null, url: URL.createObjectURL(file) }))].slice(0, 3));
    event.target.value = "";
  };
  return <div className="space-y-4 px-[var(--content-gutter)] pb-28 pt-4">
    <div className="flex items-end justify-between"><h2 className="text-ui-section font-black">작업 완료 전 확인</h2><strong className="text-ui-section text-primary-700">{completedCount}<span className="text-ink-900"> / {items.length} 완료</span></strong></div>
     <section className="ui-card px-4 py-1">{items.map((item) => { const selected = isCompleted(item.key, item.confirmed); return <button aria-pressed={selected} className="press-static flex min-h-12 w-full items-center gap-3 text-left" key={item.key} onClick={() => setCompletionState((current) => ({ ...current, [item.key]: !selected }))} type="button"><span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-primary-600 bg-primary-600 text-white" : "border-line text-transparent"}`}><Check aria-hidden="true" size="0.875rem" weight="bold" /></span><span className="flex-1 text-ui-support font-medium">{item.label}</span></button>; })}</section>
    <section className="ui-card p-4"><h2 className="text-ui-section font-black">완료 사진</h2><p className="mt-1 text-sm text-ink-600">업체와 고객이 작업 후 상태를 확인할 수 있게 한 장 이상 남겨주세요.</p><div className="mt-4 grid grid-cols-3 gap-2">{photos.map((photo, index) => <div className="relative" key={photo.url}><img alt={`완료 사진 ${index + 1}`} className="aspect-square w-full rounded-xl object-cover" src={photo.url} /><button aria-label={`완료 사진 ${index + 1} 삭제`} className="absolute right-1 top-1 grid size-9 place-items-center rounded-full bg-ink-900/75 text-white" onClick={() => { if (photo.file) URL.revokeObjectURL(photo.url); setPhotos((current) => current.filter((item) => item !== photo)); }} type="button">×</button></div>)}{photos.length < 3 ? <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-primary-400 text-center text-sm font-extrabold text-primary-700"><span><Camera aria-hidden="true" className="mx-auto mb-1" size="var(--icon-md)" />사진 추가</span><input accept="image/jpeg,image/png" capture="environment" className="sr-only" multiple onChange={addPhotos} type="file" /></label> : null}</div></section>
    <button aria-pressed={onsiteConfirmed} className="press-static flex min-h-14 w-full items-center gap-3 ui-card p-4 text-left" onClick={() => setOnsiteConfirmed((current) => !current)} type="button"><span className={`grid size-6 shrink-0 place-items-center rounded-md border-2 ${onsiteConfirmed ? "border-primary-600 bg-primary-600 text-white" : "border-line text-transparent"}`}><Check aria-hidden="true" size="1rem" weight="bold" /></span><span><strong className="block text-ui-support">현장에서 고객과 완료 상태를 함께 확인했어요</strong><span className="mt-1 block text-xs text-ink-600">직접 확인한 경우에만 선택해 주세요.</span></span></button>
    <section className="ui-card p-4"><h2 className="text-lg font-black">현장 보고</h2><p className={`mt-2 text-sm ${unresolvedIssues.length ? "text-warning-ink" : "text-success"}`}>{unresolvedIssues.length ? `미처리 현장 보고 ${unresolvedIssues.length}건을 업체·고객이 처리한 뒤 완료를 제출할 수 있어요.` : issues.length ? `보고 ${issues.length}건이 모두 처리되었어요.` : "현장 보고가 없어요."}</p>{issues.slice(0, 2).map((issue) => <p className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm" key={issue.field_issue_id}><span>{issue.title}</span><span className="text-ink-600">{issueStatusLabel(issue.status)}</span></p>)}</section>
    {submitMutation.error ? <ErrorToast message={apiErrorMessage(submitMutation.error)} /> : null}
    <div className="app-fixed-action fixed inset-x-0 bottom-0 z-[var(--z-sticky)] mx-auto w-full max-w-[var(--shell-mobile)] bg-surface px-[var(--content-gutter)] pt-3"><Button className="w-full" disabled={Boolean(brief?.completion_submission_id) || unresolvedIssues.length > 0 || completedCount !== items.length || photos.length === 0 || !checkedAt || !onsiteConfirmed || submitMutation.isPending} onClick={() => submitMutation.mutate()} size="cta"><PaperPlane aria-hidden="true" />{brief?.completion_submission_id ? "완료 내용 제출됨" : submitMutation.isPending ? "사진 업로드 및 제출 중" : "완료 내용 제출"}</Button><p className="mt-2 text-center text-xs text-ink-600">체크리스트와 완료 사진이 업체 검토 화면에 함께 전달돼요.</p></div>
  </div>;
}
