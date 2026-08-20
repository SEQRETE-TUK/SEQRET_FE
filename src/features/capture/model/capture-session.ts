import type { CaptureSession } from "@/features/capture/api/capture-api";

const ACTIVE_ANALYSIS_STATUSES = new Set(["pending", "dispatching", "queued", "running"]);
const RESUMABLE_VIDEO_STATUSES = new Set(["uploaded", "processing", "ready"]);

export function findResumableVideoSession(sessions: CaptureSession[]): CaptureSession | null {
  return sessions.find((session) => {
    const videos = session.media_assets.filter(
      (asset) => asset.media_purpose === "inventory" && asset.content_type === "video/mp4",
    );
    if (videos.length === 0) return false;
    if (session.analysis) return ACTIVE_ANALYSIS_STATUSES.has(session.analysis.status);
    return videos.some((asset) => RESUMABLE_VIDEO_STATUSES.has(asset.status));
  }) ?? null;
}
