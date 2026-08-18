import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArchiveIcon as Archive,
  BellIcon as Bell,
  BriefcaseIcon as BriefcaseBusiness,
  BuildingsIcon as Buildings,
  CameraIcon as Camera,
  CaretDownIcon as CaretDown,

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

import { mockAccessSecrets, mockApiEnabled } from "@/api/mock-api";
import { AgreementOverview } from "@/components/layout/agreement-overview";
import { ActiveMoveCard, MoveJourneyProgress } from "@/components/layout/app-primitives";
import { ConnectedProfile } from "@/components/layout/connected-profile";
import { MobileAppShell, MobileDetailHeader, MobileDetailTabs, MobilePageHeader, type MobileNavItem } from "@/components/layout/mobile-app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth, type AuthSession } from "@/features/auth/model/auth-context";
import {
  apiErrorMessage,
  getFieldBrief,
  getScopeReview,
  listFieldIssues,
  submitCompletion,
  workflowKeys,
  type Connection,
  type FieldIssue,
  type ScopeReview,
} from "@/features/workflow/api/workflow-api";
import { CrewIssueReport } from "@/features/crew/ui/crew-issue-report";

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
  return session?.actor.role === "field_worker" ? <ConnectedCrewApp session={session} /> : <CrewGuestApp />;
}

function ConnectedCrewApp({ session }: { session: AuthSession }) {
  const { clearSession, connect } = useAuth();
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
  const briefQuery = useQuery({ queryKey: workflowKeys.brief(connection.jobId), queryFn: () => getFieldBrief(connection) });
  const scopeQuery = useQuery({ queryKey: workflowKeys.scope(connection.jobId), queryFn: () => getScopeReview(connection) });
  const issueQuery = useQuery({ queryKey: workflowKeys.fieldIssues(connection.jobId), queryFn: () => listFieldIssues(connection) });
  const changeTab = (next: CrewTab) => setParams(next === "home" ? {} : next === "work" ? { tab: "work", view: "list" } : { tab: next }, { replace: true });
  const changeWorkView = (view: CrewWorkView) => setParams({ tab: "work", view }, { replace: true });
  const refresh = () => queryClient.invalidateQueries({ queryKey: workflowKeys.root(connection.jobId) });
  const disconnect = () => { clearSession(); navigate("/"); };

  const header = tab === "notifications" ? <CrewNotificationsHeader onBack={() => changeTab("home")} /> : tab === "home" ? <CrewHomeHeader onBell={() => changeTab("notifications")} /> : tab === "work" && workView !== "list" ? <CrewDetailHeader onBack={() => changeWorkView("list")} onMore={() => changeTab("more")} title={briefQuery.data?.job.title ?? "내 작업"} /> : <CrewSafeArea />;
  return (
    <>
    <MobileAppShell current={tab} eyebrow={`현장기사 · ${session.actor.display_name}`} header={header} items={items} onChange={changeTab} onProfile={() => changeTab("more")} onRefresh={tab === "more" ? undefined : refresh} root={tab === "home"} showNav={tab !== "work" || workView === "list"} title={titles[tab]}>
      {tab === "home" ? <CrewHome brief={briefQuery.data} issueCount={issueQuery.data?.length ?? 0} onInvite={() => setInviteOpen(true)} onWork={() => changeWorkView("agreement")} /> : null}
      {tab === "work" ? <CrewWork brief={briefQuery.data} connection={connection} issues={issueQuery.data ?? []} onViewChange={changeWorkView} scope={scopeQuery.data} view={workView} /> : null}
      {tab === "notifications" ? <CrewNotifications onAction={() => setParams({ tab: "work", view: "report" }, { replace: true })} /> : null}
      {tab === "more" ? <ConnectedProfile displayName={session.actor.display_name} expiresAt={session.actor.expires_at} onDisconnect={disconnect} permissions={session.actor.permissions} roleLabel="현장기사" /> : null}
    </MobileAppShell>
    <CrewInviteSheet connect={connect} onOpenChange={setInviteOpen} open={inviteOpen} />
    </>
  );
}

function CrewGuestApp() {
  const { connect } = useAuth();
  const [params, setParams] = useSearchParams();
  const [inviteOpen, setInviteOpen] = useState(false);
  const requested = params.get("tab") as CrewTab | null;
  const tab = requested && validTabs.has(requested) ? requested : "home";
  const changeTab = (next: CrewTab) => setParams(next === "home" ? {} : next === "work" ? { tab: "work", view: "list" } : { tab: next }, { replace: true });
  return <>
    <MobileAppShell current={tab} eyebrow="현장기사" header={tab === "notifications" ? <CrewNotificationsHeader onBack={() => changeTab("home")} /> : tab === "home" ? <CrewHomeHeader onBell={() => changeTab("notifications")} /> : <CrewSafeArea />} items={items} onChange={changeTab} onProfile={() => changeTab("more")} root={tab === "home"} title={titles[tab]}>
      {tab === "home" ? <CrewGuestHome onInvite={() => setInviteOpen(true)} /> : null}
      {tab === "work" ? <CrewWorkList brief={undefined} onOpen={() => undefined} /> : null}
      {tab === "notifications" ? <CrewNotifications onAction={() => setInviteOpen(true)} /> : null}
      {tab === "more" ? <section className="px-[var(--content-gutter)] pb-28 pt-6"><h1 className="text-ui-section font-black tracking-[var(--tracking-display)]">더보기</h1><p className="mt-6 border-y border-line py-5 text-sm text-ink-600">초대 코드를 입력하면 기사 정보와 배정된 이사를 확인할 수 있어요.</p></section> : null}
    </MobileAppShell>
    <CrewInviteSheet connect={connect} onOpenChange={setInviteOpen} open={inviteOpen} />
  </>;
}

function CrewGuestHome({ onInvite }: { onInvite: () => void }) {
  return <div className="px-[var(--content-gutter)] pb-28 pt-4"><h1 className="text-ui-section leading-9 font-black tracking-[var(--tracking-display)]">배정된 이사를<br />연결해 주세요</h1><CrewInviteHero onInvite={onInvite} /><section className="mt-4 ui-card px-5 py-8 text-center"><Archive aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><h2 className="mt-3 text-ui-component">연결된 작업이 없어요</h2></section></div>;
}

function CrewInviteHero({ onInvite }: { onInvite: () => void }) {
  return <button className="mt-4 ui-card ui-card-outlined ui-card-tinted press-static relative min-h-[174px] w-full overflow-hidden rounded-[var(--radius-feature)] px-5 py-4 text-left" onClick={onInvite} type="button"><span className="relative z-10 block max-w-[62%]"><strong className="block text-ui-component font-extrabold tracking-[var(--tracking-display)]">초대 코드로<br />오늘 작업 연결하기</strong><span className="mt-1.5 block text-ui-data leading-5 text-ink-600">배정된 이사와 현장 정보를 한 번에 불러와요.</span><span className="mt-4 flex items-center gap-1 whitespace-nowrap text-ui-control text-primary-700">초대 코드 입력하기 <CaretRight aria-hidden="true" size="var(--icon-xs)" /></span></span><img alt="휴대폰으로 이삿짐을 확인하는 모습" className="absolute -right-2 bottom-0 w-[140px] max-w-none" height="213" src="/move-capture-hero.png" width="170" /></button>;
}

function CrewHomeHeader({ onBell }: { onBell: () => void }) {
  return <header className="app-safe-header relative z-[var(--z-sticky)] h-0 bg-canvas"><button aria-label="알림 확인" className="absolute top-[calc(env(safe-area-inset-top)+34px)] right-[var(--content-gutter)] grid size-9 place-items-center rounded-full text-ink-900 hover:bg-surface-muted" onClick={onBell} type="button"><Bell aria-hidden="true" size="var(--icon-md)" /><span aria-hidden="true" className="absolute top-1 right-1 size-2 rounded-full bg-danger" /></button></header>;
}

function CrewNotificationsHeader({ onBack }: { onBack: () => void }) {
  return <MobilePageHeader className="sticky top-0 z-[var(--z-sticky)] bg-surface/98 backdrop-blur" onBack={onBack} title="알림" />;
}

function CrewNotifications({ onAction }: { onAction: () => void }) {
  return <div className="px-[var(--content-gutter)] pb-28 pt-5"><h2 className="text-ui-section font-black tracking-[var(--tracking-display)]">새로 도착한 소식</h2><p className="mt-2 text-ui-support text-ink-600">작업 변경과 고객 요청을 모아서 보여드려요.</p><article className="mt-6 border-y border-line py-5"><div className="flex gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-card)] bg-primary-50 text-primary-700"><ChatCircleDots aria-hidden="true" size="var(--icon-md)" /></span><div className="min-w-0"><span className="text-ui-status text-primary-700">고객 수정 요청</span><h3 className="mt-1 text-ui-component font-black">변경안을 다시 확인해 주세요</h3><p className="mt-1 text-ui-support leading-5 text-ink-600">추가 시간과 운반 인원을 다시 확인해 달라는 요청이 도착했어요.</p><p className="mt-2 text-ui-micro text-ink-400">방금 전 · 성수동 1가 이사</p></div></div><button className="mt-4 flex min-h-11 w-full items-center justify-between border-t border-line pt-3 text-ui-control text-primary-700" onClick={onAction} type="button">요청 내용 확인 <CaretRight aria-hidden="true" size="var(--icon-xs)" /></button></article></div>;
}

function CrewSafeArea() {
  return <span aria-hidden="true" className="app-safe-header block bg-canvas" />;
}

function CrewInviteSheet({ connect, onOpenChange, open }: { connect: ReturnType<typeof useAuth>["connect"]; onOpenChange: (open: boolean) => void; open: boolean }) {
  const [secret, setSecret] = useState(mockApiEnabled ? mockAccessSecrets.field_worker : "");
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
  return <Sheet onOpenChange={onOpenChange} open={open}><SheetContent><SheetHeader><SheetTitle>초대 코드 입력</SheetTitle><SheetDescription>업체가 전달한 초대 코드를 입력하면 배정된 이사와 연결돼요.</SheetDescription></SheetHeader><div className="px-5 pb-2"><Input aria-label="초대 코드" className="mt-2" id="crew-invite-code" onChange={(event) => setSecret(event.target.value)} placeholder="초대 코드 붙여넣기" value={secret} />{error ? <p className="mt-3 text-sm font-bold text-danger-ink" role="alert">{error}</p> : null}</div><SheetFooter><Button className="w-full" disabled={!secret.trim() || pending} onClick={submit} size="cta"><Key aria-hidden="true" />{pending ? "연결 중" : "내 작업에 연결"}</Button></SheetFooter></SheetContent></Sheet>;
}

function CrewDetailHeader({ onBack, onMore, title }: { onBack: () => void; onMore: () => void; title: string }) {
  return <MobileDetailHeader backLabel="작업 목록으로 돌아가기" onBack={onBack} onMore={onMore} title={title} />;
}

function CrewWork({ brief, connection, issues, onViewChange, scope, view }: {
  brief: Awaited<ReturnType<typeof getFieldBrief>> | undefined;
  connection: Connection;
  issues: Awaited<ReturnType<typeof listFieldIssues>>;
  onViewChange: (view: CrewWorkView) => void;
  scope: ScopeReview | undefined;
  view: CrewWorkView;
}) {
  if (view === "list") return <CrewWorkList brief={brief} onOpen={() => onViewChange("agreement")} />;
  return (
    <>
      <CrewDetailTabs current={view} onChange={onViewChange} />
      {view === "agreement" ? <CrewApprovedScope issue={issues[0]} scope={scope} /> : null}
      {view === "report" ? <CrewIssueReport brief={brief} connection={connection} issues={issues} /> : null}
      {view === "completion" ? <CrewCompletion brief={brief} connection={connection} issues={issues} /> : null}
    </>
  );
}

function CrewDetailTabs({ current, onChange }: { current: Exclude<CrewWorkView, "list">; onChange: (view: CrewWorkView) => void }) {
  const tabs: Array<{ id: Exclude<CrewWorkView, "list">; label: string }> = [{ id: "agreement", label: "확인서" }, { id: "report", label: "현장 보고" }, { id: "completion", label: "작업 완료" }];
  return <MobileDetailTabs current={current} items={tabs} label="작업 상세 메뉴" onChange={onChange} />;
}

function CrewWorkList({ brief, onOpen }: { brief: Awaited<ReturnType<typeof getFieldBrief>> | undefined; onOpen: () => void }) {
  const hasWork = Boolean(brief);
  const completed = Boolean(brief?.completion_submission_id);
  const [listTab, setListTab] = useState<"active" | "history">(completed ? "history" : "active");
  const showWork = hasWork && listTab === (completed ? "history" : "active");
  const startAt = brief?.start_at ? new Date(brief.start_at) : null;
  const historyCount = hasWork ? (completed ? 1 : 0) + (mockApiEnabled ? 2 : 0) : 0;
  return <div className="pb-28">
    <div className="bg-surface px-[var(--content-gutter)] pt-5"><h1 className="text-ui-section">내 작업</h1><div className="mt-6 grid grid-cols-2 border-b border-line" role="tablist" aria-label="기사 작업 목록"><button aria-selected={listTab === "active"} className={`relative min-h-11 text-ui-control ${listTab === "active" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("active")} role="tab" type="button">진행 중 {hasWork && !completed ? 1 : 0}</button><button aria-selected={listTab === "history"} className={`relative min-h-11 text-ui-control ${listTab === "history" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("history")} role="tab" type="button">작업 기록 {historyCount}</button></div></div>
    <div className="px-[var(--content-gutter)]">{showWork ? <button className="press-static mt-5 w-full ui-card p-5 text-left shadow-[var(--shadow-card)]" onClick={onOpen} type="button"><span className={`inline-flex h-[var(--status-height)] items-center rounded-full px-3 text-ui-status ${completed ? "bg-success-bg text-success-ink" : "bg-primary-50 text-primary-700"}`}>{completed ? "작업 완료" : brief?.checked_in_at ? "현장 진행" : "작업 예정"}</span><strong className="mt-4 flex items-center justify-between gap-3 text-ui-section"><span className="min-w-0 truncate">{brief ? `${brief.masked_origin ?? "출발지"} → ${brief.masked_destination ?? "도착지"}` : "작업 정보를 불러오는 중"}</span><CaretRight aria-hidden="true" className="shrink-0 text-ink-400" size="var(--icon-sm)" /></strong><span className="mt-2 block text-ui-support text-ink-600">{startAt ? `${dayFormatter.format(startAt)} · ${timeFormatter.format(startAt)}` : "일정 확인 중"}</span><span className="mt-5 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center text-xs text-ink-600"><span><Package aria-hidden="true" className="mx-auto mb-1" size="var(--icon-sm)" />점검 {brief?.completion_required_count ?? "–"}개</span><span><Wrench aria-hidden="true" className="mx-auto mb-1" size="var(--icon-sm)" />작업 {brief?.completion_check_items.length ?? "–"}개</span><span><Buildings aria-hidden="true" className="mx-auto mb-1" size="var(--icon-sm)" />조건 {brief?.origin_conditions.length ?? "–"}개</span></span></button> : listTab === "history" && mockApiEnabled && hasWork ? <div className="mt-5 space-y-3"><CrewHistoryCard date="2026년 5월 18일" destination="합정동" origin="성수동" reports={1} /><CrewHistoryCard date="2025년 8월 25일" destination="성수동" origin="건대입구" reports={0} /></div> : <section className="mt-5 ui-card px-5 py-8 text-center"><Archive aria-hidden="true" className="mx-auto text-ink-400" size="var(--icon-category)" /><h2 className="mt-3 text-ui-component">{listTab === "active" ? "진행 중인 작업이 없어요" : "완료한 작업이 없어요"}</h2></section>}</div>
  </div>;
}

function CrewHistoryCard({ date, destination, origin, reports }: { date: string; destination: string; origin: string; reports: number }) {
  return <article className="ui-card p-5"><span className="inline-flex h-[var(--status-height)] items-center rounded-full bg-success-bg px-3 text-ui-status text-success-ink"><Check aria-hidden="true" className="mr-1" size="var(--icon-xs)" />완료</span><h2 className="mt-4 text-ui-section font-black">{origin} → {destination}</h2><p className="mt-2 text-ui-support text-ink-600">{date}</p><div className="mt-4 flex gap-4 border-t border-line pt-4 text-ui-data text-ink-600"><span>완료 체크 4/4</span><span>현장 보고 {reports}건</span></div></article>;
}

function CrewApprovedScope({ issue, scope }: { issue?: FieldIssue; scope: ScopeReview | undefined }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  if (!scope) return <div className="px-[var(--content-gutter)] py-8 text-sm text-ink-600">확인서를 불러오는 중입니다.</div>;
  return (
    <div className="space-y-2.5 px-[var(--content-gutter)] pb-28 pt-3">
      <AgreementOverview onOpenHistory={() => setHistoryOpen(true)} scope={scope} />
      <CrewAgreementHistorySheet issue={issue} onOpenChange={setHistoryOpen} open={historyOpen} scope={scope} />
    </div>
  );
}

function CrewAgreementHistorySheet({ issue, onOpenChange, open, scope }: { issue?: FieldIssue; onOpenChange: (open: boolean) => void; open: boolean; scope: ScopeReview }) {
  const [previousOpen, setPreviousOpen] = useState(false);
  const versionMatch = /^v(\d+)$/i.exec(scope.scope.version_label);
  const previousVersion = versionMatch && Number(versionMatch[1]) > 1 ? `v${Number(versionMatch[1]) - 1}` : "이전 기준";
  const adjustments = scope.quote?.adjustments ?? [];
  const reportDate = issue?.reported_at ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(new Date(issue.reported_at)) : null;
  const handleOpenChange = (next: boolean) => { if (!next) setPreviousOpen(false); onOpenChange(next); };
  const handleBack = () => { if (previousOpen) setPreviousOpen(false); else handleOpenChange(false); };
  const money = (value: number | null | undefined) => value == null ? "금액 확인 중" : `${new Intl.NumberFormat("ko-KR").format(value)}원`;

  return (
    <Sheet onOpenChange={handleOpenChange} open={open}>
      <SheetContent className="!transition-none" presentation="page" showClose={false}>
        <MobilePageHeader onBack={handleBack} title={previousOpen ? `${previousVersion} 확인서` : "변경 이력"} />
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
                  <span><span className="inline-flex rounded-md border border-success px-2 py-0.5 text-ui-micro !font-extrabold text-success">현재 버전</span><strong className="mt-2 block text-ui-section">{scope.scope.version_label} · 현재 확인서</strong></span>
                  <button aria-label="이전 기록 확인" className="grid size-11 shrink-0 place-items-center rounded-full text-ink-400 hover:bg-surface-muted" onClick={() => setPreviousOpen(true)} type="button"><CaretRight aria-hidden="true" size="var(--icon-sm)" /></button>
                </div>
                <div className="mt-3 ui-card p-4 text-sm"><p>짐 {scope.scope.item_count}개 · 작업 {scope.scope.work_count}개</p><p className="mt-3 border-t border-line pt-3 tabular-nums">금액 <strong className="float-right text-primary-700">{money(scope.quote?.total_amount_krw)}</strong></p>{adjustments.length ? <p className="mt-3 text-ink-600">변경 사유: {adjustments.map((item) => item.label).join(" · ")}</p> : null}<div className="mt-3 flex flex-wrap gap-2"><span className="rounded-md bg-success-bg px-2 py-1 text-ui-control text-success-ink">업체 확인</span><span className={`rounded-md px-2 py-1 text-ui-control ${scope.customer_confirmed_at ? "bg-success-bg text-success-ink" : "bg-warning-bg text-warning-ink"}`}>{scope.customer_confirmed_at ? "고객 확인" : "고객 확인 대기"}</span></div></div>
              </li>
              {issue ? <li className="relative pb-8"><span aria-hidden="true" className="absolute top-1 -left-[37px] size-4 rounded-full border-[3px] border-primary-600 bg-surface" /><details><summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3"><span><strong className="block text-lg">현장 보고 · {issue.title}</strong>{reportDate ? <span className="mt-1 block text-sm text-ink-600">{reportDate}</span> : null}</span><CaretDown aria-hidden="true" className="mt-1 shrink-0 text-ink-400" size="var(--icon-sm)" /></summary><div className="mt-3 ui-card p-4 text-sm"><p className="leading-6">{issue.description}</p><p className="mt-2 text-ink-600">처리 상태 · {issue.status === "approved" ? "승인" : issue.status === "rejected" ? "거절" : issue.status === "customer_review" ? "고객 확인 대기" : "업체 처리 중"}</p></div></details></li> : null}
              <li className="relative"><span aria-hidden="true" className="absolute top-1 -left-[37px] size-4 rounded-full border-[3px] border-line bg-surface" /><button className="flex min-h-14 w-full items-start justify-between gap-3 text-left" onClick={() => setPreviousOpen(true)} type="button"><span><strong className="block text-lg">{previousVersion} · 변경 전 기준</strong><span className="mt-1 block text-sm text-ink-600">현재 변경안의 기준 금액</span></span><CaretRight aria-hidden="true" className="mt-1 shrink-0 text-ink-400" size="var(--icon-sm)" /></button></li>
            </ol>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CrewHome({ brief, issueCount, onInvite, onWork }: {
  brief: Awaited<ReturnType<typeof getFieldBrief>> | undefined;
  issueCount: number;
  onInvite: () => void;
  onWork: () => void;
}) {
  const startAt = brief?.start_at ? new Date(brief.start_at) : null;
  const workerName = mockApiEnabled ? "김민수" : brief?.lead_worker_name ?? "기사";
  return (
    <div className="px-[var(--content-gutter)] pb-28 pt-4">
      <h1 className="text-ui-section leading-9 font-black tracking-[var(--tracking-display)]">{workerName} 기사님,<br />오늘 작업을 준비해요</h1>
      <CrewInviteHero onInvite={onInvite} />
      <ActiveMoveCard heading="진행 중인 이사 1건" leading={<span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700"><Truck aria-hidden="true" size="var(--icon-md)" /></span>} meta={startAt ? `${dayFormatter.format(startAt)} · ${timeFormatter.format(startAt)}` : "일정 확인 중"} onOpen={onWork} route={<>{brief?.masked_origin ?? "출발지"} → {brief?.masked_destination ?? "도착지"}</>}><MoveJourneyProgress current={2} /><div className="mt-3 border-t border-line pt-3"><p className="flex min-w-0 items-baseline gap-2 whitespace-nowrap"><strong className="shrink-0 text-ui-support text-primary-700">작업범위 확인</strong><span className="ml-auto min-w-0 truncate text-right text-ui-data text-ink-600">최신 승인본과 현장 조건을 확인해요</span></p><button className="mt-2 flex min-h-10 w-full items-center justify-center rounded-xl bg-primary-600 text-ui-support font-extrabold text-white" onClick={onWork} type="button">지금 확인</button></div></ActiveMoveCard>
      <aside className="mt-4 flex items-start gap-3 rounded-[var(--radius-card)] bg-warning-bg p-3 text-sm font-medium leading-5 text-warning-ink"><WarningCircle aria-hidden="true" className="mt-0.5 shrink-0" /><p>현장이 승인본과 다르면 추가 금액을 요구하지 말고 먼저 보고해 주세요. {issueCount > 0 ? `현재 보고 ${issueCount}건이 처리 중이에요.` : ""}</p></aside>
    </div>
  );
}

function CrewCompletion({ brief, connection, issues }: {
  brief: Awaited<ReturnType<typeof getFieldBrief>> | undefined;
  connection: Connection;
  issues: Awaited<ReturnType<typeof listFieldIssues>>;
}) {
  const queryClient = useQueryClient();
  const items = useMemo(() => brief?.completion_check_items ?? [], [brief?.completion_check_items]);
  const defaultCompletedKeys = useMemo(() => new Set(items.slice(0, Math.max(0, items.length - 1)).map((item) => item.key)), [items]);
  const [completionState, setCompletionState] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState<string[]>(mockApiEnabled ? ["/room-after-evidence.png", "/built-in-wardrobe-evidence.png"] : []);
  const checkedAt = brief?.checked_in_at ?? (mockApiEnabled ? brief?.start_at : null);
  const isCompleted = (key: string, confirmed: boolean) => confirmed || (completionState[key] ?? defaultCompletedKeys.has(key));
  const completedCount = items.filter((item) => isCompleted(item.key, item.confirmed)).length;
  const submitMutation = useMutation({
    mutationFn: () => {
      if (!brief) throw new Error("작업 정보를 불러오는 중입니다.");
      const now = new Date();
      const start = checkedAt ? new Date(checkedAt) : new Date(now.getTime() - 60_000);
      return submitCompletion(connection, {
        client_reference: crypto.randomUUID(),
        dispatch_id: brief.dispatch_id,
        scope_version_id: brief.scope_version_id,
        completion_media_asset_ids: [],
        completed_check_keys: items.map((item) => item.key),
        worker_shifts: brief.assigned_workers.map((worker) => ({ worker_id: worker.worker_id, started_at: start.toISOString(), ended_at: now.toISOString() })),
        onsite_customer_confirmed: true,
        onsite_confirmed_at: now.toISOString(),
        work_ended_at: now.toISOString(),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workflowKeys.brief(connection.jobId) }),
  });
  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = [...(event.target.files ?? [])].slice(0, Math.max(0, 3 - photos.length));
    setPhotos((current) => [...current, ...selected.map(URL.createObjectURL)].slice(0, 3));
    event.target.value = "";
  };
  return <div className="space-y-4 px-[var(--content-gutter)] pb-28 pt-4">
    <div className="flex items-end justify-between"><h2 className="text-ui-section font-black">작업 완료 전 확인</h2><strong className="text-ui-section text-primary-700">{completedCount}<span className="text-ink-900"> / {items.length} 완료</span></strong></div>
     <section className="ui-card px-4 py-1">{items.map((item) => { const selected = isCompleted(item.key, item.confirmed); return <button aria-pressed={selected} className="press-static flex min-h-12 w-full items-center gap-3 text-left" key={item.key} onClick={() => setCompletionState((current) => ({ ...current, [item.key]: !selected }))} type="button"><span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-primary-600 bg-primary-600 text-white" : "border-line text-transparent"}`}><Check aria-hidden="true" size="0.875rem" weight="bold" /></span><span className="flex-1 text-ui-support font-medium">{item.label}</span></button>; })}</section>
    <section className="ui-card p-4"><h2 className="text-ui-section font-black">완료 사진</h2><p className="mt-1 text-sm text-ink-600">작업 후 상태를 남겨주세요.</p><div className="mt-4 grid grid-cols-3 gap-2">{photos.map((url, index) => <img alt={`완료 사진 ${index + 1}`} className="aspect-square w-full rounded-xl object-cover" key={url} src={url} />)}{photos.length < 3 ? <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-primary-400 text-center text-sm font-extrabold text-primary-700"><span><Camera aria-hidden="true" className="mx-auto mb-1" size="var(--icon-md)" />사진 추가</span><input accept="image/*" capture="environment" className="sr-only" multiple onChange={addPhotos} type="file" /></label> : null}</div></section>
    <section className="ui-card p-4"><h2 className="text-lg font-black">현장 보고</h2><p className="mt-2 text-sm text-success">보고 {issues.length}건이 확인서에 반영 또는 처리 중이에요.</p>{issues.slice(0, 2).map((issue) => <p className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm" key={issue.field_issue_id}><span>{issue.title}</span><span className="text-ink-600">{issueStatusLabel(issue.status)}</span></p>)}</section> 
    {submitMutation.error ? <p className="text-sm font-bold text-danger-ink" role="alert">{apiErrorMessage(submitMutation.error)}</p> : null}
    <div className="app-fixed-action fixed inset-x-0 bottom-0 z-[var(--z-sticky)] mx-auto w-full max-w-[var(--shell-mobile)] bg-surface px-[var(--content-gutter)] pt-3"><Button className="w-full" disabled={Boolean(brief?.completion_submission_id) || completedCount !== items.length || !checkedAt || submitMutation.isPending} onClick={() => submitMutation.mutate()} size="cta"><PaperPlane aria-hidden="true" />{brief?.completion_submission_id ? "완료 내용 제출됨" : submitMutation.isPending ? "제출 중" : "완료 내용 제출"}</Button><p className="mt-2 text-center text-xs text-ink-600">제출 후 업체가 고객에게 완료 확인을 요청해요.</p></div>
  </div>;
}
