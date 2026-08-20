import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon as ArrowLeft,
  CameraIcon as Camera,
  CheckIcon as Check,
  UploadSimpleIcon as FileUp,
  CircleNotchIcon as LoaderCircle,
  LockKeyIcon as LockKeyhole,
  PlayIcon as Play,
  SignOutIcon as LogOut,
  ArrowClockwiseIcon as RefreshCw,
  ArrowCounterClockwiseIcon as RotateCcw,
  VideoCameraIcon as Video,
  XIcon as X,
} from "@phosphor-icons/react";
import {
  WarningStatusIcon as AlertTriangle,
  SuccessStatusIcon as CheckCircle2,
  InfoStatusIcon as Info,
  SecurityStatusIcon as ShieldCheck,
} from "@/components/icons";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { MobileFrame } from "@/components/layout/mobile-frame";
import { MobileHeaderButton, MobilePageHeader } from "@/components/layout/mobile-app-shell";
import { FilterChip, InventoryQuantityRow } from "@/components/layout/app-primitives";
import { ProgressSteps } from "@/components/workflow/workflow-task";
import {
  ANALYSIS_REVIEW_FORM_ID,
  AnalysisReviewPanel,
  MANUAL_SCOPE_FORM_ID,
  ManualScopeEditor,
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
import { MovingItemIcon } from "@/components/moving-item-icon";
import {
  movingItemCategoryForName,
  type MovingItemCategory,
} from "@/components/moving-item-assets";

interface ConnectionFormProps {
  onConnect: (jobId: string, accessToken: string) => void;
}

interface ConnectedCaptureProps {
  connection: CaptureConnection;
  initialManual: boolean;
  initialVideo: boolean;
  initialVideoFile?: File | null;
  onComplete: () => void;
  onDisconnect: () => void;
}

function VideoCaptureStage({
  fileUrl,
  onBack,
  onFile,
  onMockCapture,
  onSubmit,
  pending,
}: {
  fileUrl: string | null;
  onBack: () => void;
  onFile: (file: File) => void;
  onMockCapture: () => void;
  onSubmit: (items: { key: string; name: string; quantity: number }[]) => void;
  pending: boolean;
}) {
  const [resultQuantities, setResultQuantities] = useState<Record<string, number>>({ boxes: 4 });
  const [resultFilter, setResultFilter] = useState<"all" | MovingItemCategory>("all");
  const detectedItems = [
    { key: "bed", name: "침대", review: false },
    { key: "desk", name: "책상", review: false },
    { key: "chair", name: "의자", review: false },
    { key: "fridge", name: "냉장고", review: false },
    { key: "microwave", name: "전자레인지", review: false },
    { key: "bookcase", name: "책장", review: true },
    { key: "boxes", name: "이사 박스", review: true },
  ] as const;
  const quantityFor = (key: string) => resultQuantities[key] ?? 1;
  const updateResultQuantity = (key: string, quantity: number) => setResultQuantities((current) => ({ ...current, [key]: Math.max(0, quantity) }));
  const categoryCounts = (Object.keys({ 가구: true, 가전: true, 기타: true }) as MovingItemCategory[]).reduce(
    (counts, category) => {
      counts[category] = detectedItems.filter((item) => movingItemCategoryForName(item.name) === category).length;
      return counts;
    },
    {} as Record<MovingItemCategory, number>,
  );
  const visibleItems = detectedItems.filter(
    (item) =>
      quantityFor(item.key) > 0 &&
      (resultFilter === "all" || movingItemCategoryForName(item.name) === resultFilter),
  );

  if (fileUrl !== null)
    return (
      <div className="min-h-dvh bg-canvas text-ink-900">
        <main className="pb-44">
          <figure className="relative overflow-hidden bg-ink-900 text-white">
            <button aria-label="다시 촬영" className="app-safe-header absolute left-4 top-3 z-10 grid size-10 place-items-center rounded-full bg-ink-900/65" onClick={onBack} type="button"><ArrowLeft aria-hidden="true" size="var(--icon-sm)" /></button>
            {fileUrl === "mock" ? (
              <img
                alt="촬영한 집 전체 영상 미리보기"
                className="aspect-[4/3] w-full object-cover"
                height="240"
                src="/room-after-evidence.png"
                width="384"
              />
            ) : (
              <video
                aria-label="촬영한 영상 미리보기"
                className="aspect-[4/3] w-full object-cover"
                controls
                playsInline
                poster="/room-after-evidence.png"
                src={fileUrl}
              />
            )}
            <figcaption className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm">
              <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-ink-900/70 text-white backdrop-blur-sm"><Play size="var(--icon-md)" weight="fill" /></span>
            </figcaption>
          </figure>
          <div className="relative -mt-6 rounded-t-[var(--radius-feature)] bg-canvas px-5 pt-5">
          <div aria-hidden="true" className="mx-auto mb-4 h-1 w-12 rounded-full bg-ink-300" />
          <h1 className="text-center text-ui-section font-black">AI가 짐 {detectedItems.length}개를 발견했어요</h1>
          <p className="mt-2 text-center text-sm text-ink-600">방과 상관없이 짐 종류별로 정리했어요.</p>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="AI 인식 결과 분류">
            <FilterChip active={resultFilter === "all"} onClick={() => setResultFilter("all")}>전체 {detectedItems.length}</FilterChip>
            {(Object.keys(categoryCounts) as MovingItemCategory[]).map((category) => (
              <FilterChip active={resultFilter === category} key={category} onClick={() => setResultFilter(category)}>{category} {categoryCounts[category]}</FilterChip>
            ))}
          </div>
          <section className="mt-3 space-y-2">{visibleItems.map((item) => { const quantity = quantityFor(item.key); return <InventoryQuantityRow icon={<MovingItemIcon name={item.name} />} key={item.key} name={item.name} onDecrease={() => updateResultQuantity(item.key, quantity - 1)} onIncrease={() => updateResultQuantity(item.key, quantity + 1)} onRemove={() => updateResultQuantity(item.key, 0)} quantity={quantity} reviewRequired={item.review} />; })}</section>
          </div>
        </main>
        <div className="app-fixed-action fixed inset-x-0 bottom-0 z-[var(--z-sticky)] mx-auto max-w-[var(--shell-mobile)] bg-surface px-5 pt-3">
          <Button
            className="w-full"
            disabled={pending}
            onClick={() => onSubmit(detectedItems.filter((item) => quantityFor(item.key) > 0).map((item) => ({ key: item.key, name: item.name, quantity: quantityFor(item.key) })))}
            size="cta"
          >
            {pending ? (
              <LoaderCircle aria-hidden="true" className="demo-spin" />
            ) : (
              <Check aria-hidden="true" />
            )}
            확인한 짐 {detectedItems.filter((item) => quantityFor(item.key) > 0).length}개 반영
          </Button>
          <Button className="mt-2 w-full" onClick={onBack} size="cta" variant="ghost"><RotateCcw aria-hidden="true" />다시 촬영</Button>
        </div>
      </div>
    );

  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink-900 text-white">
      <img
        alt="집 전체 촬영"
        className="absolute inset-0 h-full w-full object-cover opacity-75"
        height="844"
        src="/room-after-evidence.png"
        width="390"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--color-overlay)]"
      />
      <header className="app-safe-header relative z-10 grid grid-cols-[48px_1fr_48px] items-center px-3 pt-3">
        <button
          aria-label="촬영 닫기"
          className="grid size-11 place-items-center rounded-full bg-ink-900/60"
          onClick={onBack}
          type="button"
        >
          <X aria-hidden="true" size="var(--icon-md)" />
        </button>
        <h1 className="text-center text-xl font-black">집 전체 촬영</h1>
        <span className="grid size-11 place-items-center rounded-full bg-ink-900/60">
          <Camera aria-hidden="true" size="var(--icon-sm)" />
        </span>
      </header>
      <main className="relative z-10 flex min-h-[calc(100dvh-80px)] flex-col justify-end px-6 pb-[max(28px,env(safe-area-inset-bottom))]">
        <div className="space-y-2">
          <p className="w-fit rounded-full bg-surface/88 px-4 py-2 text-sm font-bold text-ink-900">
            <Check
              aria-hidden="true"
              className="mr-2 inline text-success"
              size="var(--icon-sm)"
            />
            침실·주방·거실의 큰 짐을 천천히 보여주세요
          </p>
          <p className="w-fit rounded-full bg-surface/88 px-4 py-2 text-sm font-bold text-ink-900">
            방 이름과 상관없이 짐이 잘 보이게 촬영해 주세요
          </p>
        </div>
        <div className="mt-8 text-center">
          <p className="text-ui-section font-black">60초 촬영</p>
          <label
            className="mx-auto mt-5 grid size-24 place-items-center rounded-full border-[7px] border-white bg-danger text-white shadow-[var(--shadow-raised)]"
            htmlFor="native-video-capture"
          >
            <Video
              aria-hidden="true"
              size="var(--icon-category)"
              weight="fill"
            />
            <span className="sr-only">휴대폰 카메라로 영상 촬영 시작</span>
          </label>
          <input
            accept="video/mp4,video/*"
            capture="environment"
            className="sr-only"
            id="native-video-capture"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) onFile(file);
            }}
            type="file"
          />
          {mockApiEnabled ? (
            <button
              className="mt-5 min-h-11 rounded-full bg-surface/90 px-5 text-sm font-extrabold text-ink-900"
              onClick={onMockCapture}
              type="button"
            >
              Mock 촬영 완료
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );
}

const videoProcessingSteps = [
  { title: "촬영 영상을 업로드하고 있어요", description: "영상이 안전하게 전송되고 있어요." },
  { title: "AI가 짐 목록을 만들고 있어요", description: "영상 속 짐을 가구·가전·기타로 나누고 있어요." },
  { title: "검토할 초안을 준비하고 있어요", description: "잠시 후 확인할 수 있어요." },
] as const;

function VideoProcessingStage({ error, onBack, step }: { error?: string | null; onBack: () => void; step: number }) {
  const activeStep = Math.min(step, videoProcessingSteps.length - 1);
  return <div className="flex min-h-dvh flex-col bg-canvas text-ink-900">
    <MobilePageHeader onBack={onBack} title="AI 분석 중" />
    <main className="flex flex-1 flex-col justify-center px-6 pb-20">
      {error ? (
        <Card className="border-danger bg-danger-bg p-5 text-center">
          <AlertTriangle aria-hidden="true" className="mx-auto text-danger-ink" size="var(--icon-category)" />
          <h1 className="mt-4 text-ui-section font-black">영상 분석을 시작하지 못했어요</h1>
          <p className="mt-2 text-ui-support leading-5 text-danger-ink">{error}</p>
          <Button className="mt-5 w-full" onClick={onBack} size="cta">촬영 화면으로 돌아가기</Button>
        </Card>
      ) : (
        <>
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary-50 text-primary-700"><LoaderCircle aria-hidden="true" className="demo-spin" size="var(--icon-category)" /></span>
          <h1 className="mt-7 text-center text-ui-section font-black">촬영 내용을 정리하고 있어요</h1>
          <p className="mt-2 text-center text-ui-support text-ink-600">화면을 닫아도 업로드된 촬영은 보존돼요.</p>
          <ol className="mt-8 space-y-3">
            {videoProcessingSteps.map((item, index) => <li className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${index < activeStep ? "border-success bg-success-bg" : index === activeStep ? "border-primary-100 bg-primary-50" : "border-line bg-surface"}`} key={item.title}>
              <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-black ${index < activeStep ? "bg-success text-white" : index === activeStep ? "bg-primary-600 text-white" : "bg-surface-muted text-ink-400"}`}>{index < activeStep ? <Check aria-hidden="true" size="var(--icon-xs)" weight="bold" /> : index + 1}</span>
              <span><strong className="block text-ui-data">{item.title}</strong><span className="mt-0.5 block text-ui-micro text-ink-600">{item.description}</span></span>
            </li>)}
          </ol>
        </>
      )}
    </main>
  </div>;
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

const ACTIVE_ANALYSIS = new Set([
  "pending",
  "dispatching",
  "queued",
  "running",
]);
const MAX_REVIEW_ITEMS = 500;
const VALIDATING_MEDIA = new Set(["uploaded", "processing"]);

function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "초대 정보가 만료됐거나 올바르지 않아요.";
    if (error.status === 403) return "이 역할로는 촬영을 진행할 수 없어요.";
    if (error.status === 404) return "이 초대 정보에서 작업을 찾을 수 없어요.";
    if (error.status === 409)
      return "서버 상태가 바뀌었어요. 상태를 새로 확인해 주세요.";
    if (error.status === 429)
      return "요청이 잠시 많아요. 잠시 뒤 다시 시도해 주세요.";
    if (error.status >= 500)
      return "서버 연결이 원활하지 않아요. 잠시 뒤 다시 시도해 주세요.";
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
  const [accessToken, setAccessToken] = useState(
    mockApiEnabled ? mockAccessSecrets.customer : "",
  );
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
          <ArrowLeft aria-hidden="true" size="var(--icon-sm)" />
        </a>
        <p className="mx-auto pr-11 text-lg font-bold">촬영 이어가기</p>
      </header>
      <main className="flex-1 px-6 pb-8 pt-7">
        <span className="grid size-12 place-items-center rounded-full bg-primary-50 text-primary-700">
          <LockKeyhole aria-hidden="true" size="var(--icon-md)" />
        </span>
        <h1 className="mt-6 text-ui-section font-extrabold leading-9 tracking-[var(--tracking-display)]">
          받은 초대 정보로
          <br />내 촬영을 불러와요
        </h1>
        <p className="mt-3 text-base leading-6 text-ink-600">
          {mockApiEnabled
            ? "Mock 작업 ID와 초대 코드가 자동 입력되었습니다."
            : "초대 안내에서 받은 작업 ID와 초대 코드를 한 번만 입력해 주세요."}
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
            초대 코드
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
            <p
              className="rounded-2xl bg-danger-bg px-4 py-3 text-base font-bold text-danger-ink"
              role="alert"
            >
              {error}
            </p>
          )}
          <Button className="w-full" size="cta" type="submit">
            촬영 불러오기
          </Button>
        </form>

        <Card className="mt-6 flex gap-3 border-primary-100 bg-primary-50 p-4">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-primary-700"
            size="var(--icon-sm)"
          />
          <div>
            <p className="text-base font-bold">
              이 화면을 닫으면 secret도 사라져요
            </p>
            <p className="mt-1 text-ui-support leading-5 text-ink-600">
              URL, 브라우저 저장소, 로그에는 남기지 않아요.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
function StageRail({
  complete,
  stage,
}: {
  complete: boolean;
  stage: 1 | 2 | 3 | 4;
}) {
  return (
    <div className="mt-5 rounded-[var(--radius-card)] border border-line bg-surface px-3 py-4">
      <ProgressSteps
        current={complete ? 4 : stage - 1}
        items={["촬영", "확인", "분석", "검토"]}
      />
    </div>
  );
}

function zoneState(
  assets: MediaAsset[],
  resumableAssetId: string | null,
): { label: string; tone: "default" | "success" | "warning" } {
  if (assets.length === 0) return { label: "촬영 필요", tone: "default" };
  if (
    assets.some(
      (asset) => asset.status === "failed" || asset.status === "deleted",
    )
  ) {
    return { label: "새 촬영 필요", tone: "warning" };
  }
  if (
    assets.some(
      (asset) =>
        asset.status === "pending_upload" && asset.id !== resumableAssetId,
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
        {state.tone === "success" ? (
          <Check aria-hidden="true" size="var(--icon-xs)" />
        ) : (
          index + 1
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-lg font-bold">{zone.name}</p>
          <Badge
            variant={
              state.tone === "success"
                ? "success"
                : state.tone === "warning"
                  ? "warning"
                  : "neutral"
            }
          >
            {state.label}
          </Badge>
        </div>
        <p className="mt-1 text-ui-support text-ink-400">
          {assets.length > 0
            ? assets
                .map((asset) =>
                  asset.content_type === "video/mp4" ? "영상" : "사진",
                )
                .join(" · ")
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
        <Camera aria-hidden="true" size="var(--icon-sm)" />
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
          <CheckCircle2
            aria-hidden="true"
            className="shrink-0 text-success-ink"
            size="var(--icon-md)"
          />
          <div>
            <h2 className="text-xl font-bold text-success-ink">
              AI 초안이 준비됐어요
            </h2>
            <p className="mt-2 text-base leading-5 text-ink-600">
              촬영 결과를 작업범위 초안으로 저장했어요. 아래에서 설명을 고치거나
              빠진 항목을 추가해 주세요.
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
          <AlertTriangle
            aria-hidden="true"
            className="shrink-0 text-warning"
            size="var(--icon-md)"
          />
          <div>
            <h2 className="text-xl font-bold">분석을 완료하지 못했어요</h2>
            <p className="mt-2 text-base leading-5 text-ink-600">
              촬영 파일은 그대로 보존됐어요. 아래에서 짐 목록을 직접 작성해
              흐름을 계속할 수 있어요.
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
          <LoaderCircle
            aria-hidden="true"
            className="demo-spin"
            size="var(--icon-md)"
          />
        </span>
        <div>
          <h2 className="text-xl font-bold">{copy[analysis.status]}</h2>
          <p className="mt-1 text-ui-support text-ink-600">
            화면을 열어 둔 동안 상태를 자동으로 확인해요.
          </p>
        </div>
      </div>
    </Card>
  );
}

function ConnectedCapture({
  connection,
  initialManual,
  initialVideo,
  initialVideoFile,
  onComplete,
  onDisconnect,
}: ConnectedCaptureProps) {
  const workflow = useCaptureWorkflow(connection);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);
  const [manualMode, setManualMode] = useState(initialManual);
  const [manualDraftItems, setManualDraftItems] = useState<
    AnalysisReviewDraftItem[]
  >([]);
  const [videoMode, setVideoMode] = useState<"capture" | "loading" | "review" | null>(initialVideoFile ? "loading" : initialVideo ? "capture" : null);
  const [mockProcessingStep, setMockProcessingStep] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoAnalysisSessionId, setVideoAnalysisSessionId] = useState<string | null>(null);
  const [videoAnalysisRequested, setVideoAnalysisRequested] = useState(false);
  const [videoSubmitPendingSessionId, setVideoSubmitPendingSessionId] = useState<string | null>(null);
  const initialVideoStarted = useRef(false);
  const prepareVideoRef = useRef<(file: File) => void>(() => undefined);
  const [recoveringReview, setRecoveringReview] = useState(false);
  const [removedReviewItem, setRemovedReviewItem] =
    useState<RemovedReviewItem | null>(null);
  const [reviewDraftState, setReviewDraftState] =
    useState<ReviewDraftState | null>(null);
  const appendReviewOnNextLoad = useRef(false);
  const previousReviewDraftItems = useRef<AnalysisReviewDraftItem[]>([]);
  const job = workflow.jobQuery.data;
  const sessions = workflow.sessionsQuery.data;
  const session = sessions?.[0] ?? null;
  const resumableVideoSession = sessions?.find((candidate) => {
    const videoAssets = candidate.media_assets.filter(
      (asset) => asset.media_purpose === "inventory" && asset.content_type === "video/mp4",
    );
    if (videoAssets.length === 0) return false;
    if (candidate.analysis) return ACTIVE_ANALYSIS.has(candidate.analysis.status);
    return videoAssets.some(
      (asset) => VALIDATING_MEDIA.has(asset.status) || asset.status === "ready",
    );
  }) ?? null;
  const origin = job?.locations.find((location) => location.kind === "origin");
  const zones = [...(origin?.room_zones ?? [])].sort(
    (left, right) => left.sort_order - right.sort_order,
  );
  const inventoryAssets =
    session?.media_assets.filter(
      (asset) => asset.media_purpose === "inventory",
    ) ?? [];
  const resumableAssetId = workflow.resumableUpload?.target.asset.id ?? null;
  const unrecoverable = inventoryAssets.some(
    (asset) =>
      asset.status === "failed" ||
      asset.status === "deleted" ||
      (asset.status === "pending_upload" && asset.id !== resumableAssetId),
  );
  const validating = inventoryAssets.some((asset) =>
    VALIDATING_MEDIA.has(asset.status),
  );
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
  const videoAnalysis = videoAnalysisSessionId
    ? sessions?.find(({ id }) => id === videoAnalysisSessionId)?.analysis ?? null
    : null;
  const analysisActive =
    analysis !== null && ACTIVE_ANALYSIS.has(analysis.status);
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
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          workNote: item.work_note,
        })) ?? []);
  useEffect(() => {
    if (!review || !appendReviewOnNextLoad.current) return;
    const merged = [...previousReviewDraftItems.current];
    const existingKeys = new Set(merged.map((item) => item.itemKey));
    review.items.forEach((item) => {
      if (existingKeys.has(item.item_key)) return;
      merged.push({
        itemKey: item.item_key,
        roomZoneId: item.room_zone_id,
        description: item.description,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        workNote: item.work_note,
      });
    });
    setReviewDraftState({ key: reviewKey, items: merged });
    appendReviewOnNextLoad.current = false;
  }, [review, reviewKey]);
  const reviewCompleted =
    review?.review_scope_version_id !== null && review !== undefined;
  const latestScopeVersion = [...(workflow.scopeVersionsQuery.data ?? [])]
    .sort((left, right) => left.sequence_number - right.sequence_number)
    .at(-1);
  const reviewDirty =
    !reviewCompleted &&
    review !== undefined &&
    (reviewDraftItems.length !== review.items.length ||
      reviewDraftItems.some((draft) => {
        const original = review.items.find(
          (item) => item.item_key === draft.itemKey,
        );
        return (
          original === undefined ||
          original.room_zone_id !== draft.roomZoneId ||
          original.description !== draft.description
          || original.name !== draft.name
          || original.quantity !== draft.quantity
          || original.unit !== draft.unit
          || original.work_note !== draft.workNote
        );
      }));
  const activeRemovedReviewItem =
    removedReviewItem?.key === reviewKey ? removedReviewItem : null;
  const reviewValid =
    reviewDraftItems.length > 0 &&
    reviewDraftItems.every(
      (item) =>
        (review?.scope_schema_version === 2
          ? Boolean(item.name?.trim() && item.quantity && item.quantity > 0 && item.unit?.trim())
          : item.description.trim().length > 0) &&
        review?.zones.some((zone) => zone.room_zone_id === item.roomZoneId),
    );
  const manualValid =
    manualDraftItems.length > 0 &&
    manualDraftItems.every(
      (item) =>
        item.description.trim().length > 0 &&
        zones.some((zone) => zone.id === item.roomZoneId),
    );
  const stage: 1 | 2 | 3 | 4 = manualMode
    ? 1
    : analysis?.status === "completed"
      ? 4
      : analysis
        ? 3
        : validating || allReady
          ? 2
          : 1;
  const busy =
    workflow.createSessionMutation.isPending ||
    workflow.uploadMutation.isPending ||
    workflow.submitMutation.isPending ||
    workflow.reviewMutation.isPending ||
    workflow.manualScopeMutation.isPending ||
    recoveringReview;
  const videoProcessingStep = mockApiEnabled
    ? mockProcessingStep
    : workflow.createSessionMutation.isPending || workflow.uploadMutation.isPending
      ? 0
      : videoAnalysis?.status === "running"
        ? 2
        : videoAnalysis?.status === "completed"
          ? 2
          : videoAnalysis || workflow.submitMutation.isPending
          ? 1
          : 0;
  const requestError =
    workflow.jobQuery.error ??
    workflow.sessionsQuery.error ??
    workflow.createSessionMutation.error ??
    workflow.uploadMutation.error ??
    workflow.submitMutation.error ??
    workflow.reviewMutation.error ??
    workflow.manualScopeMutation.error;
  const initialVideoReady = Boolean(job && !workflow.jobQuery.isPending && !workflow.sessionsQuery.isPending && !workflow.consentPolicyQuery.isPending);

  const startVideoUpload = (file: File) => {
    if (resumableVideoSession) {
      setLocalError(null);
      setVideoAnalysisSessionId(resumableVideoSession.id);
      setVideoAnalysisRequested(true);
      setVideoSubmitPendingSessionId(
        resumableVideoSession.analysis ? null : resumableVideoSession.id,
      );
      setVideoMode("loading");
      return;
    }
    const roomZoneId = zones[0]?.id;
    if (!roomZoneId || (!session && !workflow.consentPolicyQuery.data)) {
      setLocalError("촬영 준비가 끝나지 않았어요. 잠시 후 다시 시도해 주세요.");
      setVideoMode("loading");
      return;
    }
    setVideoAnalysisRequested(true);
    const fail = (error: unknown) => {
      setVideoAnalysisRequested(false);
      setVideoSubmitPendingSessionId(null);
      setLocalError(friendlyError(error));
      setVideoMode("loading");
    };
    const uploadAndAnalyze = (captureSessionId: string) => workflow.uploadMutation.mutate(
      { captureSessionId, file, roomZoneId },
      {
        onSuccess: () => {
          if (mockApiEnabled) {
            workflow.submitMutation.mutate(captureSessionId, { onError: fail });
          } else {
            setVideoSubmitPendingSessionId(captureSessionId);
          }
        },
        onError: fail,
      },
    );
    if (!session || analysis) {
      workflow.createSessionMutation.mutate(undefined, {
        onSuccess: (created) => {
          setVideoAnalysisSessionId(created.id);
          uploadAndAnalyze(created.id);
        },
        onError: fail,
      });
    } else {
      setVideoAnalysisSessionId(session.id);
      uploadAndAnalyze(session.id);
    }
  };

  const prepareVideo = (file: File) => {
    const error = captureFileError(file);
    if (error) {
      setLocalError(error);
      return;
    }
    setVideoSubmitPendingSessionId(null);
    if (videoUrl && videoUrl !== "mock") URL.revokeObjectURL(videoUrl);
    setLocalError(null);
    if (mockApiEnabled) {
      setVideoAnalysisRequested(false);
      setVideoAnalysisSessionId(null);
      setMockProcessingStep(0);
      setVideoUrl(URL.createObjectURL(file));
      setVideoMode("loading");
      return;
    }
    setVideoAnalysisSessionId(null);
    setVideoUrl(null);
    setVideoMode("loading");
    startVideoUpload(file);
  };

  useEffect(() => {
    if (!reviewDirty) return;
    const preventUnsavedExit = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", preventUnsavedExit);
    return () => window.removeEventListener("beforeunload", preventUnsavedExit);
  }, [reviewDirty]);

  useEffect(
    () => () => {
      if (videoUrl && videoUrl !== "mock") URL.revokeObjectURL(videoUrl);
    },
    [videoUrl],
  );

  useEffect(() => {
    if (videoMode !== "loading" || !mockApiEnabled) return;
    const timers = videoProcessingSteps.slice(1).map((_, index) => window.setTimeout(() => setMockProcessingStep(index + 1), (index + 1) * 1_000));
    const completeTimer = window.setTimeout(() => setVideoMode("review"), videoProcessingSteps.length * 1_000);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(completeTimer);
    };
  }, [videoMode]);

  useEffect(() => {
    if (videoMode !== "loading" || mockApiEnabled) return;
    if (!videoAnalysisRequested || !videoAnalysis) return;
    if (videoAnalysis.status === "completed" || videoAnalysis.status === "failed") {
      const completionTimer = window.setTimeout(() => {
        setVideoAnalysisRequested(false);
        if (videoAnalysis.status === "completed") {
          void (async () => {
            try {
              const refreshed = await workflow.refreshReview();
              if (!refreshed.isError) {
                setLocalNotice("촬영 영상을 분석해 검토할 초안을 만들었어요.");
                setVideoAnalysisSessionId(null);
                setVideoMode(null);
              } else {
                setLocalError(friendlyError(refreshed.error));
              }
            } catch (error) {
              setLocalError(friendlyError(error));
            }
          })();
        } else {
          setLocalError("AI 분석에 실패했어요. 촬영 화면으로 돌아가 다시 시도해 주세요.");
        }
      }, 0);
      return () => window.clearTimeout(completionTimer);
    }
  }, [videoAnalysis, videoAnalysisRequested, videoMode, workflow]);

  useEffect(() => {
    if (
      mockApiEnabled ||
      videoMode !== "loading" ||
      !videoAnalysisRequested ||
      !videoSubmitPendingSessionId
    ) return;
    const pendingSession = sessions?.find(
      ({ id }) => id === videoSubmitPendingSessionId,
    );
    if (!pendingSession) return;
    const assets = pendingSession.media_assets.filter(
      (asset) => asset.media_purpose === "inventory",
    );
    if (assets.some((asset) => asset.status === "failed" || asset.status === "deleted")) {
      const failureTimer = window.setTimeout(() => {
        setVideoSubmitPendingSessionId(null);
        setVideoAnalysisRequested(false);
        setLocalError("영상 파일 확인에 실패했어요. 다시 촬영해 주세요.");
      }, 0);
      return () => window.clearTimeout(failureTimer);
    }
    if (assets.length === 0 || assets.some((asset) => asset.status !== "ready")) return;

    const submitTimer = window.setTimeout(() => {
      setVideoSubmitPendingSessionId(null);
      workflow.submitMutation.mutate(videoSubmitPendingSessionId, {
        onError: (error) => {
          setVideoAnalysisRequested(false);
          setLocalError(friendlyError(error));
          setVideoMode("loading");
        },
      });
    }, 0);
    return () => window.clearTimeout(submitTimer);
  }, [sessions, videoAnalysisRequested, videoMode, videoSubmitPendingSessionId, workflow]);

  useEffect(() => {
    prepareVideoRef.current = prepareVideo;
  });

  useEffect(() => {
    if (!initialVideoFile || initialVideoStarted.current || !initialVideoReady) return;
    initialVideoStarted.current = true;
    prepareVideoRef.current(initialVideoFile);
  }, [initialVideoFile, initialVideoReady]);

  useEffect(() => {
    if (
      !initialVideo ||
      initialVideoFile ||
      initialVideoStarted.current ||
      !initialVideoReady
    ) return;
    initialVideoStarted.current = true;
    if (!resumableVideoSession) return;
    const resumeTimer = window.setTimeout(() => {
      setLocalError(null);
      setVideoAnalysisSessionId(resumableVideoSession.id);
      setVideoAnalysisRequested(true);
      setVideoSubmitPendingSessionId(
        resumableVideoSession.analysis ? null : resumableVideoSession.id,
      );
      setVideoMode("loading");
    }, 0);
    return () => window.clearTimeout(resumeTimer);
  }, [initialVideo, initialVideoFile, initialVideoReady, resumableVideoSession]);

  if (workflow.jobQuery.isPending || workflow.sessionsQuery.isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-8 text-center">
        <div>
          <LoaderCircle
            aria-hidden="true"
            className="demo-spin mx-auto text-primary-700"
            size="var(--icon-category)"
          />
          <p className="mt-4 text-lg font-bold">
            내 촬영 상태를 불러오고 있어요
          </p>
        </div>
      </div>
    );
  }

  if (!job || workflow.jobQuery.isError || workflow.sessionsQuery.isError) {
    return (
      <div className="flex min-h-dvh flex-col bg-canvas px-6 pb-8 pt-20">
        <AlertTriangle
          aria-hidden="true"
          className="text-warning"
          size="var(--icon-category)"
        />
        <h1 className="mt-5 text-ui-title-lg font-extrabold">
          촬영을 불러오지 못했어요
        </h1>
        <p className="mt-3 text-lg leading-6 text-ink-600">
          {friendlyError(requestError)}
        </p>
        <div className="mt-auto space-y-3">
          <Button
            className="w-full"
            onClick={() =>
              void Promise.all([
                workflow.jobQuery.refetch(),
                workflow.sessionsQuery.refetch(),
              ])
            }
            size="cta"
          >
            <RefreshCw aria-hidden="true" size="var(--icon-sm)" /> 다시 확인
          </Button>
          <Button
            className="w-full"
            onClick={onDisconnect}
            size="cta"
            variant="outline"
          >
            초대 정보 다시 입력
          </Button>
        </div>
      </div>
    );
  }

  const terminalJob = job.status === "completed" || job.status === "canceled";
  const uploadDisabled =
    !session || analysis !== null || busy || unrecoverable || terminalJob;

  const canLeaveReview = () =>
    !reviewDirty ||
    window.confirm(
      "아직 확정하지 않은 검토 변경이 있어요. 변경을 버리고 나갈까요?",
    );

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
    if (!consentAcknowledged || !workflow.consentPolicyQuery.data) return;
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

  const addReviewItem = (description = "") => {
    const firstZone = review?.zones[0];
    if (!firstZone || reviewDraftItems.length >= MAX_REVIEW_ITEMS) return;
    setLocalNotice(null);
    setReviewDraft([
      ...reviewDraftItems,
      {
        itemKey: `customer-${crypto.randomUUID()}`,
        roomZoneId: firstZone.room_zone_id,
        description,
        name: review.scope_schema_version === 2 ? description : undefined,
        quantity: review.scope_schema_version === 2 ? 1 : undefined,
        unit: review.scope_schema_version === 2 ? "개" : undefined,
        workNote: null,
      },
    ]);
  };

  const startAdditionalVideo = () => {
    if (reviewCompleted || busy || !review) return;
    previousReviewDraftItems.current = reviewDraftItems;
    appendReviewOnNextLoad.current = true;
    setLocalError(null);
    setLocalNotice(null);
    setVideoMode("capture");
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
    const index = reviewDraftItems.findIndex(
      (item) => item.itemKey === itemKey,
    );
    if (index < 0) return;
    setLocalNotice(null);
    setRemovedReviewItem({
      index,
      item: reviewDraftItems[index],
      key: reviewKey,
    });
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
        scopeSchemaVersion: review.scope_schema_version,
        locationConditions: review.location_conditions,
        items: reviewDraftItems.map((item) => review.scope_schema_version === 2 ? ({
          item_key: item.itemKey,
          room_zone_id: item.roomZoneId,
          name: item.name!.trim(),
          quantity: item.quantity!,
          unit: item.unit!.trim(),
          work_note: item.workNote?.trim() || null,
        }) : ({
          item_key: item.itemKey,
          room_zone_id: item.roomZoneId,
          description: item.description.trim(),
        })),
      },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            void reloadReview(
              "다른 화면에서 바뀐 최신 검토 상태를 불러왔어요.",
            );
          }
        },
      },
    );
  };

  const startManualEntry = () => {
    const firstZone = zones[0];
    if (!firstZone || latestScopeVersion?.locked_at) return;
    setLocalError(null);
    setLocalNotice(null);
    workflow.manualScopeMutation.reset();
    setManualDraftItems((current) =>
      current.filter((item) => item.description.trim().length > 0),
    );
    setManualMode(true);
  };

  const addManualItem = (description = "") => {
    const firstZone = zones[0];
    if (!firstZone || manualDraftItems.length >= MAX_REVIEW_ITEMS) return;
    setManualDraftItems((current) => [
      ...current,
      {
        itemKey: `customer-${crypto.randomUUID()}`,
        roomZoneId: firstZone.id,
        description,
      },
    ]);
  };

  const completeManualScope = () => {
    if (!manualValid || latestScopeVersion?.locked_at) return;
    workflow.manualScopeMutation.mutate(
      {
        parentVersionId: latestScopeVersion?.id ?? null,
        items: manualDraftItems.map((item) => ({
          item_key: item.itemKey,
          room_zone_id: item.roomZoneId,
          description: item.description.trim(),
        })),
      },
      {
        onSuccess: onComplete,
      },
    );
  };

  const applyVideo = (detectedItems: { key: string; name: string; quantity: number }[]) => {
    if (!review || reviewCompleted || workflow.reviewMutation.isPending) return;
    const roomZoneId = review.zones[0]?.room_zone_id;
    if (!roomZoneId) return;
    const existingItems = reviewDraftItems.filter((item) => item.description.trim().length > 0);
    const existingKeys = new Set(existingItems.map((item) => item.itemKey));
    const videoItems = detectedItems.map((item) => {
      const itemKey = `video-${item.key}-${crypto.randomUUID()}`;
      return review.scope_schema_version === 2
        ? { item_key: itemKey, room_zone_id: roomZoneId, name: item.name, quantity: item.quantity, unit: "개", work_note: null }
        : { item_key: itemKey, room_zone_id: roomZoneId, description: item.quantity > 1 ? `${item.name} ${item.quantity}개` : item.name };
    });
    workflow.reviewMutation.mutate(
      {
        sourceScopeVersionId: review.source_scope_version_id,
        scopeSchemaVersion: review.scope_schema_version,
        locationConditions: review.location_conditions,
        items: review.scope_schema_version === 2
          ? [
              ...existingItems.map((item) => ({ item_key: item.itemKey, room_zone_id: item.roomZoneId, name: item.name!.trim(), quantity: item.quantity!, unit: item.unit!.trim(), work_note: item.workNote?.trim() || null })),
              ...videoItems.filter((item) => !existingKeys.has(item.item_key)),
            ]
          : [
              ...existingItems.map((item) => ({ item_key: item.itemKey, room_zone_id: item.roomZoneId, description: item.description.trim() })),
              ...videoItems.filter((item) => !existingKeys.has(item.item_key)),
            ],
      },
      { onSuccess: onComplete },
    );
  };

  if (videoMode === "loading") {
    return (
      <VideoProcessingStage
        error={localError}
        onBack={() => {
          if (appendReviewOnNextLoad.current) {
            appendReviewOnNextLoad.current = false;
            previousReviewDraftItems.current = [];
            setVideoAnalysisRequested(false);
            setVideoAnalysisSessionId(null);
            setVideoSubmitPendingSessionId(null);
            setVideoMode(null);
          } else {
            onDisconnect();
          }
        }}
        step={videoProcessingStep}
      />
    );
  }

  if (videoMode)
    return (
      <VideoCaptureStage
        fileUrl={videoMode === "review" ? videoUrl : null}
        onBack={() => {
          if (videoMode === "capture") {
            if (appendReviewOnNextLoad.current) {
              appendReviewOnNextLoad.current = false;
              previousReviewDraftItems.current = [];
              setVideoSubmitPendingSessionId(null);
              setVideoMode(null);
            } else {
              onDisconnect();
            }
          }
          else {
            if (videoUrl && videoUrl !== "mock") URL.revokeObjectURL(videoUrl);
            setVideoAnalysisRequested(false);
            setVideoAnalysisSessionId(null);
            setVideoSubmitPendingSessionId(null);
            setVideoUrl(null);
            setVideoMode("capture");
          }
        }}
        onFile={prepareVideo}
        onMockCapture={() => {
          setVideoAnalysisRequested(false);
          setVideoAnalysisSessionId(null);
          setVideoSubmitPendingSessionId(null);
          setMockProcessingStep(0);
          setVideoUrl("mock");
          setVideoMode("loading");
        }}
        onSubmit={applyVideo}
        pending={busy || workflow.reviewQuery.isPending || !review}
      />
    );

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink-900">
      <MobilePageHeader
        className={manualMode ? "border-b-0" : undefined}
        left={<MobileHeaderButton ariaLabel="이전 화면으로 돌아가기" onClick={disconnectSafely}><ArrowLeft aria-hidden="true" size="var(--icon-sm)" /></MobileHeaderButton>}
        right={<MobileHeaderButton ariaLabel={manualMode ? "짐 목록 선택 닫기" : "연결 해제"} className="text-ink-600" onClick={disconnectSafely}>{manualMode ? <X aria-hidden="true" size="var(--icon-sm)" /> : <LogOut aria-hidden="true" size="var(--icon-sm)" />}</MobileHeaderButton>}
        title={manualMode ? "짐 목록 선택" : job.title}
      />

      <main className={`flex-1 px-5 pb-8 ${manualMode ? "pt-4" : "pt-5"}`}>
        {!manualMode ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-ui-support font-bold text-primary-700">
                  {mockApiEnabled
                    ? "Mock 데이터로 연결됨"
                    : "실제 서버와 연결됨"}
                </p>
                <h1 className="mt-2 text-ui-title-lg font-extrabold leading-8">
                  {analysis?.status === "completed"
                    ? "AI 초안을 확인해 주세요"
                    : "출발지 구역을 촬영해 주세요"}
                </h1>
              </div>
              {(workflow.sessionsQuery.isFetching ||
                workflow.reviewQuery.isFetching) && (
                <LoaderCircle
                  aria-label="상태 확인 중"
                  className="demo-spin mt-1 shrink-0 text-primary-700"
                  size="var(--icon-sm)"
                />
              )}
            </div>
            <p className="mt-2 text-base leading-5 text-ink-600">
              {analysis?.status === "completed"
                ? "AI 제안은 확정 범위가 아니에요. 내가 확인한 내용만 다음 단계로 전달해요."
                : "파일은 비공개 저장소로 직접 전송하고, 서버 확인이 끝난 자료만 AI 분석에 사용해요."}
            </p>
            <StageRail complete={reviewCompleted} stage={stage} />
          </>
        ) : null}

        {!session && !manualMode && (
          <Card className="mt-6 p-5 text-center">
            <Video
              aria-hidden="true"
              className="mx-auto text-primary-700"
              size="var(--icon-category)"
            />
            <h2 className="mt-3 text-xl font-bold">
              새 촬영을 시작할 준비가 됐어요
            </h2>
            <p className="mt-2 text-ui-support leading-5 text-ink-600">
              촬영 세션을 만든 뒤 구역별 사진이나 영상을 추가해요.
            </p>
            <Button
              className="mt-4 w-full"
              disabled={
                zones.length === 0 ||
                workflow.scopeVersionsQuery.isPending ||
                Boolean(latestScopeVersion?.locked_at)
              }
              onClick={startManualEntry}
              size="chip"
              variant="outline"
            >
              촬영 없이 직접 입력
            </Button>
          </Card>
        )}

        {session && !analysis && (
          <Card className="relative mt-6 overflow-hidden px-5">
            <span className="absolute bottom-8 left-[37px] top-8 w-px bg-primary-100" />
            {zones.length > 0 ? (
              <ol>
                {zones.map((zone, index) => (
                  <ZoneRow
                    assets={inventoryAssets.filter(
                      (asset) => asset.room_zone_id === zone.id,
                    )}
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
                <Info
                  aria-hidden="true"
                  className="mx-auto text-warning"
                  size="var(--icon-md)"
                />
                <p className="mt-3 text-lg font-bold">
                  출발지 촬영 구역이 없어요
                </p>
              </div>
            )}
          </Card>
        )}

        {analysis && !manualMode ? <AnalysisState analysis={analysis} /> : null}

        {analysis?.status === "failed" && !manualMode ? (
          <Button
            className="mt-4 w-full"
            disabled={
              zones.length === 0 ||
              workflow.scopeVersionsQuery.isPending ||
              Boolean(latestScopeVersion?.locked_at)
            }
            onClick={startManualEntry}
            size="cta"
            variant="outline"
          >
            보존된 촬영을 두고 직접 입력으로 계속
          </Button>
        ) : null}

        {manualMode && !workflow.manualScopeMutation.isSuccess ? (
          <ManualScopeEditor
            draftItems={manualDraftItems}
            onAdd={addManualItem}
            onRemove={(itemKey) =>
              setManualDraftItems((current) =>
                current.filter((item) => item.itemKey !== itemKey),
              )
            }
            onSubmit={completeManualScope}
          />
        ) : null}

        {!manualMode &&
          analysis?.status === "completed" &&
          workflow.reviewQuery.isPending && (
            <Card className="mt-4 p-6 text-center">
              <LoaderCircle
                aria-hidden="true"
                className="demo-spin mx-auto text-primary-700"
                size="var(--icon-category)"
              />
              <p className="mt-3 text-lg font-bold">
                검토할 항목을 불러오고 있어요
              </p>
            </Card>
          )}

        {!manualMode &&
          analysis?.status === "completed" &&
          workflow.reviewQuery.isError && (
            <Card className="mt-4 border-warning bg-warning-bg p-4">
              <div className="flex gap-3">
                <AlertTriangle
                  aria-hidden="true"
                  className="shrink-0 text-warning"
                  size="var(--icon-sm)"
                />
                <div>
                  <p className="text-base font-bold">
                    AI 초안 상태를 다시 확인해 주세요
                  </p>
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

        {!manualMode &&
          analysis?.status === "completed" &&
          review &&
          !workflow.reviewQuery.isError &&
          !recoveringReview && (
            <>
              {!reviewCompleted && (
                <Button className="mt-5 w-full" disabled={busy} onClick={startAdditionalVideo} size="cta" variant="outline">
                  <Video aria-hidden="true" size="var(--icon-sm)" /> 다른 공간 영상 추가
                </Button>
              )}
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
            </>
          )}

        {workflow.resumableUpload && workflow.uploadMutation.isError && (
          <Card className="mt-4 border-warning bg-warning-bg p-4">
            <p className="text-base font-bold">
              중단된 파일 전송을 이어갈 수 있어요
            </p>
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
              <RotateCcw aria-hidden="true" size="var(--icon-xs)" /> 업로드 다시
              시도
            </Button>
          </Card>
        )}

        {(localError || requestError) && (
          <p
            className="mt-4 rounded-2xl bg-danger-bg px-4 py-3 text-base font-bold text-danger-ink"
            role="alert"
          >
            {localError ?? friendlyError(requestError)}
          </p>
        )}

        {unrecoverable && !analysis && (
          <Card className="mt-4 border-warning bg-warning-bg p-4">
            <p className="text-base font-bold">
              완료되지 않은 파일이 있어 새 촬영이 필요해요
            </p>
            <p className="mt-1 text-ui-support leading-5 text-ink-600">
              기존 기록은 지우지 않고 새 세션에서 다시 촬영해요.
            </p>
          </Card>
        )}
      </main>

      {manualMode && !manualValid ? null : (
        <div className="app-fixed-action sticky bottom-0 bg-surface/95 px-6 pt-4 backdrop-blur">
          {manualMode ? (
            workflow.manualScopeMutation.isSuccess ? null : (
              <div><Button className="w-full" disabled={!manualValid || workflow.manualScopeMutation.isPending} form={MANUAL_SCOPE_FORM_ID} size="cta" type="submit">
                {workflow.manualScopeMutation.isPending ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="demo-spin"
                    size="var(--icon-sm)"
                  />
                ) : (
                  <Check aria-hidden="true" size="var(--icon-sm)" />
                )}
                {manualValid
                  ? `선택한 짐 ${manualDraftItems.length}개 저장`
                  : "짐을 선택해 주세요"}
              </Button><button className="mx-auto flex min-h-11 items-center gap-2 px-4 text-sm font-semibold text-ink-600" onClick={() => setManualDraftItems([])} type="button"><RotateCcw aria-hidden="true" size="var(--icon-xs)" />선택 초기화</button></div>
            )
          ) : !session || unrecoverable ? (
            <div>
              <label className="mb-3 flex items-start gap-3 text-sm text-ink-600">
                <input
                  checked={consentAcknowledged}
                  className="mt-0.5 size-5"
                  disabled={!workflow.consentPolicyQuery.data}
                  onChange={(event) => setConsentAcknowledged(event.target.checked)}
                  type="checkbox"
                />
                <span>{workflow.consentPolicyQuery.data?.notice ?? "촬영 개인정보 안내를 불러오는 중입니다."}</span>
              </label>
              <Button
                className="w-full"
                disabled={busy || terminalJob || !consentAcknowledged || !workflow.consentPolicyQuery.data}
                onClick={startSession}
                size="cta"
              >
                {workflow.createSessionMutation.isPending ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="demo-spin"
                    size="var(--icon-sm)"
                  />
                ) : (
                  <Video aria-hidden="true" size="var(--icon-sm)" />
                )}
                {unrecoverable ? "새 촬영 세션 시작" : "촬영 시작"}
              </Button>
            </div>
          ) : analysis?.status === "completed" ? (
            workflow.reviewQuery.isPending || recoveringReview ? (
              <Button className="w-full" disabled size="cta">
                <LoaderCircle
                  aria-hidden="true"
                  className="demo-spin"
                  size="var(--icon-sm)"
                />
                {recoveringReview
                  ? "최신 검토 상태 확인 중"
                  : "검토 항목 불러오는 중"}
              </Button>
            ) : workflow.reviewQuery.isError ? (
              <Button
                className="w-full"
                disabled={workflow.reviewQuery.isFetching || recoveringReview}
                onClick={() => void retryReview()}
                size="cta"
                variant="outline"
              >
                {workflow.reviewQuery.isFetching ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="demo-spin"
                    size="var(--icon-sm)"
                  />
                ) : (
                  <RefreshCw aria-hidden="true" size="var(--icon-sm)" />
                )}
                검토 내용 다시 불러오기
              </Button>
            ) : reviewCompleted ? (
              <Button className="w-full" disabled size="cta">
                <Check aria-hidden="true" size="var(--icon-sm)" /> 짐 목록 검수
                완료
              </Button>
            ) : (
              <Button
                className="w-full"
                disabled={
                  !review || !reviewValid || workflow.reviewMutation.isPending
                }
                form={ANALYSIS_REVIEW_FORM_ID}
                size="cta"
                type="submit"
              >
                {workflow.reviewMutation.isPending ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="demo-spin"
                    size="var(--icon-sm)"
                  />
                ) : (
                  <Check aria-hidden="true" size="var(--icon-sm)" />
                )}
                {reviewValid
                  ? "짐 목록 검수 완료"
                  : "항목 내용을 확인해 주세요"}
              </Button>
            )
          ) : analysis ? (
            <Button className="w-full" disabled size="cta">
              {analysisActive ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="demo-spin"
                  size="var(--icon-sm)"
                />
              ) : (
                <AlertTriangle aria-hidden="true" size="var(--icon-sm)" />
              )}
              {analysisActive ? "AI 분석 진행 중" : "분석 실패 · 촬영 보존됨"}
            </Button>
          ) : allReady ? (
            <Button
              className="w-full"
              disabled={busy || zones.length === 0}
              onClick={submit}
              size="cta"
            >
              {workflow.submitMutation.isPending ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="demo-spin"
                  size="var(--icon-sm)"
                />
              ) : (
                <FileUp aria-hidden="true" size="var(--icon-sm)" />
              )}
              촬영 마치고 AI 분석 시작
            </Button>
          ) : (
            <Button className="w-full" disabled size="cta">
              {validating || workflow.uploadMutation.isPending ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="demo-spin"
                  size="var(--icon-sm)"
                />
              ) : (
                <Camera aria-hidden="true" size="var(--icon-sm)" />
              )}
              {validating ? "업로드 파일 확인 중" : "구역 촬영을 추가해 주세요"}
            </Button>
          )}
          {!manualMode ? (
            <p className="mt-3 text-center text-sm text-ink-400">
              {reviewDirty
                ? "확정 전 변경은 이 화면에만 보관돼요."
                : reviewCompleted
                  ? "검토 완료본은 변경 이력으로 보존돼요."
                  : terminalJob
                    ? "종료된 작업에는 새 촬영을 추가할 수 없어요."
                    : "업로드 URL과 secret은 브라우저에 저장하지 않아요."}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function LiveCaptureFlow({
  initialConnection = null,
  initialManual = false,
  initialVideo = false,
  initialVideoFile = null,
  onComplete,
  onExit,
}: {
  initialConnection?: CaptureConnection | null;
  initialManual?: boolean;
  initialVideo?: boolean;
  initialVideoFile?: File | null;
  onComplete?: () => void;
  onExit?: () => void;
} = {}) {
  const queryClient = useQueryClient();
  const [connection, setConnection] = useState<CaptureConnection | null>(
    initialConnection,
  );

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
          initialManual={initialManual}
          initialVideo={initialVideo}
          initialVideoFile={initialVideoFile}
          key={connection.cacheScope}
          onComplete={onComplete ?? disconnect}
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
