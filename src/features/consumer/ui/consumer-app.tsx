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
import { InfoCallout, ListGroup, ListRow, PageIntro, PriorityFacts, PriorityPanel, SectionHeader, StatusTag } from "@/components/layout/app-primitives";
import { MobileAppShell, type MobileNavItem } from "@/components/layout/mobile-app-shell";
import { Button } from "@/components/ui/button";
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
              completionReady={completionQuery.data?.completion_request?.status === "requested"}
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

      <section className="mt-8" aria-labelledby="current-standard-title">
        <SectionHeader aside={<StatusTag tone={requiresScopeReview ? "warning" : "success"}>{scopeStatus}</StatusTag>}><span id="current-standard-title">현재 기준</span></SectionHeader>
        <ListGroup>
          <ListRow description={scopeStatus} end={scope?.scope.version_label ?? "–"} onClick={() => onOpenTask("scope")}>작업 범위</ListRow>
          <ListRow end={money(scope?.quote?.total_amount_krw)} onClick={() => onOpenTask("scope")}>확인 금액</ListRow>
          <ListRow description={scope?.job.destination_summary ?? "도착지 확인 중"} onClick={onMove}>{scope?.job.origin_summary ?? "출발지 확인 중"}</ListRow>
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

function RecordsTab({ completionReady, onMove, scope }: { completionReady: boolean; onMove: () => void; scope: ScopeReview | undefined }) {
  return (
    <div className="mobile-screen">
      <PageIntro description="확인·변경·완료처럼 거래 기준에 영향을 준 기록만 모아봅니다." title="이사 기록" />
      <section className="mt-8">
        <SectionHeader aside={scope?.scope.version_label}>공동확인</SectionHeader>
        <ListGroup variant="plain">
          <ListRow description={scope?.scope.status === "customer_review" ? "고객 확인이 필요해요" : "최신 기준으로 사용 중"} end={money(scope?.quote?.total_amount_krw)} onClick={onMove}>작업 범위와 견적</ListRow>
          <ListRow description="승인된 변경만 새 버전과 금액에 반영됩니다" onClick={onMove}>현장 변경 기록</ListRow>
          <ListRow description={completionReady ? "고객 확인 요청 도착" : "현장 제출 대기"} onClick={onMove}>완료 기록</ListRow>
        </ListGroup>
      </section>
      <InfoCallout icon={<Bell aria-hidden="true" size={18} weight="fill" />}>결정이 필요한 기록은 홈의 첫 번째 항목으로 다시 표시됩니다.</InfoCallout>
    </div>
  );
}
