import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowClockwiseIcon as Refresh,
  BriefcaseIcon as Briefcase,
  BuildingsIcon as Buildings,
  CaretDownIcon as CaretDown,
  CaretRightIcon as CaretRight,
  CheckCircleIcon as CheckCircle,
  ClipboardTextIcon as Clipboard,
  CopyIcon as Copy,
  GearIcon as Settings,
  KeyIcon as Key,
  MagnifyingGlassIcon as Search,
  PaperPlaneTiltIcon as Send,
  SignOutIcon as SignOut,
  UserPlusIcon as UserPlus,
  WarningCircleIcon as WarningCircle,
  WrenchIcon as Wrench,
} from "@phosphor-icons/react";
import { useMemo, useState, type ReactNode } from "react";

import { mockAccessSecrets, mockApiEnabled } from "@/api/mock-api";
import { StatusTag } from "@/components/layout/app-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/model/auth-context";
import type { AuthSession } from "@/features/auth/model/auth-context";
import {
  apiErrorMessage,
  createChangeProposal,
  createScopeProposal,
  getScopeReview,
  listFieldIssues,
  workflowKeys,
  type Connection,
  type FieldIssue,
  type ScopeReview,
} from "@/features/workflow/api/workflow-api";
import { LiveProviderWorkflow } from "@/features/workflow/ui/live-provider-workflow";

type ProviderView = "jobs" | "issues" | "invite" | "settings";
type JobMode = "detail" | "quote";
const moneyFormatter = new Intl.NumberFormat("ko-KR");
const money = (amount: number | null | undefined) => amount == null ? "–" : `${moneyFormatter.format(amount)}원`;
const day = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", weekday: "short" });
const providerConnectionsKey = "seqret-provider-connections";

function storedProviderConnections(): AuthSession[] {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(providerConnectionsKey) ?? "[]") as AuthSession[];
    return stored.filter((item) => item.accessToken && item.actor?.role === "company_manager");
  } catch {
    return [];
  }
}

function saveProviderConnections(connections: AuthSession[]) {
  window.sessionStorage.setItem(providerConnectionsKey, JSON.stringify(connections));
  return connections;
}

function upsertProviderConnection(connections: AuthSession[], next: AuthSession) {
  return saveProviderConnections([next, ...connections.filter((item) => item.actor.job_id !== next.actor.job_id)]);
}

export function ProviderWebPage() {
  const { clearSession, connect, session } = useAuth();
  const activeSession = session?.actor.role === "company_manager" ? session : null;
  const [connections, setConnections] = useState<AuthSession[]>(() => activeSession ? upsertProviderConnection(storedProviderConnections(), activeSession) : storedProviderConnections());
  const addConnection = async (secret: string) => {
    const next = await connect(secret, "company_manager");
    setConnections((current) => upsertProviderConnection(current, next));
    return next;
  };
  const selectConnection = (next: AuthSession) => connect(next.accessToken, "company_manager");
  const removeConnection = () => {
    if (!activeSession) return;
    const remaining = saveProviderConnections(connections.filter((item) => item.actor.job_id !== activeSession.actor.job_id));
    setConnections(remaining);
    if (remaining[0]) void selectConnection(remaining[0]);
    else clearSession();
  };
  return <ProviderWebConsole connections={connections} onConnect={addConnection} onDisconnect={removeConnection} onSelect={selectConnection} session={activeSession} />;
}

function ProviderWebConsole({ connections, onConnect, onDisconnect, onSelect, session }: { connections: AuthSession[]; onConnect: (secret: string) => Promise<AuthSession>; onDisconnect: () => void; onSelect: (session: AuthSession) => Promise<AuthSession>; session: AuthSession | null }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ProviderView>("jobs");
  const [jobMode, setJobMode] = useState<JobMode>("detail");
  const [search, setSearch] = useState("");
  const [showOperations, setShowOperations] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const connection: Connection | null = session ? { accessToken: session.accessToken, jobId: session.actor.job_id } : null;
  const scopeQuery = useQuery({ enabled: Boolean(connection), queryKey: workflowKeys.scope(connection?.jobId ?? "unconnected"), queryFn: () => getScopeReview(connection!) });
  const issueQuery = useQuery({ enabled: Boolean(connection), queryKey: workflowKeys.fieldIssues(connection?.jobId ?? "unconnected"), queryFn: () => listFieldIssues(connection!) });
  const linkedScopeQueries = useQueries({ queries: connections.map((item) => ({ queryKey: workflowKeys.scope(item.actor.job_id), queryFn: () => getScopeReview({ accessToken: item.accessToken, jobId: item.actor.job_id }) })) });
  const linkedJobs = connections.map((item, index) => ({ session: item, scope: linkedScopeQueries[index]?.data }));
  const scope = scopeQuery.data;
  const issues = issueQuery.data ?? [];
  const openIssues = issues.filter((issue) => issue.status === "open");
  const refresh = () => connection ? queryClient.invalidateQueries({ queryKey: workflowKeys.root(connection.jobId) }) : undefined;
  const changeView = (next: ProviderView) => { setView(next); if (next !== "jobs") setJobMode("detail"); };

  return (
    <div className="min-h-dvh bg-canvas text-ink-900 lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="hidden min-h-dvh border-r border-line bg-surface px-4 py-8 lg:flex lg:flex-col">
        <h1 className="px-3 text-ui-section font-black tracking-[var(--tracking-display)] text-primary-700">짐확정 파트너</h1>
        <nav aria-label="업체 메뉴" className="mt-9 space-y-2">
          <ProviderNav active={view === "jobs"} icon={<Clipboard aria-hidden="true" />} label="작업" onClick={() => changeView("jobs")} />
          <ProviderNav active={view === "issues"} badge={openIssues.length || undefined} icon={<WarningCircle aria-hidden="true" />} label="현장 이슈" onClick={() => changeView("issues")} />
          <ProviderNav active={view === "invite"} icon={<UserPlus aria-hidden="true" />} label="기사 초대" onClick={() => changeView("invite")} />
          <ProviderNav active={view === "settings"} icon={<Settings aria-hidden="true" />} label="설정" onClick={() => changeView("settings")} />
        </nav>
        <div className="mt-auto rounded-xl border border-line p-3">
          <p className="text-xs text-ink-600">현재 이사</p><p className="mt-1 truncate text-sm font-extrabold">{session ? session.actor.display_name : "연결된 이사 없음"}</p>
          {session ? <Button className="mt-3 w-full justify-start" onClick={onDisconnect} size="chip" variant="ghost"><SignOut aria-hidden="true" /> 이사 연결 해제</Button> : <Button className="mt-3 w-full justify-start" onClick={() => setConnectionOpen(true)} size="chip" variant="ghost"><Key aria-hidden="true" /> 초대 코드 입력</Button>}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-[var(--z-sticky)] flex min-h-[var(--header-height)] items-center justify-between gap-4 border-b border-line bg-surface/96 px-6 backdrop-blur xl:px-10">
          <div className="min-w-0"><p className="text-xs font-bold text-ink-600">{view === "jobs" ? jobMode === "quote" ? "작업 관리 / 견적 작성" : "작업 운영" : view === "issues" ? "현장 변경 관리" : "업체 운영"}</p><h2 className="mt-1 truncate text-ui-section">{view === "jobs" ? "작업 관리" : view === "issues" ? "현장 이슈" : view === "invite" ? "기사 초대" : "설정"}</h2></div>
          <div className="flex items-center gap-2">
            <label className="hidden h-[var(--control-touch)] min-w-[280px] items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-4 md:flex"><Search aria-hidden="true" className="text-ink-600" /><input aria-label="고객명, 주소, 작업 ID 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none" onChange={(event) => setSearch(event.target.value)} placeholder="고객명, 주소, 작업 ID 검색" value={search} /></label>
            <Button onClick={() => setConnectionOpen(true)} variant="outline"><Key aria-hidden="true" /> 이사 연결</Button>
            {view === "jobs" && scope ? <Button onClick={() => setJobMode(jobMode === "quote" ? "detail" : "quote")} variant="outline">{jobMode === "quote" ? "작업 목록" : "견적 보기"}</Button> : null}
            <Button aria-label="새로고침" onClick={refresh} size="icon" variant="outline"><Refresh aria-hidden="true" /></Button>
          </div>
        </header>

        <main className="min-w-0 p-5 xl:p-8">
          {view === "jobs" && jobMode === "detail" ? <JobDashboard issues={issues} jobs={linkedJobs} onConnect={() => setConnectionOpen(true)} onQuote={() => setJobMode("quote")} onSelect={(next) => { void onSelect(next); setJobMode("detail"); }} onShowOperations={() => setShowOperations((value) => !value)} scope={scope} search={search} selectedJobId={session?.actor.job_id ?? null} showOperations={showOperations} /> : null}
          {view === "jobs" && jobMode === "quote" && connection ? <QuoteEditor connection={connection} onBack={() => setJobMode("detail")} scope={scope} /> : null}
          {view === "issues" ? connection ? <IssueWorkbench connection={connection} issues={issues} scope={scope} /> : <ProviderConnectionEmpty onConnect={() => setConnectionOpen(true)} /> : null}
          {view === "invite" ? session ? <OperationsPanel /> : <ProviderConnectionEmpty onConnect={() => setConnectionOpen(true)} /> : null}
          {view === "settings" ? session ? <SettingsPanel session={session} /> : <ProviderConnectionEmpty onConnect={() => setConnectionOpen(true)} /> : null}
        </main>
      </div>
      <ProviderConnectionSheet connect={onConnect} onOpenChange={setConnectionOpen} open={connectionOpen} />
    </div>
  );
}

function JobDashboard({ issues, jobs: linkedJobs, onConnect, onQuote, onSelect, onShowOperations, scope, search, selectedJobId, showOperations }: { issues: FieldIssue[]; jobs: Array<{ session: AuthSession; scope: ScopeReview | undefined }>; onConnect: () => void; onQuote: () => void; onSelect: (session: AuthSession) => void; onShowOperations: () => void; scope: ScopeReview | undefined; search: string; selectedJobId: string | null; showOperations: boolean }) {
  const jobs = useMemo(() => {
    const rows = linkedJobs.map((item) => ({ date: item.scope?.job.scheduled_at ?? null, customer: item.scope?.job.customer_display_name ?? "고객", route: `${item.scope?.job.origin_summary ?? "출발지"} → ${item.scope?.job.destination_summary ?? "도착지"}`, status: item.scope?.scope.status ?? "company_review", current: item.session.actor.job_id === selectedJobId, session: item.session, jobCode: item.scope?.job.job_code ?? "–" }));
    const query = search.trim();
    return query ? rows.filter((job) => `${job.customer} ${job.route} ${job.jobCode}`.includes(query)) : rows;
  }, [linkedJobs, search, selectedJobId]);
  const loadedScopes = linkedJobs.flatMap((item) => item.scope ? [item.scope] : []);
  const stats = [
    ["검토 필요", loadedScopes.filter((item) => item.scope.status === "company_review" || item.scope.status === "revision_requested").length, "primary"],
    ["고객 확인 중", loadedScopes.filter((item) => item.scope.status === "customer_review").length, "warning"],
    ["공동 확정", loadedScopes.filter((item) => item.scope.status === "confirmed").length, "success"],
    ["현장 이슈", issues.filter((issue) => issue.status === "open").length, "danger"],
  ] as const;
  return <>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, tone]) => <div className="ui-card flex min-h-24 items-center gap-4 p-5" key={label}><span className={`grid size-11 place-items-center rounded-xl ${tone === "success" ? "bg-success-bg text-success" : tone === "warning" ? "bg-warning-bg text-warning-ink" : tone === "danger" ? "bg-danger-bg text-danger" : "bg-primary-50 text-primary-700"}`}>{tone === "success" ? <CheckCircle aria-hidden="true" /> : tone === "danger" ? <WarningCircle aria-hidden="true" /> : <Clipboard aria-hidden="true" />}</span><div><p className="text-sm text-ink-600">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div></div>)}</section>
    <section className="mt-5 grid min-h-[690px] gap-5 xl:grid-cols-[minmax(360px,0.9fr)_minmax(440px,1.1fr)]">
      <div className="ui-card overflow-hidden"><div className="flex min-h-16 items-center gap-5 border-b border-line px-5 text-sm font-extrabold"><span className="border-b-2 border-primary-600 py-5">전체 {jobs.length}</span><span className="text-ink-600">검토 필요</span><span className="text-ink-600">공동 확정</span></div><div className="p-4"><p className="mb-3 text-xs font-bold text-ink-600">최신순 <CaretDown aria-hidden="true" className="inline" /></p>{jobs.length ? jobs.map((job) => <button className={`flex w-full items-center gap-4 border-b border-line px-3 py-4 text-left last:border-b-0 ${job.current ? "rounded-xl border border-primary-600 bg-primary-50/50" : "hover:bg-surface-muted"}`} key={job.session.actor.job_id} onClick={() => onSelect(job.session)} type="button"><time className="w-12 text-center text-sm font-extrabold">{job.date ? day.format(new Date(job.date)) : "–"}</time><div className="min-w-0 flex-1"><p className="font-extrabold">{job.customer} <StatusTag tone={job.status === "confirmed" ? "success" : "warning"}>{job.status === "confirmed" ? "공동 확정" : job.status === "customer_review" ? "고객 확인 중" : "검토 필요"}</StatusTag></p><p className="mt-1 truncate text-sm text-ink-600">{job.route}</p><p className="mt-1 text-xs text-ink-400">작업 ID {job.jobCode}</p></div><CaretRight aria-hidden="true" /></button>) : <ProviderConnectionEmpty onConnect={onConnect} />}</div></div>
      <div className="ui-card ui-card-pad">{scope ? <><div className="flex items-start justify-between gap-4"><div><StatusTag tone={scope.scope.status === "confirmed" ? "success" : "primary"}>{scope.scope.status === "company_review" ? "검토 필요" : scope.scope.status === "customer_review" ? "고객 확인 중" : "공동 확정"}</StatusTag><h3 className="mt-3 text-ui-section font-black">{scope.job.customer_display_name ?? "고객"}</h3><p className="mt-2 text-sm text-ink-600">{scope.job.origin_summary ?? "출발지"} → {scope.job.destination_summary ?? "도착지"}</p></div><button aria-label="작업 ID 복사" className="text-ink-600" type="button"><Copy aria-hidden="true" /></button></div><div className="my-5 border-t border-line" /><div className="flex items-center justify-between"><h4 className="text-lg font-extrabold">고객이 등록한 내용</h4><span className="text-sm font-bold text-primary-700">상세 보기</span></div><div className="mt-3 grid grid-cols-2 gap-3"><FactCard icon={<Briefcase aria-hidden="true" />} label="짐" value={`${scope.scope.item_count}개`} /><FactCard icon={<Wrench aria-hidden="true" />} label="작업조건" value={`${scope.scope.work_count}개`} /></div><h4 className="mt-6 text-sm font-extrabold">현재 제안</h4><div className="mt-2 rounded-xl border border-line bg-surface-muted p-4">{scope.proposal_id ? <><p className="font-extrabold">{scope.scope.version_label} · {money(scope.quote?.total_amount_krw)}</p><p className="mt-1 text-sm text-ink-600">{scope.proposal_reason}</p></> : <><p className="font-extrabold">현재 제안이 없습니다.</p><p className="mt-1 text-sm text-ink-600">견적을 작성해 고객에게 제안해 주세요.</p></>}</div>{scope.scope.status === "company_review" ? <Button className="mt-4 w-full" onClick={onQuote}>견적 작성하기</Button> : <div className="mt-4 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-bold text-primary-800">{scope.scope.status === "customer_review" ? "고객 확인을 기다리고 있습니다." : "고객과 업체가 같은 범위로 확정했습니다."}</div>}<div className="mt-6 border-t border-line pt-5"><h4 className="font-extrabold">진행 단계</h4><ol className="mt-4 space-y-3 text-sm"><li className="flex items-center gap-2 text-success"><CheckCircle aria-hidden="true" weight="fill" /> 고객 촬영 완료</li><li className="flex items-center gap-2 text-success"><CheckCircle aria-hidden="true" weight="fill" /> AI 검수 완료</li><li className="flex items-center gap-2 text-primary-700"><span className="size-3 rounded-full border-2 border-primary-600" /> {scope.scope.status === "company_review" ? "업체 제안 필요" : "업체 제안 완료"}</li></ol></div><Button className="mt-5 w-full" onClick={onShowOperations} variant="outline">{showOperations ? "전체 운영 절차 닫기" : "배차·완료 운영 절차"}</Button></> : <ProviderConnectionEmpty onConnect={onConnect} />}</div>
    </section>
    {showOperations ? <section className="ui-card mt-5 p-5"><LiveProviderWorkflow embedded wide /></section> : null}
  </>;
}

function ProviderConnectionEmpty({ onConnect }: { onConnect: () => void }) {
  return <section className="py-10 text-center"><Key aria-hidden="true" className="mx-auto text-primary-700" size="var(--icon-category)" /><h3 className="mt-3 text-lg font-black">연결된 이사가 없어요</h3><p className="mt-2 text-sm text-ink-600">고객에게 받은 초대 코드로 이사 상태를 불러오세요.</p><Button className="mt-5" onClick={onConnect}><Key aria-hidden="true" /> 초대 코드 입력</Button></section>;
}

function ProviderConnectionSheet({ connect, onOpenChange, open }: { connect: ReturnType<typeof useAuth>["connect"]; onOpenChange: (open: boolean) => void; open: boolean }) {
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
  return <Sheet onOpenChange={onOpenChange} open={open}><SheetContent><SheetHeader><SheetTitle>이사 연결</SheetTitle><SheetDescription>고객에게 받은 초대 코드를 입력하면 해당 이사의 상태를 불러옵니다.</SheetDescription></SheetHeader><div className="px-5"><Label htmlFor="provider-invite-code">초대 코드</Label><Input autoCapitalize="none" autoComplete="off" className="mt-2" id="provider-invite-code" onChange={(event) => setSecret(event.target.value)} placeholder="초대 코드 붙여넣기" spellCheck={false} type="password" value={secret} />{error ? <p className="mt-3 text-sm font-bold text-danger-ink" role="alert">{error}</p> : null}</div><SheetFooter><Button className="w-full" disabled={!secret.trim() || pending} onClick={submit} size="cta"><Key aria-hidden="true" />{pending ? "불러오는 중" : "이사 불러오기"}</Button></SheetFooter></SheetContent></Sheet>;
}

function QuoteEditor({ connection, onBack, scope }: { connection: Connection; onBack: () => void; scope: ScopeReview | undefined }) {
  const queryClient = useQueryClient();
  const [baseAmount, setBaseAmount] = useState(scope?.quote?.base_amount_krw ?? 850000);
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState(scope?.proposal_reason ?? "촬영 결과와 현장 조건을 반영한 견적입니다.");
  const [openRoom, setOpenRoom] = useState(scope?.scope.room_groups[0]?.room_zone_id ?? "");
  const mutation = useMutation({ mutationFn: () => createScopeProposal(connection, { source_scope_version_id: scope!.scope.id, content: { schema_version: 1, items: scope!.scope.room_groups.flatMap((group) => group.items.map(({ item_key, room_zone_id, description }) => ({ item_key, room_zone_id, description }))) }, quote: { base_amount_krw: baseAmount, adjustments: adjustment === 0 ? [] : [{ label: "현장 조건 조정", amount_krw: adjustment }], total_amount_krw: baseAmount + adjustment }, included_works: scope!.scope.included_works, exclusions: scope!.scope.exclusions, reason }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: workflowKeys.scope(connection.jobId) }); onBack(); } });
  if (!scope) return <p>작업을 불러오는 중입니다.</p>;
  const locked = scope.scope.status !== "company_review";
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]"><section className="ui-card overflow-hidden"><div className="flex items-center gap-4 border-b border-line p-5"><button className="text-sm font-extrabold text-primary-700" onClick={onBack} type="button">← 작업 관리</button><div className="border-l border-line pl-4"><strong>{scope.job.customer_display_name}</strong><span className="ml-2 text-sm text-ink-600">{scope.job.origin_summary} → {scope.job.destination_summary}</span></div></div><div className="flex min-h-14 items-center gap-7 border-b border-line px-5 text-sm font-extrabold"><span className="border-b-2 border-primary-600 py-4 text-primary-700">짐 {scope.scope.item_count}</span><span>작업조건 {scope.scope.work_count}</span><span>근거 영상</span></div><div className="p-5"><h3 className="text-xl font-black">공간별 모든 짐</h3><div className="mt-4 space-y-3">{scope.scope.room_groups.map((group) => <div className="overflow-hidden rounded-xl border border-line" key={group.room_zone_id}><button className="flex min-h-14 w-full items-center gap-3 px-4 text-left font-extrabold" onClick={() => setOpenRoom(openRoom === group.room_zone_id ? "" : group.room_zone_id)} type="button"><Buildings aria-hidden="true" className="text-primary-700" />{group.label}<span className="rounded bg-surface-muted px-2 text-xs">{group.item_count}</span>{openRoom === group.room_zone_id ? <CaretDown className="ml-auto" /> : <CaretRight className="ml-auto" />}</button>{openRoom === group.room_zone_id ? <div className="mx-4 border-t border-line">{group.items.map((item) => <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_60px_100px] items-center gap-3 border-b border-line text-sm last:border-0" key={item.item_key}><span>{item.description}</span><span>1</span><span className="font-bold text-success">높음 94%</span></div>)}</div> : null}</div>)}</div></div></section><section className="ui-card ui-card-pad self-start"><h3 className="text-xl font-black">작업 범위와 금액</h3>{locked ? <div className="mt-4 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-bold text-primary-800">{scope.scope.status === "customer_review" ? "고객이 이 제안을 확인하고 있습니다." : "공동 확정된 견적입니다."}</div> : null}<ScopeRows items={scope.scope.included_works} label="포함 작업" tone="success" /><ScopeRows items={scope.scope.exclusions} label="제외 작업" tone="neutral" /><div className="mt-5 border-t border-line pt-5"><h4 className="font-extrabold">견적 금액</h4><MoneyInput disabled={locked} label="기본 금액" onChange={setBaseAmount} value={baseAmount} /><MoneyInput disabled={locked} label="추가/조정 금액" onChange={setAdjustment} value={adjustment} /><div className="mt-4 flex items-end justify-between border-t border-line pt-4"><span className="font-extrabold">총 제안 금액</span><strong className="text-2xl text-primary-700">{money(baseAmount + adjustment)}</strong></div></div><label className="mt-5 block text-sm font-extrabold" htmlFor="proposal-reason">제안 사유 <span className="font-medium text-ink-400">(선택)</span></label><Textarea className="mt-2" disabled={locked} id="proposal-reason" maxLength={120} onChange={(event) => setReason(event.target.value)} value={reason} />{mutation.error ? <p className="mt-3 text-sm font-bold text-danger">{apiErrorMessage(mutation.error)}</p> : null}{locked ? null : <Button className="mt-5 w-full" disabled={mutation.isPending} onClick={() => mutation.mutate()} size="cta"><Send aria-hidden="true" /> 고객에게 제안 보내기</Button>}</section></div>;
}

function IssueWorkbench({ connection, issues, scope }: { connection: Connection; issues: FieldIssue[]; scope: ScopeReview | undefined }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(issues[0]?.field_issue_id ?? "");
  const selected = issues.find((issue) => issue.field_issue_id === selectedId) ?? issues[0];
  const [adjustment, setAdjustment] = useState(50000);
  const [reason, setReason] = useState("엘리베이터 운행 중단으로 계단 운반이 필요합니다.");
  const mutation = useMutation({ mutationFn: () => createChangeProposal(connection, { field_issue_id: selected!.field_issue_id, base_scope_version_id: selected!.base_scope_version_id, title: "계단 운반 추가", reason, proposed_content: { schema_version: 1, items: scope!.scope.room_groups.flatMap((group) => group.items.map(({ item_key, room_zone_id, description }) => ({ item_key, room_zone_id, description }))) }, quote: { base_amount_krw: scope!.quote?.base_amount_krw ?? 0, adjustments: [{ label: "계단 운반", amount_krw: adjustment }], total_amount_krw: (scope!.quote?.total_amount_krw ?? 0) + adjustment } }), onSuccess: () => queryClient.invalidateQueries({ queryKey: workflowKeys.root(connection.jobId) }) });
  return <div className="grid min-h-[760px] gap-5 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]"><section className="ui-card overflow-hidden"><div className="flex min-h-16 items-center gap-6 border-b border-line px-5 text-sm font-extrabold"><span className="border-b-2 border-primary-600 py-5">전체 {issues.length}</span><span>처리 필요 {issues.filter((issue) => issue.status === "open").length}</span></div><div className="p-4">{issues.map((issue) => <button className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left ${selected?.field_issue_id === issue.field_issue_id ? "border-primary-600 bg-primary-50/60" : "border-transparent"}`} key={issue.field_issue_id} onClick={() => setSelectedId(issue.field_issue_id)} type="button"><span className="mt-2 size-2 rounded-full bg-danger" /><div className="flex-1"><p className="font-extrabold">{issue.title}</p><p className="mt-1 text-sm text-ink-600">{scope?.job.customer_display_name ?? "고객"}</p></div><StatusTag tone="warning">처리 필요</StatusTag></button>)}</div></section><section className="ui-card ui-card-pad">{selected && scope ? <><h3 className="text-xl font-black">기준 승인본 {scope.scope.version_label} <span className="mx-2 text-ink-400">→</span> <span className="text-primary-700">변경 제안</span></h3><div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><div><p className="text-sm font-extrabold">현장 증거</p><img alt={selected.title} className="mt-3 aspect-[16/10] w-full rounded-xl object-cover" src="/elevator-outage-evidence.png" /><p className="mt-3 text-sm font-extrabold">기사 설명</p><p className="mt-2 rounded-xl border border-line p-4 text-sm text-ink-600">{selected.description}</p><h4 className="mt-5 font-extrabold">관련 승인 범위</h4><div className="mt-2 rounded-xl border border-line p-4 text-sm"><p>포장 및 운반 <span className="float-right">포함</span></p><p className="mt-2">기본 가구 분해·조립 <span className="float-right">포함</span></p><p className="mt-2">에어컨 탈부착 <span className="float-right">제외</span></p></div></div><div><p className="flex items-center gap-2 text-sm font-extrabold text-primary-700"><Wrench aria-hidden="true" /> 변경 제안 내용</p><div className="mt-3 rounded-xl border border-line p-4"><p className="text-sm text-ink-600">추가 작업</p><p className="mt-2 font-extrabold">계단 운반 · 5층 <span className="float-right">1건</span></p></div><label className="mt-5 block text-sm font-extrabold" htmlFor="change-reason">사유</label><Textarea className="mt-2" id="change-reason" onChange={(event) => setReason(event.target.value)} value={reason} /><div className="mt-5 space-y-3 text-sm"><p className="flex justify-between"><span>기존 금액 ({scope.scope.version_label})</span><strong>{money(scope.quote?.total_amount_krw)}</strong></p><MoneyInput label="추가/조정 금액" onChange={setAdjustment} value={adjustment} /><p className="flex items-center justify-between border-t border-line pt-4"><span className="font-extrabold">변경 후 금액</span><strong className="text-2xl text-primary-700">{money((scope.quote?.total_amount_krw ?? 0) + adjustment)}</strong></p></div>{mutation.error ? <p className="mt-3 text-sm font-bold text-danger">{apiErrorMessage(mutation.error)}</p> : null}<Button className="mt-5 w-full" disabled={mutation.isPending || selected.status !== "open"} onClick={() => mutation.mutate()} size="cta"><Send aria-hidden="true" /> 고객에게 변경안 보내기</Button><Button className="mt-3 w-full" variant="outline">설명 요청</Button></div></div></> : <p className="text-sm text-ink-600">처리할 현장 이슈가 없습니다.</p>}</section></div>;
}

function OperationsPanel() { return <section className="ui-card mx-auto max-w-5xl p-6"><h3 className="text-2xl font-black">기사 초대와 배차</h3><p className="mt-2 text-sm text-ink-600">기존 API 기반 운영 절차를 그대로 사용할 수 있습니다.</p><div className="mt-5"><LiveProviderWorkflow embedded wide /></div></section>; }
function SettingsPanel({ session }: { session: AuthSession }) { return <section className="ui-card max-w-2xl p-6"><span className="grid size-12 place-items-center rounded-xl bg-primary-50 text-primary-700"><Buildings aria-hidden="true" /></span><h3 className="mt-4 text-2xl font-black">{session.actor.display_name}</h3><p className="mt-2 text-sm text-ink-600">현재 작업에 연결된 업체 관리자 계정입니다.</p></section>; }
function ProviderNav({ active, badge, icon, label, onClick }: { active: boolean; badge?: number; icon: ReactNode; label: string; onClick: () => void }) { return <button className={`flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-control)] px-4 text-left text-sm font-semibold ${active ? "bg-primary-600 text-white" : "text-ink-600 hover:bg-surface-muted"}`} onClick={onClick} type="button"><span className="size-5">{icon}</span><span className="flex-1">{label}</span>{badge ? <span className="grid size-5 place-items-center rounded-full bg-danger text-ui-micro text-white">{badge}</span> : null}</button>; }
function FactCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="flex min-h-20 items-center gap-3 rounded-xl border border-line p-4"><span className="text-ink-600">{icon}</span><div><p className="text-xs text-ink-600">{label}</p><strong className="mt-1 block">{value}</strong></div></div>; }
function ScopeRows({ items, label, tone }: { items: string[]; label: string; tone: "success" | "neutral" }) { return <div className="mt-5"><div className="flex items-center justify-between"><p className="flex items-center gap-2 font-extrabold">{tone === "success" ? <CheckCircle className="text-success" weight="fill" /> : <span className="grid size-5 place-items-center rounded-full bg-ink-400 text-xs text-white">−</span>}{label}</p><span className="text-sm text-ink-600">{items.length}개</span></div><div className="mt-2 space-y-2">{items.map((item) => <p className="rounded-xl border border-line px-4 py-3 text-sm" key={item}>{item}<span className="float-right font-bold text-success-ink">{tone === "success" ? "포함" : "제외"}</span></p>)}</div></div>; }
function MoneyInput({ disabled = false, label, onChange, value }: { disabled?: boolean; label: string; onChange: (value: number) => void; value: number }) { return <label className="mt-3 grid grid-cols-[1fr_120px_auto] items-center gap-2 text-sm 2xl:grid-cols-[1fr_150px_auto]"><span className="text-ink-600">{label}</span><Input className="h-10 text-right" disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} type="number" value={value} /><span>원</span></label>; }
