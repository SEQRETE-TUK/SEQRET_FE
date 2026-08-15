import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  FileUp,
  Info,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Video,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { MobileFrame, StatusBar } from "@/components/demo-ui";
import {
  ANALYSIS_REVIEW_FORM_ID,
  AnalysisReviewPanel,
  type AnalysisReviewDraftItem,
} from "@/components/demos/analysis-review-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  captureFileError,
  isValidAccessSecret,
  isValidJobId,
  type CaptureAnalysis,
  type MediaAsset,
  type RoomZone,
} from "@/features/capture/capture-api";
import {
  useCaptureWorkflow,
  type CaptureConnection,
} from "@/features/capture/use-capture-workflow";
import { ApiError, SignedUploadError } from "@/lib/api-client";

interface ConnectionFormProps {
  onConnect: (jobId: string, accessToken: string) => void;
}

interface ConnectedCaptureProps {
  connection: CaptureConnection;
  onDisconnect: () => void;
}

interface ZoneRowProps {
  assets: MediaAsset[];
  disabled: boolean;
  index: number;
  onFile: (file: File, roomZoneId: string) => void;
  resumableAssetId: string | null;
  zone: RoomZone;
}

interface ReviewDraftState {
  key: string;
  items: AnalysisReviewDraftItem[];
}

const ACTIVE_ANALYSIS = new Set(["pending", "dispatching", "queued", "running"]);
const VALIDATING_MEDIA = new Set(["uploaded", "processing"]);

function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "초대 정보가 만료됐거나 올바르지 않아요.";
    if (error.status === 403) return "이 역할로는 촬영을 진행할 수 없어요.";
    if (error.status === 404) return "이 초대 정보에서 작업을 찾을 수 없어요.";
    if (error.status === 409) return "서버 상태가 바뀌었어요. 상태를 새로 확인해 주세요.";
    if (error.status === 429) return "요청이 잠시 많아요. 잠시 뒤 다시 시도해 주세요.";
    if (error.status >= 500) return "서버 연결이 원활하지 않아요. 잠시 뒤 다시 시도해 주세요.";
  }
  if (error instanceof SignedUploadError) {
    return "파일 전송이 멈췄어요. 만료되기 전에 다시 시도해 주세요.";
  }
  if (error instanceof TypeError) {
    return "네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
  }
  if (error instanceof Error && error.message.includes("expired")) {
    return "업로드 시간이 지나 새 촬영 세션이 필요해요.";
  }
  return "요청을 마치지 못했어요. 상태를 확인한 뒤 다시 시도해 주세요.";
}

function ConnectionForm({ onConnect }: ConnectionFormProps) {
  const [jobId, setJobId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedJobId = jobId.trim();
    const normalizedToken = accessToken.trim();
    if (!isValidJobId(normalizedJobId)) {
      setError("초대 안내에 적힌 작업 ID를 확인해 주세요.");
      return;
    }
    if (!isValidAccessSecret(normalizedToken)) {
      setError("access secret 전체를 빠짐없이 입력해 주세요.");
      return;
    }
    setError(null);
    onConnect(normalizedJobId, normalizedToken);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink-900">
      <StatusBar />
      <header className="flex h-14 items-center px-5">
        <a
          aria-label="역할 선택으로 돌아가기"
          className="grid size-11 place-items-center rounded-full"
          href="/"
        >
          <ArrowLeft size={22} />
        </a>
        <p className="mx-auto pr-11 text-[17px] font-bold">촬영 이어가기</p>
      </header>
      <main className="flex-1 px-6 pb-8 pt-7">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary-50 text-primary-700">
          <LockKeyhole size={27} />
        </span>
        <h1 className="mt-6 text-[26px] font-extrabold leading-[34px] tracking-[-0.6px]">
          받은 초대 정보로
          <br />내 촬영을 불러와요
        </h1>
        <p className="mt-3 text-[14px] leading-6 text-ink-600">
          아직 로그인 전달 화면이 연결되지 않아, 현재는 초대 안내의 두 값을 한 번 입력해요.
        </p>

        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block text-[13px] font-bold text-ink-600">
            작업 ID
            <input
              autoCapitalize="none"
              autoComplete="off"
              className="mt-2 h-14 w-full rounded-2xl border border-line bg-white px-4 text-[14px] outline-none focus:border-primary-600"
              inputMode="text"
              onChange={(event) => setJobId(event.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              spellCheck={false}
              value={jobId}
            />
          </label>
          <label className="block text-[13px] font-bold text-ink-600">
            Access secret
            <input
              autoCapitalize="none"
              autoComplete="off"
              className="mt-2 h-14 w-full rounded-2xl border border-line bg-white px-4 text-[14px] outline-none focus:border-primary-600"
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="초대 안내의 비밀값"
              spellCheck={false}
              type="password"
              value={accessToken}
            />
          </label>
          {error && (
            <p className="rounded-2xl bg-danger-bg px-4 py-3 text-[13px] font-bold text-danger-ink" role="alert">
              {error}
            </p>
          )}
          <Button className="w-full" size="cta" type="submit">
            촬영 불러오기
          </Button>
        </form>

        <Card className="mt-6 flex gap-3 border-primary-100 bg-primary-50 p-4">
          <ShieldCheck className="mt-0.5 shrink-0 text-primary-700" size={21} />
          <div>
            <p className="text-[13px] font-bold">이 화면을 닫으면 secret도 사라져요</p>
            <p className="mt-1 text-[12px] leading-5 text-ink-600">
              URL, 브라우저 저장소, 로그에는 남기지 않아요.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}

function StageRail({ complete, stage }: { complete: boolean; stage: 1 | 2 | 3 | 4 }) {
  const labels = ["구역 촬영", "파일 확인", "AI 분석", "초안 검토"];
  return (
    <ol aria-label="촬영 진행 단계" className="mt-5 grid grid-cols-4 gap-1.5">
      {labels.map((label, index) => {
        const step = (index + 1) as 1 | 2 | 3 | 4;
        const active = step === stage && !complete;
        const done = step < stage || (complete && step === stage);
        return (
          <li
            className={`rounded-xl border px-2 py-3 text-center text-[11px] font-bold ${
              active
                ? "border-primary-400 bg-primary-50 text-primary-700"
                : done
                  ? "border-success bg-success-bg text-success-ink"
                  : "border-line bg-white text-ink-400"
            }`}
            key={label}
          >
            <span className="mb-1 block text-[10px]">{done ? "완료" : `${step}/4`}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

function zoneState(
  assets: MediaAsset[],
  resumableAssetId: string | null,
): { label: string; tone: "default" | "success" | "warning" } {
  if (assets.length === 0) return { label: "촬영 필요", tone: "default" };
  if (assets.some((asset) => asset.status === "failed" || asset.status === "deleted")) {
    return { label: "새 촬영 필요", tone: "warning" };
  }
  if (
    assets.some(
      (asset) => asset.status === "pending_upload" && asset.id !== resumableAssetId,
    )
  ) {
    return { label: "업로드 중단", tone: "warning" };
  }
  if (assets.some((asset) => asset.id === resumableAssetId)) {
    return { label: "재시도 가능", tone: "warning" };
  }
  if (assets.some((asset) => VALIDATING_MEDIA.has(asset.status))) {
    return { label: "파일 확인 중", tone: "default" };
  }
  return { label: `${assets.length}개 준비`, tone: "success" };
}

function ZoneRow({
  assets,
  disabled,
  index,
  onFile,
  resumableAssetId,
  zone,
}: ZoneRowProps) {
  const state = zoneState(assets, resumableAssetId);
  const inputId = `capture-zone-${zone.id}`;
  return (
    <li className="relative flex gap-4 border-b border-line py-4 last:border-b-0">
      <span
        className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-extrabold ${
          state.tone === "success"
            ? "bg-success-bg text-success-ink"
            : state.tone === "warning"
              ? "bg-warning-bg text-warning-ink"
              : "bg-primary-50 text-primary-700"
        }`}
      >
        {state.tone === "success" ? <Check size={17} /> : index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[15px] font-bold">{zone.name}</p>
          <Badge variant={state.tone === "success" ? "success" : state.tone === "warning" ? "warning" : "neutral"}>
            {state.label}
          </Badge>
        </div>
        <p className="mt-1 text-[12px] text-ink-400">
          {assets.length > 0
            ? assets.map((asset) => (asset.content_type === "video/mp4" ? "영상" : "사진")).join(" · ")
            : "큰 짐과 이동 동선이 보이게 촬영해 주세요"}
        </p>
      </div>
      <label
        aria-disabled={disabled}
        className={`grid size-11 shrink-0 place-items-center rounded-xl border ${
          disabled
            ? "pointer-events-none border-line bg-[#E4E6ED] text-ink-400"
            : "border-primary-100 bg-primary-50 text-primary-700"
        }`}
        htmlFor={inputId}
      >
        <Camera size={19} />
        <span className="sr-only">{zone.name} 사진 또는 영상 추가</span>
      </label>
      <input
        accept="image/jpeg,image/png,video/mp4"
        capture="environment"
        className="sr-only"
        disabled={disabled}
        id={inputId}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) onFile(file, zone.id);
        }}
        type="file"
      />
    </li>
  );
}

function AnalysisState({ analysis }: { analysis: CaptureAnalysis }) {
  if (analysis.status === "completed") {
    return (
      <Card className="mt-5 border-success bg-success-bg p-5">
        <div className="flex gap-3">
          <CheckCircle2 className="shrink-0 text-success-ink" size={24} />
          <div>
            <h2 className="text-[17px] font-bold text-success-ink">AI 초안이 준비됐어요</h2>
            <p className="mt-2 text-[13px] leading-5 text-ink-600">
              촬영 결과를 작업범위 초안으로 저장했어요. 아래에서 설명을 고치거나 빠진 항목을 추가해 주세요.
            </p>
          </div>
        </div>
      </Card>
    );
  }
  if (analysis.status === "failed") {
    return (
      <Card className="mt-5 border-warning bg-warning-bg p-5">
        <div className="flex gap-3">
          <AlertTriangle className="shrink-0 text-warning" size={24} />
          <div>
            <h2 className="text-[17px] font-bold">분석을 완료하지 못했어요</h2>
            <p className="mt-2 text-[13px] leading-5 text-ink-600">
              촬영 파일은 그대로 보존됐어요. {analysis.retryable ? "자동 재시도 정책은 다음 통합 범위에서 연결해요." : "직접 입력 경로로 이어갈 수 있어요."}
            </p>
          </div>
        </div>
      </Card>
    );
  }
  const copy: Record<string, string> = {
    pending: "분석 요청을 준비하고 있어요",
    dispatching: "분석 작업을 전달하고 있어요",
    queued: "분석 순서를 기다리고 있어요",
    running: "촬영 내용을 확인하고 있어요",
  };
  return (
    <Card className="mt-5 border-primary-100 bg-primary-50 p-5">
      <div className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-primary-700">
          <LoaderCircle className="demo-spin" size={24} />
        </span>
        <div>
          <h2 className="text-[17px] font-bold">{copy[analysis.status]}</h2>
          <p className="mt-1 text-[12px] text-ink-600">화면을 열어 둔 동안 상태를 자동으로 확인해요.</p>
        </div>
      </div>
    </Card>
  );
}

function ConnectedCapture({ connection, onDisconnect }: ConnectedCaptureProps) {
  const workflow = useCaptureWorkflow(connection);
  const [localError, setLocalError] = useState<string | null>(null);
  const [reviewDraftState, setReviewDraftState] = useState<ReviewDraftState | null>(null);
  const job = workflow.jobQuery.data;
  const sessions = workflow.sessionsQuery.data;
  const session = sessions?.[0] ?? null;
  const origin = job?.locations.find((location) => location.kind === "origin");
  const zones = [...(origin?.room_zones ?? [])].sort(
    (left, right) => left.sort_order - right.sort_order,
  );
  const inventoryAssets =
    session?.media_assets.filter((asset) => asset.media_purpose === "inventory") ?? [];
  const resumableAssetId = workflow.resumableUpload?.target.asset.id ?? null;
  const unrecoverable = inventoryAssets.some(
    (asset) =>
      asset.status === "failed" ||
      asset.status === "deleted" ||
      (asset.status === "pending_upload" && asset.id !== resumableAssetId),
  );
  const validating = inventoryAssets.some((asset) => VALIDATING_MEDIA.has(asset.status));
  const allReady =
    zones.length > 0 &&
    inventoryAssets.length > 0 &&
    inventoryAssets.every((asset) => asset.status === "ready") &&
    zones.every((zone) =>
      inventoryAssets.some(
        (asset) => asset.room_zone_id === zone.id && asset.status === "ready",
      ),
    );
  const analysis = session?.analysis ?? null;
  const analysisActive = analysis !== null && ACTIVE_ANALYSIS.has(analysis.status);
  const review = workflow.reviewQuery.data;
  const reviewKey = review
    ? `${review.source_scope_version_id}:${review.review_scope_version_id ?? "draft"}`
    : "";
  const reviewDraftItems =
    reviewDraftState?.key === reviewKey
      ? reviewDraftState.items
      : (review?.items.map((item) => ({
          itemKey: item.item_key,
          roomZoneId: item.room_zone_id,
          description: item.description,
        })) ?? []);
  const reviewCompleted = review?.review_scope_version_id !== null && review !== undefined;
  const reviewValid =
    reviewDraftItems.length > 0 &&
    reviewDraftItems.every(
      (item) =>
        item.description.trim().length > 0 &&
        review?.zones.some((zone) => zone.room_zone_id === item.roomZoneId),
    );
  const stage: 1 | 2 | 3 | 4 =
    analysis?.status === "completed" ? 4 : analysis ? 3 : validating || allReady ? 2 : 1;
  const busy =
    workflow.createSessionMutation.isPending ||
    workflow.uploadMutation.isPending ||
    workflow.submitMutation.isPending ||
    workflow.reviewMutation.isPending;
  const requestError =
    workflow.jobQuery.error ??
    workflow.sessionsQuery.error ??
    workflow.createSessionMutation.error ??
    workflow.uploadMutation.error ??
    workflow.submitMutation.error ??
    workflow.reviewMutation.error;

  if (workflow.jobQuery.isPending || workflow.sessionsQuery.isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-8 text-center">
        <div>
          <LoaderCircle className="demo-spin mx-auto text-primary-700" size={32} />
          <p className="mt-4 text-[15px] font-bold">내 촬영 상태를 불러오고 있어요</p>
        </div>
      </div>
    );
  }

  if (!job || workflow.jobQuery.isError || workflow.sessionsQuery.isError) {
    return (
      <div className="flex min-h-dvh flex-col bg-canvas px-6 pb-8 pt-20">
        <AlertTriangle className="text-warning" size={32} />
        <h1 className="mt-5 text-[24px] font-extrabold">촬영을 불러오지 못했어요</h1>
        <p className="mt-3 text-[14px] leading-6 text-ink-600">{friendlyError(requestError)}</p>
        <div className="mt-auto space-y-3">
          <Button className="w-full" onClick={() => void Promise.all([workflow.jobQuery.refetch(), workflow.sessionsQuery.refetch()])} size="cta">
            <RefreshCw size={18} /> 다시 확인
          </Button>
          <Button className="w-full" onClick={onDisconnect} size="cta" variant="outline">
            초대 정보 다시 입력
          </Button>
        </div>
      </div>
    );
  }

  const terminalJob = job.status === "completed" || job.status === "canceled";
  const uploadDisabled =
    !session ||
    analysis !== null ||
    busy ||
    unrecoverable ||
    terminalJob;

  const startSession = () => {
    setLocalError(null);
    workflow.createSessionMutation.reset();
    workflow.uploadMutation.reset();
    workflow.createSessionMutation.mutate();
  };

  const selectFile = (file: File, roomZoneId: string) => {
    const error = captureFileError(file);
    if (error) {
      setLocalError(error);
      return;
    }
    if (!session) return;
    setLocalError(null);
    workflow.uploadMutation.reset();
    workflow.uploadMutation.mutate({
      captureSessionId: session.id,
      file,
      roomZoneId,
    });
  };

  const submit = () => {
    if (!session || !allReady) return;
    setLocalError(null);
    workflow.submitMutation.reset();
    workflow.submitMutation.mutate(session.id);
  };

  const setReviewDraft = (items: AnalysisReviewDraftItem[]) => {
    if (!review) return;
    setReviewDraftState({ key: reviewKey, items });
  };

  const addReviewItem = () => {
    const firstZone = review?.zones[0];
    if (!firstZone) return;
    setReviewDraft([
      ...reviewDraftItems,
      {
        itemKey: `customer-${crypto.randomUUID()}`,
        roomZoneId: firstZone.room_zone_id,
        description: "",
      },
    ]);
  };

  const changeReviewItem = (
    itemKey: string,
    changes: Partial<AnalysisReviewDraftItem>,
  ) => {
    setReviewDraft(
      reviewDraftItems.map((item) =>
        item.itemKey === itemKey ? { ...item, ...changes } : item,
      ),
    );
  };

  const removeReviewItem = (itemKey: string) => {
    setReviewDraft(reviewDraftItems.filter((item) => item.itemKey !== itemKey));
  };

  const completeReview = () => {
    if (!review || reviewCompleted || !reviewValid) return;
    setLocalError(null);
    workflow.reviewMutation.reset();
    workflow.reviewMutation.mutate({
      sourceScopeVersionId: review.source_scope_version_id,
      items: reviewDraftItems.map((item) => ({
        item_key: item.itemKey,
        room_zone_id: item.roomZoneId,
        description: item.description.trim(),
      })),
    });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink-900">
      <StatusBar />
      <header className="flex h-14 items-center border-b border-line bg-white px-5">
        <a aria-label="촬영 데모로 돌아가기" className="grid size-11 place-items-center rounded-full" href="/?role=consumer&screen=3">
          <ArrowLeft size={22} />
        </a>
        <p className="mx-auto truncate px-3 text-[17px] font-bold">{job.title}</p>
        <button aria-label="연결 해제" className="grid size-11 place-items-center rounded-full text-ink-600" onClick={onDisconnect} type="button">
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 px-5 pb-8 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold text-primary-700">실제 서버와 연결됨</p>
            <h1 className="mt-2 text-[24px] font-extrabold leading-8">
              {analysis?.status === "completed"
                ? "AI 초안을 확인해 주세요"
                : "출발지 구역을 촬영해 주세요"}
            </h1>
          </div>
          {(workflow.sessionsQuery.isFetching || workflow.reviewQuery.isFetching) && <LoaderCircle aria-label="상태 확인 중" className="demo-spin mt-1 shrink-0 text-primary-700" size={21} />}
        </div>
        <p className="mt-2 text-[13px] leading-5 text-ink-600">
          {analysis?.status === "completed"
            ? "AI 제안은 확정 범위가 아니에요. 내가 확인한 내용만 다음 단계로 전달해요."
            : "파일은 비공개 저장소로 직접 전송하고, 서버 확인이 끝난 자료만 AI 분석에 사용해요."}
        </p>
        <StageRail complete={reviewCompleted} stage={stage} />

        {!session && (
          <Card className="mt-6 p-5 text-center">
            <Video className="mx-auto text-primary-700" size={28} />
            <h2 className="mt-3 text-[17px] font-bold">새 촬영을 시작할 준비가 됐어요</h2>
            <p className="mt-2 text-[12px] leading-5 text-ink-600">촬영 세션을 만든 뒤 구역별 사진이나 영상을 추가해요.</p>
          </Card>
        )}

        {session && !analysis && (
          <Card className="relative mt-6 overflow-hidden px-5">
            <span className="absolute bottom-8 left-[37px] top-8 w-px bg-primary-100" />
            {zones.length > 0 ? (
              <ol>
                {zones.map((zone, index) => (
                  <ZoneRow
                    assets={inventoryAssets.filter((asset) => asset.room_zone_id === zone.id)}
                    disabled={uploadDisabled}
                    index={index}
                    key={zone.id}
                    onFile={selectFile}
                    resumableAssetId={resumableAssetId}
                    zone={zone}
                  />
                ))}
              </ol>
            ) : (
              <div className="py-6 text-center">
                <Info className="mx-auto text-warning" size={24} />
                <p className="mt-3 text-[14px] font-bold">출발지 촬영 구역이 없어요</p>
              </div>
            )}
          </Card>
        )}

        {analysis && <AnalysisState analysis={analysis} />}

        {analysis?.status === "completed" && workflow.reviewQuery.isPending && (
          <Card className="mt-4 p-6 text-center">
            <LoaderCircle className="demo-spin mx-auto text-primary-700" size={28} />
            <p className="mt-3 text-[14px] font-bold">검토할 항목을 불러오고 있어요</p>
          </Card>
        )}

        {analysis?.status === "completed" && workflow.reviewQuery.isError && (
          <Card className="mt-4 border-warning bg-warning-bg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="shrink-0 text-warning" size={21} />
              <div>
                <p className="text-[13px] font-bold">AI 초안 상태를 다시 확인해 주세요</p>
                <p className="mt-1 text-[12px] leading-5 text-ink-600">
                  {friendlyError(workflow.reviewQuery.error)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {analysis?.status === "completed" && review && (
          <AnalysisReviewPanel
            draftItems={reviewDraftItems}
            onAdd={addReviewItem}
            onChange={changeReviewItem}
            onRemove={removeReviewItem}
            onSubmit={completeReview}
            review={review}
          />
        )}

        {workflow.resumableUpload && workflow.uploadMutation.isError && (
          <Card className="mt-4 border-warning bg-warning-bg p-4">
            <p className="text-[13px] font-bold">중단된 파일 전송을 이어갈 수 있어요</p>
            <Button
              className="mt-3 w-full"
              disabled={busy}
              onClick={() => {
                setLocalError(null);
                workflow.uploadMutation.reset();
                workflow.uploadMutation.mutate(undefined);
              }}
              size="chip"
              variant="outline"
            >
              <RotateCcw size={17} /> 업로드 다시 시도
            </Button>
          </Card>
        )}

        {(localError || requestError) && (
          <p className="mt-4 rounded-2xl bg-danger-bg px-4 py-3 text-[13px] font-bold text-danger-ink" role="alert">
            {localError ?? friendlyError(requestError)}
          </p>
        )}

        {unrecoverable && !analysis && (
          <Card className="mt-4 border-warning bg-warning-bg p-4">
            <p className="text-[13px] font-bold">완료되지 않은 파일이 있어 새 촬영이 필요해요</p>
            <p className="mt-1 text-[12px] leading-5 text-ink-600">기존 기록은 지우지 않고 새 세션에서 다시 촬영해요.</p>
          </Card>
        )}
      </main>

      <div className="sticky bottom-0 border-t border-line bg-white px-6 pb-5 pt-4">
        {!session || unrecoverable ? (
          <Button className="w-full" disabled={busy || terminalJob} onClick={startSession} size="cta">
            {workflow.createSessionMutation.isPending ? <LoaderCircle className="demo-spin" size={18} /> : <Video size={18} />}
            {unrecoverable ? "새 촬영 세션 시작" : "촬영 시작"}
          </Button>
        ) : analysis?.status === "completed" ? (
          workflow.reviewQuery.isPending ? (
            <Button className="w-full" disabled size="cta">
              <LoaderCircle className="demo-spin" size={18} /> 검토 항목 불러오는 중
            </Button>
          ) : workflow.reviewQuery.isError ? (
            <Button
              className="w-full"
              disabled={workflow.reviewQuery.isFetching}
              onClick={() => void workflow.reviewQuery.refetch()}
              size="cta"
              variant="outline"
            >
              {workflow.reviewQuery.isFetching ? <LoaderCircle className="demo-spin" size={18} /> : <RefreshCw size={18} />}
              검토 내용 다시 불러오기
            </Button>
          ) : reviewCompleted ? (
            <Button className="w-full" disabled size="cta">
              <Check size={18} /> AI 초안 검토 완료
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={!review || !reviewValid || workflow.reviewMutation.isPending}
              form={ANALYSIS_REVIEW_FORM_ID}
              size="cta"
              type="submit"
            >
              {workflow.reviewMutation.isPending ? <LoaderCircle className="demo-spin" size={18} /> : <Check size={18} />}
              {reviewValid ? "검토 내용 확정" : "항목 내용을 확인해 주세요"}
            </Button>
          )
        ) : analysis ? (
          <Button className="w-full" disabled size="cta">
            {analysisActive ? <LoaderCircle className="demo-spin" size={18} /> : <AlertTriangle size={18} />}
            {analysisActive ? "AI 분석 진행 중" : "분석 실패 · 촬영 보존됨"}
          </Button>
        ) : allReady ? (
          <Button className="w-full" disabled={busy || zones.length === 0} onClick={submit} size="cta">
            {workflow.submitMutation.isPending ? <LoaderCircle className="demo-spin" size={18} /> : <FileUp size={18} />}
            촬영 마치고 AI 분석 시작
          </Button>
        ) : (
          <Button className="w-full" disabled size="cta">
            {validating || workflow.uploadMutation.isPending ? <LoaderCircle className="demo-spin" size={18} /> : <Camera size={18} />}
            {validating ? "업로드 파일 확인 중" : "구역 촬영을 추가해 주세요"}
          </Button>
        )}
        <p className="mt-3 text-center text-[11px] text-ink-400">
          {reviewCompleted
            ? "검토 완료본은 변경 이력으로 보존돼요."
            : terminalJob
              ? "종료된 작업에는 새 촬영을 추가할 수 없어요."
              : "업로드 URL과 secret은 브라우저에 저장하지 않아요."}
        </p>
      </div>
    </div>
  );
}

export function LiveCaptureFlow() {
  const queryClient = useQueryClient();
  const [connection, setConnection] = useState<CaptureConnection | null>(null);

  const disconnect = () => {
    if (connection) {
      queryClient.removeQueries({
        queryKey: ["capture-flow", connection.cacheScope],
      });
    }
    setConnection(null);
  };

  return (
    <MobileFrame>
      {connection ? (
        <ConnectedCapture
          connection={connection}
          key={connection.cacheScope}
          onDisconnect={disconnect}
        />
      ) : (
        <ConnectionForm
          onConnect={(jobId, accessToken) =>
            setConnection({
              accessToken,
              cacheScope: crypto.randomUUID(),
              jobId,
            })
          }
        />
      )}
    </MobileFrame>
  );
}
