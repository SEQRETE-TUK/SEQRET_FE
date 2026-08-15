import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon as ArrowLeft,
  CameraIcon as Camera,
  CheckIcon as Check,
  UploadSimpleIcon as FileUp,
  CircleNotchIcon as LoaderCircle,
  LockKeyIcon as LockKeyhole,
  SignOutIcon as LogOut,
  ArrowClockwiseIcon as RefreshCw,
  ArrowCounterClockwiseIcon as RotateCcw,
  VideoCameraIcon as Video,
} from "@phosphor-icons/react";
import {
  WarningStatusIcon as AlertTriangle,
  SuccessStatusIcon as CheckCircle2,
  InfoStatusIcon as Info,
  SecurityStatusIcon as ShieldCheck,
} from "@/components/icons";
import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { Link } from "react-router-dom";

import { MobileFrame } from "@/components/layout/mobile-frame";
import { ProgressSteps } from "@/components/workflow/workflow-task";
import {
  ANALYSIS_REVIEW_FORM_ID,
  AnalysisReviewPanel,
  type AnalysisReviewDraftItem,
} from "@/features/capture/ui/analysis-review-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  captureFileError,
  isValidAccessSecret,
  isValidJobId,
  type CaptureAnalysis,
  type MediaAsset,
  type RoomZone,
} from "@/features/capture/api/capture-api";
import {
  useCaptureWorkflow,
  type CaptureConnection,
} from "@/features/capture/model/use-capture-workflow";
import { ApiError, SignedUploadError } from "@/api/client";
import { mockAccessSecrets, mockApiEnabled, mockJobId } from "@/api/mock-api";

interface ConnectionFormProps {
  onConnect: (jobId: string, accessToken: string) => void;
}

interface ConnectedCaptureProps {
  connection: CaptureConnection;
  onDisconnect: () => void;
  returnHref: string;
  returnLabel: string;
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

interface RemovedReviewItem {
  index: number;
  item: AnalysisReviewDraftItem;
  key: string;
}

const ACTIVE_ANALYSIS = new Set(["pending", "dispatching", "queued", "running"]);
const MAX_REVIEW_ITEMS = 500;
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
  const [jobId, setJobId] = useState(mockApiEnabled ? mockJobId : "");
  const [accessToken, setAccessToken] = useState(mockApiEnabled ? mockAccessSecrets.customer : "");
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
      <header className="app-safe-header flex items-center border-b border-line bg-surface px-5 pb-3">
        <a
          aria-label="역할 선택으로 돌아가기"
          className="grid size-11 place-items-center rounded-full"
          href="/"
        >
          <ArrowLeft size={22} />
        </a>
        <p className="mx-auto pr-11 text-lg font-bold">촬영 이어가기</p>
      </header>
      <main className="flex-1 px-6 pb-8 pt-7">
        <span className="grid size-12 place-items-center rounded-full bg-primary-50 text-primary-700">
          <LockKeyhole size={27} />
        </span>
        <h1 className="mt-6 text-ui-screen font-extrabold leading-[34px] tracking-[-0.6px]">
          받은 초대 정보로
          <br />내 촬영을 불러와요
        </h1>
        <p className="mt-3 text-base leading-6 text-ink-600">
          {mockApiEnabled ? "Mock 작업 ID와 보안코드가 자동 입력되었습니다." : "초대 안내에서 받은 작업 ID와 보안코드를 한 번만 입력해 주세요."}
        </p>

        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block text-base font-bold text-ink-600">
            작업 ID
            <Input
              autoCapitalize="none"
              autoComplete="off"
              className="mt-2 h-14 rounded-2xl"
              inputMode="text"
              name="jobId"
              onChange={(event) => setJobId(event.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000…"
              spellCheck={false}
              value={jobId}
            />
          </label>
          <label className="block text-base font-bold text-ink-600">
            Bearer 보안코드
            <Input
              autoCapitalize="none"
              autoComplete="off"
              className="mt-2 h-14 rounded-2xl"
              name="accessSecret"
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="초대 안내의 비밀값…"
              spellCheck={false}
              type="password"
              value={accessToken}
            />
          </label>
          {error && (
            <p className="rounded-2xl bg-danger-bg px-4 py-3 text-base font-bold text-danger-ink" role="alert">
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
            <p className="text-base font-bold">이 화면을 닫으면 secret도 사라져요</p>
            <p className="mt-1 text-ui-support leading-5 text-ink-600">
              URL, 브라우저 저장소, 로그에는 남기지 않아요.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}

function StageRail({ complete, stage }: { complete: boolean; stage: 1 | 2 | 3 | 4 }) {
  return (
    <div className="mt-5 rounded-[var(--radius-card)] border border-line bg-surface px-3 py-4">
      <ProgressSteps current={complete ? 4 : stage - 1} items={["촬영", "확인", "분석", "검토"]} />
    </div>
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
        className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-ui-support font-extrabold ${
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
          <p className="truncate text-lg font-bold">{zone.name}</p>
          <Badge variant={state.tone === "success" ? "success" : state.tone === "warning" ? "warning" : "neutral"}>
            {state.label}
          </Badge>
        </div>
        <p className="mt-1 text-ui-support text-ink-400">
          {assets.length > 0
            ? assets.map((asset) => (asset.content_type === "video/mp4" ? "영상" : "사진")).join(" · ")
            : "큰 짐과 이동 동선이 보이게 촬영해 주세요"}
        </p>
      </div>
      <label
        aria-disabled={disabled}
        className={`grid size-11 shrink-0 place-items-center rounded-xl border ${
          disabled
            ? "pointer-events-none border-line bg-line text-ink-400"
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
        name={`captureZone-${zone.id}`}
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
            <h2 className="text-xl font-bold text-success-ink">AI 초안이 준비됐어요</h2>
            <p className="mt-2 text-base leading-5 text-ink-600">
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
            <h2 className="text-xl font-bold">분석을 완료하지 못했어요</h2>
            <p className="mt-2 text-base leading-5 text-ink-600">
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
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-primary-700">
          <LoaderCircle className="demo-spin" size={24} />
        </span>
        <div>
          <h2 className="text-xl font-bold">{copy[analysis.status]}</h2>
          <p className="mt-1 text-ui-support text-ink-600">화면을 열어 둔 동안 상태를 자동으로 확인해요.</p>
        </div>
      </div>
    </Card>
  );
}

function ConnectedCapture({ connection, onDisconnect, returnHref, returnLabel }: ConnectedCaptureProps) {
  const workflow = useCaptureWorkflow(connection);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const [recoveringReview, setRecoveringReview] = useState(false);
  const [removedReviewItem, setRemovedReviewItem] = useState<RemovedReviewItem | null>(null);
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
  const reviewDirty =
    !reviewCompleted &&
    review !== undefined &&
    (reviewDraftItems.length !== review.items.length ||
      reviewDraftItems.some((draft) => {
        const original = review.items.find((item) => item.item_key === draft.itemKey);
        return (
          original === undefined ||
          original.room_zone_id !== draft.roomZoneId ||
          original.description !== draft.description
        );
      }));
  const activeRemovedReviewItem =
    removedReviewItem?.key === reviewKey ? removedReviewItem : null;
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
    workflow.reviewMutation.isPending ||
    recoveringReview;
  const requestError =
    workflow.jobQuery.error ??
    workflow.sessionsQuery.error ??
    workflow.createSessionMutation.error ??
    workflow.uploadMutation.error ??
    workflow.submitMutation.error ??
    workflow.reviewMutation.error;

  useEffect(() => {
    if (!reviewDirty) return;
    const preventUnsavedExit = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", preventUnsavedExit);
    return () => window.removeEventListener("beforeunload", preventUnsavedExit);
  }, [reviewDirty]);

  if (workflow.jobQuery.isPending || workflow.sessionsQuery.isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-8 text-center">
        <div>
          <LoaderCircle className="demo-spin mx-auto text-primary-700" size={32} />
          <p className="mt-4 text-lg font-bold">내 촬영 상태를 불러오고 있어요</p>
        </div>
      </div>
    );
  }

  if (!job || workflow.jobQuery.isError || workflow.sessionsQuery.isError) {
    return (
      <div className="flex min-h-dvh flex-col bg-canvas px-6 pb-8 pt-20">
        <AlertTriangle className="text-warning" size={32} />
        <h1 className="mt-5 text-ui-title-lg font-extrabold">촬영을 불러오지 못했어요</h1>
        <p className="mt-3 text-lg leading-6 text-ink-600">{friendlyError(requestError)}</p>
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

  const canLeaveReview = () =>
    !reviewDirty ||
    window.confirm("아직 확정하지 않은 검토 변경이 있어요. 변경을 버리고 나갈까요?");

  const returnToApp = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!canLeaveReview()) event.preventDefault();
  };

  const disconnectSafely = () => {
    if (canLeaveReview()) onDisconnect();
  };

  const reloadReview = async (successNotice?: string) => {
    setRecoveringReview(true);
    const result = await workflow.refreshReview();
    setRecoveringReview(false);
    if (result.isSuccess) {
      workflow.reviewMutation.reset();
      setReviewDraftState(null);
      setRemovedReviewItem(null);
      if (successNotice) setLocalNotice(successNotice);
    }
    return result;
  };

  const retryReview = async () => {
    setLocalError(null);
    setLocalNotice(null);
    workflow.reviewMutation.reset();
    await reloadReview();
  };

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
    if (!firstZone || reviewDraftItems.length >= MAX_REVIEW_ITEMS) return;
    setLocalNotice(null);
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
    setLocalNotice(null);
    setReviewDraft(
      reviewDraftItems.map((item) =>
        item.itemKey === itemKey ? { ...item, ...changes } : item,
      ),
    );
  };

  const removeReviewItem = (itemKey: string) => {
    const index = reviewDraftItems.findIndex((item) => item.itemKey === itemKey);
    if (index < 0) return;
    setLocalNotice(null);
    setRemovedReviewItem({ index, item: reviewDraftItems[index], key: reviewKey });
    setReviewDraft(reviewDraftItems.filter((item) => item.itemKey !== itemKey));
  };

  const restoreRemovedReviewItem = () => {
    if (!activeRemovedReviewItem) return;
    const restoredItems = [...reviewDraftItems];
    restoredItems.splice(
      Math.min(activeRemovedReviewItem.index, restoredItems.length),
      0,
      activeRemovedReviewItem.item,
    );
    setReviewDraft(restoredItems);
    setRemovedReviewItem(null);
  };

  const completeReview = () => {
    if (!review || reviewCompleted || !reviewValid) return;
    setLocalError(null);
    setLocalNotice(null);
    workflow.reviewMutation.reset();
    workflow.reviewMutation.mutate(
      {
        sourceScopeVersionId: review.source_scope_version_id,
        items: reviewDraftItems.map((item) => ({
          item_key: item.itemKey,
          room_zone_id: item.roomZoneId,
          description: item.description.trim(),
        })),
      },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            void reloadReview("다른 화면에서 바뀐 최신 검토 상태를 불러왔어요.");
          }
        },
      },
    );
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink-900">
      <header className="app-safe-header flex items-center border-b border-line bg-surface px-5 pb-3">
        <Link
          aria-label={returnLabel}
          className="grid size-11 place-items-center rounded-full"
          onClick={returnToApp}
          to={returnHref}
        >
          <ArrowLeft aria-hidden="true" size={22} />
        </Link>
        <p className="mx-auto truncate px-3 text-xl font-bold">{job.title}</p>
        <button
          aria-label="연결 해제"
          className="grid size-11 place-items-center rounded-full text-ink-600"
          onClick={disconnectSafely}
          type="button"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 px-5 pb-8 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-ui-support font-bold text-primary-700">{mockApiEnabled ? "Mock 데이터로 연결됨" : "실제 서버와 연결됨"}</p>
            <h1 className="mt-2 text-ui-title-lg font-extrabold leading-8">
              {analysis?.status === "completed"
                ? "AI 초안을 확인해 주세요"
                : "출발지 구역을 촬영해 주세요"}
            </h1>
          </div>
          {(workflow.sessionsQuery.isFetching || workflow.reviewQuery.isFetching) && <LoaderCircle aria-label="상태 확인 중" className="demo-spin mt-1 shrink-0 text-primary-700" size={21} />}
        </div>
        <p className="mt-2 text-base leading-5 text-ink-600">
          {analysis?.status === "completed"
            ? "AI 제안은 확정 범위가 아니에요. 내가 확인한 내용만 다음 단계로 전달해요."
            : "파일은 비공개 저장소로 직접 전송하고, 서버 확인이 끝난 자료만 AI 분석에 사용해요."}
        </p>
        <StageRail complete={reviewCompleted} stage={stage} />

        {!session && (
          <Card className="mt-6 p-5 text-center">
            <Video className="mx-auto text-primary-700" size={28} />
            <h2 className="mt-3 text-xl font-bold">새 촬영을 시작할 준비가 됐어요</h2>
            <p className="mt-2 text-ui-support leading-5 text-ink-600">촬영 세션을 만든 뒤 구역별 사진이나 영상을 추가해요.</p>
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
                <p className="mt-3 text-lg font-bold">출발지 촬영 구역이 없어요</p>
              </div>
            )}
          </Card>
        )}

        {analysis && <AnalysisState analysis={analysis} />}

        {analysis?.status === "completed" && workflow.reviewQuery.isPending && (
          <Card className="mt-4 p-6 text-center">
            <LoaderCircle className="demo-spin mx-auto text-primary-700" size={28} />
            <p className="mt-3 text-lg font-bold">검토할 항목을 불러오고 있어요</p>
          </Card>
        )}

        {analysis?.status === "completed" && workflow.reviewQuery.isError && (
          <Card className="mt-4 border-warning bg-warning-bg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="shrink-0 text-warning" size={21} />
              <div>
                <p className="text-base font-bold">AI 초안 상태를 다시 확인해 주세요</p>
                <p className="mt-1 text-ui-support leading-5 text-ink-600">
                  {friendlyError(workflow.reviewQuery.error)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {localNotice && (
          <p
            className="mt-4 rounded-2xl bg-success-bg px-4 py-3 text-base font-bold text-success-ink"
            role="status"
          >
            {localNotice}
          </p>
        )}

        {analysis?.status === "completed" &&
          review &&
          !workflow.reviewQuery.isError &&
          !recoveringReview && (
            <AnalysisReviewPanel
              canAdd={reviewDraftItems.length < MAX_REVIEW_ITEMS}
              draftItems={reviewDraftItems}
              hasUnsavedChanges={reviewDirty}
              onAdd={addReviewItem}
              onChange={changeReviewItem}
              onRemove={removeReviewItem}
              onRestoreRemoved={restoreRemovedReviewItem}
              onSubmit={completeReview}
              removedItemDescription={
                activeRemovedReviewItem
                  ? activeRemovedReviewItem.item.description.trim() ||
                    "설명 없는 직접 추가 항목"
                  : null
              }
              review={review}
            />
          )}

        {workflow.resumableUpload && workflow.uploadMutation.isError && (
          <Card className="mt-4 border-warning bg-warning-bg p-4">
            <p className="text-base font-bold">중단된 파일 전송을 이어갈 수 있어요</p>
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
          <p className="mt-4 rounded-2xl bg-danger-bg px-4 py-3 text-base font-bold text-danger-ink" role="alert">
            {localError ?? friendlyError(requestError)}
          </p>
        )}

        {unrecoverable && !analysis && (
          <Card className="mt-4 border-warning bg-warning-bg p-4">
            <p className="text-base font-bold">완료되지 않은 파일이 있어 새 촬영이 필요해요</p>
            <p className="mt-1 text-ui-support leading-5 text-ink-600">기존 기록은 지우지 않고 새 세션에서 다시 촬영해요.</p>
          </Card>
        )}
      </main>

      <div className="app-safe-bottom sticky bottom-0 border-t border-line bg-surface/95 px-6 pt-4 backdrop-blur">
        {!session || unrecoverable ? (
          <Button className="w-full" disabled={busy || terminalJob} onClick={startSession} size="cta">
            {workflow.createSessionMutation.isPending ? <LoaderCircle className="demo-spin" size={18} /> : <Video size={18} />}
            {unrecoverable ? "새 촬영 세션 시작" : "촬영 시작"}
          </Button>
        ) : analysis?.status === "completed" ? (
          workflow.reviewQuery.isPending || recoveringReview ? (
            <Button className="w-full" disabled size="cta">
              <LoaderCircle className="demo-spin" size={18} />
              {recoveringReview ? "최신 검토 상태 확인 중" : "검토 항목 불러오는 중"}
            </Button>
          ) : workflow.reviewQuery.isError ? (
            <Button
              className="w-full"
              disabled={workflow.reviewQuery.isFetching || recoveringReview}
              onClick={() => void retryReview()}
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
        <p className="mt-3 text-center text-sm text-ink-400">
          {reviewDirty
            ? "확정 전 변경은 이 화면에만 보관돼요."
            : reviewCompleted
              ? "검토 완료본은 변경 이력으로 보존돼요."
              : terminalJob
                ? "종료된 작업에는 새 촬영을 추가할 수 없어요."
                : "업로드 URL과 secret은 브라우저에 저장하지 않아요."}
        </p>
      </div>
    </div>
  );
}

export function LiveCaptureFlow({
  initialConnection = null,
  onExit,
  returnHref = "/consumer",
}: {
  initialConnection?: CaptureConnection | null;
  onExit?: () => void;
  returnHref?: string;
} = {}) {
  const queryClient = useQueryClient();
  const [connection, setConnection] = useState<CaptureConnection | null>(initialConnection);

  const disconnect = () => {
    if (connection) {
      queryClient.removeQueries({
        queryKey: ["capture-flow", connection.cacheScope],
      });
    }
    if (initialConnection && onExit) onExit();
    else setConnection(null);
  };

  return (
    <MobileFrame>
      {connection ? (
        <ConnectedCapture
          connection={connection}
          key={connection.cacheScope}
          onDisconnect={disconnect}
          returnHref={returnHref}
          returnLabel="내 이사로 돌아가기"
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
