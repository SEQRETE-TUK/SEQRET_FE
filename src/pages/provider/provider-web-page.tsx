import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowClockwiseIcon as Refresh,
  CaretRightIcon as CaretRight,
  ClipboardTextIcon as Clipboard,
  ClockCounterClockwiseIcon as History,
  KeyIcon as Key,
  MagnifyingGlassIcon as Search,
  SignOutIcon as SignOut,
  UserPlusIcon as UserPlus,
  WarningCircleIcon as WarningCircle,
} from "@phosphor-icons/react";
import { useMemo, useState, type ReactNode } from "react";

import { mockAccessSecrets, mockApiEnabled } from "@/api/mock-api";
import { FilterChip, ListGroup, ListRow, MoveJourneyProgress, StatusTag } from "@/components/layout/app-primitives";
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
type JobFilter = "all" | "action" | "confirmed";
const moneyFormatter = new Intl.NumberFormat("ko-KR");
const money = (amount: number | null | undefined) => amount == null ? "–" : `${moneyFormatter.format(amount)}원`;
const day = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", weekday: "short" });
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
  const queryClient = useQueryClient();
  const [view, setView] = useState<ProviderView>("jobs");
  const [jobMode, setJobMode] = useState<JobMode>("detail");
  const [search, setSearch] = useState("");
  const [connectionOpen, setConnectionOpen] = useState(false);
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
  const refresh = () => connection ? queryClient.invalidateQueries({ queryKey: workflowKeys.root(connection.jobId) }) : undefined;
  const changeView = (next: ProviderView) => { setView(next); if (next !== "jobs") setJobMode("detail"); };

  if (session && invitationPending) {
    return <div className="min-h-dvh bg-canvas px-[var(--content-gutter)] py-[var(--space-lg)] text-ink-900"><main className="mx-auto max-w-xl" id="main-content"><p className="text-ui-control text-primary-700">짐확정 · 업체용</p><h1 className="mt-2 text-ui-step-title">먼저 작업 초대를 확인해 주세요</h1><p className="mt-2 text-ui-support text-ink-600">수락 전에는 고객의 이사 정보나 견적을 불러오지 않습니다.</p><div className="mt-6"><InvitationPanel /></div></main></div>;
  }

  return (
    <div className="min-h-dvh bg-canvas pb-20 text-ink-900 lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:pb-0">
      <aside className="hidden min-h-dvh border-r border-line bg-surface px-5 py-8 lg:flex lg:flex-col">
        <div className="px-3"><strong className="text-ui-section tracking-[var(--tracking-brand)] text-primary-800">짐확정</strong></div>
        <nav aria-label="업체 메뉴" className="mt-9 space-y-2">
          <ProviderNav active={view === "jobs"} icon={<Clipboard aria-hidden="true" />} label="작업" onClick={() => changeView("jobs")} />
          <ProviderNav active={view === "issues"} badge={openIssues.length || undefined} icon={<WarningCircle aria-hidden="true" />} label="현장 이슈" onClick={() => changeView("issues")} />
          <ProviderNav active={view === "invite"} icon={<UserPlus aria-hidden="true" />} label="기사·배차" onClick={() => changeView("invite")} />
        </nav>
        <div className="mt-auto px-3">
          {session ? <Button className="w-full justify-start" onClick={onDisconnect} size="chip" variant="ghost"><SignOut aria-hidden="true" /> 이사 연결 해제</Button> : <Button className="w-full justify-start" onClick={() => setConnectionOpen(true)} size="chip" variant="ghost"><Key aria-hidden="true" /> 초대 코드 입력</Button>}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-[var(--z-sticky)] flex min-h-[var(--header-height)] items-center justify-between gap-2 border-b border-line bg-surface/96 px-4 backdrop-blur sm:px-6 xl:px-10">
          <div className="min-w-0"><h1 className="truncate text-ui-section">{view === "jobs" ? "작업 관리" : view === "issues" ? "현장 이슈" : "기사·배차"}</h1></div>
          <div className="flex items-center gap-2">
            <label className="hidden h-[var(--control-touch)] min-w-[280px] items-center gap-2 rounded-[var(--radius-control)] border border-input bg-surface px-4 focus-within:border-primary-400 focus-within:ring-3 focus-within:ring-primary-100 md:flex"><Search aria-hidden="true" className="text-ink-600" /><input aria-label="고객명, 주소, 작업 ID 검색" autoComplete="off" className="min-w-0 flex-1 bg-transparent text-ui-control outline-none placeholder:text-ink-400" data-slot="input-proxy" name="providerSearch" onChange={(event) => setSearch(event.target.value)} placeholder="고객명, 주소, 작업 ID 검색…" type="search" value={search} /></label>
            <Button aria-label="이사 연결" onClick={() => setConnectionOpen(true)} size="icon" variant="outline"><Key aria-hidden="true" /></Button>
            {view === "jobs" && scope ? <Button className="px-2.5 sm:px-4" onClick={() => setJobMode(jobMode === "quote" ? "detail" : "quote")} variant="outline">{jobMode === "quote" ? "작업 목록" : "범위·견적"}</Button> : null}
            <Button aria-label="새로고침" onClick={refresh} size="icon" variant="outline"><Refresh aria-hidden="true" /></Button>
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-5 xl:p-8" id="main-content"><div className="mx-auto max-w-[var(--shell-wide)]">
          {view === "jobs" && jobMode === "detail" ? <JobDashboard history={historyQuery.data ?? []} issues={issues} jobs={linkedJobs} onConnect={() => setConnectionOpen(true)} onIssue={() => changeView("issues")} onQuote={() => setJobMode("quote")} onSelect={(next) => { onSelect(next); setJobMode("detail"); }} scope={scope} search={search} selectedJobId={session?.actor.job_id ?? null} /> : null}
          {view === "jobs" && jobMode === "quote" && connection ? <ProviderQuoteEditor key={connection.jobId} connection={connection} onBack={() => setJobMode("detail")} scope={scope} /> : null}
          {view === "issues" ? connection ? <ProviderIssueWorkbench connection={connection} issues={issues} scope={scope} /> : <ProviderConnectionEmpty onConnect={() => setConnectionOpen(true)} /> : null}
          {view === "invite" ? session ? <OperationsPanel /> : <ProviderConnectionEmpty onConnect={() => setConnectionOpen(true)} /> : null}
        </div></main>
      </div>
      <nav aria-label="업체 모바일 메뉴" className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] grid grid-cols-3 border-t border-line bg-surface px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
        <ProviderMobileNav active={view === "jobs"} icon={<Clipboard aria-hidden="true" />} label="작업" onClick={() => changeView("jobs")} />
        <ProviderMobileNav active={view === "issues"} badge={openIssues.length || undefined} icon={<WarningCircle aria-hidden="true" />} label="현장 이슈" onClick={() => changeView("issues")} />
        <ProviderMobileNav active={view === "invite"} icon={<UserPlus aria-hidden="true" />} label="기사·배차" onClick={() => changeView("invite")} />
      </nav>
      <ProviderConnectionDialog connect={onConnect} onOpenChange={setConnectionOpen} open={connectionOpen} />
    </div>
  );
}

function JobDashboard({ history, issues, jobs: linkedJobs, onConnect, onIssue, onQuote, onSelect, scope, search, selectedJobId }: { history: ScopeVersionSummary[]; issues: FieldIssue[]; jobs: Array<{ session: AuthSession; scope: ScopeReview | undefined }>; onConnect: () => void; onIssue: () => void; onQuote: () => void; onSelect: (session: AuthSession) => void; scope: ScopeReview | undefined; search: string; selectedJobId: string | null }) {
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
      jobCode: item.scope?.job.job_code ?? "–",
    }));
    const query = search.trim();
    return query ? rows.filter((job) => (job.customer + " " + job.route + " " + job.jobCode).includes(query)) : rows;
  }, [linkedJobs, search, selectedJobId]);
  const jobs = allJobs.filter((job) => filter === "all" || (filter === "confirmed" ? job.status === "confirmed" : job.status === "company_review" || job.status === "revision_requested"));
  const loadedScopes = linkedJobs.flatMap((item) => item.scope ? [item.scope] : []);
  const actionableIssues = issues.filter((issue) => issue.status === "open" || issue.status === "clarification_requested");
  const stats = [
    ["검토 필요", loadedScopes.filter((item) => item.scope.status === "company_review" || item.scope.status === "revision_requested").length],
    ["고객 확인 중", loadedScopes.filter((item) => item.scope.status === "customer_review").length],
    ["공동확정", loadedScopes.filter((item) => item.scope.status === "confirmed").length],
    ["현장 이슈", actionableIssues.length],
  ] as const;
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

  return (
    <div className="space-y-5">
      {priority ? <section className="ui-card ui-card-outlined ui-card-tinted flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-ui-control text-primary-700">지금 할 일</p>
          <h3 className="mt-1 text-ui-component">{priority.title}</h3>
          <p className="mt-1 max-w-3xl text-ui-support text-ink-600">{priority.description}</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={priority.onClick}>{priority.action}<CaretRight aria-hidden="true" /></Button>
      </section> : null}

      <dl aria-label="작업 상태 요약" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map(([label, value]) => <div className="ui-card ui-card-outlined px-4 py-3" key={label}>
          <dt className="text-ui-data text-ink-600">{label}</dt>
          <dd className="mt-1 text-ui-section tabular-nums">{value}</dd>
        </div>)}
      </dl>

      {allJobs.length === 0 ? <section className="ui-card ui-card-outlined px-5"><ProviderConnectionEmpty onConnect={onConnect} /></section> : <section className="grid items-start gap-5 xl:grid-cols-[minmax(20rem,0.88fr)_minmax(0,1.12fr)]">
        <section aria-labelledby="provider-job-list-title" className="ui-card ui-card-outlined overflow-hidden">
          <h3 className="sr-only" id="provider-job-list-title">연결된 작업</h3>
          <div aria-label="작업 상태 필터" className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>전체 {allJobs.length}</FilterChip>
            <FilterChip active={filter === "action"} onClick={() => setFilter("action")}>검토 필요</FilterChip>
            <FilterChip active={filter === "confirmed"} onClick={() => setFilter("confirmed")}>공동확정</FilterChip>
          </div>
          <div className="border-t border-line">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="text-ui-control">작업 목록</p>
              <span className="text-ui-data text-ink-600">최신순</span>
            </div>
            {jobs.length ? <ListGroup className="mt-0" label="작업 목록" variant="plain">
              {jobs.map((job) => <ListRow
                description={<><span className="block truncate">{job.route}</span><span className="mt-1 block text-ui-micro text-ink-400">작업 ID {job.jobCode}</span></>}
                end={<StatusTag tone={statusTone(job.status)}>{statusLabel(job.status)}</StatusTag>}
                key={job.session.actor.job_id}
                leading={<time className="block w-12 text-center text-ui-data">{job.date ? day.format(new Date(job.date)) : "–"}</time>}
                onClick={() => onSelect(job.session)}
                selected={job.current}
              >
                {job.customer}
              </ListRow>)}
            </ListGroup> : <p className="border-t border-line px-5 py-10 text-center text-ui-support text-ink-600">이 조건에 맞는 작업이 없습니다.</p>}
          </div>
        </section>

        <article className="ui-card ui-card-outlined ui-card-pad min-w-0">
          {scope ? <>
            <header className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <StatusTag tone={statusTone(scope.scope.status)}>{statusLabel(scope.scope.status)}</StatusTag>
                <h3 className="mt-3 truncate text-ui-section">{scope.job.customer_display_name ?? "고객"} 고객</h3>
                <p className="mt-1 break-words text-ui-support text-ink-600">{scope.job.origin_summary ?? "출발지"} → {scope.job.destination_summary ?? "도착지"}</p>
              </div>
              <Button className="shrink-0" onClick={() => setHistoryOpen(true)} size="chip" variant="ghost"><History aria-hidden="true" /> 이력</Button>
            </header>

            <section className="mt-5 rounded-[var(--radius-feature)] border border-line bg-surface-muted p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-ui-data text-ink-600">현재 확인서</p>
                  <strong className="mt-1 block text-ui-component">{scope.scope.version_label}</strong>
                </div>
                <strong className="text-ui-step-title text-primary-700">{money(scope.quote?.total_amount_krw)}</strong>
              </div>
              <p className="mt-3 max-w-3xl break-words text-ui-support text-ink-600">{scope.proposal_id ? scope.proposal_reason : "아직 업체 제안이 없습니다. 작업범위와 금액을 확인해 고객에게 보내주세요."}</p>
              <dl className="mt-4 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center">
                <div><dt className="text-ui-micro text-ink-600">짐</dt><dd className="mt-1 text-ui-control">{scope.scope.item_count}개</dd></div>
                <div><dt className="text-ui-micro text-ink-600">작업조건</dt><dd className="mt-1 text-ui-control">{scope.scope.work_count}개</dd></div>
                <div><dt className="text-ui-micro text-ink-600">버전</dt><dd className="mt-1 text-ui-control">{scope.scope.version_label}</dd></div>
              </dl>
            </section>

            <section className="mt-5" aria-labelledby="provider-progress-title">
              <h4 className="text-ui-control" id="provider-progress-title">공동확인 진행</h4>
              <MoveJourneyProgress current={progress} steps={["범위 검토", "업체 제안", "고객 확인", "공동확정"]} />
            </section>

            {scope.scope.status === "company_review" || scope.scope.status === "revision_requested"
              ? <Button className="mt-5 w-full" onClick={onQuote}>{scope.scope.status === "revision_requested" ? "수정 요청 반영하기" : "범위·견적 작성하기"}</Button>
              : <p className={"mt-5 rounded-[var(--radius-card)] px-4 py-3 text-ui-support " + (scope.scope.status === "confirmed" ? "bg-success-bg text-success-ink" : "bg-primary-50 text-primary-800")}>{scope.scope.status === "customer_review" ? "고객이 현재 제안을 확인하고 있습니다." : "고객과 업체가 같은 범위와 금액을 확인했습니다."}</p>}
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
