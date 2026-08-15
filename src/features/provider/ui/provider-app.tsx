import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArchiveIcon as Archive,
  BriefcaseIcon as BriefcaseBusiness,
  UserCircleIcon as CircleUserRound,
  HouseIcon as Home,
} from "@phosphor-icons/react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ConnectedProfile } from "@/components/layout/connected-profile";
import { ActivityTimeline, HandoffStatus, InfoCallout, ListGroup, ListRow, PageIntro, PriorityFacts, SectionHeader, StatusTag, WorkContext } from "@/components/layout/app-primitives";
import { MobileAppShell, type MobileNavItem } from "@/components/layout/mobile-app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/model/auth-context";
import {
  getCompletionSummary,
  getDispatch,
  getScopeReview,
  listFieldIssues,
  workflowKeys,
  type Connection,
} from "@/features/workflow/api/workflow-api";
import { LiveProviderWorkflow } from "@/features/workflow/ui/live-provider-workflow";

type ProviderTab = "home" | "work" | "records" | "my";

const items: MobileNavItem<ProviderTab>[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "work", label: "작업", icon: BriefcaseBusiness },
  { id: "records", label: "기록", icon: Archive },
  { id: "my", label: "내 정보", icon: CircleUserRound },
];
const validTabs = new Set<ProviderTab>(items.map(({ id }) => id));
const titles: Record<ProviderTab, string> = { home: "SEQRET", work: "작업 운영", records: "이사 기록", my: "내 정보" };
const moneyFormatter = new Intl.NumberFormat("ko-KR");
const issueStatusLabel = (status: string) => ({ open: "업체 처리 대기", customer_review: "고객 확인 대기", clarification_requested: "설명 보완 필요", approved: "고객 승인", rejected: "고객 거절" })[status] ?? "상태 확인 중";
const completionStatusLabel = (status: string) => ({ requested: "고객 확인 대기", confirmed: "완료 확인", issue_reported: "문제 기록", revoked: "요청 철회", expired: "요청 만료", not_requested: "요청 전" })[status] ?? "상태 확인 중";

export function ProviderApp() {
  const { session, clearSession } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const requested = params.get("tab") as ProviderTab | null;
  const tab = requested && validTabs.has(requested) ? requested : "home";
  const connection: Connection = { accessToken: session!.accessToken, jobId: session!.actor.job_id };
  const scopeQuery = useQuery({ queryKey: workflowKeys.scope(connection.jobId), queryFn: () => getScopeReview(connection) });
  const dispatchQuery = useQuery({ queryKey: workflowKeys.dispatch(connection.jobId), queryFn: () => getDispatch(connection) });
  const issueQuery = useQuery({ queryKey: workflowKeys.fieldIssues(connection.jobId), queryFn: () => listFieldIssues(connection) });
  const completionQuery = useQuery({ queryKey: workflowKeys.completion(connection.jobId), queryFn: () => getCompletionSummary(connection) });
  const changeTab = (next: ProviderTab) => setParams(next === "home" ? {} : { tab: next }, { replace: true });
  const refresh = () => queryClient.invalidateQueries({ queryKey: workflowKeys.root(connection.jobId) });
  const disconnect = () => { clearSession(); navigate("/"); };

  return (
    <MobileAppShell
      current={tab}
      eyebrow={`업체 · ${session!.actor.display_name}`}
      items={items}
      onChange={changeTab}
      onRefresh={tab === "my" ? undefined : refresh}
      root={tab === "home"}
      title={titles[tab]}
    >
      {tab === "home" ? (
        <ProviderHome
          completion={completionQuery.data}
          dispatch={dispatchQuery.data}
          issueCount={issueQuery.data?.filter(({ status }) => status === "open").length ?? 0}
          onWork={() => changeTab("work")}
          scope={scopeQuery.data}
        />
      ) : null}
      {tab === "work" ? <LiveProviderWorkflow embedded /> : null}
      {tab === "records" ? (
        <ProviderRecords
          completion={completionQuery.data}
          dispatch={dispatchQuery.data}
          issues={issueQuery.data ?? []}
          scope={scopeQuery.data}
        />
      ) : null}
      {tab === "my" ? <ConnectedProfile detail="운영 작업에 연결됨" displayName={session!.actor.display_name} onDisconnect={disconnect} roleLabel="업체" /> : null}
    </MobileAppShell>
  );
}

function ProviderHome({ completion, dispatch, issueCount, onWork, scope }: {
  completion: Awaited<ReturnType<typeof getCompletionSummary>> | undefined;
  dispatch: Awaited<ReturnType<typeof getDispatch>> | undefined;
  issueCount: number;
  onWork: () => void;
  scope: Awaited<ReturnType<typeof getScopeReview>> | undefined;
}) {
  const confirmed = scope?.scope.status === "confirmed";
  const completionRequestStatus = completion?.completion_request?.status;
  const priority = !confirmed
    ? scope?.scope.status === "customer_review"
      ? { actor: "고객", kicker: "응답 대기", title: "고객의 범위 확인을 기다리고 있어요", body: "현재 제안은 그대로 유지됩니다. 수정 요청이 오면 새 버전으로 다시 제안하세요." }
      : { actor: "업체", kicker: "범위 제안", title: "작업 범위와 금액을 제안해 주세요", body: "고객이 검수한 짐 목록을 기준으로 포함·제외 작업과 금액을 작성하세요." }
    : dispatch?.status !== "confirmed"
      ? { actor: "업체", kicker: "배차 필요", title: "차량과 현장기사를 배정해 주세요", body: "공동확인된 범위에 맞는 배차 후보를 선택할 차례예요." }
      : issueCount > 0
        ? { actor: "업체", kicker: "현장 확인 필요", title: `처리할 현장 이슈가 ${issueCount}건 있어요`, body: "기사의 증빙과 기준 범위를 확인한 뒤 고객에게 변경안을 보내세요." }
        : completion?.completion_submission_id && !completion?.completion_request
          ? { actor: "업체", kicker: "완료 검토", title: "현장 완료 기록을 검토해 주세요", body: "체크리스트·작업시간·최종 금액을 확인한 뒤 고객에게 완료 확인을 요청하세요." }
          : completionRequestStatus === "requested"
            ? { actor: "고객", kicker: "응답 대기", title: "고객의 완료 확인을 기다리고 있어요", body: "완료 기록과 최종 금액을 보냈습니다. 요청 상태가 바뀌면 다음 작업을 이어가세요." }
            : { actor: "현장기사", kicker: "현장 진행", title: "현장 완료 기록을 기다리고 있어요", body: "현장 이슈나 완료 제출이 도착하면 바로 이어서 처리할 수 있습니다." };
  const route = scope?.job;
  return (
    <div className="mobile-screen">
      <PageIntro
        eyebrow="업체 운영"
        title="멈춘 작업부터 처리하세요"
        description="범위, 배차, 현장 이슈와 완료 요청을 현재 담당 순서로 정리했습니다."
      />

      {route ? <WorkContext
        code={route.job_code}
        route={`${route.origin_summary ?? "출발지"} → ${route.destination_summary ?? "도착지"}`}
        scheduledAt={route.scheduled_at}
        status={<StatusTag tone={confirmed ? "success" : "warning"}>{confirmed ? "공동확인 완료" : scope?.scope.status === "customer_review" ? "고객 확인 대기" : "업체 처리 중"}</StatusTag>}
        title={route.title}
        version={scope?.scope.version_label}
      /> : null}

      <HandoffStatus action={priority.title} actor={priority.actor}>{priority.body}</HandoffStatus>
      <div className="mt-5 border-y border-line py-4">
        <PriorityFacts items={[
          { label: "현재 범위", value: scope?.scope.version_label ?? "확인 중" },
          { label: "작업", value: `${scope?.scope.item_count ?? "–"}개` },
          { label: "기준 금액", value: scope?.quote ? `${moneyFormatter.format(scope.quote.total_amount_krw)}원` : "미정" },
        ]} />
        <Button className="mt-4 w-full" onClick={onWork} size="cta">{priority.actor === "업체" ? "우선 작업 처리" : "현재 상태 확인"}</Button>
      </div>

      <section className="mt-8" aria-labelledby="provider-status-title">
        <SectionHeader aside="담당 순서"><span id="provider-status-title">운영 큐</span></SectionHeader>
        <ListGroup variant="plain">
          <ListRow description={confirmed ? `${scope?.scope.version_label} 공동확인 완료` : "업체 제안 또는 고객 응답 대기"} end={confirmed ? "완료" : "확인"} leading={<span className="tabular-nums text-sm font-black text-primary-700">01</span>} onClick={onWork} selected={!confirmed}>범위와 견적</ListRow>
          <ListRow description={dispatch?.status === "confirmed" ? "차량·대표 기사·작업 인원 확정" : "범위에 맞는 후보 비교 필요"} end={dispatch?.status === "confirmed" ? "완료" : "처리"} leading={<span className="tabular-nums text-sm font-black text-primary-700">02</span>} onClick={onWork} selected={confirmed && dispatch?.status !== "confirmed"}>배차</ListRow>
          <ListRow description={issueCount > 0 ? "현장 근거를 작업·금액 변경안으로 전환" : "새 현장 보고 없음"} end={`${issueCount}건`} leading={<span className="tabular-nums text-sm font-black text-primary-700">03</span>} onClick={onWork} selected={issueCount > 0}>현장 변경</ListRow>
          <ListRow description={completion?.completion_submission_id ? "현장 제출 검토 후 고객에게 확인 요청" : "현장기사 제출 대기"} end={completion?.completion_submission_id ? "검토" : "대기"} leading={<span className="tabular-nums text-sm font-black text-primary-700">04</span>} onClick={onWork} selected={Boolean(completion?.completion_submission_id && !completion.completion_request)}>완료와 문서</ListRow>
        </ListGroup>
      </section>

      <InfoCallout icon={<Archive aria-hidden="true" size={18} weight="fill" />}>업체가 제안한 변경은 고객이 승인한 뒤에만 새 범위와 금액으로 반영됩니다.</InfoCallout>
    </div>
  );
}

function ProviderRecords({ completion, dispatch, issues, scope }: {
  completion: Awaited<ReturnType<typeof getCompletionSummary>> | undefined;
  dispatch: Awaited<ReturnType<typeof getDispatch>> | undefined;
  issues: Awaited<ReturnType<typeof listFieldIssues>>;
  scope: Awaited<ReturnType<typeof getScopeReview>> | undefined;
}) {
  const activity = [
    scope?.company_confirmed_at ? { actor: "업체", detail: `${scope.scope.item_count}개 작업 · ${scope.quote ? `${moneyFormatter.format(scope.quote.total_amount_krw)}원` : "금액 미정"}`, time: scope.company_confirmed_at, title: `${scope.scope.version_label} 범위·금액 제안` } : null,
    scope?.customer_confirmed_at ? { actor: "고객", detail: "업체 제안과 같은 버전을 확인했습니다.", time: scope.customer_confirmed_at, title: `${scope.scope.version_label} 공동확인 완료` } : null,
    dispatch?.confirmed_at ? { actor: "업체", detail: `${dispatch.vehicle_options.find(({ id }) => id === dispatch.selected_vehicle_id)?.display_name ?? "차량"} · 작업자 ${dispatch.selected_worker_ids.length}명`, time: dispatch.confirmed_at, title: "배차 확정" } : null,
    ...issues.map((issue) => ({ actor: "현장기사", detail: `${issueStatusLabel(issue.status)} · 증빙 ${issue.evidence_media_asset_ids.length}건`, time: issue.reported_at, title: issue.title })),
    completion?.completed_at ? { actor: "현장기사", detail: `체크리스트 ${completion.checklist.completed_count}/${completion.checklist.total_count} · ${completion.duration_minutes ?? 0}분`, time: completion.completed_at, title: "완료 기록 제출" } : null,
    completion?.completion_request ? { actor: "업체", detail: completionStatusLabel(completion.completion_request.status), time: completion.completion_request.requested_at, title: "고객 완료 확인 요청" } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);
  return (
    <div className="mobile-screen">
      <PageIntro description="범위 제안부터 배차·현장·완료 요청까지 행위자와 시각을 확인합니다." title="운영 이력" />
      {scope ? <WorkContext code={scope.job.job_code} route={`${scope.job.origin_summary ?? "출발지"} → ${scope.job.destination_summary ?? "도착지"}`} scheduledAt={scope.job.scheduled_at} status={<StatusTag tone={scope.scope.status === "confirmed" ? "success" : "warning"}>{scope.scope.status === "confirmed" ? "공동확인 완료" : "확인 진행 중"}</StatusTag>} title={scope.job.title} version={scope.scope.version_label} /> : null}
      <section className="mt-8" aria-label="이사 기록 목록">
        <SectionHeader aside={`${activity.length}건`}>운영 이력</SectionHeader>
        {activity.length > 0 ? <ActivityTimeline items={activity} /> : <p className="mt-3 border-y border-line py-5 text-sm text-ink-600">아직 기록된 운영 이력이 없습니다.</p>}
      </section>
      {issues.length === 0 ? <InfoCallout icon={<Archive aria-hidden="true" size={18} weight="fill" />}>현재 보고된 현장 변경이 없습니다.</InfoCallout> : null}
    </div>
  );
}
