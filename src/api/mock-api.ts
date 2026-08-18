import { ApiError } from "@/api/client";
import type {
  AnalysisReview,
  CaptureSession,
  MediaAsset,
  MediaUploadTarget,
  ScopeVersionSummary,
} from "@/features/capture/api/capture-api";
import type {
  ActorSelf,
  ChangeProposal,
  CompletionRequest,
  CompletionSummary,
  CustomerOnboardingInput,
  CustomerOnboardingResult,
  DispatchView,
  FieldBrief,
  FieldIssue,
  Invitation,
  InvitationIssued,
  MoveJob,
  ParticipantRole,
  ScopeReview,
} from "@/features/workflow/api/workflow-api";

export const mockApiEnabled = import.meta.env.VITE_MOCK_API === "true";

export const mockAccessSecrets: Record<ParticipantRole, string> = {
  customer: "seqret_mock_customer_0000000000000000000000000000",
  company_manager: "seqret_mock_provider_0000000000000000000000000000",
  field_worker: "seqret_mock_worker_000000000000000000000000000000",
};

export const mockJobId = "11111111-1111-4111-8111-111111111111";
const JOB_ID = mockJobId;
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const PROVIDER_ID = "33333333-3333-4333-8333-333333333333";
const WORKER_ID = "44444444-4444-4444-8444-444444444444";
const ORIGIN_ZONE_ID = "55555555-5555-4555-8555-555555555555";
const KITCHEN_ZONE_ID = "55555555-5555-4555-8555-555555555556";
const ENTRANCE_ZONE_ID = "55555555-5555-4555-8555-555555555557";
const DESTINATION_ZONE_ID = "66666666-6666-4666-8666-666666666666";
const SCOPE_ID = "77777777-7777-4777-8777-777777777777";
const DISPATCH_ID = "88888888-8888-4888-8888-888888888888";

const now = () => new Date().toISOString();
const future = () => new Date(Date.now() + 86_400_000).toISOString();
const copy = <T>(value: T): T => structuredClone(value);
const jsonBody = <T>(init: RequestInit): T => JSON.parse(String(init.body ?? "{}")) as T;

interface MockState {
  actors: Record<string, ActorSelf>;
  analysisReview: AnalysisReview;
  completion: CompletionSummary;
  dispatch: DispatchView;
  fieldBrief: FieldBrief;
  invitations: Invitation[];
  issues: FieldIssue[];
  job: MoveJob;
  proposals: Record<string, ChangeProposal>;
  scope: ScopeReview;
  scopeVersions: ScopeVersionSummary[];
  sessions: CaptureSession[];
}

interface MockDispatchSetupInput {
  expected_duration_minutes: number;
  required_certifications: string[];
  required_skills: string[];
  required_vehicle_capacity_m2: number;
  required_worker_count: number;
  vehicles: Array<Omit<DispatchView["vehicle_options"][number], "id">>;
  workers: Array<Omit<DispatchView["worker_options"][number], "id">>;
}

function actor(role: ParticipantRole, participantId: string, displayName: string): ActorSelf {
  return {
    job_id: JOB_ID,
    participant_id: participantId,
    role,
    display_name: displayName,
    permissions: ["mock:all"],
    expires_at: future(),
    invitation: null,
  };
}

function createState(): MockState {
  const createdAt = now();
  const job: MoveJob = {
    id: JOB_ID,
    title: "우리 집 이사",
    status: "active",
    scheduled_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    created_at: createdAt,
    completed_at: null,
    participants: [
      { id: CUSTOMER_ID, role: "customer", display_name: "김서큐" },
      { id: PROVIDER_ID, role: "company_manager", display_name: "안심이사 매니저" },
      { id: WORKER_ID, role: "field_worker", display_name: "박현장" },
    ],
    locations: [
      { id: crypto.randomUUID(), kind: "origin", label: "성수동 아파트", room_zones: [{ id: ORIGIN_ZONE_ID, name: "침실", sort_order: 0 }, { id: KITCHEN_ZONE_ID, name: "주방", sort_order: 1 }, { id: ENTRANCE_ZONE_ID, name: "현관", sort_order: 2 }] },
      { id: crypto.randomUUID(), kind: "destination", label: "자양동 오피스텔", room_zones: [{ id: DESTINATION_ZONE_ID, name: "전체 공간", sort_order: 0 }] },
    ],
  };
  const jobHeader = {
    job_id: JOB_ID,
    job_code: "MOCK-2026-001",
    title: job.title,
    scheduled_at: job.scheduled_at,
    customer_display_name: "김서큐",
    company_display_name: "안심이사",
    viewer_display_name: "Mock 사용자",
    viewer_role: "customer" as ParticipantRole,
    origin_summary: "성수동 1가",
    destination_summary: "자양동 오피스텔",
  };
  const quote = {
    base_amount_krw: 820_000,
    adjustments: [{ label: "출발지 계단 3층 운반", amount_krw: 30_000 }],
    total_amount_krw: 850_000,
  };
  const scope: ScopeReview = {
    job: jobHeader,
    scope: {
      id: SCOPE_ID,
      version_label: "v3",
      status: "customer_review",
      item_count: 12,
      work_count: 4,
      exclusion_count: 1,
      review_required_count: 0,
      room_groups: [{
        room_zone_id: ORIGIN_ZONE_ID,
        label: "침실",
        item_count: 6,
        review_required_count: 0,
        items: ["침대 프레임", "매트리스", "책상", "의자", "서랍장", "스탠드"].map((description, index) => ({
          item_key: `bedroom-item-${index + 1}`,
          room_zone_id: ORIGIN_ZONE_ID,
          description,
          review_required: false,
          source_media_asset_ids: [],
        })),
      }, {
        room_zone_id: KITCHEN_ZONE_ID,
        label: "주방",
        item_count: 4,
        review_required_count: 0,
        items: ["냉장고", "전자레인지", "식탁", "주방 의자"].map((description, index) => ({ item_key: `kitchen-item-${index + 1}`, room_zone_id: KITCHEN_ZONE_ID, description, review_required: false, source_media_asset_ids: [] })),
      }, {
        room_zone_id: ENTRANCE_ZONE_ID,
        label: "현관",
        item_count: 2,
        review_required_count: 0,
        items: ["신발장", "우산꽂이"].map((description, index) => ({ item_key: `entrance-item-${index + 1}`, room_zone_id: ENTRANCE_ZONE_ID, description, review_required: false, source_media_asset_ids: [] })),
      }],
      included_works: ["포장 및 운반", "기본 가구 분해·조립", "가구 배치", "보호 포장"],
      exclusions: ["에어컨 탈부착"],
    },
    proposal_id: "scope-proposal-1",
    quote,
    proposal_reason: "촬영 결과와 현장 조건을 반영한 Mock 견적입니다.",
    media_previews: [],
    company_confirmed_at: createdAt,
    customer_confirmed_at: null,
    revision_request: null,
  };
  const invitations: Invitation[] = [
    { id: "invite-provider", job_id: JOB_ID, issuer_participant_id: CUSTOMER_ID, invitee_participant_id: PROVIDER_ID, role: "company_manager", display_name: "안심이사 매니저", status: "accepted", issued_at: createdAt, expires_at: future(), resolved_at: createdAt },
    { id: "invite-worker", job_id: JOB_ID, issuer_participant_id: PROVIDER_ID, invitee_participant_id: WORKER_ID, role: "field_worker", display_name: "박현장", status: "accepted", issued_at: createdAt, expires_at: future(), resolved_at: createdAt },
  ];
  const vehicle = { id: "vehicle-1", external_reference: "mock-truck", display_name: "5톤 탑차", specification: "28㎡ 적재", equipment: ["보호 패드", "카트"], capacity_m2: 28, available: true, conflict_reason: null };
  const dispatch: DispatchView = {
    job: { ...jobHeader, viewer_role: "company_manager" },
    setup_id: "setup-1",
    dispatch_id: DISPATCH_ID,
    source_scope_version_id: SCOPE_ID,
    source_scope_version_label: "v3",
    requirements: { start_at: job.scheduled_at!, expected_duration_minutes: 480, required_vehicle_count: 1, required_vehicle_capacity_m2: 28, required_worker_count: 1, required_skills: [], required_certifications: [] },
    vehicle_options: [vehicle],
    worker_options: [{ id: "worker-option-1", external_reference: "mock-worker", display_name: "박현장", role_label: "팀장", skills: [], certifications: [], available: true, conflict_reason: null, participant_id: WORKER_ID }],
    selected_vehicle_id: "vehicle-1",
    selected_worker_ids: ["worker-option-1"],
    lead_worker_id: "worker-option-1",
    checks: [{ key: "capacity", status: "pass", detail: "필요 적재량 충족" }],
    worker_note: "고객 연락 후 진입해 주세요.",
    status: "confirmed",
    confirmed_at: createdAt,
    notification_created: true,
  };
  const completionRequest: CompletionRequest = {
    completion_request_id: "completion-request-1",
    client_reference: "mock-completion-request",
    completion_submission_id: "completion-submission-1",
    status: "requested",
    requested_at: createdAt,
    expires_at: future(),
    revoked_at: null,
    decided_at: null,
    unrecorded_extra_charge: null,
    problem_report: null,
    notification_created: true,
  };
  const completion: CompletionSummary = {
    job: jobHeader,
    job_status: "active",
    completion_submission_id: "completion-submission-1",
    completed_at: createdAt,
    final_amount_krw: quote.total_amount_krw,
    duration_minutes: 420,
    completion_media_count: 2,
    checklist: { completed_count: 3, total_count: 3 },
    onsite_confirmation_completed: true,
    worker_shifts: [{ worker_id: WORKER_ID, display_name: "박현장", role_label: "팀장", started_at: createdAt, ended_at: createdAt, duration_minutes: 420 }],
    field_changes: [],
    quote,
    completion_request: completionRequest,
    approved_scope_version_id: SCOPE_ID,
    approved_scope_version_label: "v3",
    documents: [{ key: "completion", name: "작업 완료 확인서", status: "ready" }],
    archive_ready: true,
    retention_until: future(),
    problem_report_count: 0,
  };
  const sessionId = crypto.randomUUID();
  const analysisRunId = crypto.randomUUID();
  const media: MediaAsset = { id: crypto.randomUUID(), capture_session_id: sessionId, room_zone_id: ORIGIN_ZONE_ID, media_purpose: "inventory", status: "ready", content_type: "image/jpeg", expected_size_bytes: 1024, actual_size_bytes: 1024, sha256_hex: null, created_at: createdAt, uploaded_at: createdAt };
  const sessions: CaptureSession[] = [{ id: sessionId, job_id: JOB_ID, created_by_participant_id: CUSTOMER_ID, created_at: createdAt, media_assets: [media], analysis: { analysis_run_id: analysisRunId, capture_session_id: sessionId, status: "completed", scope_version_id: SCOPE_ID, failure_code: null, retryable: null, submitted_at: createdAt, completed_at: createdAt } }];
  const analysisReview: AnalysisReview = {
    job_id: JOB_ID,
    analysis_run_id: analysisRunId,
    capture_session_id: sessionId,
    source_scope_version_id: SCOPE_ID,
    review_scope_version_id: null,
    analysis_completed_at: createdAt,
    review_completed_at: null,
    zones: scope.scope.room_groups.map((group, index) => ({ room_zone_id: group.room_zone_id, name: group.label, sort_order: index, total_media_count: index === 0 ? 1 : 0, ready_media_count: index === 0 ? 1 : 0, failed_media_count: 0 })),
    items: scope.scope.room_groups.flatMap((group) => group.items).map((item) => ({ ...item, source: "ai" as const, confidence: 0.94 })),
  };
  const scopeVersions: ScopeVersionSummary[] = [{
    id: SCOPE_ID,
    parent_version_id: null,
    sequence_number: 1,
    content: {
      schema_version: 1,
      items: analysisReview.items.map(({ description, item_key, room_zone_id }) => ({ description, item_key, room_zone_id })),
    },
    created_at: createdAt,
    locked_at: null,
  }];
  return {
    actors: {
      [mockAccessSecrets.customer]: actor("customer", CUSTOMER_ID, "김서큐"),
      [mockAccessSecrets.company_manager]: actor("company_manager", PROVIDER_ID, "안심이사 매니저"),
      [mockAccessSecrets.field_worker]: actor("field_worker", WORKER_ID, "박현장"),
    },
    analysisReview,
    completion,
    dispatch,
    fieldBrief: {
      job: { ...jobHeader, viewer_role: "field_worker" }, dispatch_id: DISPATCH_ID, scope_version_id: SCOPE_ID, scope_version_label: "v3", start_at: job.scheduled_at!, masked_origin: "성수동 원룸", masked_destination: "자양동 오피스텔", lead_worker_name: "박현장", origin_conditions: ["엘리베이터 양쪽 모두 사용 가능", "출발지 건물 앞 주차"], field_check_required_count: 3,
      check_in_items: [{ key: "vehicle_checked", label: "차량과 적재 장비 확인", confirmed: false }, { key: "scope_checked", label: "최신 작업범위 확인", confirmed: false }, { key: "safety_checked", label: "현장 안전사항 확인", confirmed: false }],
      completion_check_items: [{ key: "packing", label: "포장 및 운반", confirmed: false }, { key: "assembly", label: "침대 분해·조립", confirmed: false }, { key: "placement", label: "요청 위치 배치", confirmed: false }, { key: "cleanup", label: "현장 정리", confirmed: false }], completion_required_count: 4, completion_submission_id: null, assigned_vehicle: vehicle, assigned_worker_count: 1,
      assigned_workers: [{ worker_id: WORKER_ID, external_reference: "mock-worker", display_name: "박현장", role_label: "팀장", is_lead: true }], required_skills: [], safety_notice: "승인 범위 밖 작업은 먼저 이슈로 보고해 주세요.", checked_in_at: null,
    },
    invitations,
    issues: [{
      field_issue_id: "field-issue-elevator",
      client_reference: "mock-elevator-outage",
      job_id: JOB_ID,
      base_scope_version_id: SCOPE_ID,
      issue_type: "site_blocker",
      title: "엘리베이터 운행 중단",
      description: "점검 중이라 5층까지 계단 운반이 필요합니다.",
      evidence_media_asset_ids: ["mock-elevator-evidence"],
      reported_by_participant_id: WORKER_ID,
      reported_at: createdAt,
      status: "customer_review",
      change_proposal_id: "change-proposal-elevator",
    }, {
      field_issue_id: "field-issue-piano",
      client_reference: "mock-upright-piano",
      job_id: JOB_ID,
      base_scope_version_id: SCOPE_ID,
      issue_type: "out_of_scope",
      title: "승인 범위에 없는 업라이트 피아노",
      description: "거실에 업라이트 피아노가 있어 전문 운반 인력이 추가로 필요합니다.",
      evidence_media_asset_ids: ["mock-piano-evidence"],
      reported_by_participant_id: WORKER_ID,
      reported_at: createdAt,
      status: "open",
      change_proposal_id: null,
    }, {
      field_issue_id: "field-issue-wardrobe",
      client_reference: "mock-built-in-wardrobe",
      job_id: JOB_ID,
      base_scope_version_id: SCOPE_ID,
      issue_type: "damage_risk",
      title: "붙박이장 분해 시 파손 위험",
      description: "상판이 이미 갈라져 있어 분해 과정에서 파손될 수 있습니다. 진행 전 확인이 필요합니다.",
      evidence_media_asset_ids: ["mock-wardrobe-evidence"],
      reported_by_participant_id: WORKER_ID,
      reported_at: createdAt,
      status: "open",
      change_proposal_id: null,
    }, {
      field_issue_id: "field-issue-parking",
      client_reference: "mock-parking-blocked",
      job_id: JOB_ID,
      base_scope_version_id: SCOPE_ID,
      issue_type: "site_blocker",
      title: "도착지 하역 공간 확보 완료",
      description: "관리사무소 협의로 지상 주차면 2칸을 확보했습니다. 추가 비용은 없습니다.",
      evidence_media_asset_ids: [],
      reported_by_participant_id: WORKER_ID,
      reported_at: createdAt,
      status: "approved",
      change_proposal_id: null,
    }],
    job,
    proposals: {
      "change-proposal-elevator": {
        job: jobHeader,
        proposal_id: "change-proposal-elevator",
        field_issue_id: "field-issue-elevator",
        status: "pending",
        title: "계단 운반 · 5층",
        reason: "엘리베이터 운행 중단 (현장 점검 중)",
        base_scope_version_id: SCOPE_ID,
        base_scope_version_label: "v3",
        result_scope_version_id: null,
        evidence_media: [{ media_asset_id: "mock-elevator-evidence", room_zone_id: ORIGIN_ZONE_ID, content_type: "image/jpeg", read_url: "/elevator-outage-evidence.png", expires_at: future() }],
        quote: { base_amount_krw: 850_000, adjustments: [{ label: "계단 운반 · 5층", amount_krw: 50_000 }], total_amount_krw: 900_000 },
        requested_at: createdAt,
        clarification_note: null,
        clarification_requested_at: null,
        explanation: null,
        explained_at: null,
        decided_at: null,
        decision_note: null,
      },
    },
    scope,
    scopeVersions,
    sessions,
  };
}

let state = createState();

function result<T>(value: T): Promise<T> {
  return Promise.resolve(copy(value));
}

function accessLink(role: ParticipantRole, participantId: string, secret: string) {
  return { id: crypto.randomUUID(), job_id: JOB_ID, participant_id: participantId, role, secret, expires_at: future() };
}

export async function mockApiRequest<T>(path: string, init: RequestInit, accessToken?: string): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  const method = init.method ?? "GET";

  if (path === "/api/v1/move-jobs/onboarding" && method === "POST") {
    const input = jsonBody<CustomerOnboardingInput>(init);
    state = createState();
    state.job.title = input.title;
    state.job.scheduled_at = input.scheduled_at;
    state.job.locations = input.locations.map((location) => ({ id: crypto.randomUUID(), ...location, room_zones: location.room_zones.map((zone) => ({ id: crypto.randomUUID(), ...zone })) }));
    state.job.participants[0].display_name = input.customer_display_name;
    state.actors[mockAccessSecrets.customer].display_name = input.customer_display_name;
    return result({ job: state.job, customer_access_link: accessLink("customer", CUSTOMER_ID, mockAccessSecrets.customer) } as CustomerOnboardingResult) as Promise<T>;
  }
  if (path === "/api/v1/me" && method === "GET") {
    const found = accessToken ? state.actors[accessToken] : undefined;
    if (!found) throw new Error("Mock 초대 코드를 확인해 주세요.");
    return result(found) as Promise<T>;
  }
  if (!accessToken || !state.actors[accessToken]) throw new Error("Mock 연결 정보가 없습니다.");
  const jobPath = `/api/v1/move-jobs/${JOB_ID}`;
  if (path === jobPath && method === "GET") return result(state.job) as Promise<T>;
  if (path === `${jobPath}/invitations` && method === "GET") return result({ invitations: state.invitations }) as Promise<T>;
  if (path === `${jobPath}/invitations` && method === "POST") {
    const input = jsonBody<{ role: Exclude<ParticipantRole, "customer">; display_name: string }>(init);
    const participantId = crypto.randomUUID();
    const secret = `seqret_mock_${input.role}_${crypto.randomUUID().replaceAll("-", "")}`;
    const invitation: Invitation = { id: crypto.randomUUID(), job_id: JOB_ID, issuer_participant_id: state.actors[accessToken].participant_id, invitee_participant_id: participantId, role: input.role, display_name: input.display_name, status: "pending", issued_at: now(), expires_at: future(), resolved_at: null };
    state.invitations.push(invitation);
    state.actors[secret] = { ...actor(input.role, participantId, input.display_name), invitation };
    return result({ invitation, access_link: accessLink(input.role, participantId, secret) } as InvitationIssued) as Promise<T>;
  }
  const invitationAction = path.match(new RegExp(`^${jobPath}/invitations/([^/]+)/(accept|decline|revoke|reissue)$`));
  if (invitationAction && method === "POST") {
    const invitation = state.invitations.find(({ id }) => id === invitationAction[1])!;
    const action = invitationAction[2];
    invitation.status = action === "accept" ? "accepted" : action === "decline" ? "declined" : action === "revoke" ? "revoked" : "pending";
    invitation.resolved_at = action === "reissue" ? null : now();
    Object.values(state.actors).filter((item) => item.invitation?.id === invitation.id).forEach((item) => { item.invitation = copy(invitation); });
    if (action !== "reissue") return result(invitation) as Promise<T>;
    const secret = `seqret_mock_reissued_${crypto.randomUUID().replaceAll("-", "")}`;
    state.actors[secret] = { ...actor(invitation.role, invitation.invitee_participant_id, invitation.display_name), invitation };
    return result({ invitation, access_link: accessLink(invitation.role, invitation.invitee_participant_id, secret) } as InvitationIssued) as Promise<T>;
  }
  if (path === `${jobPath}/scope-review` && method === "GET") {
    const currentActor = state.actors[accessToken];
    return result({ ...state.scope, job: { ...state.scope.job, viewer_role: currentActor.role, viewer_display_name: currentActor.display_name } }) as Promise<T>;
  }
  if (path === `${jobPath}/scope-proposals` && method === "POST") {
    const input = jsonBody<{ quote: ScopeReview["quote"]; reason: string }>(init);
    state.scope.quote = input.quote;
    state.scope.proposal_reason = input.reason;
    state.scope.scope.status = "customer_review";
    return result({ scope_version_id: state.scope.scope.id }) as Promise<T>;
  }
  if (path === `${jobPath}/scope-review/revision-request` && method === "POST") {
    const input = jsonBody<{ reason: string }>(init);
    state.scope.scope.status = "revision_requested";
    state.scope.revision_request = { revision_request_id: crypto.randomUUID(), status: "requested", reason: input.reason, requested_at: now() };
    return result({ ok: true }) as Promise<T>;
  }
  if (path === `${jobPath}/scope-review/confirm` && method === "POST") {
    state.scope.scope.status = "confirmed";
    state.scope.customer_confirmed_at = now();
    return result({ ok: true }) as Promise<T>;
  }
  if (path === `${jobPath}/field-issues` && method === "GET") return result(state.issues) as Promise<T>;
  if (path === `${jobPath}/field-issues` && method === "POST") {
    const input = jsonBody<Omit<FieldIssue, "field_issue_id" | "job_id" | "reported_by_participant_id" | "reported_at" | "status" | "change_proposal_id">>(init);
    const issue: FieldIssue = { ...input, field_issue_id: crypto.randomUUID(), job_id: JOB_ID, reported_by_participant_id: state.actors[accessToken].participant_id, reported_at: now(), status: "open", change_proposal_id: null };
    state.issues.push(issue);
    return result(issue) as Promise<T>;
  }
  if (path === `${jobPath}/change-proposals` && method === "POST") {
    const input = jsonBody<{ field_issue_id: string; base_scope_version_id: string; title: string; reason: string; quote: ChangeProposal["quote"] }>(init);
    const proposalId = crypto.randomUUID();
    const issue = state.issues.find(({ field_issue_id }) => field_issue_id === input.field_issue_id)!;
    issue.change_proposal_id = proposalId;
    issue.status = "customer_review";
    state.proposals[proposalId] = { job: state.scope.job, proposal_id: proposalId, field_issue_id: input.field_issue_id, status: "pending", title: input.title, reason: input.reason, base_scope_version_id: input.base_scope_version_id, base_scope_version_label: state.scope.scope.version_label, result_scope_version_id: null, evidence_media: issue.evidence_media_asset_ids.map((media_asset_id) => ({ media_asset_id, room_zone_id: ORIGIN_ZONE_ID, content_type: "image/jpeg", read_url: "/elevator-outage-evidence.png", expires_at: future() })), quote: input.quote, requested_at: now(), clarification_note: null, clarification_requested_at: null, explanation: null, explained_at: null, decided_at: null, decision_note: null };
    return result({ proposal_id: proposalId }) as Promise<T>;
  }
  const proposalMatch = path.match(new RegExp(`^${jobPath}/change-proposals/([^/]+)(?:/(decision|explanation))?$`));
  if (proposalMatch) {
    const proposal = state.proposals[proposalMatch[1]];
    if (!proposal) throw new Error("Mock 변경 제안을 찾을 수 없습니다.");
    if (method === "GET") return result(proposal) as Promise<T>;
    const input = jsonBody<{ decision?: string; note?: string; explanation?: string }>(init);
    if (proposalMatch[2] === "decision") {
      proposal.status = input.decision === "approve" ? "approved" : input.decision === "reject" ? "rejected" : "clarification_requested";
      proposal.decision_note = input.note ?? null;
      proposal.decided_at = now();
      if (input.decision === "request_clarification") proposal.clarification_requested_at = now();
      const issue = state.issues.find(({ field_issue_id }) => field_issue_id === proposal.field_issue_id);
      if (issue) issue.status = proposal.status as FieldIssue["status"];
      if (input.decision === "approve") state.scope.quote = proposal.quote;
    } else {
      proposal.explanation = input.explanation ?? null;
      proposal.explained_at = now();
    }
    return result(proposal) as Promise<T>;
  }
  if (path === `${jobPath}/dispatch` && method === "GET") return result(state.dispatch) as Promise<T>;
  if (path === `${jobPath}/dispatch/setup` && method === "POST") {
    const input = jsonBody<MockDispatchSetupInput>(init);
    state.dispatch = { ...state.dispatch, setup_id: crypto.randomUUID(), dispatch_id: null, status: "ready", confirmed_at: null, requirements: { start_at: state.job.scheduled_at ?? now(), expected_duration_minutes: input.expected_duration_minutes, required_vehicle_count: 1, required_vehicle_capacity_m2: input.required_vehicle_capacity_m2, required_worker_count: input.required_worker_count, required_skills: input.required_skills, required_certifications: input.required_certifications }, vehicle_options: input.vehicles.map((item) => ({ id: crypto.randomUUID(), ...item })), worker_options: input.workers.map((item) => ({ id: crypto.randomUUID(), ...item })), selected_vehicle_id: null, selected_worker_ids: [], lead_worker_id: null };
    return result(state.dispatch) as Promise<T>;
  }
  if (path === `${jobPath}/dispatch` && method === "PUT") {
    const input = jsonBody<{ vehicle_id: string; worker_ids: string[]; lead_worker_id: string; worker_note: string | null }>(init);
    state.dispatch = { ...state.dispatch, dispatch_id: DISPATCH_ID, selected_vehicle_id: input.vehicle_id, selected_worker_ids: input.worker_ids, lead_worker_id: input.lead_worker_id, worker_note: input.worker_note, status: "confirmed", confirmed_at: now() };
    return result(state.dispatch) as Promise<T>;
  }
  if (path === `${jobPath}/field-brief` && method === "GET") return result(state.fieldBrief) as Promise<T>;
  if (path === `${jobPath}/check-ins` && method === "POST") {
    const input = jsonBody<{ confirmed_check_keys: string[] }>(init);
    state.fieldBrief.checked_in_at = now();
    state.fieldBrief.check_in_items.forEach((item) => { item.confirmed = input.confirmed_check_keys.includes(item.key); });
    return result({ checked_in_at: state.fieldBrief.checked_in_at }) as Promise<T>;
  }
  if (path === `${jobPath}/completion-submissions` && method === "POST") {
    state.fieldBrief.completion_submission_id = "completion-submission-1";
    state.completion.completion_submission_id = "completion-submission-1";
    return result({ completion_submission_id: "completion-submission-1" }) as Promise<T>;
  }
  if (path === `${jobPath}/completion-summary` && method === "GET") return result(state.completion) as Promise<T>;
  if (path === `${jobPath}/completion-requests` && method === "POST") {
    state.completion.completion_request = { ...state.completion.completion_request!, status: "requested", requested_at: now() };
    return result(state.completion.completion_request) as Promise<T>;
  }
  if (path.includes(`${jobPath}/completion-requests/`) && path.endsWith("/decision") && method === "POST") {
    const input = jsonBody<{ decision: "confirm" | "report_issue"; unrecorded_extra_charge: boolean | null; problem_type?: "missing_work" | "damage" | "amount" | "other"; problem_description?: string }>(init);
    const request = state.completion.completion_request!;
    request.status = input.decision === "confirm" ? "confirmed" : "issue_reported";
    request.decided_at = now();
    request.unrecorded_extra_charge = input.unrecorded_extra_charge;
    if (input.decision === "report_issue") {
      request.problem_report = { problem_report_id: crypto.randomUUID(), problem_type: (input.problem_type ?? "other") as "missing_work" | "damage" | "amount" | "other", description: input.problem_description ?? "", reported_at: now() };
      state.completion.problem_report_count += 1;
    }
    return result(request) as Promise<T>;
  }
  if (path === `${jobPath}/capture-sessions` && method === "GET") return result(state.sessions) as Promise<T>;
  if (path === `${jobPath}/capture-sessions` && method === "POST") {
    // 실제 backend와 동일하게 동의 field가 없으면 422로 거절한다.
    const consent = jsonBody<{ consent_policy_version?: string; privacy_notice_acknowledged?: boolean }>(init);
    if (!consent.consent_policy_version || consent.privacy_notice_acknowledged !== true) {
      throw new ApiError(422, "consent_policy_version과 privacy_notice_acknowledged가 필요합니다.", null, null);
    }
    const session: CaptureSession = { id: crypto.randomUUID(), job_id: JOB_ID, created_by_participant_id: state.actors[accessToken].participant_id, created_at: now(), media_assets: [], analysis: null };
    state.sessions.unshift(session);
    return result(session) as Promise<T>;
  }
  const uploadMatch = path.match(new RegExp(`^${jobPath}/capture-sessions/([^/]+)/media-assets/upload$`));
  if (uploadMatch && method === "POST") {
    const input = jsonBody<{ room_zone_id: string; media_purpose: MediaAsset["media_purpose"]; content_type: string; content_length: number }>(init);
    const asset: MediaAsset = { id: crypto.randomUUID(), capture_session_id: uploadMatch[1], room_zone_id: input.room_zone_id, media_purpose: input.media_purpose, status: "pending_upload", content_type: input.content_type, expected_size_bytes: input.content_length, actual_size_bytes: null, sha256_hex: null, created_at: now(), uploaded_at: null };
    state.sessions.find(({ id }) => id === uploadMatch[1])!.media_assets.push(asset);
    return result({ asset, upload_url: `mock-upload://${asset.id}`, upload_headers: {}, expires_at: future() } as MediaUploadTarget) as Promise<T>;
  }
  const completeUploadMatch = path.match(new RegExp(`^${jobPath}/capture-sessions/([^/]+)/media-assets/([^/]+)/complete$`));
  if (completeUploadMatch && method === "POST") {
    const asset = state.sessions.flatMap(({ media_assets }) => media_assets).find(({ id }) => id === completeUploadMatch[2])!;
    asset.status = "ready";
    asset.actual_size_bytes = asset.expected_size_bytes;
    asset.uploaded_at = now();
    return result(asset) as Promise<T>;
  }
  const submitCaptureMatch = path.match(new RegExp(`^${jobPath}/capture-sessions/([^/]+)/submit$`));
  if (submitCaptureMatch && method === "POST") {
    const session = state.sessions.find(({ id }) => id === submitCaptureMatch[1])!;
    session.analysis = { analysis_run_id: crypto.randomUUID(), capture_session_id: session.id, status: "completed", scope_version_id: SCOPE_ID, failure_code: null, retryable: null, submitted_at: now(), completed_at: now() };
    state.analysisReview = { ...state.analysisReview, analysis_run_id: session.analysis.analysis_run_id, capture_session_id: session.id, analysis_completed_at: now(), review_completed_at: null };
    return result(session.analysis) as Promise<T>;
  }
  if (path === `${jobPath}/analysis-review` && method === "GET") return result(state.analysisReview) as Promise<T>;
  if (path === `${jobPath}/analysis-review/complete` && method === "POST") {
    const input = jsonBody<{ items: AnalysisReview["items"] }>(init);
    state.analysisReview.items = input.items.map((item) => ({ ...item, source: "customer", confidence: null, review_required: false, source_media_asset_ids: [] }));
    state.analysisReview.review_completed_at = now();
    state.analysisReview.review_scope_version_id = SCOPE_ID;
    return result(state.analysisReview) as Promise<T>;
  }
  if (path === `${jobPath}/scope-versions` && method === "GET") return result(state.scopeVersions) as Promise<T>;
  if (path === `${jobPath}/scope-versions` && method === "POST") {
    const input = jsonBody<{ parent_version_id: string | null; content: ScopeVersionSummary["content"] }>(init);
    const parent = input.parent_version_id ? state.scopeVersions.find(({ id }) => id === input.parent_version_id) : null;
    const version: ScopeVersionSummary = {
      id: crypto.randomUUID(),
      parent_version_id: input.parent_version_id,
      sequence_number: parent ? parent.sequence_number + 1 : 1,
      content: input.content,
      created_at: now(),
      locked_at: null,
    };
    state.scopeVersions.push(version);
    return result(version) as Promise<T>;
  }
  throw new Error(`처리되지 않은 Mock API: ${method} ${path}`);
}
