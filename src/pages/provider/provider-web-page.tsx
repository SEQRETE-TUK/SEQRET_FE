import { useQueries, useQuery } from "@tanstack/react-query";
import {
  CaretRightIcon as CaretRight,
  CheckCircleIcon as CheckCircle,
  ClipboardTextIcon as Clipboard,
  ClockCounterClockwiseIcon as History,
  KeyIcon as Key,
  MagnifyingGlassIcon as Search,
  SignOutIcon as SignOut,
  UserPlusIcon as UserPlus,
  WarningCircleIcon as WarningCircle,
} from "@phosphor-icons/react";
import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

import { mockAccessSecrets, mockApiEnabled, mockProviderDraftAccessSecret } from "@/api/mock-api";
import { FilterChip, MoveJourneyProgress, StatusTag } from "@/components/layout/app-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/model/auth-context";
import type { AuthSession } from "@/features/auth/model/auth-context";
import { listScopeVersions, type ScopeVersionSummary } from "@/features/capture/api/capture-api";
import {
  apiErrorMessage,
  getScopeReview,
  listFieldIssues,
  workflowKeys,
  type Connection,
  type FieldIssue,
  type ScopeReview,
} from "@/features/workflow/api/workflow-api";
import { LiveProviderWorkflow } from "@/features/workflow/ui/live-provider-workflow";
import { ProviderIssueWorkbench } from "@/features/workflow/ui/provider-issue-workbench";
import { ProviderQuoteEditor } from "@/features/workflow/ui/provider-quote-editor";
import { InvitationPanel } from "@/features/workflow/ui/workflow-shell";

type ProviderView = "jobs" | "issues" | "invite";
type JobMode = "detail" | "quote";
type JobFilter = "all" | "action" | "customer" | "confirmed";
const moneyFormatter = new Intl.NumberFormat("ko-KR");
const money = (amount: number | null | undefined) => amount == null ? "–" : `${moneyFormatter.format(amount)}원`;
const day = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", weekday: "short" });
const schedule = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
function upsertProviderConnection(connections: AuthSession[], next: AuthSession) {
  return [next, ...connections.filter((item) => item.actor.job_id !== next.actor.job_id)];
}

export function ProviderWebPage() {
  const { clearSession, connect, session, switchSession } = useAuth();
  const activeSession = session?.actor.role === "company_manager" ? session : null;
  const [connections, setConnections] = useState<AuthSession[]>(() => activeSession ? [activeSession] : []);
  const addConnection = async (secret: string) => {
    const next = await connect(secret, "company_manager");
    setConnections((current) => upsertProviderConnection(current, next));
    return next;
  };
  const selectConnection = (next: AuthSession) => switchSession(next);
  const removeConnection = () => {
    if (!activeSession) return;
    const remaining = connections.filter((item) => item.actor.job_id !== activeSession.actor.job_id);
    setConnections(remaining);
    if (remaining[0]) void selectConnection(remaining[0]);
    else clearSession();
  };
  return <ProviderWebConsole connections={connections} onConnect={addConnection} onDisconnect={removeConnection} onSelect={selectConnection} session={activeSession} />;
}

function ProviderWebConsole({ connections, onConnect, onDisconnect, onSelect, session }: { connections: AuthSession[]; onConnect: (secret: string) => Promise<AuthSession>; onDisconnect: () => void; onSelect: (session: AuthSession) => void; session: AuthSession | null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [connectionOpen, setConnectionOpen] = useState(false);
  const viewParam = searchParams.get("view");
  const view: ProviderView = viewParam === "issues" || viewParam === "invite" ? viewParam : "jobs";
  const jobMode: JobMode = searchParams.get("mode") === "quote" ? "quote" : "detail";
  const invitationPending = session?.actor.invitation?.status === "pending";
  const connection: Connection | null = session ? { accessToken: session.accessToken, jobId: session.actor.job_id } : null;
  const canReadJob = Boolean(connection && !invitationPending);
  const scopeQuery = useQuery({ enabled: canReadJob, queryKey: workflowKeys.scope(connection?.jobId ?? "unconnected"), queryFn: () => getScopeReview(connection!), refetchInterval: mockApiEnabled ? 2_000 : false });
  const issueQuery = useQuery({ enabled: canReadJob, queryKey: workflowKeys.fieldIssues(connection?.jobId ?? "unconnected"), queryFn: () => listFieldIssues(connection!), refetchInterval: mockApiEnabled ? 2_000 : false });
  const historyQuery = useQuery({ enabled: canReadJob, queryKey: [...workflowKeys.scope(connection?.jobId ?? "unconnected"), "versions"], queryFn: () => listScopeVersions(connection!) });
  const linkedScopeQueries = useQueries({ queries: connections.map((item) => ({ enabled: item.actor.invitation?.status !== "pending", queryKey: workflowKeys.scope(item.actor.job_id), queryFn: () => getScopeReview({ accessToken: item.accessToken, jobId: item.actor.job_id }) })) });
  const linkedJobs = connections.map((item, index) => ({ session: item, scope: linkedScopeQueries[index]?.data }));
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
  const viewTitle = jobMode === "quote" ? "범위·견적" : view === "jobs" ? "작업" : view === "issues" ? "현장 이슈" : "기사·배차";
  const viewContext = view === "jobs" && jobMode === "detail"
    ? `연결 ${connections.length}건`
    : scope ? scope.job.customer_display_name ?? "고객" : "선택 작업 없음";

  if (session && invitationPending) {
    return <div className="min-h-dvh bg-canvas px-[var(--content-gutter)] py-[var(--space-lg)] text-ink-900"><main className="mx-auto max-w-xl" id="main-content"><p className="text-ui-control text-primary-700">SEQRET · 업체용</p><h1 className="mt-2 text-ui-step-title">먼저 작업 초대를 확인해 주세요</h1><p className="mt-2 text-ui-support text-ink-600">수락 전에는 고객의 이사 정보나 견적을 불러오지 않습니다.</p><div className="mt-6"><InvitationPanel /></div></main></div>;
  }

  return (
    <div className="provider-console min-h-dvh bg-canvas pb-20 text-ink-900 md:grid md:grid-cols-[15rem_minmax(0,1fr)] md:pb-0">
      <aside className="sticky top-0 hidden h-dvh min-h-0 flex-col border-r border-line bg-surface px-4 py-5 md:flex">
        <div className="px-3"><strong className="tracking-[var(--tracking-brand)] text-primary-800">SEQRET</strong></div>
        <nav aria-label="업체 메뉴" className="mt-7">
          <ProviderNav active={view === "jobs"} icon={<Clipboard aria-hidden="true" />} label="작업" onClick={() => changeView("jobs")} />
          {scope ? <div className="mt-5 border-t border-line pt-3">
            <div className="space-y-1">
              <ProviderNav active={view === "issues"} badge={openIssues.length || undefined} icon={<WarningCircle aria-hidden="true" />} label="현장 이슈" onClick={() => changeView("issues")} />
              <ProviderNav active={view === "invite"} icon={<UserPlus aria-hidden="true" />} label="기사·배차" onClick={() => changeView("invite")} />
            </div>
          </div> : null}
        </nav>
        <div className="mt-auto border-t border-line px-2 pt-4">
          {session ? <Button className="w-full justify-start" onClick={onDisconnect} size="chip" variant="ghost"><SignOut aria-hidden="true" /> 연결 해제</Button> : <Button className="w-full justify-start" onClick={() => setConnectionOpen(true)} size="chip" variant="ghost"><Key aria-hidden="true" /> 초대 코드 입력</Button>}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-[var(--z-sticky)] flex min-h-[4.5rem] items-center justify-between gap-4 border-b border-line bg-surface/96 px-4 backdrop-blur sm:px-6 md:min-h-20 xl:px-8">
          <div className="min-w-0"><p className="truncate text-ui-micro text-ink-500">{viewContext}</p><h1 className="mt-0.5 truncate text-ui-section">{viewTitle}</h1></div>
          <div className="flex items-center gap-2">
            {view === "jobs" && jobMode === "detail" ? <label className="hidden h-[var(--control-touch)] min-w-[17rem] items-center gap-2 rounded-[var(--radius-control)] border border-input bg-surface px-4 focus-within:border-primary-400 focus-within:ring-3 focus-within:ring-primary-100 lg:flex"><Search aria-hidden="true" className="text-ink-600" /><input aria-label="고객명, 주소 검색" autoComplete="off" className="min-w-0 flex-1 bg-transparent text-ui-control outline-none placeholder:text-ink-400" data-slot="input-proxy" name="providerSearch" onChange={(event) => setSearch(event.target.value)} placeholder="고객명, 주소 검색…" type="search" value={search} /></label> : null}
            <Button aria-label="이사 연결" className="px-3 xl:px-4" onClick={() => setConnectionOpen(true)} variant="outline"><Key aria-hidden="true" /><span className="hidden xl:inline">이사 연결</span></Button>
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-5 xl:p-7" id="main-content"><div className="mx-auto max-w-[var(--shell-wide)]">
          {view === "jobs" && jobMode === "detail" ? <JobDashboard history={historyQuery.data ?? []} issues={issues} jobs={linkedJobs} onConnect={() => setConnectionOpen(true)} onIssue={() => changeView("issues")} onQuote={() => changeJobMode("quote")} onSearchChange={setSearch} onSelect={(next) => { onSelect(next); changeJobMode("detail"); }} scope={scope} search={search} selectedJobId={session?.actor.job_id ?? null} /> : null}
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
      <ProviderConnectionDialog connect={onConnect} onOpenChange={setConnectionOpen} open={connectionOpen} />
    </div>
  );
}

function JobDashboard({ history, issues, jobs: linkedJobs, onConnect, onIssue, onQuote, onSearchChange, onSelect, scope, search, selectedJobId }: { history: ScopeVersionSummary[]; issues: FieldIssue[]; jobs: Array<{ session: AuthSession; scope: ScopeReview | undefined }>; onConnect: () => void; onIssue: () => void; onQuote: () => void; onSearchChange: (value: string) => void; onSelect: (session: AuthSession) => void; scope: ScopeReview | undefined; search: string; selectedJobId: string | null }) {
  const [filter, setFilter] = useState<JobFilter>("all");
  const [historyOpen, setHistoryOpen] = useState(false);
  const allJobs = useMemo(() => {
    const rows = linkedJobs.map((item) => ({
      date: item.scope?.job.scheduled_at ?? null,
      customer: item.scope?.job.customer_display_name ?? "고객",
      route: (item.scope?.job.origin_summary ?? "출발지") + " → " + (item.scope?.job.destination_summary ?? "도착지"),
      status: item.scope?.scope.status ?? "company_review",
      current: item.session.actor.job_id === selectedJobId,
      session: item.session,
    }));
    const query = search.trim();
    return query ? rows.filter((job) => (job.customer + " " + job.route).includes(query)) : rows;
  }, [linkedJobs, search, selectedJobId]);
  const actionableIssues = issues.filter((issue) => issue.status === "open" || issue.status === "clarification_requested");
  const statusCounts = {
    action: allJobs.filter((job) => job.status === "company_review" || job.status === "revision_requested").length,
    customer: allJobs.filter((job) => job.status === "customer_review").length,
    confirmed: allJobs.filter((job) => job.status === "confirmed").length,
  };
  const jobs = allJobs.filter((job) => filter === "all"
    || (filter === "action" && (job.status === "company_review" || job.status === "revision_requested"))
    || (filter === "customer" && job.status === "customer_review")
    || (filter === "confirmed" && job.status === "confirmed"));
  const queueGroups = [
    { key: "action", label: "검토 필요", jobs: jobs.filter((job) => job.status === "company_review" || job.status === "revision_requested") },
    { key: "customer", label: "고객 확인 중", jobs: jobs.filter((job) => job.status === "customer_review") },
    { key: "confirmed", label: "공동확정", jobs: jobs.filter((job) => job.status === "confirmed") },
  ].filter((group) => group.jobs.length > 0 && (filter === "all" || filter === group.key));
  const priority = scope?.scope.status === "revision_requested"
    ? { title: "고객 수정 요청이 도착했어요", description: scope.revision_request?.reason ?? "요청 내용을 반영해 새 버전으로 다시 제안해 주세요.", action: "수정해서 다시 제안", onClick: onQuote }
    : scope?.scope.status === "company_review"
      ? { title: "범위와 견적 검토가 필요해요", description: "고객이 등록한 항목과 현장 조건을 확인한 뒤 제안하세요.", action: "범위·견적 작성", onClick: onQuote }
      : actionableIssues[0]
        ? { title: "현장 보고에 응답해 주세요", description: actionableIssues[0].title, action: "현장 이슈 열기", onClick: onIssue }
        : null;
  const statusLabel = (status: string) => status === "confirmed" ? "공동확정" : status === "customer_review" ? "고객 확인 중" : status === "revision_requested" ? "수정 요청" : "검토 필요";
  const statusTone = (status: string): "primary" | "success" | "warning" => status === "confirmed" ? "success" : status === "company_review" ? "primary" : "warning";
  const progress = scope?.scope.status === "confirmed" ? 4 : scope?.scope.status === "customer_review" ? 3 : scope?.scope.status === "revision_requested" ? 2 : 1;
  const needsQuoteAction = scope?.scope.status === "company_review" || scope?.scope.status === "revision_requested";

  return (
    <div>
      <label className="flex h-[var(--control-touch)] items-center gap-2 rounded-[var(--radius-control)] border border-input bg-surface px-4 focus-within:border-primary-400 focus-within:ring-3 focus-within:ring-primary-100 lg:hidden"><Search aria-hidden="true" className="text-ink-600" /><input aria-label="고객명, 주소 검색" autoComplete="off" className="min-w-0 flex-1 bg-transparent text-ui-control outline-none placeholder:text-ink-400" name="providerSearchMobile" onChange={(event) => onSearchChange(event.target.value)} placeholder="고객명, 주소 검색…" type="search" value={search} /></label>

      {linkedJobs.length === 0 ? <section className="ui-card ui-card-outlined mt-4 px-5 lg:mt-0"><ProviderConnectionEmpty onConnect={onConnect} /></section> : <section className="ui-card ui-card-outlined mt-4 overflow-hidden lg:mt-0 xl:grid xl:grid-cols-[minmax(22rem,0.92fr)_minmax(0,1.08fr)]">
        <section aria-labelledby="provider-job-list-title" className="min-w-0 border-b border-line xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <div className="flex min-w-0 items-baseline gap-2"><h2 className="text-ui-component" id="provider-job-list-title">작업 큐</h2><span className="text-ui-data tabular-nums text-ink-600">{allJobs.length}</span></div>
            {actionableIssues.length > 0 ? <button className="min-h-11 shrink-0 whitespace-nowrap text-ui-data text-ink-600 hover:text-primary-700" onClick={onIssue} type="button">현장 이슈 <span className="tabular-nums">{actionableIssues.length}</span></button> : null}
          </div>
          <div aria-label="작업 상태 필터" className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line px-4 py-3">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>전체 {allJobs.length}</FilterChip>
            <FilterChip active={filter === "action"} onClick={() => setFilter("action")}>검토 필요 {statusCounts.action}</FilterChip>
            <FilterChip active={filter === "customer"} onClick={() => setFilter("customer")}>고객 확인 중 {statusCounts.customer}</FilterChip>
            <FilterChip active={filter === "confirmed"} onClick={() => setFilter("confirmed")}>공동확정 {statusCounts.confirmed}</FilterChip>
          </div>
          <div aria-label="작업 목록" className="border-t border-line">
            {queueGroups.length ? queueGroups.map((group) => <section aria-labelledby={`provider-job-group-${group.key}`} key={group.key}>
              <div className="flex items-center justify-between bg-surface-muted px-4 py-2.5"><h3 className="text-ui-data text-ink-600" id={`provider-job-group-${group.key}`}>{group.label}</h3><span className="text-ui-micro tabular-nums text-ink-500">{group.jobs.length}</span></div>
              {group.jobs.map((job) => <button aria-pressed={job.current} className={`grid min-h-[4.75rem] w-full grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-l-2 border-b-line px-4 py-3 text-left sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] ${job.current ? "border-l-primary-600 bg-primary-50/70" : "border-l-transparent hover:bg-surface-muted"}`} key={job.session.actor.job_id} onClick={() => onSelect(job.session)} type="button">
                <time className="text-center text-ui-data tabular-nums text-ink-600 sm:row-span-1">{job.date ? day.format(new Date(job.date)) : "–"}</time>
                <span className="min-w-0"><strong className="block truncate text-ui-list-title">{job.customer}</strong><span className="mt-0.5 block truncate text-ui-list-detail text-ink-600">{job.route}</span></span>
                <span className="col-start-2 justify-self-start sm:col-start-3 sm:row-start-1 sm:justify-self-end"><StatusTag tone={statusTone(job.status)}>{statusLabel(job.status)}</StatusTag></span>
              </button>)}
            </section>) : <p className="px-5 py-10 text-center text-ui-support text-ink-600">이 조건에 맞는 작업이 없습니다.</p>}
          </div>
        </section>

        <article aria-label="선택 작업 상세" className="min-w-0 p-5 sm:p-6">
          {scope ? <>
            <header className="min-w-0 border-b border-line pb-4">
              <div className="flex min-w-0 items-start justify-between gap-3"><h3 className="truncate text-ui-section">{scope.job.customer_display_name ?? "고객"}</h3><StatusTag tone={statusTone(scope.scope.status)}>{statusLabel(scope.scope.status)}</StatusTag></div>
              <p className="mt-1 break-words text-ui-support text-ink-600">{scope.job.origin_summary ?? "출발지"} → {scope.job.destination_summary ?? "도착지"}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><time className="text-ui-data text-ink-600">{scope.job.scheduled_at ? schedule.format(new Date(scope.job.scheduled_at)) : "일정 확인 중"}</time><div className="flex flex-wrap justify-end gap-1"><Button onClick={() => setHistoryOpen(true)} size="chip" variant="ghost"><History aria-hidden="true" /> 이력</Button>{!needsQuoteAction ? <Button onClick={onQuote} size="chip" variant="outline">범위·견적</Button> : null}</div></div>
            </header>

            {priority ? <section className="mt-5 flex flex-col gap-4 border-y border-line py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1"><h4 className="text-ui-component">{priority.title}</h4><p className="mt-1 break-words text-ui-support text-ink-600">{priority.description}</p></div>
              <Button className="w-full shrink-0 sm:w-auto" onClick={priority.onClick}>{priority.action}<CaretRight aria-hidden="true" /></Button>
            </section> : null}

            <section className="border-b border-line py-5">
              <div className="flex flex-wrap items-end justify-between gap-3"><p className="text-ui-data text-ink-600">제안 금액</p><strong className="text-ui-step-title text-primary-700">{money(scope.quote?.total_amount_krw)}</strong></div>
              <p className="mt-3 max-w-3xl break-words text-ui-support text-ink-600">{scope.proposal_id ? scope.proposal_reason : "아직 업체 제안이 없습니다. 작업범위와 금액을 확인해 고객에게 보내주세요."}</p>
              <dl className="mt-4 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center">
                <div className="px-2"><dt className="text-ui-micro text-ink-600">짐</dt><dd className="mt-1 text-ui-control">{scope.scope.item_count}개</dd></div>
                <div className="px-2"><dt className="text-ui-micro text-ink-600">포함 작업</dt><dd className="mt-1 text-ui-control">{scope.scope.work_count}개</dd></div>
                <div className="px-2"><dt className="text-ui-micro text-ink-600">확인서</dt><dd className="mt-1 text-ui-control">{scope.scope.version_label}</dd></div>
              </dl>
            </section>

            <section className="mt-5" aria-labelledby="provider-progress-title">
              <h4 className="text-ui-control" id="provider-progress-title">공동확인 진행</h4>
              <MoveJourneyProgress current={progress} steps={["범위 검토", "업체 제안", "고객 확인", "공동확정"]} />
            </section>

            {!needsQuoteAction ? <p className={"mt-5 flex items-start gap-2 border-t border-line pt-4 text-ui-support " + (scope.scope.status === "confirmed" ? "text-success-ink" : "text-primary-800")}><CheckCircle aria-hidden="true" className="mt-0.5 shrink-0" />{scope.scope.status === "customer_review" ? "고객이 현재 제안을 확인하고 있습니다." : "고객과 업체가 같은 범위와 금액을 확인했습니다."}</p> : null}
          </> : <ProviderConnectionEmpty onConnect={onConnect} />}
        </article>
      </section>}

      {scope ? <ProviderHistoryDialog history={history} onOpenChange={setHistoryOpen} open={historyOpen} scope={scope} /> : null}
    </div>
  );
}
function ProviderHistoryDialog({ history, onOpenChange, open, scope }: { history: ScopeVersionSummary[]; onOpenChange: (open: boolean) => void; open: boolean; scope: ScopeReview }) {
  const versions = [...history].sort((a, b) => b.sequence_number - a.sequence_number);
  return <Dialog onOpenChange={onOpenChange} open={open}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>범위·합의 이력</DialogTitle><DialogDescription>저장된 확인서 버전과 양쪽의 확인 상태입니다.</DialogDescription></DialogHeader><div className="mt-6 space-y-3">{versions.map((version) => { const current = version.id === scope.scope.id; return <article className={`rounded-[var(--radius-card)] border p-4 ${current ? "border-primary-400 bg-primary-50/50" : "border-line"}`} key={version.id}><div className="flex flex-wrap items-center justify-between gap-2"><strong>{current ? scope.scope.version_label : `v${version.sequence_number}`}{current ? " · 현재" : ""}</strong><time className="text-ui-data text-ink-600">{new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(version.created_at))}</time></div><p className="mt-2 text-ui-support text-ink-600">항목 {version.content.items.length}개 · {version.locked_at ? "공동확정" : "검토 가능"}</p></article>; })}{versions.length === 0 ? <p className="rounded-[var(--radius-card)] bg-surface-muted p-4 text-ui-support text-ink-600">버전 기록을 불러오는 중…</p> : null}<article className="rounded-[var(--radius-card)] border border-line p-4"><strong>현재 확인 상태</strong><div className="mt-3 flex flex-wrap gap-2"><StatusTag tone={scope.company_confirmed_at ? "success" : "warning"}>업체 {scope.company_confirmed_at ? "확인" : "미확인"}</StatusTag><StatusTag tone={scope.customer_confirmed_at ? "success" : "warning"}>고객 {scope.customer_confirmed_at ? "확인" : "대기"}</StatusTag></div>{scope.revision_request ? <p className="mt-3 rounded-[var(--radius-control)] bg-warning-bg p-3 text-ui-support text-warning-ink">수정 요청 · {scope.revision_request.reason}</p> : null}</article>{scope.approved_changes.map((change) => <article className="rounded-[var(--radius-card)] border border-line p-4" key={change.proposal_id}><span className="text-ui-micro text-primary-700">현장 변경 반영</span><strong className="mt-1 block break-words">{change.title}</strong><p className="mt-1 break-words text-ui-support text-ink-600">{change.reason}</p><p className="mt-3 text-ui-control">{money(change.quote.total_amount_krw)}</p></article>)}</div></DialogContent></Dialog>;
}

function ProviderConnectionEmpty({ onConnect }: { onConnect: () => void }) {
  return <section className="py-10 text-center"><h3 className="text-ui-component">연결된 이사가 없어요</h3><p className="mt-2 text-ui-support text-ink-600">고객에게 받은 초대 코드로 이사 상태를 불러오세요.</p><Button className="mt-5" onClick={onConnect}><Key aria-hidden="true" /> 초대 코드 입력</Button></section>;
}

function ProviderConnectionDialog({ connect, onOpenChange, open }: { connect: ReturnType<typeof useAuth>["connect"]; onOpenChange: (open: boolean) => void; open: boolean }) {
  const [secret, setSecret] = useState(mockApiEnabled ? mockAccessSecrets.company_manager : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (!secret.trim() || pending) return;
    setPending(true);
    setError(null);
    try {
      await connect(secret, "company_manager");
      if (mockApiEnabled) setSecret(mockProviderDraftAccessSecret);
      onOpenChange(false);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setPending(false);
    }
  };
  return <Dialog onOpenChange={onOpenChange} open={open}><DialogContent><DialogHeader><DialogTitle>이사 연결</DialogTitle><DialogDescription>고객에게 받은 초대 코드를 입력하면 해당 이사의 상태를 불러옵니다.</DialogDescription></DialogHeader><div className="mt-6"><Label htmlFor="provider-invite-code">초대 코드</Label><Input autoCapitalize="none" autoComplete="off" className="mt-2" id="provider-invite-code" name="providerInviteCode" onChange={(event) => setSecret(event.target.value)} placeholder="초대 코드 붙여넣기…" spellCheck={false} type="password" value={secret} />{error ? <p className="mt-3 text-ui-support text-danger-ink" role="alert">{error}</p> : null}</div><DialogFooter><Button className="w-full sm:w-auto" disabled={!secret.trim() || pending} onClick={submit} size="cta"><Key aria-hidden="true" />{pending ? "불러오는 중…" : "이사 불러오기"}</Button></DialogFooter></DialogContent></Dialog>;
}


function OperationsPanel() { return <LiveProviderWorkflow embedded wide />; }
function ProviderNav({ active, badge, icon, label, onClick }: { active: boolean; badge?: number; icon: ReactNode; label: string; onClick: () => void }) { return <button aria-current={active ? "page" : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-control)] px-4 text-left text-ui-control ${active ? "bg-primary-50 text-primary-700" : "text-ink-600 hover:bg-surface-muted hover:text-ink-900"}`} onClick={onClick} type="button"><span className="size-5">{icon}</span><span className="flex-1">{label}</span>{badge ? <span className="grid size-5 place-items-center rounded-full bg-danger text-ui-micro text-white">{badge}</span> : null}</button>; }
function ProviderMobileNav({ active, badge, icon, label, onClick }: { active: boolean; badge?: number; icon: ReactNode; label: string; onClick: () => void }) { return <button aria-current={active ? "page" : undefined} className={`relative grid min-h-12 place-items-center text-xs font-bold ${active ? "text-primary-700" : "text-ink-500"}`} onClick={onClick} type="button"><span className="relative">{icon}{badge ? <span className="absolute -right-3 -top-2 grid size-4 place-items-center rounded-full bg-danger text-[10px] text-white">{badge}</span> : null}</span><span>{label}</span></button>; }
