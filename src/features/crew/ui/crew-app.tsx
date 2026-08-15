import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArchiveIcon as Archive,
  BriefcaseIcon as BriefcaseBusiness,
  UserCircleIcon as CircleUserRound,
  HouseIcon as Home,
  MapPinIcon as MapPin,
} from "@phosphor-icons/react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ConnectedProfile } from "@/components/layout/connected-profile";
import { InfoCallout, ListGroup, ListRow, PageIntro, PriorityFacts, PriorityPanel, SectionHeader, StatusTag } from "@/components/layout/app-primitives";
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

type CrewTab = "home" | "work" | "records" | "my";

const items: MobileNavItem<CrewTab>[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "work", label: "작업", icon: BriefcaseBusiness },
  { id: "records", label: "기록", icon: Archive },
  { id: "my", label: "내 정보", icon: CircleUserRound },
];
const validTabs = new Set<CrewTab>(items.map(({ id }) => id));
const titles: Record<CrewTab, string> = { home: "SEQRET", work: "현장 진행", records: "현장 기록", my: "내 정보" };
const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
const dayFormatter = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" });
const timeFormatter = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

export function CrewApp() {
  const { session, clearSession } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const requested = params.get("tab") as CrewTab | null;
  const tab = requested && validTabs.has(requested) ? requested : "home";
  const connection: Connection = { accessToken: session!.accessToken, jobId: session!.actor.job_id };
  const briefQuery = useQuery({ queryKey: workflowKeys.brief(connection.jobId), queryFn: () => getFieldBrief(connection) });
  const issueQuery = useQuery({ queryKey: workflowKeys.fieldIssues(connection.jobId), queryFn: () => listFieldIssues(connection) });
  const changeTab = (next: CrewTab) => setParams(next === "home" ? {} : { tab: next }, { replace: true });
  const refresh = () => queryClient.invalidateQueries({ queryKey: workflowKeys.root(connection.jobId) });
  const disconnect = () => { clearSession(); navigate("/"); };

  return (
    <MobileAppShell current={tab} eyebrow={`현장기사 · ${session!.actor.display_name}`} items={items} onChange={changeTab} onRefresh={tab === "my" ? undefined : refresh} root={tab === "home"} title={titles[tab]}>
      {tab === "home" ? <CrewHome brief={briefQuery.data} issueCount={issueQuery.data?.length ?? 0} onWork={() => changeTab("work")} /> : null}
      {tab === "work" ? <LiveCrewWorkflow embedded /> : null}
      {tab === "records" ? <CrewRecords brief={briefQuery.data} issues={issueQuery.data ?? []} /> : null}
      {tab === "my" ? <ConnectedProfile detail="현장 작업에 연결됨" displayName={session!.actor.display_name} onDisconnect={disconnect} roleLabel="현장기사" /> : null}
    </MobileAppShell>
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
        eyebrow={startAt ? `${dayFormatter.format(startAt)} · ${timeFormatter.format(startAt)}` : "오늘 작업"}
        title={checkedIn ? <>현재 현장 작업을<br />이어가세요</> : <>도착했다면<br />체크인해 주세요</>}
        description={brief?.job.title ?? "확정된 현장 작업을 불러오는 중입니다."}
      />

      <PriorityPanel
        action={<Button className="w-full" onClick={onWork} size="cta">{checkedIn ? "현장 작업 이어가기" : "현장 체크인 시작"}</Button>}
        description={checkedIn ? "필요한 변경은 사진 근거와 함께 보고하고, 완료 항목을 확인하세요." : "체크인 후에만 현장 변경 보고와 완료 제출을 시작할 수 있어요."}
        label={checkedIn ? "현장 진행 중" : "체크인 전"}
        meta={<PriorityFacts items={[
          { label: "범위", value: brief?.scope_version_label ?? "확인 중" },
          { label: "차량", value: brief?.assigned_vehicle.display_name ?? "확인 중" },
          { label: "인원", value: `${brief?.assigned_worker_count ?? "–"}명` },
        ]} />}
        title={checkedIn ? "현장 이슈와 완료 항목을 확인하세요" : "확인된 작업 범위로 시작하세요"}
        tone={checkedIn ? "primary" : "warning"}
      />

      <section className="mt-8" aria-labelledby="crew-standard-title">
        <SectionHeader aside={<StatusTag tone="success">확인된 버전</StatusTag>}><span id="crew-standard-title">오늘 작업 기준</span></SectionHeader>
        <ListGroup variant="plain">
          <ListRow description={brief?.masked_destination ?? "도착지 확인 중"} onClick={onWork}>{brief?.masked_origin ?? "출발지 확인 중"}</ListRow>
          <ListRow description={`${brief?.assigned_worker_count ?? "–"}명 배정`} end={brief?.assigned_vehicle.display_name ?? "–"} onClick={onWork}>차량과 인원</ListRow>
          <ListRow description={issueCount > 0 ? "업체 처리 상태 확인" : "새 보고 없음"} end={`${issueCount}건`} onClick={onWork}>현장 변경</ListRow>
        </ListGroup>
      </section>

      <InfoCallout icon={<MapPin aria-hidden="true" size={18} weight="fill" />}>{brief?.safety_notice ?? "확정된 배차와 안전 안내를 불러오고 있어요."}</InfoCallout>

      <section className="mt-8" aria-labelledby="crew-check-title">
        <SectionHeader aside={`${confirmedChecks}/${totalChecks} 확인`}><span id="crew-check-title">오늘의 순서</span></SectionHeader>
        <ListGroup variant="plain">
          <ListRow end={checkedIn ? "완료" : "지금 할 일"} onClick={onWork} selected={!checkedIn}>현장 체크인</ListRow>
          <ListRow end={issueCount > 0 ? `${issueCount}건 보고` : "필요할 때"} onClick={onWork} selected={checkedIn && issueCount > 0}>변경·이슈 기록</ListRow>
          <ListRow end={brief?.completion_submission_id ? "제출됨" : `${confirmedChecks}/${totalChecks}`} onClick={onWork} selected={checkedIn && !brief?.completion_submission_id}>완료 확인과 제출</ListRow>
        </ListGroup>
      </section>
    </div>
  );
}

function CrewRecords({ brief, issues }: {
  brief: Awaited<ReturnType<typeof getFieldBrief>> | undefined;
  issues: Awaited<ReturnType<typeof listFieldIssues>>;
}) {
  return (
    <div className="mobile-screen">
      <PageIntro description="체크인, 현장 변경 보고, 완료 제출처럼 직접 남긴 기록만 표시합니다." title="현장 기록" />
      <section className="mt-8" aria-label="현장 기록 목록">
        <SectionHeader>오늘 작업</SectionHeader>
        <ListGroup>
          <ListRow description={brief?.scope_version_label ?? "배차 대기"}>배차 확인</ListRow>
          {brief?.checked_in_at ? <ListRow description={dateTimeFormatter.format(new Date(brief.checked_in_at))}>현장 체크인</ListRow> : null}
          {issues.map((issue) => <ListRow key={issue.field_issue_id} description={`${issue.status} · 증빙 ${issue.evidence_media_asset_ids.length}건`}>{issue.title}</ListRow>)}
          {brief?.completion_submission_id ? <ListRow description="업체와 고객에게 전달됨">완료 기록 제출</ListRow> : null}
        </ListGroup>
      </section>
      {!brief?.checked_in_at && issues.length === 0 ? <InfoCallout icon={<Archive aria-hidden="true" size={18} weight="fill" />}>아직 현장에서 남긴 기록이 없습니다.</InfoCallout> : null}
    </div>
  );
}
