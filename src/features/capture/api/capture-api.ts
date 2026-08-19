import { apiRequest, uploadToSignedUrl } from "@/api/client";
import { analysisReviewCompletePayload, captureSessionCreatePayload } from "@/api/contract-payloads";

type MediaAssetStatus =
  | "pending_upload"
  | "uploaded"
  | "processing"
  | "ready"
  | "failed"
  | "deleted";

type CaptureAnalysisStatus =
  | "pending"
  | "dispatching"
  | "queued"
  | "running"
  | "completed"
  | "failed";

export interface RoomZone {
  id: string;
  name: string;
  sort_order: number;
}

interface MoveLocation {
  id: string;
  kind: "origin" | "destination";
  label: string;
  room_zones: RoomZone[];
}

export interface MoveJob {
  id: string;
  title: string;
  status: "draft" | "active" | "completed" | "canceled";
  locations: MoveLocation[];
}

export interface MediaAsset {
  id: string;
  capture_session_id: string;
  room_zone_id: string;
  media_purpose: "inventory" | "condition" | "change_evidence" | "completion";
  status: MediaAssetStatus;
  content_type: string;
  expected_size_bytes: number;
  actual_size_bytes: number | null;
  sha256_hex: string | null;
  created_at: string;
  uploaded_at: string | null;
}

export interface CaptureAnalysis {
  analysis_run_id: string;
  capture_session_id: string;
  status: CaptureAnalysisStatus;
  scope_version_id: string | null;
  failure_code: string | null;
  retryable: boolean | null;
  submitted_at: string;
  completed_at: string | null;
}

export interface CaptureSession {
  id: string;
  job_id: string;
  created_by_participant_id: string;
  created_at: string;
  media_processing_consent: MediaProcessingConsentSnapshot;
  media_assets: MediaAsset[];
  analysis: CaptureAnalysis | null;
}

export interface CaptureSessionCreated {
  id: string;
  job_id: string;
  created_by_participant_id: string;
  created_at: string;
  media_processing_consent: MediaProcessingConsentSnapshot;
}

interface MediaProcessingConsentSnapshot {
  policy_version: string | null;
  processing_purposes: MediaConsentPolicy["processing_purposes"];
  privacy_notice_acknowledged: boolean;
  retention_days_after_job_completion: number | null;
  consented_at: string | null;
}

export interface MediaConsentPolicy {
  policy_version: string;
  processing_purposes: Array<"inventory_analysis" | "condition_record" | "field_change_evidence" | "completion_record">;
  retention_days_after_job_completion: number;
  notice: string;
}

interface AnalysisReviewZone {
  room_zone_id: string;
  name: string;
  sort_order: number;
  total_media_count: number;
  ready_media_count: number;
  failed_media_count: number;
}

interface AnalysisReviewItem {
  item_key: string;
  room_zone_id: string;
  description: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  work_note: string | null;
  review_status: "confirmed" | "review_required";
  scope_source: "ai" | "customer" | "company" | "field_change";
  source: "ai" | "customer";
  confidence: number | null;
  review_required: boolean;
  source_media_asset_ids: string[];
}

export interface AnalysisReview {
  job_id: string;
  analysis_run_id: string;
  capture_session_id: string;
  source_scope_version_id: string;
  review_scope_version_id: string | null;
  analysis_completed_at: string;
  review_completed_at: string | null;
  scope_schema_version: 1 | 2;
  zones: AnalysisReviewZone[];
  items: AnalysisReviewItem[];
  location_conditions: ScopeLocationConditions[];
  location_condition_suggestions: Array<Record<string, unknown>>;
}

interface AnalysisReviewItemInputV1 {
  item_key: string;
  room_zone_id: string;
  description: string;
}

interface AnalysisReviewItemInputV2 {
  item_key: string;
  room_zone_id: string;
  name: string;
  quantity: number;
  unit: string;
  work_note?: string | null;
}

export type AnalysisReviewItemInput = AnalysisReviewItemInputV1 | AnalysisReviewItemInputV2;

interface ScopeLocationConditions {
  location_id: string;
  kind: "origin" | "destination";
  conditions: Record<string, unknown>;
}

export interface ScopeVersionSummary {
  id: string;
  parent_version_id: string | null;
  sequence_number: number;
  content:
    | { schema_version: 1; items: AnalysisReviewItemInputV1[] }
    | { schema_version: 2; items: AnalysisReviewItemInputV2[]; location_conditions: ScopeLocationConditions[] };
  created_at: string;
  locked_at: string | null;
}

export interface MediaUploadTarget {
  asset: MediaAsset;
  upload_url: string;
  upload_headers: Record<string, string>;
  expires_at: string;
}

export type SupportedCaptureContentType = "image/jpeg" | "image/png" | "video/mp4";

interface AuthorizedRequest {
  accessToken?: string;
  jobId: string;
  signal?: AbortSignal;
}

export interface CreateCaptureSessionRequest extends AuthorizedRequest {
  consentPolicyVersion: string;
  privacyNoticeAcknowledged: true;
}

export interface CreateMediaUploadRequest extends AuthorizedRequest {
  captureSessionId: string;
  contentLength: number;
  contentType: SupportedCaptureContentType;
  mediaPurpose?: MediaAsset["media_purpose"];
  roomZoneId: string;
}

export interface CompleteMediaUploadRequest extends AuthorizedRequest {
  captureSessionId: string;
  mediaAssetId: string;
}

export interface SubmitCaptureRequest extends AuthorizedRequest {
  captureSessionId: string;
}

export interface CompleteAnalysisReviewRequest extends AuthorizedRequest {
  sourceScopeVersionId: string;
  items: AnalysisReviewItemInput[];
  scopeSchemaVersion: 1 | 2;
  locationConditions: ScopeLocationConditions[];
}

export interface CreateManualScopeRequest extends AuthorizedRequest {
  items: AnalysisReviewItemInput[];
  parentVersionId: string | null;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACCESS_SECRET_PATTERN = /^[A-Za-z0-9_-]{40,100}$/;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

function pathSegment(value: string): string {
  return encodeURIComponent(value);
}

function jobPath(jobId: string): string {
  if (!UUID_PATTERN.test(jobId)) {
    throw new Error("A valid move job ID is required");
  }
  return `/api/v1/move-jobs/${pathSegment(jobId)}`;
}

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

export function isValidJobId(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function isValidAccessSecret(value: string): boolean {
  return ACCESS_SECRET_PATTERN.test(value.trim());
}

export function captureFileError(file: File): string | null {
  const contentType = file.type as SupportedCaptureContentType;
  if (!["image/jpeg", "image/png", "video/mp4"].includes(contentType)) {
    return "JPG, PNG 사진 또는 MP4 영상만 올릴 수 있어요.";
  }
  if (file.size <= 0) {
    return "내용이 없는 파일은 올릴 수 없어요.";
  }
  const limit = contentType === "video/mp4" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    return contentType === "video/mp4"
      ? "영상은 200MB 이하로 선택해 주세요."
      : "사진은 20MB 이하로 선택해 주세요.";
  }
  return null;
}

export function asSupportedContentType(file: File): SupportedCaptureContentType {
  const error = captureFileError(file);
  if (error) {
    throw new Error(error);
  }
  return file.type as SupportedCaptureContentType;
}

export async function getMoveJob({
  accessToken,
  jobId,
  signal,
}: AuthorizedRequest): Promise<MoveJob> {
  return apiRequest<MoveJob>(jobPath(jobId), {
    accessToken,
    method: "GET",
    signal,
  });
}

export async function listCaptureSessions({
  accessToken,
  jobId,
  signal,
}: AuthorizedRequest): Promise<CaptureSession[]> {
  return apiRequest<CaptureSession[]>(`${jobPath(jobId)}/capture-sessions`, {
    accessToken,
    method: "GET",
    signal,
  });
}

export async function getMediaConsentPolicy({
  accessToken,
  jobId,
  signal,
}: AuthorizedRequest): Promise<MediaConsentPolicy> {
  return apiRequest<MediaConsentPolicy>(`${jobPath(jobId)}/media-consent-policy`, {
    accessToken,
    method: "GET",
    signal,
  });
}

export async function createCaptureSession({
  accessToken,
  consentPolicyVersion,
  jobId,
  privacyNoticeAcknowledged,
  signal,
}: CreateCaptureSessionRequest): Promise<CaptureSessionCreated> {
  return apiRequest<CaptureSessionCreated>(`${jobPath(jobId)}/capture-sessions`, {
    accessToken,
    body: JSON.stringify(captureSessionCreatePayload(consentPolicyVersion, privacyNoticeAcknowledged)),
    headers: jsonHeaders(),
    method: "POST",
    signal,
  });
}

export async function createMediaUpload({
  accessToken,
  captureSessionId,
  contentLength,
  contentType,
  jobId,
  mediaPurpose = "inventory",
  roomZoneId,
  signal,
}: CreateMediaUploadRequest): Promise<MediaUploadTarget> {
  return apiRequest<MediaUploadTarget>(
    `${jobPath(jobId)}/capture-sessions/${pathSegment(captureSessionId)}/media-assets/upload`,
    {
      accessToken,
      body: JSON.stringify({
        room_zone_id: roomZoneId,
        media_purpose: mediaPurpose,
        content_type: contentType,
        content_length: contentLength,
      }),
      headers: jsonHeaders(),
      method: "POST",
      signal,
    },
  );
}

export async function uploadCaptureFile(
  target: MediaUploadTarget,
  file: File,
  signal?: AbortSignal,
): Promise<void> {
  await uploadToSignedUrl({
    body: file,
    signal,
    uploadHeaders: target.upload_headers,
    uploadUrl: target.upload_url,
  });
}

export async function completeMediaUpload({
  accessToken,
  captureSessionId,
  jobId,
  mediaAssetId,
  signal,
}: CompleteMediaUploadRequest): Promise<MediaAsset> {
  return apiRequest<MediaAsset>(
    `${jobPath(jobId)}/capture-sessions/${pathSegment(captureSessionId)}/media-assets/${pathSegment(mediaAssetId)}/complete`,
    {
      accessToken,
      method: "POST",
      signal,
    },
  );
}

export async function submitCapture({
  accessToken,
  captureSessionId,
  jobId,
  signal,
}: SubmitCaptureRequest): Promise<CaptureAnalysis> {
  return apiRequest<CaptureAnalysis>(
    `${jobPath(jobId)}/capture-sessions/${pathSegment(captureSessionId)}/submit`,
    {
      accessToken,
      method: "POST",
      signal,
    },
  );
}

export async function getAnalysisReview({
  accessToken,
  jobId,
  signal,
}: AuthorizedRequest): Promise<AnalysisReview> {
  return apiRequest<AnalysisReview>(`${jobPath(jobId)}/analysis-review`, {
    accessToken,
    method: "GET",
    signal,
  });
}

export async function completeAnalysisReview({
  accessToken,
  items,
  jobId,
  locationConditions,
  scopeSchemaVersion,
  signal,
  sourceScopeVersionId,
}: CompleteAnalysisReviewRequest): Promise<AnalysisReview> {
  return apiRequest<AnalysisReview>(`${jobPath(jobId)}/analysis-review/complete`, {
    accessToken,
    body: JSON.stringify(analysisReviewCompletePayload({ sourceScopeVersionId, scopeSchemaVersion, items, locationConditions })),
    headers: jsonHeaders(),
    method: "POST",
    signal,
  });
}

export async function listScopeVersions({
  accessToken,
  jobId,
  signal,
}: AuthorizedRequest): Promise<ScopeVersionSummary[]> {
  return apiRequest<ScopeVersionSummary[]>(`${jobPath(jobId)}/scope-versions`, {
    accessToken,
    method: "GET",
    signal,
  });
}

export async function createManualScope({
  accessToken,
  items,
  jobId,
  parentVersionId,
  signal,
}: CreateManualScopeRequest): Promise<ScopeVersionSummary> {
  return apiRequest<ScopeVersionSummary>(`${jobPath(jobId)}/scope-versions`, {
    accessToken,
    body: JSON.stringify({
      parent_version_id: parentVersionId,
      content: { schema_version: 1, items },
    }),
    headers: jsonHeaders(),
    method: "POST",
    signal,
  });
}
