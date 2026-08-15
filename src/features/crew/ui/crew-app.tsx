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
import { ActivityTimeline, HandoffStatus, InfoCallout, ListGroup, ListRow, PageIntro, SectionHeader, StatusTag, WorkContext } from "@/components/layout/app-primitives";
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
        eyebrow="오늘 현장 브리핑"
        title={brief?.job.title ?? "현장 작업을 불러오는 중입니다"}
        description={startAt ? `${dayFormatter.format(startAt)} ${timeFormatter.format(startAt)} 시작` : "배차된 작업 시간을 확인하고 있습니다."}
      />

      {brief ? <WorkContext
        code={brief.job.job_code}
        route={`${brief.masked_origin ?? "출발지 확인 중"} → ${brief.masked_destination ?? "도착지 확인 중"}`}
        scheduledAt={brief.start_at}
        status={<StatusTag tone={checkedIn ? "success" : "warning"}>{checkedIn ? "체크인 완료" : "체크인 전"}</StatusTag>}
        title={brief.job.title}
        version={brief.scope_version_label}
      /> : null}

      <InfoCallout icon={<MapPin aria-hidden="true" size={18} weight="fill" />}>{brief?.safety_notice ?? "확정된 배차와 안전 안내를 불러오고 있어요."}</InfoCallout>

      <HandoffStatus action={checkedIn ? "현장 상태를 기록해 주세요" : "도착 후 체크인해 주세요"} actor="현장기사" updatedAt={brief?.checked_in_at}>
        {checkedIn ? "승인 범위와 다른 사실은 작업하기 전에 사진 근거와 함께 보고하고, 금액은 업체가 제안합니다." : "체크인 전에 최신 승인 범위, 차량, 함께 일할 인원과 안전 안내를 확인하세요."}
      </HandoffStatus>
      <Button className="mt-5 w-full" onClick={onWork} size="cta">{checkedIn ? "현장 작업 이어가기" : "체크인 항목 확인"}</Button>

      <section className="mt-8" aria-labelledby="crew-standard-title">
        <SectionHeader aside={<StatusTag tone="success">확인된 버전</StatusTag>}><span id="crew-standard-title">오늘 작업 기준</span></SectionHeader>
        <ListGroup variant="plain">
          <ListRow description={brief?.masked_destination ?? "도착지 확인 중"} onClick={onWork}>{brief?.masked_origin ?? "출발지 확인 중"}</ListRow>
          <ListRow description={`${brief?.assigned_worker_count ?? "–"}명 배정`} end={brief?.assigned_vehicle.display_name ?? "–"} onClick={onWork}>차량과 인원</ListRow>
          <ListRow description={issueCount > 0 ? "업체 처리 상태 확인" : "새 보고 없음"} end={`${issueCount}건`} onClick={onWork}>현장 변경</ListRow>
        </ListGroup>
      </section>

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
  const activity = [
    brief ? { actor: "업체", detail: `${brief.assigned_vehicle.display_name} · 작업자 ${brief.assigned_worker_count}명 · 범위 ${brief.scope_version_label}`, time: brief.start_at, title: "현장 배차 전달" } : null,
    brief?.checked_in_at ? { actor: brief.lead_worker_name, detail: "체크인 항목 확인 후 현장 작업을 시작했습니다.", time: brief.checked_in_at, title: "현장 체크인" } : null,
    ...issues.map((issue) => ({ actor: "현장기사", detail: `${issueStatusLabel(issue.status)} · 증빙 ${issue.evidence_media_asset_ids.length}건`, time: issue.reported_at, title: issue.title })),
    brief?.completion_submission_id ? { actor: "현장기사", detail: "완료 체크리스트와 현장 기록을 업체에 전달했습니다.", time: null, title: "완료 기록 제출" } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);
  return (
    <div className="mobile-screen">
      <PageIntro description="체크인, 현장 변경 보고, 완료 제출처럼 직접 남긴 기록만 표시합니다." title="오늘 남긴 기록" />
      {brief ? <WorkContext code={brief.job.job_code} route={`${brief.masked_origin ?? "출발지"} → ${brief.masked_destination ?? "도착지"}`} scheduledAt={brief.start_at} status={<StatusTag tone={brief.checked_in_at ? "success" : "warning"}>{brief.checked_in_at ? "현장 진행" : "체크인 전"}</StatusTag>} title={brief.job.title} version={brief.scope_version_label} /> : null}
      <section className="mt-8" aria-label="현장 기록 목록">
        <SectionHeader aside={`${activity.length}건`}>오늘 작업</SectionHeader>
        {activity.length > 0 ? <ActivityTimeline items={activity} /> : <p className="mt-3 border-y border-line py-5 text-sm text-ink-600">아직 현장에서 남긴 기록이 없습니다.</p>}
      </section>
      {!brief?.checked_in_at && issues.length === 0 ? <InfoCallout icon={<Archive aria-hidden="true" size={18} weight="fill" />}>아직 현장에서 남긴 기록이 없습니다.</InfoCallout> : null}
    </div>
  );
}
