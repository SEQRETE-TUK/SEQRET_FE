import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellIcon as Bell,
  BriefcaseIcon as BriefcaseBusiness,
  CameraIcon as Camera,
  ClipboardTextIcon as ClipboardCheck,
  ClockCounterClockwiseIcon as History,
  HouseIcon as Home,
  UserCircleIcon as UserRound,
} from "@phosphor-icons/react";
import {
  SecurityStatusIcon as ShieldCheck,
} from "@/components/icons";
import { useNavigate, useSearchParams } from "react-router-dom";

import { mockApiEnabled } from "@/api/mock-api";
import { ConnectedProfile } from "@/components/layout/connected-profile";
import { ActivityTimeline, InfoCallout, ListGroup, ListRow, PageIntro, PriorityFacts, PriorityPanel, SectionHeader, StatusTag, WorkContext } from "@/components/layout/app-primitives";
import { MobileAppShell, type MobileNavItem } from "@/components/layout/mobile-app-shell";
import { Button } from "@/components/ui/button";
import { ProgressSteps } from "@/components/workflow/workflow-task";
import { useAuth } from "@/features/auth/model/auth-context";
import {
  getCompletionSummary,
  getScopeReview,
  workflowKeys,
  type Connection,
  type ScopeReview,
} from "@/features/workflow/api/workflow-api";
import { LiveConsumerWorkflow } from "@/features/workflow/ui/live-consumer-workflow";

type ConsumerTab = "home" | "work" | "records" | "my";

const moneyFormatter = new Intl.NumberFormat("ko-KR");
const dateFormatter = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" });
const money = (value: number | null | undefined) => value == null ? "금액 확인 중" : `${moneyFormatter.format(value)}원`;
const completionRequestLabel = (status: string) => ({ requested: "고객 확인 대기", confirmed: "완료 확인", issue_reported: "문제 기록", revoked: "요청 철회", expired: "요청 만료", not_requested: "요청 전" })[status] ?? "상태 확인 중";

const tabs: MobileNavItem<ConsumerTab>[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "work", label: "작업", icon: BriefcaseBusiness },
  { id: "records", label: "기록", icon: History },
  { id: "my", label: "내 정보", icon: UserRound },
];
const validTabs = new Set<ConsumerTab>(tabs.map(({ id }) => id));
const titles: Record<ConsumerTab, string> = { home: "SEQRET", work: "내 이사 작업", records: "이사 기록", my: "내 정보" };

export function ConsumerApp() {
  const { session, clearSession } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const requested = params.get("tab") as ConsumerTab | null;
  const tab = requested && validTabs.has(requested) ? requested : "home";
  const setTab = (next: ConsumerTab) => setParams(next === "home" ? {} : { tab: next }, { replace: true });
  const connection: Connection = { accessToken: session!.accessToken, jobId: session!.actor.job_id };
  const scopeQuery = useQuery({
    queryKey: workflowKeys.scope(session!.actor.job_id),
    queryFn: () => getScopeReview(connection),
  });
  const completionQuery = useQuery({
    queryKey: workflowKeys.completion(session!.actor.job_id),
    queryFn: () => getCompletionSummary(connection),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: workflowKeys.root(session!.actor.job_id) });
  const disconnect = () => {
    clearSession();
    navigate("/");
  };

  return (
    <MobileAppShell
      current={tab}
      eyebrow={`고객 · ${session!.actor.display_name}`}
      items={tabs}
      onChange={setTab}
      onHeaderAction={tab === "home" ? () => setTab("records") : undefined}
      onRefresh={tab === "work" ? refresh : undefined}
      root={tab === "home"}
      title={titles[tab]}
    >
          {tab === "home" ? (
            <HomeTab
              completionReady={completionQuery.data?.completion_request?.status === "requested"}
              customerName={session!.actor.display_name}
              onCapture={() => navigate("/consumer/capture")}
              onOpenTask={(task) => setParams({ tab: "work", task })}
              onMove={() => setTab("work")}
              scope={scopeQuery.data}
            />
          ) : null}
          {tab === "work" ? <LiveConsumerWorkflow embedded /> : null}
          {tab === "records" ? (
            <RecordsTab
              completion={completionQuery.data}
              onMove={() => setTab("work")}
              scope={scopeQuery.data}
            />
          ) : null}
      {tab === "my" ? <ConnectedProfile detail="이사 기록에 연결됨" displayName={session!.actor.display_name} onDisconnect={disconnect} roleLabel="고객" /> : null}
    </MobileAppShell>
  );
}

function HomeTab({
  completionReady,
  customerName,
  onCapture,
  onOpenTask,
  onMove,
  scope,
}: {
  completionReady: boolean;
  customerName: string;
  onCapture: () => void;
  onOpenTask: (task: "scope" | "completion") => void;
  onMove: () => void;
  scope: ScopeReview | undefined;
}) {
  const requiresScopeReview = scope?.scope.status === "customer_review";
  const nextLabel = requiresScopeReview ? "변경 내용 확인" : completionReady ? "완료 기록 확인" : "내 이사 작업 확인";
  const scheduledAt = scope?.job.scheduled_at ? new Date(scope.job.scheduled_at) : null;
  const scopeStatus = requiresScopeReview ? "고객 확인 대기" : scope?.scope.status === "confirmed" ? "고객·업체 확인 완료" : "최신 상태 확인 중";
  return (
    <div className="mobile-screen">
      <PageIntro
        eyebrow={scheduledAt ? `${dateFormatter.format(scheduledAt)} 이사` : "이사 일정 확인 중"}
        title={requiresScopeReview || completionReady ? <>{customerName}님,<br />확인할 내용이 있어요</> : <>{customerName}님,<br />현재 기준을 확인하세요</>}
      />

      <PriorityPanel
        action={<Button className="w-full" onClick={() => requiresScopeReview ? onOpenTask("scope") : completionReady ? onOpenTask("completion") : onMove()} size="cta">{nextLabel}</Button>}
        description={requiresScopeReview ? "업체가 보낸 작업 범위와 금액을 검토해 주세요." : completionReady ? "현장 작업과 최종 금액이 도착했어요." : "확인된 기준과 남은 작업을 한곳에서 볼 수 있어요."}
        label={requiresScopeReview ? "공동확인 대기" : completionReady ? "완료 확인 대기" : "현재 기준"}
        meta={scope ? <PriorityFacts items={[
          { label: "버전", value: scope.scope.version_label },
          { label: "확인 금액", value: money(scope.quote?.total_amount_krw) },
          { label: "작업", value: `${scope.scope.item_count}개` },
        ]} /> : "최신 내용을 불러오는 중"}
        title={requiresScopeReview ? "업체가 작업 범위를 제안했어요" : completionReady ? "완료 기록을 확인해 주세요" : "확인된 작업 범위를 볼 수 있어요"}
      />

      <section className="mt-8" aria-labelledby="consumer-progress-title">
        <SectionHeader aside={scopeStatus}><span id="consumer-progress-title">이사 진행</span></SectionHeader>
        <div className="mt-4 border-y border-line py-4">
          <ProgressSteps current={requiresScopeReview ? 1 : completionReady ? 4 : scope?.scope.status === "confirmed" ? 2 : 0} />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="current-standard-title">
        <SectionHeader aside={<StatusTag tone={requiresScopeReview ? "warning" : "success"}>{scopeStatus}</StatusTag>}><span id="current-standard-title">현재 기준</span></SectionHeader>
        {scope ? <WorkContext
          code={scope.job.job_code}
          route={`${scope.job.origin_summary ?? "출발지 확인 중"} → ${scope.job.destination_summary ?? "도착지 확인 중"}`}
          scheduledAt={scope.job.scheduled_at}
          title={scope.job.title}
          version={scope.scope.version_label}
        /> : null}
        <ListGroup className="mt-0 border-t-0" variant="plain">
          <ListRow description={scopeStatus} end={scope?.scope.version_label ?? "–"} onClick={() => onOpenTask("scope")}>작업 범위</ListRow>
          <ListRow end={money(scope?.quote?.total_amount_krw)} onClick={() => onOpenTask("scope")}>확인 금액</ListRow>
        </ListGroup>
      </section>

      <section className="mt-8" aria-labelledby="record-shortcut-title">
        <SectionHeader><span id="record-shortcut-title">기록과 준비</span></SectionHeader>
        <ListGroup variant="plain">
          <ListRow description={`${scope?.scope.item_count ?? "–"}개 항목 · 직접 수정 가능`} end={<ClipboardCheck aria-hidden="true" className="size-5" />} onClick={onMove}>짐 목록과 작업 범위</ListRow>
          <ListRow description="촬영한 짐을 분석 초안으로 만들어요" end={<Camera aria-hidden="true" className="size-5" />} onClick={onCapture}>촬영으로 짐 목록 만들기</ListRow>
          <ListRow
            description={completionReady ? "완료 사진과 최종 금액을 확인하세요" : "현장 제출 대기"}
            leading={completionReady && mockApiEnabled ? <img alt="완료 사진 미리보기" className="size-[72px] rounded-xl object-cover" height="72" loading="lazy" src="/room-after-evidence.png" width="72" /> : undefined}
            onClick={() => onOpenTask("completion")}
          >완료 기록</ListRow>
        </ListGroup>
      </section>

      <InfoCallout icon={<ShieldCheck aria-hidden="true" size={18} weight="fill" />}>현장 직원은 고객과 업체가 함께 확인한 최신 버전만 볼 수 있어요.</InfoCallout>
    </div>
  );
}

function RecordsTab({ completion, onMove, scope }: {
  completion: Awaited<ReturnType<typeof getCompletionSummary>> | undefined;
  onMove: () => void;
  scope: ScopeReview | undefined;
}) {
  const completionReady = completion?.completion_request?.status === "requested";
  const activity = [
    scope?.company_confirmed_at ? {
      actor: scope.job.company_display_name ?? "업체",
      detail: `${scope.scope.item_count}개 작업 · ${money(scope.quote?.total_amount_krw)}`,
      time: scope.company_confirmed_at,
      title: `${scope.scope.version_label} 작업 범위와 금액 제안`,
    } : null,
    scope?.revision_request ? {
      actor: "고객",
      detail: scope.revision_request.reason,
      time: scope.revision_request.requested_at,
      title: "작업 범위 수정 요청",
    } : null,
    scope?.customer_confirmed_at ? {
      actor: "고객",
      detail: "업체와 같은 버전을 확인했습니다.",
      time: scope.customer_confirmed_at,
      title: `${scope.scope.version_label} 공동확인 완료`,
    } : null,
    ...(completion?.field_changes ?? []).map((change) => ({
      actor: "고객·업체·현장기사",
      detail: `${change.amount_delta_krw > 0 ? "+" : ""}${money(change.amount_delta_krw)} · ${change.status}`,
      time: change.decided_at,
      title: change.title,
    })),
    completion?.completion_request ? {
      actor: scope?.job.company_display_name ?? "업체",
      detail: `최종 금액 ${money(completion.final_amount_krw)} · ${completionRequestLabel(completion.completion_request.status)}`,
      time: completion.completion_request.requested_at,
      title: "완료 확인 요청",
    } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);
  return (
    <div className="mobile-screen">
      <PageIntro description="누가 무엇을 요청하고 확인했는지 시간 순서로 남습니다." title="변경과 확인 이력" />
      {scope ? <WorkContext code={scope.job.job_code} route={`${scope.job.origin_summary ?? "출발지"} → ${scope.job.destination_summary ?? "도착지"}`} scheduledAt={scope.job.scheduled_at} status={<StatusTag tone={scope.scope.status === "confirmed" ? "success" : "warning"}>{scope.scope.status === "confirmed" ? "공동확인 완료" : "확인 진행 중"}</StatusTag>} title={scope.job.title} version={scope.scope.version_label} /> : null}
      <section className="mt-8">
        <SectionHeader aside={`${activity.length}건`}>상태 변경 이력</SectionHeader>
        {activity.length > 0 ? <ActivityTimeline items={activity} /> : <p className="mt-3 border-y border-line py-5 text-sm text-ink-600">아직 확인하거나 변경한 기록이 없습니다.</p>}
      </section>
      {scope?.scope.status === "customer_review" || completionReady ? <Button className="mt-8 w-full" onClick={onMove} size="cta">대기 중인 작업 확인</Button> : null}
      <InfoCallout icon={<Bell aria-hidden="true" size={18} weight="fill" />}>요청을 보낸 뒤에도 다음 담당자와 기존 기준은 기록에서 계속 확인할 수 있습니다.</InfoCallout>
    </div>
  );
}
