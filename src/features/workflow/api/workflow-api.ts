import { ApiError, apiRequest, downloadApiFile, publicApiRequest } from "@/api/client";
import { mockApiEnabled } from "@/api/mock-api";
import { scopeProposalPayload } from "@/api/contract-payloads";

export type ParticipantRole = "customer" | "company_manager" | "field_worker";

export interface Invitation {
  id: string;
  job_id: string;
  issuer_participant_id: string;
  invitee_participant_id: string;
  role: ParticipantRole;
  display_name: string;
  status: "pending" | "accepted" | "declined" | "expired" | "revoked";
  issued_at: string;
  expires_at: string;
  resolved_at: string | null;
}

interface AccessLink {
  id: string;
  job_id: string;
  participant_id: string;
  role: ParticipantRole;
  secret: string;
  expires_at: string;
}

export interface InvitationIssued {
  invitation: Invitation;
  access_link: AccessLink;
}

export interface ActorSelf {
  job_id: string;
  participant_id: string;
  role: ParticipantRole;
  display_name: string;
  permissions: string[];
  expires_at: string;
  invitation: Invitation | null;
}

interface RoomZoneInput {
  name: string;
  sort_order: number;
}

interface LocationInput {
  kind: "origin" | "destination";
  label: string;
  conditions?: MoveLocationConditions;
  room_zones: RoomZoneInput[];
}

export interface MoveLocationConditions {
  residence_type: "apartment" | "villa" | "officetel" | "house" | "studio" | "other" | "unknown";
  floor: { status: "known" | "unknown"; value: number | null };
  elevator: "available" | "unavailable" | "unknown";
  stairs: "required" | "not_required" | "unknown";
  parking_access: "available" | "restricted" | "unavailable" | "unknown";
  carry_distance: { status: "known" | "unknown"; value_m: number | null };
  access_note: string | null;
}

export interface CustomerOnboardingInput {
  title: string;
  scheduled_at: string | null;
  customer_display_name: string;
  locations: LocationInput[];
}

export interface MoveJob {
  id: string;
  title: string;
  status: "draft" | "active" | "completed" | "canceled";
  scheduled_at: string | null;
  created_at: string;
  completed_at: string | null;
  participants: Array<{ id: string; role: ParticipantRole; display_name: string }>;
  locations: Array<{
    id: string;
    kind: "origin" | "destination";
    label: string;
    conditions?: MoveLocationConditions;
    room_zones: Array<{ id: string; name: string; sort_order: number }>;
  }>;
}

export interface CustomerOnboardingResult {
  job: MoveJob;
  customer_access_link: AccessLink;
  connection_code: string;
}

export interface MockMoveSummary {
  job: MoveJob;
  version_label: string;
  scope_status: ScopeReview["scope"]["status"];
  company_participation_status: ScopeReview["company_participation_status"];
  completion_request_status: CompletionRequest["status"] | null;
  quote: QuoteSnapshot | null;
  item_count: number;
  adjustment_count: number;
}

export interface QuoteSnapshot {
  base_amount_krw: number;
  adjustments: Array<{ label: string; amount_krw: number }>;
  total_amount_krw: number;
}

interface ScopeItemV1 {
  item_key: string;
  room_zone_id: string;
  description: string;
}

interface ScopeItemV2 {
  item_key: string;
  room_zone_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  work_note: string | null;
  review_status: "confirmed" | "review_required";
  source: "ai" | "customer" | "company" | "field_change";
}

export interface ScopeLocationConditions {
  location_id: string;
  kind: "origin" | "destination";
  conditions: Record<string, unknown>;
}

export type ScopeContent =
  | { schema_version: 1; items: ScopeItemV1[] }
  | { schema_version: 2; items: ScopeItemV2[]; location_conditions: ScopeLocationConditions[] };

export interface ExecutionPlanSnapshot {
  vehicle_count: number;
  vehicle_description: string;
  worker_count: number;
  estimated_duration_minutes: number;
  notes: string | null;
}

export interface ScopeReview {
  job: JobHeader;
  scope: {
    id: string;
    version_label: string;
    schema_version: 1 | 2;
    content_hash: string;
    locked_at: string | null;
    status: "company_review" | "customer_review" | "revision_requested" | "confirmed";
    item_count: number;
    work_count: number;
    exclusion_count: number;
    review_required_count: number;
    room_groups: Array<{
      room_zone_id: string;
      label: string;
      item_count: number;
      review_required_count: number;
      items: Array<ScopeItemV1 & ScopeItemV2 & { review_required: boolean; source_media_asset_ids: string[] }>;
    }>;
    location_conditions: ScopeLocationConditions[];
    included_works: string[];
    exclusions: string[];
  };
  proposal_id: string | null;
  quote: QuoteSnapshot | null;
  execution_plan: ExecutionPlanSnapshot | null;
  proposal_reason: string | null;
  company_participation_status: "company_not_invited" | "company_invited" | "company_joined" | "company_declined" | "company_invitation_expired" | "company_invitation_revoked";
  collaboration_status: "draft" | "awaiting_company_proposal" | "awaiting_confirmation" | "revision_requested" | "confirmed";
  agreement_notice: string;
  approved_changes: Array<{
    proposal_id: string;
    field_issue_id: string;
    title: string;
    reason: string;
    base_scope_version_id: string;
    result_scope_version_id: string;
    quote: QuoteSnapshot;
    evidence_media_asset_ids: string[];
    approved_at: string;
  }>;
  media_previews: Array<{
    media_asset_id: string;
    room_zone_id: string;
    content_type: string;
    read_url: string;
    expires_at: string;
  }>;
  company_confirmed_at: string | null;
  customer_confirmed_at: string | null;
  revision_request: {
    revision_request_id: string;
    status: "requested" | "resolved";
    reason: string;
    requested_at: string;
  } | null;
}

interface JobHeader {
  job_id: string;
  job_code: string;
  title: string;
  scheduled_at: string | null;
  customer_display_name: string | null;
  company_display_name: string | null;
  viewer_display_name: string;
  viewer_role: ParticipantRole;
  origin_summary: string | null;
  destination_summary: string | null;
}

export interface FieldIssue {
  field_issue_id: string;
  client_reference: string;
  job_id: string;
  base_scope_version_id: string;
  issue_type: "out_of_scope" | "damage_risk" | "site_blocker";
  title: string;
  description: string;
  evidence_media_asset_ids: string[];
  reported_by_participant_id: string;
  reported_at: string;
  status: "open" | "customer_review" | "clarification_requested" | "approved" | "rejected";
  change_proposal_id: string | null;
}

export interface ChangeProposal {
  job: JobHeader;
  proposal_id: string;
  field_issue_id: string;
  status: string;
  title: string;
  reason: string;
  base_scope_version_id: string;
  base_scope_version_label: string;
  result_scope_version_id: string | null;
  evidence_media: ScopeReview["media_previews"];
  quote: QuoteSnapshot;
  requested_at: string;
  clarification_note: string | null;
  clarification_requested_at: string | null;
  explanation: string | null;
  explained_at: string | null;
  decided_at: string | null;
  decision_note: string | null;
}

export interface DispatchView {
  job: JobHeader;
  setup_id: string | null;
  dispatch_id: string | null;
  source_scope_version_id: string | null;
  source_scope_version_label: string | null;
  requirements: {
    start_at: string;
    expected_duration_minutes: number;
    required_vehicle_count: 1;
    required_vehicle_capacity_m2: number;
    required_worker_count: number;
    required_skills: string[];
    required_certifications: string[];
  } | null;
  vehicle_options: Array<{
    id: string;
    external_reference: string;
    display_name: string;
    specification: string;
    equipment: string[];
    capacity_m2: number;
    available: boolean;
    conflict_reason: string | null;
  }>;
  worker_options: Array<{
    id: string;
    external_reference: string;
    display_name: string;
    role_label: string;
    skills: string[];
    certifications: string[];
    available: boolean;
    conflict_reason: string | null;
    participant_id: string | null;
  }>;
  selected_vehicle_id: string | null;
  selected_worker_ids: string[];
  lead_worker_id: string | null;
  checks: Array<{ key: string; status: "pass" | "fail"; detail: string }>;
  worker_note: string | null;
  status: "setup_required" | "ready" | "stale" | "confirmed";
  confirmed_at: string | null;
  notification_created: boolean;
}

export interface FieldBrief {
  job: JobHeader;
  dispatch_id: string;
  scope_version_id: string;
  scope_version_label: string;
  start_at: string;
  masked_origin: string | null;
  masked_destination: string | null;
  lead_worker_name: string;
  origin_conditions: string[];
  field_check_required_count: number;
  check_in_items: Array<{ key: string; label: string; confirmed: boolean }>;
  completion_check_items: Array<{ key: string; label: string; confirmed: boolean }>;
  completion_required_count: number;
  completion_submission_id: string | null;
  assigned_vehicle: DispatchView["vehicle_options"][number];
  assigned_worker_count: number;
  assigned_workers: Array<{
    worker_id: string;
    external_reference: string;
    display_name: string;
    role_label: string;
    is_lead: boolean;
  }>;
  required_skills: string[];
  safety_notice: string;
  checked_in_at: string | null;
}

export interface CompletionRequest {
  completion_request_id: string;
  client_reference: string;
  completion_submission_id: string;
  status: "not_requested" | "requested" | "confirmed" | "issue_reported" | "revoked" | "expired";
  requested_at: string;
  expires_at: string;
  revoked_at: string | null;
  decided_at: string | null;
  unrecorded_extra_charge: boolean | null;
  problem_report: null | {
    problem_report_id: string;
    problem_type: "missing_work" | "damage" | "amount" | "other";
    description: string;
    reported_at: string;
  };
  notification_created: boolean;
}

export interface CompletionSummary {
  job: JobHeader;
  job_status: MoveJob["status"];
  completion_submission_id: string | null;
  completed_at: string | null;
  final_amount_krw: number | null;
  duration_minutes: number | null;
  completion_media: Array<{
    media_asset_id: string;
    room_zone_id: string;
    room_zone_label: string;
    content_type: string;
    read_url: string;
    expires_at: string;
  }>;
  completion_media_count: number;
  checklist: {
    completed_count: number;
    total_count: number;
    items?: Array<{ key: string; label: string; confirmed: boolean }>;
  };
  onsite_confirmation_completed: boolean;
  worker_shifts: Array<{
    worker_id: string;
    display_name: string;
    role_label: string;
    started_at: string;
    ended_at: string;
    duration_minutes: number;
  }>;
  field_changes: Array<{
    proposal_id: string;
    title: string;
    status: string;
    amount_delta_krw: number;
    total_amount_krw: number;
    decided_at: string | null;
  }>;
  quote: QuoteSnapshot | null;
  completion_request: CompletionRequest | null;
  approved_scope_version_id: string | null;
  approved_scope_version_label: string | null;
  documents: Array<{ key: string; name: string; status: "ready" | "not_ready" }>;
  archive_ready: boolean;
  retention_until: string | null;
  problem_report_count: number;
}

export type NotificationEventType =
  | "capture_submitted.v1"
  | "analysis_completed.v1"
  | "analysis_failed.v1"
  | "scope_locked.v1"
  | "change_requested.v1"
  | "dispatch_confirmed.v1"
  | "completion_media_submitted.v1"
  | "completion_submitted.v1"
  | "completion_requested.v1"
  | "completion_decided.v1"
  | "media_deleted.v1";

export interface WorkflowNotification {
  id: string;
  event_id: string;
  event_type: NotificationEventType;
  job_id: string;
  recipient_participant_id: string;
  status: "pending" | "sent" | "failed";
  attempt_count: number;
  created_at: string;
  last_attempt_at: string | null;
  sent_at: string | null;
  last_error_code: string | null;
}

export interface Connection {
  accessToken?: string;
  jobId: string;
}

export interface WorkspaceSession {
  access_token?: string;
  account_id: string;
  role: ParticipantRole;
  display_name: string;
  expires_at: string;
  csrf_token: string;
  members: Array<{
    job_id: string;
    participant_id: string;
    role: ParticipantRole;
    display_name: string;
    invitation: Invitation | null;
  }>;
}

const jsonHeaders = { "Content-Type": "application/json" };
const segment = (value: string) => encodeURIComponent(value);
const jobPath = (jobId: string) => `/api/v1/move-jobs/${segment(jobId)}`;
const command = <T>(connection: Connection, path: string, method: "POST" | "PUT" | "PATCH", body: T) =>
  apiRequest(path, {
    accessToken: connection.accessToken,
    body: JSON.stringify(body),
    headers: jsonHeaders,
    method,
  });

export const workflowKeys = {
  root: (jobId: string) => ["workflow", jobId] as const,
  moves: (identity?: string) => ["workflow", "moves", identity ?? "workspace"] as const,
  actor: (jobId: string) => ["workflow", jobId, "actor"] as const,
  invitations: (jobId: string) => ["workflow", jobId, "invitations"] as const,
  scope: (jobId: string) => ["workflow", jobId, "scope"] as const,
  fieldIssues: (jobId: string) => ["workflow", jobId, "field-issues"] as const,
  proposal: (jobId: string, proposalId: string) => ["workflow", jobId, "proposal", proposalId] as const,
  dispatch: (jobId: string) => ["workflow", jobId, "dispatch"] as const,
  brief: (jobId: string) => ["workflow", jobId, "field-brief"] as const,
  completion: (jobId: string) => ["workflow", jobId, "completion"] as const,
  notifications: (jobId: string) => ["workflow", jobId, "notifications"] as const,
};

export function onboardCustomer(input: CustomerOnboardingInput) {
  return publicApiRequest<CustomerOnboardingResult>("/api/v1/move-jobs/onboarding", {
    body: JSON.stringify(input),
    headers: jsonHeaders,
    method: "POST",
  });
}

export function getActorSelf(accessToken: string) {
  return apiRequest<ActorSelf>("/api/v1/me", { accessToken, method: "GET" });
}

export function connectMove(connectionCode: string, role: ParticipantRole) {
  return publicApiRequest<WorkspaceSession>("/api/v1/connections", {
    body: JSON.stringify({ connection_code: connectionCode.trim(), role }),
    headers: jsonHeaders,
    method: "POST",
  });
}

export function createWorkspaceSession(accessToken: string) {
  return apiRequest<WorkspaceSession>("/api/v1/sessions", { accessToken, method: "POST" });
}

export function getWorkspaceSession() {
  return apiRequest<WorkspaceSession>("/api/v1/session", { method: "GET" });
}

export function deleteWorkspaceSession() {
  return apiRequest<void>("/api/v1/session", { method: "DELETE" });
}

export function getMoveJob(connection: Connection) {
  return apiRequest<MoveJob>(jobPath(connection.jobId), { accessToken: connection.accessToken, method: "GET" });
}

export function listMoveJobs(accessToken?: string) {
  return apiRequest<{ moves: MockMoveSummary[] }>("/api/v1/move-jobs", { accessToken: mockApiEnabled ? accessToken : undefined, method: "GET" });
}

export function deleteMoveJob(connection: Connection) {
  return apiRequest<void>(jobPath(connection.jobId), { accessToken: connection.accessToken, method: "DELETE" });
}

export function patchMoveJob(connection: Connection, input: {
  scheduled_at?: string | null;
  locations?: Array<{ kind: "origin" | "destination"; label?: string; conditions?: MoveLocationConditions }>;
}) {
  return command(connection, jobPath(connection.jobId), "PATCH", input) as Promise<MoveJob>;
}

export function listInvitations(connection: Connection) {
  return apiRequest<{ invitations: Invitation[] }>(`${jobPath(connection.jobId)}/invitations`, {
    accessToken: connection.accessToken,
    method: "GET",
  });
}

export function createInvitation(connection: Connection, role: Exclude<ParticipantRole, "customer">, displayName?: string) {
  return command<unknown>(connection, `${jobPath(connection.jobId)}/invitations`, "POST", {
    role,
    ...(displayName?.trim() ? { display_name: displayName.trim() } : {}),
  }) as Promise<InvitationIssued>;
}

export function respondToInvitation(connection: Connection, invitationId: string, action: "accept" | "decline") {
  return command(connection, `${jobPath(connection.jobId)}/invitations/${segment(invitationId)}/${action}`, "POST", {});
}

export function manageInvitation(connection: Connection, invitationId: string, action: "revoke" | "reissue") {
  return command(connection, `${jobPath(connection.jobId)}/invitations/${segment(invitationId)}/${action}`, "POST", {}) as Promise<Invitation | InvitationIssued>;
}

export function getScopeReview(connection: Connection) {
  return apiRequest<ScopeReview>(`${jobPath(connection.jobId)}/scope-review`, { accessToken: connection.accessToken, method: "GET" });
}

export function confirmScopeReview(connection: Connection, scopeVersionId: string) {
  return command(connection, `${jobPath(connection.jobId)}/scope-review/confirm`, "POST", { scope_version_id: scopeVersionId });
}

export function requestScopeRevision(connection: Connection, scopeVersionId: string, reason: string) {
  return command(connection, `${jobPath(connection.jobId)}/scope-review/revision-request`, "POST", { scope_version_id: scopeVersionId, reason });
}

export function scopeContentFromReview(review: ScopeReview): ScopeContent {
  const items = review.scope.room_groups.flatMap((group) => group.items);
  if (review.scope.schema_version === 2) {
    return {
      schema_version: 2,
      items: items.map(({ item_key, name, quantity, review_status, room_zone_id, source, unit, work_note }) => ({
        item_key,
        name,
        quantity,
        review_status,
        room_zone_id,
        source,
        unit,
        work_note,
      })),
      location_conditions: review.scope.location_conditions,
    };
  }
  return {
    schema_version: 1,
    items: items.map(({ description, item_key, room_zone_id }) => ({ description, item_key, room_zone_id })),
  };
}

export function createScopeProposal(connection: Connection, input: {
  source_scope_version_id: string;
  content: ScopeContent;
  quote: QuoteSnapshot;
  execution_plan: ExecutionPlanSnapshot;
  included_works: string[];
  exclusions: string[];
  reason: string;
}) {
  return command(connection, `${jobPath(connection.jobId)}/scope-proposals`, "POST", scopeProposalPayload(input));
}

export function listFieldIssues(connection: Connection) {
  return apiRequest<FieldIssue[]>(`${jobPath(connection.jobId)}/field-issues`, { accessToken: connection.accessToken, method: "GET" });
}

export function createFieldIssue(connection: Connection, input: {
  client_reference: string;
  base_scope_version_id: string;
  issue_type: FieldIssue["issue_type"];
  title: string;
  description: string;
  evidence_media_asset_ids: string[];
}) {
  return command(connection, `${jobPath(connection.jobId)}/field-issues`, "POST", input) as Promise<FieldIssue>;
}

export function getChangeProposal(connection: Connection, proposalId: string) {
  return apiRequest<ChangeProposal>(`${jobPath(connection.jobId)}/change-proposals/${segment(proposalId)}`, {
    accessToken: connection.accessToken,
    method: "GET",
  });
}

export function createChangeProposal(connection: Connection, input: {
  field_issue_id: string;
  base_scope_version_id: string;
  title: string;
  reason: string;
  proposed_content: ScopeContent;
  quote: QuoteSnapshot;
}) {
  return command(connection, `${jobPath(connection.jobId)}/change-proposals`, "POST", input) as Promise<{ proposal_id: string }>;
}

export function decideChangeProposal(connection: Connection, proposalId: string, input: {
  decision: "approve" | "reject" | "request_clarification";
  note?: string;
}) {
  return command(connection, `${jobPath(connection.jobId)}/change-proposals/${segment(proposalId)}/decision`, "POST", input);
}

export function explainChangeProposal(connection: Connection, proposalId: string, explanation: string) {
  return command(connection, `${jobPath(connection.jobId)}/change-proposals/${segment(proposalId)}/explanation`, "POST", { explanation });
}

export function getDispatch(connection: Connection) {
  return apiRequest<DispatchView>(`${jobPath(connection.jobId)}/dispatch`, { accessToken: connection.accessToken, method: "GET" });
}

export function setupDispatch(connection: Connection, input: unknown) {
  return command(connection, `${jobPath(connection.jobId)}/dispatch/setup`, "POST", input) as Promise<DispatchView>;
}

export function confirmDispatch(connection: Connection, input: {
  setup_id: string;
  vehicle_id: string;
  lead_worker_id: string;
  worker_ids: string[];
  worker_note: string | null;
}) {
  return command(connection, `${jobPath(connection.jobId)}/dispatch`, "PUT", input) as Promise<DispatchView>;
}

export function getFieldBrief(connection: Connection) {
  return apiRequest<FieldBrief>(`${jobPath(connection.jobId)}/field-brief`, { accessToken: connection.accessToken, method: "GET" });
}

export function checkIn(connection: Connection, dispatchId: string, confirmedCheckKeys: string[]) {
  return command(connection, `${jobPath(connection.jobId)}/check-ins`, "POST", {
    dispatch_id: dispatchId,
    confirmed_check_keys: confirmedCheckKeys,
  });
}

export function submitCompletion(connection: Connection, input: unknown) {
  return command(connection, `${jobPath(connection.jobId)}/completion-submissions`, "POST", input) as Promise<{ completion_submission_id: string }>;
}

export function getCompletionSummary(connection: Connection) {
  return apiRequest<CompletionSummary>(`${jobPath(connection.jobId)}/completion-summary`, { accessToken: connection.accessToken, method: "GET" });
}

export function listNotifications(connection: Connection) {
  return apiRequest<WorkflowNotification[]>(`${jobPath(connection.jobId)}/notifications`, { accessToken: connection.accessToken, method: "GET" });
}

export function createCompletionRequest(connection: Connection, completionSubmissionId: string, clientReference: string) {
  return command(connection, `${jobPath(connection.jobId)}/completion-requests`, "POST", {
    client_reference: clientReference,
    completion_submission_id: completionSubmissionId,
  }) as Promise<CompletionRequest>;
}

export function decideCompletionRequest(connection: Connection, requestId: string, input: {
  decision: "confirm" | "report_issue";
  problem_type?: "missing_work" | "damage" | "amount" | "other";
  problem_description?: string;
  unrecorded_extra_charge?: boolean;
}) {
  return command(connection, `${jobPath(connection.jobId)}/completion-requests/${segment(requestId)}/decision`, "POST", input);
}

export function downloadCompletionArchive(connection: Connection) {
  return downloadApiFile(`${jobPath(connection.jobId)}/documents/archive`, connection.accessToken);
}

export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "네트워크 연결을 확인하고 다시 시도해 주세요.";
  }
  switch (error.status) {
    case 401:
      return "접근 정보가 만료되었어요. 이사 연결 코드로 다시 연결해 주세요.";
    case 403:
      return "현재 역할로는 이 작업을 할 수 없어요.";
    case 404:
      return "요청한 작업을 찾을 수 없거나 접근이 종료됐어요.";
    case 409:
      return "다른 곳에서 상태가 변경됐어요. 최신 내용을 불러왔으니 다시 확인해 주세요.";
    case 422:
      return "입력한 내용을 다시 확인해 주세요.";
    case 429:
      return error.retryAfterSeconds === null
        ? "요청이 많아요. 잠시 후 다시 시도해 주세요."
        : `${error.retryAfterSeconds}초 후 다시 시도해 주세요.`;
    case 503:
      return "현재 외부 서비스가 준비되지 않았어요. 서버 기록은 유지됩니다.";
    default:
      return "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";
  }
}

export function shouldRecoverState(error: unknown): boolean {
  return !(error instanceof ApiError) || error.status === 409 || error.status >= 500;
}
