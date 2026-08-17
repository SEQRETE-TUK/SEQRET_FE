import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArchiveIcon as Archive,
  BriefcaseIcon as BriefcaseBusiness,
  BuildingsIcon as Buildings,
  CaretLeftIcon as CaretLeft,
  CaretRightIcon as CaretRight,
  CheckCircleIcon as CheckCircle,
  DotsThreeIcon as More,
  DotsThreeVerticalIcon as MoreVertical,
  HouseIcon as Home,
  MapPinIcon as MapPin,
  PackageIcon as Package,
  WarningCircleIcon as WarningCircle,
  WrenchIcon as Wrench,
} from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { mockApiEnabled } from "@/api/mock-api";
import { ConnectedProfile } from "@/components/layout/connected-profile";
import { ActivityTimeline, InfoCallout, PageIntro, SectionHeader, StatusTag, WorkContext } from "@/components/layout/app-primitives";
import { MobileAppShell, type MobileNavItem } from "@/components/layout/mobile-app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/model/auth-context";
import {
  getFieldBrief,
  listFieldIssues,
  workflowKeys,
  type Connection,
} from "@/features/workflow/api/workflow-api";
import { LiveCrewWorkflow } from "@/features/workflow/ui/live-crew-workflow";
import { CrewIssueReport } from "@/features/crew/ui/crew-issue-report";

type CrewTab = "home" | "work" | "more";
type CrewWorkView = "list" | "agreement" | "report" | "completion";

const items: MobileNavItem<CrewTab>[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "work", label: "내 작업", icon: BriefcaseBusiness },
  { id: "more", label: "더보기", icon: More },
];
const validTabs = new Set<CrewTab>(items.map(({ id }) => id));
const validWorkViews = new Set<CrewWorkView>(["list", "agreement", "report", "completion"]);
const titles: Record<CrewTab, string> = { home: "SEQRET", work: "내 작업", more: "더보기" };
const dayFormatter = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" });
const timeFormatter = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
const issueStatusLabel = (status: string) => ({ open: "업체 처리 대기", customer_review: "고객 확인 대기", clarification_requested: "설명 보완 중", approved: "고객 승인", rejected: "고객 거절" })[status] ?? "상태 확인 중";

export function CrewApp() {
  const { session, clearSession } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const requested = params.get("tab") as CrewTab | null;
  const tab = requested && validTabs.has(requested) ? requested : "home";
  const requestedView = params.get("view") as CrewWorkView | null;
  const workView = requestedView && validWorkViews.has(requestedView) ? requestedView : "list";
  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab, workView]);
  const connection: Connection = { accessToken: session!.accessToken, jobId: session!.actor.job_id };
  const briefQuery = useQuery({ queryKey: workflowKeys.brief(connection.jobId), queryFn: () => getFieldBrief(connection) });
  const issueQuery = useQuery({ queryKey: workflowKeys.fieldIssues(connection.jobId), queryFn: () => listFieldIssues(connection) });
  const changeTab = (next: CrewTab) => setParams(next === "home" ? {} : next === "work" ? { tab: "work", view: "list" } : { tab: next }, { replace: true });
  const changeWorkView = (view: CrewWorkView) => setParams({ tab: "work", view }, { replace: true });
  const refresh = () => queryClient.invalidateQueries({ queryKey: workflowKeys.root(connection.jobId) });
  const disconnect = () => { clearSession(); navigate("/"); };

  const header = tab === "work" && workView !== "list" ? <CrewDetailHeader onBack={() => changeWorkView("list")} onMore={() => changeTab("more")} title={briefQuery.data?.job.title ?? "내 작업"} /> : undefined;
  return (
    <MobileAppShell current={tab} eyebrow={`현장기사 · ${session!.actor.display_name}`} header={header} items={items} onChange={changeTab} onProfile={() => changeTab("more")} onRefresh={tab === "more" ? undefined : refresh} root={tab === "home"} title={titles[tab]}>
      {tab === "home" ? <CrewHome brief={briefQuery.data} issueCount={issueQuery.data?.length ?? 0} onWork={() => changeWorkView("report")} /> : null}
      {tab === "work" ? <CrewWork brief={briefQuery.data} connection={connection} issues={issueQuery.data ?? []} onViewChange={changeWorkView} view={workView} /> : null}
      {tab === "more" ? <ConnectedProfile detail="현재 현장 작업에 연결됨" displayName={session!.actor.display_name} onDisconnect={disconnect} roleLabel="현장기사" /> : null}
    </MobileAppShell>
  );
}

function CrewDetailHeader({ onBack, onMore, title }: { onBack: () => void; onMore: () => void; title: string }) {
  return <header className="app-safe-header sticky top-0 z-[var(--z-sticky)] grid min-h-[68px] grid-cols-[48px_minmax(0,1fr)_48px] items-center bg-surface/98 px-2 backdrop-blur"><button aria-label="작업 목록으로 돌아가기" className="grid size-11 place-items-center rounded-full hover:bg-surface-muted" onClick={onBack} type="button"><CaretLeft aria-hidden="true" size={28} weight="bold" /></button><h1 className="truncate text-center text-[21px] font-black tracking-[-0.04em]">{title}</h1><button aria-label="더보기" className="grid size-11 place-items-center rounded-full hover:bg-surface-muted" onClick={onMore} type="button"><MoreVertical aria-hidden="true" size={27} weight="bold" /></button></header>;
}

function CrewWork({ brief, connection, issues, onViewChange, view }: {
  brief: Awaited<ReturnType<typeof getFieldBrief>> | undefined;
  connection: Connection;
  issues: Awaited<ReturnType<typeof listFieldIssues>>;
  onViewChange: (view: CrewWorkView) => void;
  view: CrewWorkView;
}) {
  if (view === "list") return <CrewWorkList brief={brief} onOpen={() => onViewChange("agreement")} />;
  return (
    <>
      <CrewDetailTabs current={view} onChange={onViewChange} />
      {view === "agreement" ? <CrewApprovedScope brief={brief} onReport={() => onViewChange("report")} /> : null}
      {view === "report" ? <CrewIssueReport brief={brief} connection={connection} /> : null}
      {view === "completion" ? <CrewRecords brief={brief} compact issues={issues} /> : null}
    </>
  );
}

function CrewDetailTabs({ current, onChange }: { current: Exclude<CrewWorkView, "list">; onChange: (view: CrewWorkView) => void }) {
  const tabs: Array<{ id: Exclude<CrewWorkView, "list">; label: string }> = [{ id: "agreement", label: "확인서" }, { id: "report", label: "현장 보고" }, { id: "completion", label: "작업 완료" }];
  return <div aria-label="작업 상세 메뉴" className="sticky top-[68px] z-[calc(var(--z-sticky)-1)] grid grid-cols-3 border-b border-line bg-surface" role="tablist">{tabs.map((tab) => <button aria-selected={current === tab.id} className={`relative min-h-14 whitespace-nowrap text-[15px] font-bold ${current === tab.id ? "text-primary-700 after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} key={tab.id} onClick={() => onChange(tab.id)} role="tab" type="button">{tab.label}</button>)}</div>;
}

function CrewWorkList({ brief, onOpen }: { brief: Awaited<ReturnType<typeof getFieldBrief>> | undefined; onOpen: () => void }) {
  const completed = Boolean(brief?.completion_submission_id);
  const [listTab, setListTab] = useState<"active" | "history">(completed ? "history" : "active");
  const showWork = listTab === (completed ? "history" : "active");
  const startAt = brief?.start_at ? new Date(brief.start_at) : null;
  return <div className="px-[var(--content-gutter)] pb-28 pt-6">
    <h1 className="text-[30px] font-black tracking-[-0.05em]">내 작업</h1>
    <div className="mt-6 grid grid-cols-2 border-b border-line" role="tablist" aria-label="기사 작업 목록"><button aria-selected={listTab === "active"} className={`relative min-h-13 font-extrabold ${listTab === "active" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("active")} role="tab" type="button">진행 중 {completed ? 0 : 1}</button><button aria-selected={listTab === "history"} className={`relative min-h-13 font-extrabold ${listTab === "history" ? "text-primary-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} onClick={() => setListTab("history")} role="tab" type="button">작업 기록 {completed ? 1 : 0}</button></div>
    <p className="mt-5 text-sm leading-6 text-ink-600">{listTab === "active" ? "배정된 작업의 승인 범위와 현장 상태를 확인해요." : "제출한 현장 보고와 완료 기록을 다시 확인해요."}</p>
    {showWork ? <button className="mt-4 w-full rounded-[var(--radius-feature)] border border-line bg-surface p-5 text-left shadow-[var(--shadow-card)]" onClick={onOpen} type="button"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${completed ? "bg-success-bg text-success-ink" : "bg-primary-50 text-primary-700"}`}>{completed ? "작업 완료" : brief?.checked_in_at ? "현장 진행" : "작업 예정"}</span><strong className="mt-4 flex items-center justify-between gap-3 text-[20px]"><span className="min-w-0 truncate">{brief ? `${brief.masked_origin ?? "출발지"} → ${brief.masked_destination ?? "도착지"}` : "작업 정보를 불러오는 중"}</span><CaretRight aria-hidden="true" className="shrink-0 text-ink-400" size={22} /></strong><span className="mt-2 block text-sm text-ink-600">{startAt ? `${dayFormatter.format(startAt)} · ${timeFormatter.format(startAt)}` : "일정 확인 중"}</span><span className="mt-5 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center text-xs text-ink-600"><span><Package aria-hidden="true" className="mx-auto mb-1" size={20} />점검 {brief?.completion_required_count ?? "–"}개</span><span><Wrench aria-hidden="true" className="mx-auto mb-1" size={20} />작업 {brief?.completion_check_items.length ?? "–"}개</span><span><Buildings aria-hidden="true" className="mx-auto mb-1" size={20} />조건 {brief?.origin_conditions.length ?? "–"}개</span></span><span className="mt-5 flex min-h-11 items-center justify-center rounded-xl bg-surface-muted text-sm font-extrabold">{completed ? "작업 기록 보기" : "작업 상세 보기"}</span></button> : <section className="mt-4 rounded-[var(--radius-feature)] border border-line bg-surface px-5 py-8 text-center"><Archive aria-hidden="true" className="mx-auto text-ink-400" size={32} /><h2 className="mt-3 font-black">{listTab === "active" ? "진행 중인 작업이 없어요" : "완료한 작업이 없어요"}</h2></section>}
  </div>;
}

function CrewApprovedScope({ brief, onReport }: { brief: Awaited<ReturnType<typeof getFieldBrief>> | undefined; onReport: () => void }) {
  return (
    <div className="px-[var(--content-gutter)] pb-28 pt-7">
      <section className="ui-card ui-card-pad">
        <div className="flex items-center gap-2 text-sm font-extrabold text-success"><CheckCircle aria-hidden="true" weight="fill" /> 최신 승인본 {brief?.scope_version_label ?? "–"} · 고객/업체 확인 완료</div>
        <div className="mt-5 grid grid-cols-3 divide-x divide-line text-center">
          <CrewFact icon={<Package aria-hidden="true" />} label="짐" value={mockApiEnabled ? "12개" : `${brief?.completion_required_count ?? "–"}개 점검`} />
          <CrewFact icon={<Wrench aria-hidden="true" />} label="포함 작업" value={`${brief?.completion_check_items.length ?? "–"}개`} />
          <CrewFact icon={<Buildings aria-hidden="true" />} label="현장 조건" value={`${brief?.origin_conditions.length ?? "–"}개`} />
        </div>
        <div className="my-5 border-t border-line" />
        <ScopeGroup icon={<Wrench aria-hidden="true" />} items={brief?.completion_check_items.map((item) => item.label) ?? []} label="포함 작업" />
        <div className="my-5 border-t border-line" />
        <ScopeGroup icon={<Buildings aria-hidden="true" />} items={brief?.origin_conditions ?? []} label="현장 확인" />
      </section>
      <Button className="mt-5 w-full" onClick={onReport} size="cta"><WarningCircle aria-hidden="true" /> 새 현장 보고</Button>
    </div>
  );
}

function CrewHome({ brief, issueCount, onWork }: {
  brief: Awaited<ReturnType<typeof getFieldBrief>> | undefined;
  issueCount: number;
  onWork: () => void;
}) {
  const checkedIn = Boolean(brief?.checked_in_at);
  const confirmedChecks = brief?.completion_check_items.filter(({ confirmed }) => confirmed).length ?? 0;
  const totalChecks = brief?.completion_check_items.length ?? 0;
  const startAt = brief?.start_at ? new Date(brief.start_at) : null;
  return (
    <div className="mobile-screen">
      <PageIntro
        title={`${brief?.lead_worker_name ?? "기사"} 기사님 · 오늘 작업`}
      />
      <section className="ui-card ui-card-pad mt-7">
        <p className="flex items-center gap-2 text-sm font-extrabold text-primary-700"><MapPin aria-hidden="true" /> 오늘 작업 시간</p>
        <p className="mt-3 text-[42px] font-black tracking-[-0.055em]">{startAt ? timeFormatter.format(startAt) : "–"}</p>
        <p className="mt-2 text-lg text-ink-600">{brief?.masked_origin ?? "출발지"} → {brief?.masked_destination ?? "도착지"}</p>
        <div className="mt-4"><StatusTag tone="success">최신 승인본 {brief?.scope_version_label ?? "–"} · 고객/업체 확인 완료</StatusTag></div>
        <div className="my-5 border-t border-line" />
        <div className="grid grid-cols-3 divide-x divide-line text-center">
          <CrewFact icon={<Package aria-hidden="true" />} label={mockApiEnabled ? "짐 12개" : `${brief?.completion_required_count ?? "–"}개 점검`} value={mockApiEnabled ? "침대, 매트리스 외 10개" : "승인 기준"} />
          <CrewFact icon={<Wrench aria-hidden="true" />} label={`${brief?.completion_check_items.length ?? "–"}개`} value="포함 작업" />
          <CrewFact icon={<Buildings aria-hidden="true" />} label={`${brief?.origin_conditions.length ?? "–"}개`} value="현장 조건" />
        </div>
        <Button className="mt-5 w-full" onClick={onWork} size="cta"><MapPin aria-hidden="true" /> {checkedIn ? "현장 작업 이어가기" : "현장 도착 체크인"}</Button>
      </section>

      <section className="ui-card ui-card-pad mt-5">
        <SectionHeader aside={`${confirmedChecks}/${totalChecks} 확인`}>오늘 옮길 범위</SectionHeader>
        <div className="mt-3 divide-y divide-line">{brief?.completion_check_items.slice(0, 2).map((item) => <p className="flex min-h-14 items-center gap-3 text-sm" key={item.key}><CheckCircle aria-hidden="true" className="text-success" weight="fill" /><strong>포함</strong><span>{item.label}</span></p>)}<p className="flex min-h-14 items-center gap-3 text-sm"><WarningCircle aria-hidden="true" className="text-warning-ink" /><strong className="text-warning-ink">주의</strong><span>{brief?.origin_conditions[0] ?? "현장 조건 확인"}</span></p></div>
      </section>

      <aside className="mt-5 flex gap-3 rounded-[var(--radius-card)] border border-warning bg-warning-bg p-4 text-sm font-bold text-warning-ink"><WarningCircle aria-hidden="true" className="mt-0.5 shrink-0" /> 현장이 다르면 금액을 요구하지 말고 보고해 주세요. {issueCount > 0 ? `현재 ${issueCount}건 처리 중입니다.` : ""}</aside>
    </div>
  );
}

function CrewFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="px-2"><span className="mx-auto grid size-11 place-items-center rounded-full bg-primary-50 text-primary-700">{icon}</span><strong className="mt-2 block text-sm">{label}</strong><span className="mt-1 block text-xs text-ink-600">{value}</span></div>;
}

function ScopeGroup({ icon, items, label }: { icon: ReactNode; items: string[]; label: string }) {
  return <div><h3 className="flex items-center gap-2 text-lg font-extrabold text-primary-700">{icon}{label}</h3><ul className="mt-3 space-y-3 text-sm">{items.map((item) => <li className="flex items-center gap-2" key={item}><CheckCircle aria-hidden="true" className="text-primary-700" weight="fill" />{item}</li>)}</ul></div>;
}

function CrewRecords({ brief, compact = false, issues }: {
  brief: Awaited<ReturnType<typeof getFieldBrief>> | undefined;
  compact?: boolean;
  issues: Awaited<ReturnType<typeof listFieldIssues>>;
}) {
  const [showCompletion, setShowCompletion] = useState(false);
  const activity = [
    brief ? { actor: "업체", detail: `${brief.assigned_vehicle.display_name} · 작업자 ${brief.assigned_worker_count}명 · 범위 ${brief.scope_version_label}`, time: brief.start_at, title: "현장 배차 전달" } : null,
    brief?.checked_in_at ? { actor: brief.lead_worker_name, detail: "체크인 항목 확인 후 현장 작업을 시작했습니다.", time: brief.checked_in_at, title: "현장 체크인" } : null,
    ...issues.map((issue) => ({ actor: "현장기사", detail: `${issueStatusLabel(issue.status)} · 증빙 ${issue.evidence_media_asset_ids.length}건`, time: issue.reported_at, title: issue.title })),
    brief?.completion_submission_id ? { actor: "현장기사", detail: "완료 체크리스트와 현장 기록을 업체에 전달했습니다.", time: null, title: "완료 기록 제출" } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);
  return (
    <div className={compact ? "px-[var(--content-gutter)] pb-28 pt-7" : "mobile-screen"}>
      {!compact ? <PageIntro description="체크인, 현장 변경 보고, 완료 제출처럼 직접 남긴 기록만 표시합니다." title="오늘 남긴 기록" /> : null}
      {brief ? <WorkContext code={brief.job.job_code} route={`${brief.masked_origin ?? "출발지"} → ${brief.masked_destination ?? "도착지"}`} scheduledAt={brief.start_at} status={<StatusTag tone={brief.checked_in_at ? "success" : "warning"}>{brief.checked_in_at ? "현장 진행" : "체크인 전"}</StatusTag>} title={brief.job.title} version={brief.scope_version_label} /> : null}
      <section className="mt-8" aria-label="현장 기록 목록">
        <SectionHeader aside={`${activity.length}건`}>오늘 작업</SectionHeader>
        {activity.length > 0 ? <ActivityTimeline items={activity} /> : <p className="mt-3 border-y border-line py-5 text-sm text-ink-600">아직 현장에서 남긴 기록이 없습니다.</p>}
      </section>
      {!brief?.checked_in_at && issues.length === 0 ? <InfoCallout icon={<Archive aria-hidden="true" size={18} weight="fill" />}>아직 현장에서 남긴 기록이 없습니다.</InfoCallout> : null}
      <Button className="mt-6 w-full" onClick={() => setShowCompletion((value) => !value)} variant="outline">{showCompletion ? "완료 절차 닫기" : "완료 체크리스트 열기"}</Button>
      {showCompletion ? <LiveCrewWorkflow embedded /> : null}
    </div>
  );
}
