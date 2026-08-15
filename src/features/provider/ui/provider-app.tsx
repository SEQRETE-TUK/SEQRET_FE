import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArchiveIcon as Archive,
  BriefcaseIcon as BriefcaseBusiness,
  UserCircleIcon as CircleUserRound,
  HouseIcon as Home,
} from "@phosphor-icons/react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ConnectedProfile } from "@/components/layout/connected-profile";
import { InfoCallout, ListGroup, ListRow, PageIntro, PriorityFacts, PriorityPanel, SectionHeader, StatusTag } from "@/components/layout/app-primitives";
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
          dispatchStatus={dispatchQuery.data?.status}
          issues={issueQuery.data ?? []}
          scopeVersion={scopeQuery.data?.scope.version_label}
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
  const priority = issueCount > 0
    ? { kicker: "현장 확인 필요", title: `처리할 현장 이슈가 ${issueCount}건 있어요`, body: "증빙과 범위를 확인한 뒤 고객에게 변경안을 보내세요." }
    : dispatch?.status !== "confirmed"
      ? { kicker: "다음 작업", title: "차량과 현장기사를 배정해 주세요", body: "확정 범위에 맞는 배차 후보를 선택할 차례예요." }
      : { kicker: "운영 중", title: "현장 진행 상태를 확인해 주세요", body: "현장 보고와 완료 제출이 도착하면 바로 이어서 처리할 수 있어요." };
  const route = scope?.job;
  const confirmed = scope?.scope.status === "confirmed";
  return (
    <div className="mobile-screen">
      <PageIntro
        eyebrow={`오늘 운영 · ${scope?.scope.version_label ?? "최신 범위 확인 중"}`}
        title={issueCount > 0 ? <>처리할 현장 변경이<br />도착했어요</> : <>다음 운영 작업을<br />확인하세요</>}
        description={route ? `${route.origin_summary ?? "출발지"} → ${route.destination_summary ?? "도착지"}` : "이사 정보를 불러오는 중입니다."}
      />

      <PriorityPanel
        action={<Button className="w-full" onClick={onWork} size="cta">{priority.kicker === "운영 중" ? "현장 진행 확인" : "다음 작업 확인"}</Button>}
        description={priority.body}
        label={priority.kicker}
        meta={<PriorityFacts items={[
          { label: "버전", value: scope?.scope.version_label ?? "확인 중" },
          { label: "작업", value: `${scope?.scope.item_count ?? "–"}개` },
          { label: "금액", value: scope?.quote ? `${moneyFormatter.format(scope.quote.total_amount_krw)}원` : "미정" },
        ]} />}
        title={priority.title}
        tone={issueCount > 0 ? "warning" : "primary"}
      />

      <section className="mt-8" aria-labelledby="provider-status-title">
        <SectionHeader aside={<StatusTag tone={confirmed ? "success" : "warning"}>{confirmed ? "확인 완료" : "확인 중"}</StatusTag>}><span id="provider-status-title">현재 기준</span></SectionHeader>
        <ListGroup variant="plain">
          <ListRow description={`${scope?.scope.item_count ?? "–"}개 작업 항목`} end={scope?.scope.version_label ?? "–"} onClick={onWork}>범위와 견적</ListRow>
          <ListRow description={dispatch?.status === "confirmed" ? "차량·현장 직원 확정" : "범위 확정 후 배정"} end={dispatch?.status === "confirmed" ? "확정" : "준비 중"} onClick={onWork}>배차</ListRow>
          <ListRow description={issueCount > 0 ? "고객에게 변경안 전송 필요" : "새 현장 보고 없음"} end={`${issueCount}건`} onClick={onWork}>현장 변경</ListRow>
        </ListGroup>
      </section>

      <section className="mt-8" aria-labelledby="provider-numbers-title">
        <SectionHeader><span id="provider-numbers-title">기록</span></SectionHeader>
        <ListGroup variant="plain">
          <ListRow description={completion?.completion_submission_id ? "현장 제출 수신" : "현장 제출 대기"} onClick={onWork}>완료 기록</ListRow>
          <ListRow description={completion?.archive_ready ? "다운로드 가능" : "완료 확인 후 생성"} onClick={onWork}>최종 문서</ListRow>
        </ListGroup>
      </section>

      <InfoCallout icon={<Archive aria-hidden="true" size={18} weight="fill" />}>업체가 제안한 변경은 고객이 승인한 뒤에만 새 범위와 금액으로 반영됩니다.</InfoCallout>
    </div>
  );
}

function ProviderRecords({ completion, dispatchStatus, issues, scopeVersion }: {
  completion: Awaited<ReturnType<typeof getCompletionSummary>> | undefined;
  dispatchStatus: string | undefined;
  issues: Awaited<ReturnType<typeof listFieldIssues>>;
  scopeVersion: string | undefined;
}) {
  return (
    <div className="mobile-screen">
      <PageIntro description="범위 확정, 배차, 현장 변경, 완료 제출을 시간 흐름대로 확인합니다." title="이사 기록" />
      <section className="mt-8" aria-label="이사 기록 목록">
        <SectionHeader>운영 이력</SectionHeader>
        <ListGroup>
          <ListRow description="고객·업체 공동확인 기준">작업 범위 <span className="text-ink-600">{scopeVersion ?? "준비 중"}</span></ListRow>
          <ListRow description={dispatchStatus === "confirmed" ? "차량과 현장 직원 확정" : "배차 준비 중"}>배차 상태</ListRow>
          {issues.map((issue) => <ListRow key={issue.field_issue_id} description={`현장 이슈 · ${issue.status}`}>{issue.title}</ListRow>)}
          <ListRow description={completion?.completion_submission_id ? "현장 제출 수신" : "제출 대기"}>완료 기록</ListRow>
        </ListGroup>
      </section>
      {issues.length === 0 ? <InfoCallout icon={<Archive aria-hidden="true" size={18} weight="fill" />}>현재 보고된 현장 변경이 없습니다.</InfoCallout> : null}
    </div>
  );
}
