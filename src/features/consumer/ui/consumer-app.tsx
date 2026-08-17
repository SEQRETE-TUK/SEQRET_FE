import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightIcon as ArrowRight,
  BellIcon as Bell,
  CalendarBlankIcon as Calendar,
  CameraIcon as Camera,
  CaretLeftIcon as CaretLeft,
  CaretRightIcon as CaretRight,
  CheckIcon as Check,
  CheckCircleIcon as CheckCircle,
  ClipboardTextIcon as ClipboardText,
  CubeIcon as Cube,
  DotsThreeVerticalIcon as MoreVertical,
  ElevatorIcon as Elevator,
  HouseIcon as Home,
  NotepadIcon as Notepad,
  PackageIcon as Package,
  PaperPlaneTiltIcon as PaperPlane,
  SquaresFourIcon as SquaresFour,
  StairsIcon as Stairs,
  TrendUpIcon as TrendUp,
  TruckIcon as Truck,
  WrenchIcon as Wrench,
} from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ConnectedProfile } from "@/components/layout/connected-profile";
import { MobileAppShell, type MobileNavItem } from "@/components/layout/mobile-app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/model/auth-context";
import {
  apiErrorMessage,
  confirmScope,
  getCompletionSummary,
  getScopeReview,
  listFieldIssues,
  requestScopeRevision,
  workflowKeys,
  type CompletionSummary,
  type Connection,
  type FieldIssue,
  type ScopeReview,
} from "@/features/workflow/api/workflow-api";

type ConsumerTab = "home" | "move" | "more";
type ConsumerMoveView = "info" | "items" | "agreement";

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

const tabs: MobileNavItem<ConsumerTab>[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "move", label: "내 이사", icon: Notepad },
  { id: "more", label: "더보기", icon: SquaresFour },
];
const validTabs = new Set<ConsumerTab>(tabs.map(({ id }) => id));
const validMoveViews = new Set<ConsumerMoveView>(["info", "items", "agreement"]);

export function ConsumerApp() {
  const { session, clearSession } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("tab") as ConsumerTab | null;
  const tab = requestedTab && validTabs.has(requestedTab) ? requestedTab : "home";
  const requestedView = params.get("view") as ConsumerMoveView | null;
  const moveView = requestedView && validMoveViews.has(requestedView) ? requestedView : "info";
  const connection: Connection = { accessToken: session!.accessToken, jobId: session!.actor.job_id };

  const scopeQuery = useQuery({ queryKey: workflowKeys.scope(session!.actor.job_id), queryFn: () => getScopeReview(connection) });
  const completionQuery = useQuery({ queryKey: workflowKeys.completion(session!.actor.job_id), queryFn: () => getCompletionSummary(connection) });
  const issuesQuery = useQuery({ queryKey: workflowKeys.fieldIssues(session!.actor.job_id), queryFn: () => listFieldIssues(connection) });

  const setTab = (next: ConsumerTab) => {
    if (next === "home") setParams({}, { replace: true });
    else if (next === "move") setParams({ tab: "move", view: "info" }, { replace: true });
    else setParams({ tab: "more" }, { replace: true });
  };
  const setMoveView = (view: ConsumerMoveView) => setParams({ tab: "move", view }, { replace: true });
  const openAgreement = () => setMoveView("agreement");
  const disconnect = () => { clearSession(); navigate("/"); };

  const header = tab === "home"
    ? <HomeHeader customerName={session!.actor.display_name} onBell={openAgreement} />
    : tab === "move"
      ? <MoveHeader onBack={() => setTab("home")} onMore={() => setTab("more")} scope={scopeQuery.data} />
      : undefined;

  return (
    <MobileAppShell current={tab} eyebrow={`고객 · ${session!.actor.display_name}`} header={header} items={tabs} onChange={setTab} onProfile={() => setTab("more")} title={tab === "home" ? "홈" : tab === "move" ? "내 이사" : "더보기"}>
      {tab === "home" ? <HomeTab completion={completionQuery.data} onCapture={() => navigate("/consumer/capture")} onOpenAgreement={openAgreement} onOpenMove={() => setTab("move")} scope={scopeQuery.data} /> : null}
      {tab === "move" ? <ConsumerMoveTab completion={completionQuery.data} connection={connection} issues={issuesQuery.data} onCapture={() => navigate("/consumer/capture")} onViewChange={setMoveView} scope={scopeQuery.data} view={moveView} /> : null}
      {tab === "more" ? <ConnectedProfile detail="이사 기록에 연결됨" displayName={session!.actor.display_name} onDisconnect={disconnect} roleLabel="고객" /> : null}
    </MobileAppShell>
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
    <header className="app-safe-header sticky top-0 z-[var(--z-sticky)] grid min-h-[68px] grid-cols-[48px_1fr_48px] items-center border-b border-line bg-surface/98 px-2 backdrop-blur">
      <button aria-label="홈으로 돌아가기" className="grid size-11 place-items-center rounded-full hover:bg-surface-muted" onClick={onBack} type="button"><CaretLeft aria-hidden="true" size={28} weight="bold" /></button>
      <h1 className="truncate text-center text-[22px] font-black tracking-[-0.04em]">{title}</h1>
      <button aria-label="더보기" className="grid size-11 place-items-center rounded-full hover:bg-surface-muted" onClick={onMore} type="button"><MoreVertical aria-hidden="true" size={27} weight="bold" /></button>
    </header>
  );
}

function HomeTab({ completion, onCapture, onOpenAgreement, onOpenMove, scope }: { completion: CompletionSummary | undefined; onCapture: () => void; onOpenAgreement: () => void; onOpenMove: () => void; scope: ScopeReview | undefined }) {
  const scheduledAt = scope?.job.scheduled_at ? new Date(scope.job.scheduled_at) : null;
  const dDay = scheduledAt ? Math.max(0, Math.ceil((scheduledAt.getTime() - renderStartedAt) / 86_400_000)) : null;
  const requiresScopeReview = scope?.scope.status === "customer_review";
  const completed = scope?.scope.status === "confirmed";
  const actionTitle = requiresScopeReview ? "작업범위와 금액 확인" : completed ? "공동확인 내용 보기" : "촬영 결과 확인";
  const actionMeta = scope ? `${scope.job.company_display_name ?? "이사업체"} 제안 · ${money(scope.quote?.total_amount_krw)} · ${scope.scope.version_label}` : "최신 제안을 불러오는 중";
  const currentStep = requiresScopeReview ? 2 : completed ? 3 : 1;

  return (
    <div className="pb-[calc(var(--bottom-rail-height)+2rem)]">
      <section className="px-[var(--content-gutter)]">
        <button className="relative min-h-[174px] w-full overflow-hidden rounded-[22px] bg-primary-50 px-5 py-4 text-left ring-1 ring-primary-100" onClick={onCapture} type="button">
          <span className="relative z-10 block max-w-[62%]">
            <span className="text-sm font-extrabold text-primary-700">새 이사</span>
            <strong className="mt-2 block text-[22px] leading-[1.28] font-black tracking-[-0.04em]">60초 촬영으로<br />준비를 시작해요</strong>
            <span className="mt-1.5 block text-[13px] leading-5 text-ink-600">짐 목록과 작업조건 초안을 만들어요</span>
            <span className="mt-3 flex items-center gap-1 text-sm font-extrabold text-primary-700">새 이사 시작하기 <ArrowRight aria-hidden="true" size={18} weight="bold" /></span>
          </span>
          <img alt="휴대폰으로 이삿짐 상자를 촬영하는 모습" className="absolute -right-6 -bottom-3 w-[170px] max-w-none" height="213" src="/move-capture-hero.png" width="170" />
        </button>
      </section>

      <section className="mx-[var(--content-gutter)] mt-4 rounded-[22px] border border-line bg-surface p-3 shadow-[var(--shadow-card)]">
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

      <section className="mt-4 bg-primary-50/70 px-[var(--content-gutter)] py-5">
        <h2 className="text-[20px] font-black tracking-[-0.035em]">추가금이 생기는 순간</h2>
        <p className="mt-1 text-sm text-ink-600">미리 확인하면 당일 변경을 줄일 수 있어요</p>
        <div className="no-scrollbar -mx-[var(--content-gutter)] mt-4 flex snap-x gap-3 overflow-x-auto px-[var(--content-gutter)] pb-1">
          <PreventionCard action="조건 다시 확인" icon={<Elevator aria-hidden="true" size={45} weight="duotone" />} label="작업조건 차이" title="엘리베이터·계단 조건이 달랐어요" />
          <PreventionCard action="짐 목록에 반영" icon={<Package aria-hidden="true" size={45} weight="duotone" />} label="짐 목록 차이" title="촬영 후 큰 짐이 추가됐어요" />
          <PreventionCard action="사유·금액 재승인" icon={<Wrench aria-hidden="true" size={45} weight="duotone" />} label="추가 작업" title="분해·설치 작업이 빠졌어요" />
        </div>
      </section>
      {completion?.completion_request?.status === "requested" ? <p className="sr-only">완료 확인 요청이 도착했습니다.</p> : null}
    </div>
  );
}

function JourneyProgress({ current }: { current: number }) {
  const steps = ["촬영과 짐 검수", "작업범위와\n금액 확인", "공동확인 완료"];
  return <ol className="mt-3 grid grid-cols-3">{steps.map((label, index) => { const step = index + 1; const done = step < current; const active = step === current; return <li className="relative text-center" key={label}>{index > 0 ? <span aria-hidden="true" className={`absolute top-3.5 right-1/2 h-0.5 w-full ${step <= current ? "bg-success" : "bg-line"}`} /> : null}<span className={`relative z-10 mx-auto grid size-7 place-items-center rounded-full border-2 text-xs font-black ${done ? "border-success bg-success text-white" : active ? "border-primary-600 bg-primary-600 text-white" : "border-line bg-surface text-ink-400"}`}>{done ? <Check aria-hidden="true" size={15} weight="bold" /> : step}</span><span className={`mt-1.5 block whitespace-pre-line text-[10px] leading-3.5 font-bold ${active ? "text-primary-700" : done ? "text-ink-900" : "text-ink-600"}`}>{label}</span></li>; })}</ol>;
}

function PreventionCard({ action, icon, label, title }: { action: string; icon: ReactNode; label: string; title: string }) {
  return <article className="min-h-[188px] w-[162px] shrink-0 snap-start rounded-[18px] border border-line bg-surface p-4 shadow-[var(--shadow-card)]"><p className="text-sm font-extrabold text-primary-700">{label}</p><div className="mt-3 text-primary-700">{icon}</div><h3 className="mt-3 text-[15px] leading-5 font-extrabold">{title}</h3><p className="mt-3 flex items-center gap-1 text-[12px] font-extrabold text-primary-700">{action} <CaretRight aria-hidden="true" size={14} /></p></article>;
}

function ConsumerMoveTab({ completion, connection, issues, onCapture, onViewChange, scope, view }: { completion: CompletionSummary | undefined; connection: Connection; issues: FieldIssue[] | undefined; onCapture: () => void; onViewChange: (view: ConsumerMoveView) => void; scope: ScopeReview | undefined; view: ConsumerMoveView }) {
  return <><MoveTabs current={view} onChange={onViewChange} />{view === "info" ? <MoveInfo onOpenItems={() => onViewChange("items")} scope={scope} /> : null}{view === "items" ? <ConsumerInventory onCapture={onCapture} onOpenAgreement={() => onViewChange("agreement")} scope={scope} /> : null}{view === "agreement" ? <ConsumerAgreement completion={completion} connection={connection} issues={issues} scope={scope} /> : null}</>;
}

function MoveTabs({ current, onChange }: { current: ConsumerMoveView; onChange: (view: ConsumerMoveView) => void }) {
  const items: Array<{ id: ConsumerMoveView; label: string }> = [{ id: "info", label: "이사 정보" }, { id: "items", label: "짐 목록" }, { id: "agreement", label: "확인서" }];
  return <div aria-label="내 이사 메뉴" className="sticky top-[68px] z-[calc(var(--z-sticky)-1)] grid grid-cols-3 border-b border-line bg-surface" role="tablist">{items.map((item) => { const active = item.id === current; return <button aria-selected={active} className={`relative min-h-14 text-[15px] font-bold ${active ? "text-primary-700 after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-primary-600" : "text-ink-600"}`} key={item.id} onClick={() => onChange(item.id)} role="tab" type="button">{item.label}</button>; })}</div>;
}

function MoveInfo({ onOpenItems, scope }: { onOpenItems: () => void; scope: ScopeReview | undefined }) {
  const scheduledAt = scope?.job.scheduled_at ? new Date(scope.job.scheduled_at) : null;
  const dDay = scheduledAt ? Math.max(0, Math.ceil((scheduledAt.getTime() - renderStartedAt) / 86_400_000)) : null;
  return (
    <div className="space-y-2.5 px-[var(--content-gutter)] pb-28 pt-3">
      <InfoCard title="이사 일정"><div className="flex items-center gap-3"><Calendar aria-hidden="true" className="shrink-0" size={28} /><strong className="min-w-0 flex-1 text-[16px] leading-5">{scheduledAt ? fullDateFormatter.format(scheduledAt) : "일정을 확인하고 있어요"}</strong>{dDay !== null ? <span className="rounded-lg bg-primary-50 px-2 py-1.5 text-[13px] font-extrabold text-primary-700">D-{dDay}</span> : null}<button className="text-sm font-extrabold text-primary-700" type="button">수정</button></div></InfoCard>
      <InfoCard title="이동 경로"><div className="relative pl-12"><span aria-hidden="true" className="absolute top-4 bottom-4 left-[14px] w-0.5 bg-primary-600" /><RoutePoint conditions={["3층", "엘리베이터 없음", "주차 가능"]} label="출발지" title={scope?.job.origin_summary ?? "출발지를 불러오는 중"} /><RoutePoint conditions={["5층", "엘리베이터 있음", "주차 확인 필요"]} destination label="도착지" title={scope?.job.destination_summary ?? "도착지를 불러오는 중"} /></div></InfoCard>
      <InfoCard title="이사 기본 정보"><InfoRow icon={<Truck aria-hidden="true" size={23} weight="duotone" />} label="이사 유형" value="소형 이사" /><InfoRow icon={<ClipboardText aria-hidden="true" size={23} weight="duotone" />} label="짐 목록" onClick={onOpenItems} value={`${scope?.scope.item_count ?? "–"}개 · 확인 필요 ${scope?.scope.review_required_count ?? "–"}개`} /></InfoCard>
      <InfoCard title="준비 상태"><div className="flex items-center gap-3"><CheckCircle aria-hidden="true" className="shrink-0 text-success" size={27} weight="fill" /><div className="min-w-0 flex-1"><strong className="block text-[16px] text-success">짐 목록 작성 중</strong><span className="mt-0.5 block text-[13px]">{scope?.scope.item_count ?? "–"}개 중 {Math.max(0, (scope?.scope.item_count ?? 0) - (scope?.scope.review_required_count ?? 0))}개 확인</span></div><Button className="px-3 text-[13px]" onClick={onOpenItems} size="chip" variant="outline">짐 목록 계속 확인</Button></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full w-[86%] rounded-full bg-success" /></div><p className="mt-2 text-[13px] text-ink-600">짐 목록을 확정하면 업체가 작업 범위와 금액을 검토해요.</p></InfoCard>
      <aside className="flex items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3 text-sm text-ink-600"><TrendUp aria-hidden="true" size={22} /> 처음 확인한 뒤 수정된 정보는 확인서 변경 이력에 기록돼요.</aside>
    </div>
  );
}

function InfoCard({ children, title }: { children: ReactNode; title: string }) { return <section className="rounded-[18px] border border-line bg-surface p-3 shadow-[var(--shadow-card)]"><h2 className="mb-2.5 text-[16px] font-black">{title}</h2>{children}</section>; }

function RoutePoint({ conditions, destination = false, label, title }: { conditions: string[]; destination?: boolean; label: string; title: string }) {
  return <div className={destination ? "relative mt-6" : "relative"}><span aria-hidden="true" className="absolute top-1 -left-[46px] size-5 rounded-full border-[5px] border-primary-600 bg-surface" /><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-[13px] font-extrabold text-primary-700">{label}</p><strong className="mt-0.5 block text-[15px]">{title}</strong></div><button className="text-sm font-extrabold text-primary-700" type="button">수정</button></div><div className="mt-1.5 flex flex-wrap gap-1.5">{conditions.map((condition, index) => <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${destination && index === conditions.length - 1 ? "bg-warning-bg text-warning-ink" : "bg-surface-muted text-ink-600"}`} key={condition}>{condition}</span>)}</div></div>;
}

function InfoRow({ icon, label, onClick, value }: { icon: ReactNode; label: string; onClick?: () => void; value: string }) {
  const content = <><span className="grid size-10 place-items-center rounded-xl bg-primary-50 text-primary-700">{icon}</span><strong className="flex-1 text-[15px]">{label}</strong><span className="text-right text-sm text-ink-600">{value}</span>{onClick ? <CaretRight aria-hidden="true" size={18} /> : null}</>;
  const classes = "flex min-h-11 w-full items-center gap-3 border-t border-line text-left first:border-t-0";
  return onClick ? <button className={classes} onClick={onClick} type="button">{content}</button> : <div className={classes}>{content}</div>;
}

function ConsumerInventory({ onCapture, onOpenAgreement, scope }: { onCapture: () => void; onOpenAgreement: () => void; scope: ScopeReview | undefined }) {
  const [openRoom, setOpenRoom] = useState(scope?.scope.room_groups[0]?.room_zone_id ?? "");
  return <div className="px-[var(--content-gutter)] pb-28 pt-4"><section className="rounded-[18px] border border-line bg-surface p-4 shadow-[var(--shadow-card)]"><div className="flex items-center gap-2 text-sm font-extrabold text-success"><CheckCircle aria-hidden="true" size={22} weight="fill" /> AI 분석 완료 <span className="font-medium text-ink-600">· 총 {scope?.scope.item_count ?? "–"}개</span></div><div className="mt-4 flex flex-wrap gap-2">{scope?.scope.room_groups.map((group) => <button className={`min-h-10 rounded-full border px-4 text-sm font-extrabold ${openRoom === group.room_zone_id ? "border-primary-600 bg-primary-50 text-primary-700" : "border-line text-ink-600"}`} key={group.room_zone_id} onClick={() => setOpenRoom(group.room_zone_id)} type="button">{group.label}</button>)}</div><div className="mt-4 divide-y divide-line border-y border-line">{scope?.scope.room_groups.flatMap((group) => group.items).filter((item) => !openRoom || item.room_zone_id === openRoom).map((item) => <div className="flex min-h-14 items-center gap-3 py-3 text-sm" key={item.item_key}><span className="grid size-9 place-items-center rounded-xl bg-primary-50 text-primary-700"><Package aria-hidden="true" size={19} /></span><span className="flex-1 font-bold">{item.description}</span><span className="font-bold text-success">확인</span></div>)}{!scope ? <p className="py-5 text-sm text-ink-600">최신 짐 목록을 불러오는 중입니다.</p> : null}</div><Button className="mt-5 w-full" onClick={onCapture} size="cta"><Camera aria-hidden="true" /> 짐 추가 · 수정</Button></section><Button className="mt-4 w-full" onClick={onOpenAgreement} variant="outline">확인서에서 작업 범위 보기</Button></div>;
}

function ConsumerAgreement({ completion, connection, issues, scope }: { completion: CompletionSummary | undefined; connection: Connection; issues: FieldIssue[] | undefined; scope: ScopeReview | undefined }) {
  const queryClient = useQueryClient();
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [issueOpen, setIssueOpen] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: workflowKeys.root(connection.jobId) });
  const confirmMutation = useMutation({ mutationFn: () => confirmScope(connection, scope!.scope.id), onSuccess: refresh });
  const revisionMutation = useMutation({ mutationFn: () => requestScopeRevision(connection, scope!.scope.id, reason.trim()), onSuccess: () => { setReason(""); setRevisionOpen(false); refresh(); } });
  if (!scope) return <div className="px-[var(--content-gutter)] py-8 text-sm text-ink-600">확인서를 불러오는 중입니다.</div>;

  const pending = scope.scope.status === "customer_review";
  const issue = issues?.[0];
  const adjustment = scope.quote?.adjustments[0];
  const baseAmount = scope.quote?.base_amount_krw;
  const totalAmount = scope.quote?.total_amount_krw;
  const delta = adjustment?.amount_krw ?? ((totalAmount ?? 0) - (baseAmount ?? 0));

  return (
    <div className="space-y-2.5 px-[var(--content-gutter)] pb-28 pt-3">
      {issue ? <section className="rounded-[18px] border border-line bg-surface p-3 shadow-[var(--shadow-card)]"><span className="inline-flex rounded-full border border-warning px-2.5 py-0.5 text-[11px] font-extrabold text-warning-ink">확인 필요</span><h2 className="mt-1.5 text-[18px] font-black">현장 보고 <b className="text-primary-700">1건</b>이 도착했어요</h2><p className="mt-0.5 text-[12px] text-ink-600">{issue.title}</p><div className="mt-2 flex items-center justify-between text-[11px] text-ink-400"><span>현장기사 보고 · {scope.job.company_display_name ?? "이사업체"} 금액 제안</span><span className="font-bold text-warning-ink">내 확인 대기</span></div><button className="mt-2 flex min-h-10 w-full items-center justify-between rounded-xl border border-line px-4 text-[13px] font-extrabold" onClick={() => setIssueOpen((open) => !open)} type="button">보고 내용 확인 <CaretRight aria-hidden="true" size={18} /></button>{issueOpen ? <p className="mt-2 rounded-xl bg-warning-bg p-3 text-sm leading-5 text-warning-ink">{issue.description}</p> : null}</section> : null}
      <section className="rounded-[18px] border border-line bg-surface p-3 shadow-[var(--shadow-card)]"><p className="text-[12px] text-ink-600">변경 후 금액</p><p className="text-[27px] font-black tracking-[-0.04em]">{money(totalAmount)}</p><p className="text-[12px] text-ink-600">기존 {money(baseAmount)}</p><div className="mt-2 flex items-center gap-2.5 rounded-xl border border-line p-2"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-warning-bg text-warning-ink"><TrendUp aria-hidden="true" size={21} weight="bold" /></span><div className="min-w-0 flex-1"><strong className="block text-[13px]"><b className="text-warning-ink">{delta > 0 ? "+" : ""}{money(delta)}</b>{delta !== 0 ? "이 반영된 이유" : " · 추가 금액 없음"}</strong><span className="block truncate text-[12px] text-ink-600">{adjustment?.label ?? scope.proposal_reason ?? "촬영 결과와 작업조건 반영"}</span></div><CaretRight aria-hidden="true" className="text-ink-400" size={18} /></div></section>
      <section className="rounded-[18px] border border-line bg-surface p-3 shadow-[var(--shadow-card)]"><p className="text-[12px] text-ink-600">현재 상황</p><h2 className="mt-0.5 text-[18px] font-black"><span className="text-primary-700">{pending ? "업체 확인 완료" : "공동확인 완료"}</span> · {issue ? "현장 변경 확인" : "작업 범위 확인"}</h2><AgreementProgress pending={pending} /><p className="mt-2 text-[12px] text-ink-600">{pending ? "작업 범위와 금액을 확인하면 양측 확인이 완료돼요." : "고객과 업체가 같은 버전의 작업 범위를 확인했어요."}</p></section>
      <section className="rounded-[18px] border border-line bg-surface p-3 shadow-[var(--shadow-card)]"><h2 className="text-[12px] text-ink-600">확인할 작업</h2><ConfirmedRow icon={<Cube aria-hidden="true" size={21} weight="duotone" />} label="작업 범위" value={`짐 ${scope.scope.item_count}개 · ${scope.scope.included_works.slice(0, 2).join(" · ")}`} /><ConfirmedRow icon={<Stairs aria-hidden="true" size={21} weight="duotone" />} label="출발지 조건" value="계단 3층 · 주차 가능" /><ConfirmedRow icon={<Elevator aria-hidden="true" size={21} weight="duotone" />} label="도착지 조건" value="엘리베이터 · 주차 확인" /></section>
      <aside className="flex items-center gap-3 rounded-2xl bg-primary-50 px-4 py-3 text-sm text-ink-600"><PaperPlane aria-hidden="true" className="text-primary-700" size={21} weight="fill" />수정 요청은 {scope.job.company_display_name ?? "이사업체"} 담당자에게 전달돼요.</aside>
      {confirmMutation.error || revisionMutation.error ? <p className="text-sm font-bold text-danger">{apiErrorMessage(confirmMutation.error ?? revisionMutation.error)}</p> : null}
      {pending ? <section className="rounded-[18px] border border-primary-100 bg-surface p-4 shadow-[var(--shadow-card)]"><h2 className="text-[17px] font-black">{scope.scope.version_label} 내용을 확인해 주세요</h2><p className="mt-1 text-sm text-ink-600">확인은 결제나 전자서명이 아니라 같은 작업 기준을 봤다는 기록입니다.</p><Button className="mt-4 w-full" disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate()} size="cta">이 내용으로 확인</Button><Button className="mt-2 w-full" onClick={() => setRevisionOpen((open) => !open)} variant="outline">수정 요청</Button>{revisionOpen ? <div className="mt-3 rounded-xl bg-surface-muted p-3"><label className="text-sm font-extrabold" htmlFor="revision-reason">수정이 필요한 내용을 알려주세요</label><Textarea className="mt-2" id="revision-reason" maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="예: 에어컨 탈부착도 포함해 주세요." value={reason} /><Button className="mt-3 w-full" disabled={!reason.trim() || revisionMutation.isPending} onClick={() => revisionMutation.mutate()}>수정 요청 보내기</Button></div> : null}</section> : null}
      {completion?.final_amount_krw ? <p className="sr-only">완료 기준 최종 금액 {money(completion.final_amount_krw)}</p> : null}
    </div>
  );
}

function AgreementProgress({ pending }: { pending: boolean }) {
  const steps = ["짐 확인", "업체 확인", "고객 확인", "완료 확인"];
  const current = pending ? 3 : 4;
  return <ol className="mt-3 grid grid-cols-4">{steps.map((label, index) => { const step = index + 1; const done = step < current; const active = step === current; return <li className="relative text-center" key={label}>{index > 0 ? <span aria-hidden="true" className={`absolute top-3 right-1/2 h-0.5 w-full ${step <= current ? done ? "bg-success" : "bg-primary-600" : "bg-line"}`} /> : null}<span className={`relative z-10 mx-auto grid size-6 place-items-center rounded-full border-2 text-[10px] font-black ${done ? "border-success bg-success text-white" : active ? "border-primary-600 bg-primary-600 text-white" : "border-line bg-surface-muted text-ink-400"}`}>{done ? <Check aria-hidden="true" size={13} weight="bold" /> : step}</span><span className={`mt-1 block text-[9px] font-bold ${active ? "text-primary-700" : done ? "text-success" : "text-ink-600"}`}>{label}</span></li>; })}</ol>;
}

function ConfirmedRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex min-h-11 items-center gap-2.5 border-b border-line last:border-b-0"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700">{icon}</span><strong className="text-[13px]">{label}</strong><span className="ml-auto max-w-[58%] truncate text-right text-[12px] text-ink-600">{value}</span><CaretRight aria-hidden="true" className="text-ink-400" size={16} /></div>;
}
