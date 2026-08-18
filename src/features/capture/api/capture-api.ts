import { apiRequest, uploadToSignedUrl } from "@/api/client";

// backend 동의 정책 version. 배포 환경별로 env로 주입하고, 미설정 시 v1을 사용한다.
export const CONSENT_POLICY_VERSION = import.meta.env.VITE_CONSENT_POLICY_VERSION ?? "v1";

export type MediaAssetStatus =
  | "pending_upload"
  | "uploaded"
  | "processing"
  | "ready"
  | "failed"
  | "deleted";

export type CaptureAnalysisStatus =
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

export interface MoveLocation {
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
  media_assets: MediaAsset[];
  analysis: CaptureAnalysis | null;
}

export interface CaptureSessionCreated {
  id: string;
  job_id: string;
  created_by_participant_id: string;
  created_at: string;
}

export interface AnalysisReviewZone {
  room_zone_id: string;
  name: string;
  sort_order: number;
  total_media_count: number;
  ready_media_count: number;
  failed_media_count: number;
}

export interface AnalysisReviewItem {
  item_key: string;
  room_zone_id: string;
  description: string;
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
  zones: AnalysisReviewZone[];
  items: AnalysisReviewItem[];
}

export interface AnalysisReviewItemInput {
  item_key: string;
  room_zone_id: string;
  description: string;
}

export interface ScopeVersionSummary {
  id: string;
  parent_version_id: string | null;
  sequence_number: number;
  content: {
    schema_version: 1;
    items: AnalysisReviewItemInput[];
  };
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
  accessToken: string;
  jobId: string;
  signal?: AbortSignal;
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

// 촬영 session 생성 body. backend가 두 field를 필수로 받으므로 누락 시 422가 난다.
export interface CreateCaptureSessionRequest extends AuthorizedRequest {
  privacyNoticeAcknowledged: boolean;
  consentPolicyVersion?: string;
}

export interface CompleteAnalysisReviewRequest extends AuthorizedRequest {
  sourceScopeVersionId: string;
  items: AnalysisReviewItemInput[];
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

export async function createCaptureSession({
  accessToken,
  consentPolicyVersion = CONSENT_POLICY_VERSION,
  jobId,
  privacyNoticeAcknowledged,
  signal,
}: CreateCaptureSessionRequest): Promise<CaptureSessionCreated> {
  if (!privacyNoticeAcknowledged) {
    throw new Error("개인정보 수집·이용 고지를 확인해야 촬영을 시작할 수 있어요.");
  }
  return apiRequest<CaptureSessionCreated>(`${jobPath(jobId)}/capture-sessions`, {
    accessToken,
    body: JSON.stringify({
      consent_policy_version: consentPolicyVersion,
      privacy_notice_acknowledged: privacyNoticeAcknowledged,
    }),
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
  signal,
  sourceScopeVersionId,
}: CompleteAnalysisReviewRequest): Promise<AnalysisReview> {
  return apiRequest<AnalysisReview>(`${jobPath(jobId)}/analysis-review/complete`, {
    accessToken,
    body: JSON.stringify({
      source_scope_version_id: sourceScopeVersionId,
      items,
    }),
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
