import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon as ArrowRight,
  CaretRightIcon as CaretRight,
  BellIcon as Bell,
  CalendarBlankIcon as Calendar,
  CheckCircleIcon as CheckCircle,
  ClipboardTextIcon as Clipboard,
  CopyIcon as Copy,
  ClockCounterClockwiseIcon as History,
  KeyIcon as Key,
  MagnifyingGlassIcon as Search,
  SignOutIcon as SignOut,
  UserPlusIcon as UserPlus,
  WarningCircleIcon as WarningCircle,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { mockApiEnabled, mockConnectionCodes } from "@/api/mock-api";
import { AgreementHistorySheet } from "@/components/layout/agreement-history-sheet";
import { FilterChip, MoveJourneyProgress, StatusTag } from "@/components/layout/app-primitives";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/features/auth/model/auth-context";
import type { AuthSession } from "@/features/auth/model/auth-context";
import {
  apiErrorMessage,
  getCompletionSummary,
  getScopeReview,
  listFieldIssues,
  listMoveJobs,
  listNotifications,
  workflowKeys,
  type Connection,
  type CompletionSummary,
  type FieldIssue,
  type ScopeReview,
} from "@/features/workflow/api/workflow-api";
import { notificationCopy, notificationDateFormatter } from "@/features/workflow/model/notification-copy";
import { LiveProviderWorkflow } from "@/features/workflow/ui/live-provider-workflow";
import { ProviderIssueWorkbench } from "@/features/workflow/ui/provider-issue-workbench";
import { ProviderQuoteEditor } from "@/features/workflow/ui/provider-quote-editor";
import { InvitationPanel } from "@/features/workflow/ui/workflow-shell";

type ProviderView = "jobs" | "issues" | "invite";
type JobMode = "detail" | "quote";
type JobFilter = "all" | "action" | "customer" | "confirmed";
type ProviderLinkedJob = { session: AuthSession; scope: ScopeReview | undefined; completion: CompletionSummary | undefined };
const moneyFormatter = new Intl.NumberFormat("ko-KR");
const money = (amount: number | null | undefined) => amount == null ? "–" : `${moneyFormatter.format(amount)}원`;
const day = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", weekday: "short" });
const schedule = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
const fullSchedule = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" });
const providerPageRenderedAt = Date.now();
function upsertProviderConnection(connections: AuthSession[], next: AuthSession) {
  return [next, ...connections.filter((item) => item.actor.job_id !== next.actor.job_id)];
}

function customerName(name: string | null | undefined) {
  const displayName = name?.trim() || "고객";
  return displayName.endsWith("님") ? displayName : `${displayName}님`;
}

function ProviderMoveRoute({ destination, origin }: { destination: string; origin: string }) {
  return <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] items-center gap-2"><div className="min-w-0"><span className="block text-ui-micro !font-medium text-ink-400">출발지</span><strong className="mt-0.5 block truncate text-ui-component text-ink-900">{origin}</strong></div><span className="grid size-8 place-items-center text-primary-700"><ArrowRight aria-hidden="true" size="var(--icon-md)" weight="bold" /></span><div className="min-w-0"><span className="block text-ui-micro !font-medium text-ink-400">도착지</span><strong className="mt-0.5 block truncate text-ui-component text-ink-900">{destination}</strong></div></div>;
}

function ProviderMoveSchedule({ scheduledAt }: { scheduledAt: string | null | undefined }) {
  const date = scheduledAt ? new Date(scheduledAt) : null;
  const dDay = date ? Math.max(0, Math.ceil((date.getTime() - providerPageRenderedAt) / 86_400_000)) : null;
  return <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-component)] border border-line bg-surface px-2.5 py-2 text-ui-control text-ink-900"><Calendar aria-hidden="true" className="shrink-0 text-primary-700" size="var(--icon-sm)" weight="bold" /><time className="min-w-0 flex-1 truncate" dateTime={scheduledAt ?? undefined}>{date ? fullSchedule.format(date) : "일정 확인 중"}</time>{dDay !== null ? <b className="shrink-0 rounded-[var(--radius-component)] bg-primary-50 px-2.5 py-1.5 font-[var(--weight-button)] text-primary-700">D-{dDay}</b> : null}</div>;
}

export function ProviderWebPage() {
  const { clearSession, connect, session, switchSession } = useAuth();
  const navigate = useNavigate();
  const activeSession = session?.actor.role === "company_manager" ? session : null;
  const [connections, setConnections] = useState<AuthSession[]>(() => activeSession ? [activeSession] : []);
  const addConnection = useCallback(async (secret: string) => {
    const next = await connect(secret, "company_manager");
    setConnections((current) => upsertProviderConnection(current, next));
    return next;
  }, [connect]);
  const selectConnection = (next: AuthSession) => switchSession(next);
  const removeConnection = () => {
    const remaining = activeSession
      ? connections.filter((item) => item.actor.job_id !== activeSession.actor.job_id)
      : [];
    setConnections(remaining);
    if (remaining[0]) void selectConnection(remaining[0]);
    else {
      clearSession();
      navigate("/", { replace: true });
    }
  };
  return <ProviderWebConsole connections={connections} onConnect={addConnection} onDisconnect={removeConnection} onSelect={selectConnection} session={activeSession} />;
}

function ProviderWebConsole({ connections, onConnect, onDisconnect, onSelect, session }: { connections: AuthSession[]; onConnect: (secret: string) => Promise<AuthSession>; onDisconnect: () => void; onSelect: (session: AuthSession) => void; session: AuthSession | null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(searchParams.get("view") === "notifications");
  const viewParam = searchParams.get("view");
  const view: ProviderView = viewParam === "issues" || viewParam === "invite" ? viewParam : "jobs";
  const jobMode: JobMode = searchParams.get("mode") === "quote" ? "quote" : "detail";
  const invitationPending = session?.actor.invitation?.status === "pending";
  const connection: Connection | null = session ? { accessToken: session.accessToken, jobId: session.actor.job_id } : null;
  const canReadJob = Boolean(connection && !invitationPending);
  const scopeQuery = useQuery({ enabled: canReadJob, queryKey: workflowKeys.scope(connection?.jobId ?? "unconnected"), queryFn: () => getScopeReview(connection!), refetchInterval: mockApiEnabled ? 2_000 : false });
  const issueQuery = useQuery({ enabled: canReadJob, queryKey: workflowKeys.fieldIssues(connection?.jobId ?? "unconnected"), queryFn: () => listFieldIssues(connection!), refetchInterval: mockApiEnabled ? 2_000 : false });
  const notificationsQuery = useQuery({ enabled: canReadJob, queryKey: workflowKeys.notifications(connection?.jobId ?? "unconnected"), queryFn: () => listNotifications(connection!) });
  const moveListQuery = useQuery({ enabled: canReadJob, queryKey: workflowKeys.moves(session?.actor.role ?? "company_manager"), queryFn: () => listMoveJobs(session?.accessToken) });
  const visibleConnections = useMemo<AuthSession[]>(() => {
    if (mockApiEnabled || !session) return connections;
    return (moveListQuery.data?.moves ?? []).flatMap((move) => {
      const participant = move.job.participants.find((item) => item.role === "company_manager");
      return participant ? [{ actor: { ...session.actor, job_id: move.job.id, participant_id: participant.id, display_name: participant.display_name, invitation: null }, accessToken: undefined }] : [];
    });
  }, [connections, moveListQuery.data?.moves, session]);
  const linkedScopeQueries = useQueries({ queries: visibleConnections.map((item) => ({ enabled: item.actor.invitation?.status !== "pending", queryKey: workflowKeys.scope(item.actor.job_id), queryFn: () => getScopeReview({ accessToken: item.accessToken, jobId: item.actor.job_id }) })) });
  const linkedCompletionQueries = useQueries({ queries: visibleConnections.map((item) => ({ enabled: item.actor.invitation?.status !== "pending", queryKey: workflowKeys.completion(item.actor.job_id), queryFn: () => getCompletionSummary({ accessToken: item.accessToken, jobId: item.actor.job_id }), refetchInterval: mockApiEnabled ? 2_000 : false })) });
  const linkedJobs: ProviderLinkedJob[] = visibleConnections.map((item, index) => ({ session: item, scope: linkedScopeQueries[index]?.data, completion: linkedCompletionQueries[index]?.data }));
  const scope = scopeQuery.data;
  const issues = issueQuery.data ?? [];
  const openIssues = issues.filter((issue) => issue.status === "open" || issue.status === "clarification_requested");
  const changeView = (nextView: ProviderView) => setSearchParams((current) => {
    const next = new URLSearchParams(current);
    if (nextView === "jobs") next.delete("view");
    else next.set("view", nextView);
    next.delete("mode");
    return next;
  });
  const changeJobMode = (nextMode: JobMode) => setSearchParams((current) => {
    const next = new URLSearchParams(current);
    if (nextMode === "detail") next.delete("mode");
    else next.set("mode", nextMode);
    next.delete("view");
    return next;
  });
  const handleNotificationsOpenChange = (open: boolean) => {
    setNotificationsOpen(open);
    if (!open && viewParam === "notifications") {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete("view");
        return next;
      }, { replace: true });
    }
  };
  const viewTitle = jobMode === "quote" ? "범위·견적" : view === "jobs" ? "작업" : view === "issues" ? "현장 이슈" : "기사·배차";
  const nextMockProviderSecret = mockApiEnabled
    ? [mockConnectionCodes.main, mockConnectionCodes.draft, mockConnectionCodes.revision, mockConnectionCodes.completed][Math.min(connections.length, 3)]
    : "";

  return (
    <div className="provider-console min-h-dvh bg-canvas pb-20 text-ink-900 md:grid md:grid-cols-[15rem_minmax(0,1fr)] md:pb-0">
      <aside className="sticky top-0 hidden h-dvh min-h-0 flex-col border-r border-line bg-surface px-4 py-5 md:flex">
        <div className="flex items-center gap-2 px-3"><img alt="" aria-hidden="true" className="size-5 object-contain" height="20" src="/jimlog-brand-mark.png" width="20" /><strong className="tracking-[var(--tracking-brand)] text-primary-800">짐로그</strong></div>
        <nav aria-label="업체 메뉴" className="mt-7">
          <ProviderNav active={view === "jobs"} icon={<Clipboard aria-hidden="true" />} label="작업" onClick={() => changeView("jobs")} />
          {session ? <div className="mt-5 border-t border-line pt-3">
            <div className="space-y-1">
              <ProviderNav active={view === "issues"} badge={openIssues.length || undefined} icon={<WarningCircle aria-hidden="true" />} label="현장 이슈" onClick={() => changeView("issues")} />
              <ProviderNav active={view === "invite"} icon={<UserPlus aria-hidden="true" />} label="기사·배차" onClick={() => changeView("invite")} />
            </div>
          </div> : null}
        </nav>
        <div className="mt-auto px-2 pt-4">
          <Button className="w-full justify-start" onClick={() => setDisconnectOpen(true)} size="chip" variant="ghost"><span className="flex size-5 shrink-0 items-center justify-center"><SignOut aria-hidden="true" /></span><span>연결 해제</span></Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-[var(--z-sticky)] flex min-h-16 items-center justify-between gap-4 border-b border-line bg-surface/96 px-4 backdrop-blur sm:px-6 xl:px-8">
          <div className="min-w-0"><h1 className="truncate text-ui-section">{viewTitle}</h1></div>
          <div className="flex items-center gap-2">
            {view === "jobs" && jobMode === "detail" ? <div className="relative hidden min-w-[17rem] lg:block"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-600" size="var(--icon-sm)" /><Input aria-label="고객명, 주소 검색" autoComplete="off" className="pl-10" name="providerSearch" onChange={(event) => setSearch(event.target.value)} placeholder="고객명, 주소 검색…" type="search" value={search} /></div> : null}
            {session ? <Popover onOpenChange={handleNotificationsOpenChange} open={notificationsOpen || viewParam === "notifications"}>
              <PopoverTrigger render={<Button aria-label={`알림 ${notificationsQuery.data?.length ?? 0}건`} className="size-9 rounded-full p-0 text-ink-900 hover:bg-surface-muted [&_svg]:size-5" size="icon" variant="ghost"><Bell aria-hidden="true" /></Button>} />
              <PopoverContent aria-label="작업 알림">
                <ProviderNotificationsPanel compact error={notificationsQuery.error} notifications={notificationsQuery.data} pending={notificationsQuery.isPending} />
              </PopoverContent>
            </Popover> : null}
            <Button aria-label="연결 코드 추가" className="size-9 rounded-full p-0 text-ink-900 hover:bg-surface-muted [&_svg]:size-5" onClick={() => setConnectionOpen(true)} size="icon" variant="ghost"><Key aria-hidden="true" /></Button>
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-5 xl:p-7" id="main-content"><div className="mx-auto max-w-[var(--shell-wide)]">
          {view === "jobs" && jobMode === "detail" ? <JobDashboard issues={issues} jobs={linkedJobs} onConnect={() => setConnectionOpen(true)} onIssue={() => changeView("issues")} onQuote={() => changeJobMode("quote")} onSearchChange={setSearch} onSelect={(next) => { onSelect(next); changeJobMode("detail"); }} scope={scope} search={search} selectedJobId={session?.actor.job_id ?? null} /> : null}
          {view === "jobs" && jobMode === "quote" && connection ? <ProviderQuoteEditor key={connection.jobId} connection={connection} onBack={() => changeJobMode("detail")} scope={scope} /> : null}
          {view === "issues" ? connection ? <ProviderIssueWorkbench connection={connection} issues={issues} scope={scope} /> : <ProviderConnectionEmpty onConnect={() => setConnectionOpen(true)} /> : null}
          {view === "invite" ? session ? <OperationsPanel /> : <ProviderConnectionEmpty onConnect={() => setConnectionOpen(true)} /> : null}
        </div></main>
      </div>
      <nav aria-label="업체 모바일 메뉴" className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] grid grid-cols-3 border-t border-line bg-surface px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
        <ProviderMobileNav active={view === "jobs"} icon={<Clipboard aria-hidden="true" />} label="작업" onClick={() => changeView("jobs")} />
        <ProviderMobileNav active={view === "issues"} badge={openIssues.length || undefined} icon={<WarningCircle aria-hidden="true" />} label="현장 이슈" onClick={() => changeView("issues")} />
        <ProviderMobileNav active={view === "invite"} icon={<UserPlus aria-hidden="true" />} label="기사·배차" onClick={() => changeView("invite")} />
      </nav>
      <ProviderConnectionDialog connect={onConnect} initialSecret={nextMockProviderSecret} key={visibleConnections.length} onOpenChange={setConnectionOpen} open={connectionOpen} />
      <ProviderDisconnectDialog onConfirm={onDisconnect} onOpenChange={setDisconnectOpen} open={disconnectOpen} />
      <Dialog open={Boolean(session && invitationPending)}>
        <DialogContent showClose={false}>
          <DialogHeader>
            <DialogTitle>고객이 보낸 이사 요청을 수락할까요?</DialogTitle>
            <DialogDescription>수락하면 고객의 이사 정보와 견적 업무를 확인할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <InvitationPanel presentation="dialog" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JobDashboard({ issues, jobs: linkedJobs, onConnect, onIssue, onQuote, onSearchChange, onSelect, scope, search, selectedJobId }: { issues: FieldIssue[]; jobs: ProviderLinkedJob[]; onConnect: () => void; onIssue: () => void; onQuote: () => void; onSearchChange: (value: string) => void; onSelect: (session: AuthSession) => void; scope: ScopeReview | undefined; search: string; selectedJobId: string | null }) {
  const [filter, setFilter] = useState<JobFilter>("all");
  const [listTab, setListTab] = useState<"active" | "history" | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [connectionCopied, setConnectionCopied] = useState(false);
  const allJobs = useMemo(() => {
    const rows = linkedJobs.map((item) => {
      const header = item.scope?.job ?? item.completion?.job;
      return {
        date: header?.scheduled_at ?? null,
        customer: header?.customer_display_name ?? "고객",
        route: (header?.origin_summary ?? "출발지") + " → " + (header?.destination_summary ?? "도착지"),
        status: item.completion?.job_status === "completed" || item.completion?.completion_request?.status === "confirmed" ? "completed" : item.scope?.scope.status ?? "preparing",
        completion: item.completion,
        current: item.session.actor.job_id === selectedJobId,
        header,
        session: item.session,
      };
    });
    const query = search.trim();
    return query ? rows.filter((job) => (job.customer + " " + job.route).includes(query)) : rows;
  }, [linkedJobs, search, selectedJobId]);
  const activeJobs = allJobs.filter((job) => job.status !== "completed");
  const historyJobs = allJobs.filter((job) => job.status === "completed");
  const selectedJob = allJobs.find((job) => job.current);
  const currentTab = listTab ?? (selectedJob?.status === "completed" ? "history" : "active");
  const actionableIssues = issues.filter((issue) => issue.status === "open" || issue.status === "clarification_requested");
  const statusCounts = {
    action: activeJobs.filter((job) => job.status === "company_review" || job.status === "revision_requested").length,
    customer: activeJobs.filter((job) => job.status === "customer_review").length,
    confirmed: activeJobs.filter((job) => job.status === "confirmed").length,
  };
  const jobs = currentTab === "history" ? historyJobs : activeJobs.filter((job) => filter === "all"
    || (filter === "action" && (job.status === "company_review" || job.status === "revision_requested"))
    || (filter === "customer" && job.status === "customer_review")
    || (filter === "confirmed" && job.status === "confirmed"));
  const queueGroups = currentTab === "history" ? [{ key: "history", label: "완료 기록", jobs: historyJobs }] : [
    { key: "action", label: "검토 필요", jobs: jobs.filter((job) => job.status === "company_review" || job.status === "revision_requested") },
    { key: "customer", label: "고객 확인 중", jobs: jobs.filter((job) => job.status === "customer_review") },
    { key: "confirmed", label: "공동확정", jobs: jobs.filter((job) => job.status === "confirmed") },
    { key: "preparing", label: "범위 준비 중", jobs: jobs.filter((job) => job.status === "preparing") },
  ].filter((group) => group.jobs.length > 0 && (filter === "all" || filter === group.key));
  const priority = selectedJob?.status === "completed" ? null : scope?.scope.status === "revision_requested"
    ? { title: "고객 수정 요청이 도착했어요", description: scope.revision_request?.reason ?? "요청 내용을 반영해 새 버전으로 다시 제안해 주세요.", action: "수정해서 다시 제안", onClick: onQuote }
    : scope?.scope.status === "company_review"
      ? { title: "범위와 견적 검토가 필요해요", description: "고객이 등록한 항목과 현장 조건을 확인한 뒤 제안하세요.", action: "범위·견적 작성", onClick: onQuote }
      : actionableIssues[0]
        ? { title: "현장 보고에 응답해 주세요", description: actionableIssues[0].title, action: "현장 이슈 열기", onClick: onIssue }
        : null;
  const statusLabel = (status: string) => status === "completed" ? "완료" : status === "confirmed" ? "공동확정" : status === "customer_review" ? "고객 확인 중" : status === "revision_requested" ? "수정 요청" : status === "preparing" ? "범위 준비 중" : "검토 필요";
  const statusTone = (status: string): "primary" | "success" | "warning" => status === "completed" || status === "confirmed" ? "success" : status === "company_review" ? "primary" : "warning";
  const progress = selectedJob?.status === "completed" || scope?.scope.status === "confirmed" ? 4 : scope?.scope.status === "customer_review" ? 3 : scope?.scope.status === "revision_requested" ? 2 : 1;
  const needsQuoteAction = scope?.scope.status === "company_review" || scope?.scope.status === "revision_requested";
  const connectionCode = selectedJobId ? `MOVE-${selectedJobId.replaceAll("-", "").slice(0, 8).toUpperCase()}` : null;
  const changeListTab = (next: "active" | "history") => {
    setListTab(next);
    setFilter("all");
    const nextJob = (next === "history" ? historyJobs : activeJobs)[0];
    if (nextJob && nextJob.session.actor.job_id !== selectedJobId) onSelect(nextJob.session);
  };
  const copyConnectionCode = async () => {
    if (!connectionCode) return;
    try {
      await navigator.clipboard.writeText(connectionCode);
      setConnectionCopied(true);
      window.setTimeout(() => setConnectionCopied(false), 1500);
    } catch {
      // Clipboard permissions are handled by the browser.
    }
  };

  return (
    <div>
      <label className="flex h-[var(--control-touch)] items-center gap-2 rounded-[var(--radius-component)] border border-input bg-surface px-4 focus-within:border-primary-400 focus-within:ring-3 focus-within:ring-primary-100 lg:hidden"><Search aria-hidden="true" className="text-ink-600" /><input aria-label="고객명, 주소 검색" autoComplete="off" className="min-w-0 flex-1 bg-transparent text-ui-control outline-none placeholder:text-ink-400" name="providerSearchMobile" onChange={(event) => onSearchChange(event.target.value)} placeholder="고객명, 주소 검색…" type="search" value={search} /></label>

      {linkedJobs.length === 0 ? <section className="ui-card ui-card-outlined mt-4 px-5 lg:mt-0"><ProviderConnectionEmpty onConnect={onConnect} /></section> : <section className="ui-card ui-card-outlined mt-4 overflow-hidden lg:mt-0 xl:grid xl:grid-cols-[minmax(22rem,0.92fr)_minmax(0,1.08fr)]">
        <section aria-label="작업 목록" className="min-w-0 border-b border-line xl:border-b-0 xl:border-r">
          <div aria-label="업체 작업 목록" className="grid grid-cols-2" role="tablist">
            <button aria-selected={currentTab === "active"} className={`relative min-h-11 text-ui-control ${currentTab === "active" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => changeListTab("active")} role="tab" type="button">진행 중 {activeJobs.length}</button>
            <button aria-selected={currentTab === "history"} className={`relative min-h-11 text-ui-control ${currentTab === "history" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => changeListTab("history")} role="tab" type="button">기록 {historyJobs.length}</button>
          </div>
          {currentTab === "active" ? <div aria-label="작업 상태 필터" className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line px-4 py-3">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>전체 {activeJobs.length}</FilterChip>
            <FilterChip active={filter === "action"} onClick={() => setFilter("action")}>검토 필요 {statusCounts.action}</FilterChip>
            <FilterChip active={filter === "customer"} onClick={() => setFilter("customer")}>고객 확인 중 {statusCounts.customer}</FilterChip>
            <FilterChip active={filter === "confirmed"} onClick={() => setFilter("confirmed")}>공동확정 {statusCounts.confirmed}</FilterChip>
          </div> : null}
          <div aria-label="작업 목록" className="border-t border-line">
            {queueGroups.length ? queueGroups.map((group) => <section aria-label={group.label} key={group.key}>
              {group.jobs.map((job) => <button aria-pressed={job.current} className={`grid min-h-[4.75rem] w-full grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-l-2 border-b-line px-4 py-3 text-left sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] ${job.current ? "border-l-primary-600 bg-primary-50/70" : "border-l-transparent hover:bg-surface-muted"}`} key={job.session.actor.job_id} onClick={() => onSelect(job.session)} type="button">
                <time className="text-center text-ui-data tabular-nums text-ink-600 sm:row-span-1">{job.date ? day.format(new Date(job.date)) : "–"}</time>
                <span className="min-w-0"><strong className="block truncate text-ui-list-title">{job.customer}</strong><span className="mt-0.5 block truncate text-ui-list-detail text-ink-600">{job.route}</span></span>
                <span className="col-start-2 justify-self-start sm:col-start-3 sm:row-start-1 sm:justify-self-end"><StatusTag tone={statusTone(job.status)}>{statusLabel(job.status)}</StatusTag></span>
              </button>)}
            </section>) : <p className="px-5 py-10 text-center text-ui-support text-ink-600">{currentTab === "history" ? "완료된 작업이 없습니다." : "이 조건에 맞는 작업이 없습니다."}</p>}
          </div>
        </section>

        <article aria-label="선택 작업 상세" className="min-w-0 p-5 sm:p-6">
          {scope ? <>
            <header className="min-w-0 border-b border-line pb-4">
              <div className="flex min-w-0 items-center justify-between gap-3"><h3 className="truncate text-ui-section">{customerName(scope.job.customer_display_name)}</h3>{connectionCode ? <Button aria-label={`${connectionCode} ${connectionCopied ? "복사됨" : "복사"}`} className="shrink-0" onClick={() => void copyConnectionCode()} size="chip" variant="outline"><Copy aria-hidden="true" />{connectionCode}</Button> : null}</div>
              <div className="mt-4"><ProviderMoveRoute destination={scope.job.destination_summary ?? "도착지"} origin={scope.job.origin_summary ?? "출발지"} /></div>
              <div className="mt-4"><ProviderMoveSchedule scheduledAt={scope.job.scheduled_at} /></div>
            </header>

            <div className="flex justify-end gap-1 pt-2"><Button onClick={() => setHistoryOpen(true)} size="chip" variant="ghost"><History aria-hidden="true" /> 이력</Button>{!needsQuoteAction ? <Button onClick={onQuote} size="chip" variant="outline">범위·견적</Button> : null}</div>

            {selectedJob?.status === "completed" && selectedJob.completion ? <section className="mt-5 rounded-[var(--radius-component)] bg-success-bg p-4 text-success-ink">
              <div className="flex items-center justify-between gap-3"><h4 className="text-ui-component">완료 기록</h4><StatusTag tone="success">고객 확인 완료</StatusTag></div>
              <p className="mt-1 text-ui-support">{selectedJob.completion.completed_at ? `${schedule.format(new Date(selectedJob.completion.completed_at))} 완료` : "완료 시각 확인 중"}</p>
              <dl className="mt-4 grid grid-cols-3 divide-x divide-success/30 border-t border-success/30 pt-3 text-center">
                <div className="px-2"><dt className="text-ui-micro">최종 금액</dt><dd className="mt-1 text-ui-control tabular-nums">{money(selectedJob.completion.final_amount_krw)}</dd></div>
                <div className="px-2"><dt className="text-ui-micro">완료 사진</dt><dd className="mt-1 text-ui-control tabular-nums">{selectedJob.completion.completion_media_count}건</dd></div>
                <div className="px-2"><dt className="text-ui-micro">확인서</dt><dd className="mt-1 text-ui-control">{selectedJob.completion.approved_scope_version_label ?? scope.scope.version_label}</dd></div>
              </dl>
            </section> : null}

            {priority ? <section className="mt-5 flex flex-col gap-4 rounded-[var(--radius-component)] bg-primary-50 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
              <div className="min-w-0 flex-1"><h4 className="text-ui-component">{priority.title}</h4><p className="mt-1 break-words text-ui-support text-ink-600">{priority.description}</p></div>
              <Button className="w-full shrink-0 sm:w-auto" onClick={priority.onClick}>{priority.action}<CaretRight aria-hidden="true" /></Button>
            </section> : null}

            <section className="mt-5">
              <MoveJourneyProgress current={progress} steps={["범위 검토", "업체 제안", "고객 확인", "공동확정"]} />
            </section>

            <section className="border-b border-line py-5">
              <div className="flex flex-wrap items-end justify-between gap-3"><p className="text-ui-data text-ink-600">제안 금액</p><strong className="text-ui-step-title text-primary-700">{money(scope.quote?.total_amount_krw)}</strong></div>
              <p className="mt-3 max-w-3xl break-words text-ui-support text-ink-600">{scope.proposal_id ? scope.proposal_reason : "아직 업체 제안이 없습니다. 작업범위와 금액을 확인해 고객에게 보내주세요."}</p>
              <dl className="mt-4 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center">
                <div className="px-2"><dt className="text-ui-micro text-ink-600">짐</dt><dd className="mt-1 text-ui-control">{scope.scope.item_count}개</dd></div>
                <div className="px-2"><dt className="text-ui-micro text-ink-600">포함 작업</dt><dd className="mt-1 text-ui-control">{scope.scope.work_count}개</dd></div>
                <div className="px-2"><dt className="text-ui-micro text-ink-600">확인서</dt><dd className="mt-1 text-ui-control">{scope.scope.version_label}</dd></div>
              </dl>
            </section>

            {!needsQuoteAction ? <p className={"mt-5 flex items-start gap-2 border-t border-line pt-4 text-ui-support " + (selectedJob?.status === "completed" || scope.scope.status === "confirmed" ? "text-success-ink" : "text-primary-800")}><CheckCircle aria-hidden="true" className="mt-0.5 shrink-0" />{selectedJob?.status === "completed" ? "고객의 완료 확인이 기록되었습니다." : scope.scope.status === "customer_review" ? "고객이 현재 제안을 확인하고 있습니다." : "고객과 업체가 같은 범위와 금액을 확인했습니다."}</p> : null}
          </> : selectedJob?.header ? <>
            <header className="min-w-0 border-b border-line pb-4">
              <div className="flex min-w-0 items-center justify-between gap-3"><h3 className="truncate text-ui-section">{customerName(selectedJob.header.customer_display_name)}</h3>{connectionCode ? <Button aria-label={`${connectionCode} ${connectionCopied ? "복사됨" : "복사"}`} className="shrink-0" onClick={() => void copyConnectionCode()} size="chip" variant="outline"><Copy aria-hidden="true" />{connectionCode}</Button> : null}</div>
              <div className="mt-4"><ProviderMoveRoute destination={selectedJob.header.destination_summary ?? "도착지"} origin={selectedJob.header.origin_summary ?? "출발지"} /></div>
              <div className="mt-4"><ProviderMoveSchedule scheduledAt={selectedJob.header.scheduled_at} /></div>
            </header>
            <section className="py-10 text-center"><h4 className="text-ui-component">고객이 작업범위를 준비하고 있어요</h4><p className="mx-auto mt-2 max-w-md text-ui-support text-ink-600">촬영과 짐 검수가 끝나면 이 화면에서 범위와 견적을 검토할 수 있습니다.</p></section>
          </> : <ProviderConnectionEmpty onConnect={onConnect} />}
        </article>
      </section>}

      {scope ? <AgreementHistorySheet issue={undefined} onOpenChange={setHistoryOpen} open={historyOpen} presentation="dialog" scope={scope} /> : null}
    </div>
  );
}

function ProviderNotificationsPanel({ compact = false, error, notifications, pending }: { compact?: boolean; error?: unknown; notifications?: Awaited<ReturnType<typeof listNotifications>>; pending: boolean }) {
  const items = [...(notifications ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const spacing = compact ? "px-4 py-4" : "px-6 py-5";
  const emptySpacing = compact ? "px-4 py-8" : "px-6 py-12";
  return <section className={compact ? "overflow-hidden" : "ui-card mx-auto max-w-3xl overflow-hidden"}><header className={`border-b border-line ${spacing}`}><h2 className="text-ui-section">작업 알림</h2><p className="mt-1 text-ui-support text-ink-600">현재 선택한 작업에서 업체 확인이 필요한 변화를 보여드립니다.</p></header>{pending ? <p className={`${emptySpacing} text-center text-sm text-ink-600`}>알림을 불러오는 중입니다.</p> : error ? <p className={`${compact ? "m-4" : "m-6"} rounded-xl bg-danger-bg p-4 text-sm font-bold text-danger-ink`} role="alert">{apiErrorMessage(error)}</p> : items.length ? <div className="divide-y divide-line">{items.map((notification) => { const copy = notificationCopy[notification.event_type]; return <article className={`flex gap-4 ${spacing}`} key={notification.id}><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><Bell aria-hidden="true" size="var(--icon-sm)" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-ui-status text-primary-700">{copy.label}</span><time className="text-ui-micro text-ink-400" dateTime={notification.created_at}>{notificationDateFormatter.format(new Date(notification.created_at))}</time></div><h3 className="mt-1 text-ui-component">{copy.title}</h3><p className="mt-1 text-ui-support text-ink-600">{copy.description}</p></div></article>; })}</div> : <div className={`${emptySpacing} text-center`}><Bell aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><p className="mt-3 font-extrabold">도착한 알림이 없습니다.</p></div>}</section>;
}

function ProviderConnectionEmpty({ onConnect }: { onConnect: () => void }) {
  return <section className="py-10 text-center"><h3 className="text-ui-component">연결된 이사가 없어요</h3><p className="mt-2 text-ui-support text-ink-600">고객과 공유한 이사 연결 코드로 작업을 불러오세요.</p><Button className="mt-5" onClick={onConnect}><Key aria-hidden="true" /> 연결 코드 추가</Button></section>;
}

function ProviderConnectionDialog({ connect, initialSecret, onOpenChange, open }: { connect: ReturnType<typeof useAuth>["connect"]; initialSecret: string; onOpenChange: (open: boolean) => void; open: boolean }) {
  const [secret, setSecret] = useState(initialSecret);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (!secret.trim() || pending) return;
    setPending(true);
    setError(null);
    try {
      await connect(secret, "company_manager");
      onOpenChange(false);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setPending(false);
    }
  };
  return <Dialog onOpenChange={onOpenChange} open={open}><DialogContent><DialogHeader><DialogTitle>이사 연결 코드 추가</DialogTitle><DialogDescription>고객·기사와 공유하는 코드를 입력하면 작업을 추가합니다.</DialogDescription></DialogHeader><div className="mt-6"><Label htmlFor="provider-invite-code">이사 연결 코드</Label><Input autoCapitalize="characters" autoComplete="off" className="mt-2" id="provider-invite-code" name="providerInviteCode" onChange={(event) => setSecret(event.target.value)} placeholder="MOVE-XXXXXXXX" spellCheck={false} value={secret} />{error ? <ErrorToast message={error} /> : null}</div><DialogFooter><Button className="w-full sm:w-auto" disabled={!secret.trim() || pending} onClick={submit} size="cta"><Key aria-hidden="true" />{pending ? "추가 중…" : "작업 추가"}</Button></DialogFooter></DialogContent></Dialog>;
}

function ProviderDisconnectDialog({ onConfirm, onOpenChange, open }: { onConfirm: () => void; onOpenChange: (open: boolean) => void; open: boolean }) {
  return <Dialog onOpenChange={onOpenChange} open={open}><DialogContent><DialogHeader><DialogTitle>이 기기에서 연결을 해제할까요?</DialogTitle><DialogDescription>현재 기기의 연결만 지워집니다. 이사 연결 코드로 다시 들어올 수 있어요.</DialogDescription></DialogHeader><DialogFooter className="grid grid-cols-2 gap-2"><Button onClick={() => onOpenChange(false)} variant="secondary">계속 사용</Button><Button onClick={onConfirm} variant="destructive">연결 해제</Button></DialogFooter></DialogContent></Dialog>;
}


function OperationsPanel() { return <LiveProviderWorkflow embedded wide />; }
function ProviderNav({ active, badge, icon, label, onClick }: { active: boolean; badge?: number; icon: ReactNode; label: string; onClick: () => void }) { return <Button aria-current={active ? "page" : undefined} className="w-full justify-start" onClick={onClick} size="chip" variant={active ? "secondary" : "ghost"}><span className="flex size-5 shrink-0 items-center justify-center">{icon}</span><span className="flex-1 text-left">{label}</span>{badge ? <span className="grid size-5 place-items-center rounded-full bg-danger text-ui-micro text-white">{badge}</span> : null}</Button>; }
function ProviderMobileNav({ active, badge, icon, label, onClick }: { active: boolean; badge?: number; icon: ReactNode; label: string; onClick: () => void }) { return <button aria-current={active ? "page" : undefined} className={`relative grid min-h-12 place-items-center text-xs font-bold ${active ? "text-primary-700" : "text-ink-500"}`} onClick={onClick} type="button"><span className="relative">{icon}{badge ? <span className="absolute -right-3 -top-2 grid size-4 place-items-center rounded-full bg-danger text-[10px] text-white">{badge}</span> : null}</span><span>{label}</span></button>; }
