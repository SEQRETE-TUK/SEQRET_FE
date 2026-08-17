import {
  ArmchairIcon as Armchair,
  BedIcon as Bed,
  BooksIcon as Books,
  ChairIcon as Chair,
  CheckIcon as Check,
  CoatHangerIcon as CoatHanger,
  CookingPotIcon as CookingPot,
  DeskIcon as Desk,
  FanIcon as Fan,
  ImageIcon as Image,
  LampIcon as Lamp,
  OfficeChairIcon as OfficeChair,
  OvenIcon as Oven,
  PackageIcon as Package,
  PlusIcon as Plus,
  ArrowCounterClockwiseIcon as RotateCcw,
  ShirtFoldedIcon as ShirtFolded,
  TableIcon as Table,
  TelevisionSimpleIcon as Television,
  TrashIcon as Trash2,
  WashingMachineIcon as WashingMachine,
  type Icon,
} from "@phosphor-icons/react";
import {
  WarningStatusIcon as AlertTriangle,
} from "@/components/icons";
import type { FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AnalysisReview } from "@/features/capture/api/capture-api";

export interface AnalysisReviewDraftItem {
  itemKey: string;
  roomZoneId: string;
  description: string;
}

interface AnalysisReviewPanelProps {
  canAdd: boolean;
  draftItems: AnalysisReviewDraftItem[];
  hasUnsavedChanges: boolean;
  onAdd: () => void;
  onChange: (itemKey: string, changes: Partial<AnalysisReviewDraftItem>) => void;
  onRemove: (itemKey: string) => void;
  onRestoreRemoved: () => void;
  onSubmit: () => void;
  removedItemDescription: string | null;
  review: AnalysisReview;
}

export const ANALYSIS_REVIEW_FORM_ID = "analysis-review-form";
export const MANUAL_SCOPE_FORM_ID = "manual-scope-form";

type ManualCategory = "가구" | "가전" | "기타";
const manualCategoryTone: Record<ManualCategory, string> = {
  가구: "bg-primary-50 text-primary-700",
  가전: "bg-success-bg text-success-ink",
  기타: "bg-warning-bg text-warning-ink",
};
const manualCatalog: Array<{ category: ManualCategory; icon: Icon; label: string }> = [
  { category: "가구", icon: Bed, label: "침대" },
  { category: "가구", icon: Armchair, label: "소파" },
  { category: "가구", icon: CoatHanger, label: "옷장" },
  { category: "가구", icon: ShirtFolded, label: "서랍장" },
  { category: "가구", icon: Books, label: "책장" },
  { category: "가구", icon: Desk, label: "책상" },
  { category: "가구", icon: Table, label: "테이블" },
  { category: "가구", icon: Chair, label: "의자" },
  { category: "가구", icon: OfficeChair, label: "사무용 의자" },
  { category: "가구", icon: Lamp, label: "스탠드" },
  { category: "가전", icon: Television, label: "TV" },
  { category: "가전", icon: WashingMachine, label: "세탁기" },
  { category: "가전", icon: Oven, label: "전자레인지" },
  { category: "가전", icon: Fan, label: "선풍기" },
  { category: "가전", icon: CookingPot, label: "주방 가전" },
  { category: "기타", icon: Package, label: "이사 박스" },
  { category: "기타", icon: CoatHanger, label: "행거" },
  { category: "기타", icon: Books, label: "책" },
];

export function ManualScopeEditor({
  draftItems,
  onAdd,
  onRemove,
  onSubmit,
}: {
  draftItems: AnalysisReviewDraftItem[];
  onAdd: (description?: string) => void;
  onRemove: (itemKey: string) => void;
  onSubmit: () => void;
}) {
  const selected = new Map(draftItems.map((item) => [item.description, item.itemKey]));
  const toggle = (label: string) => {
    const itemKey = selected.get(label);
    if (itemKey) onRemove(itemKey);
    else onAdd(label);
  };
  return (
    <form id={MANUAL_SCOPE_FORM_ID} onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <section>
        {(["가구", "가전", "기타"] as ManualCategory[]).map((category) => <section className="mt-7 first:mt-0" key={category}><h3 className="text-ui-section font-black">{category}</h3><div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-5 min-[400px]:grid-cols-4">{manualCatalog.filter((item) => item.category === category).map(({ icon: CatalogIcon, label }) => { const active = selected.has(label); return <button aria-pressed={active} className={`press-static relative flex min-h-[116px] min-w-0 flex-col items-center justify-center rounded-2xl px-1 text-center ${active ? "bg-primary-50 text-primary-800 ring-2 ring-primary-600" : "bg-surface text-ink-900"}`} key={label} onClick={() => toggle(label)} type="button"><span className={`grid size-14 place-items-center rounded-2xl ${manualCategoryTone[category]}`}><CatalogIcon aria-hidden="true" size="var(--icon-category)" weight="duotone" /></span><span className="mt-2 line-clamp-2 text-ui-data font-extrabold">{label}</span>{active ? <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary-600 text-white"><Check aria-hidden="true" size="var(--icon-xs)" weight="bold" /></span> : null}</button>; })}</div></section>)}
      </section>
    </form>
  );
}

export function AnalysisReviewPanel({
  canAdd,
  draftItems,
  hasUnsavedChanges,
  onAdd,
  onChange,
  onRemove,
  onRestoreRemoved,
  onSubmit,
  removedItemDescription,
  review,
}: AnalysisReviewPanelProps) {
  const completed = review.review_scope_version_id !== null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form id={ANALYSIS_REVIEW_FORM_ID} onSubmit={submit}>
      <section className="mt-6">
        <div className="border-b border-line pb-5">
          <h2 className="text-xl font-extrabold">
            {completed ? "AI 초안 검토를 마쳤어요" : "AI가 찾은 항목을 확인해요"}
          </h2>
          <p className="mt-1 text-ui-support leading-5 text-ink-600">
            {completed
              ? "확정한 내용은 변경 이력으로 안전하게 보존돼요."
              : "틀린 설명은 고치고, 빠진 짐은 직접 추가해 주세요."}
          </p>

          {!completed && hasUnsavedChanges && (
            <p
              className="mt-4 rounded-xl border border-warning bg-warning-bg px-3 py-2 text-sm font-bold text-warning-ink"
              role="status"
            >
              아직 확정하지 않은 변경이 있어요. 이 화면을 나가면 사라져요.
            </p>
          )}

          <ul className="mt-4 border-y border-line">
            {review.zones.map((zone) => (
              <li className="flex min-h-14 items-center justify-between gap-3 border-b border-line py-2 last:border-b-0" key={zone.room_zone_id}>
                <div className="flex min-w-0 items-center gap-2">
                  <Image aria-hidden="true" className="text-primary-700" size="var(--icon-xs)" />
                  <p className="truncate text-ui-support font-bold">{zone.name}</p>
                </div>
                <p className="shrink-0 text-sm text-ink-400">
                  확인 {zone.ready_media_count}/{zone.total_media_count}
                  {zone.failed_media_count > 0 && ` · 실패 ${zone.failed_media_count}`}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="divide-y divide-line border-b border-line">
          {!completed && removedItemDescription && (
            <div
              aria-live="polite"
              className="flex items-center gap-3 bg-canvas px-4 py-3"
              role="status"
            >
              <div className="min-w-0 flex-1">
                <p className="text-ui-support font-bold">항목에서 제외했어요</p>
                <p className="mt-0.5 truncate text-sm text-ink-400">
                  {removedItemDescription}
                </p>
              </div>
              <Button
                onClick={onRestoreRemoved}
                size="chip"
                type="button"
                variant="outline"
              >
                <RotateCcw aria-hidden="true" size="var(--icon-xs)" /> 되돌리기
              </Button>
            </div>
          )}

          {draftItems.length === 0 && (
            <div className="bg-warning-bg p-4 text-center">
              <AlertTriangle aria-hidden="true" className="mx-auto text-warning" size="var(--icon-sm)" />
              <p className="mt-2 text-base font-bold">최소 한 개의 항목이 필요해요</p>
            </div>
          )}

          {draftItems.map((draft, index) => {
            const source = review.items.find((item) => item.item_key === draft.itemKey);
            return (
              <article className="py-5" key={draft.itemKey}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={source?.source === "customer" ? "neutral" : "primary"}>
                      {source?.source === "customer" || !source ? "직접 추가" : "AI 제안"}
                    </Badge>
                    {source?.review_required && <Badge variant="warning">확인 필요</Badge>}
                    {source?.confidence !== null && source?.confidence !== undefined && (
                      <Badge variant="neutral">신뢰도 {Math.round(source.confidence * 100)}%</Badge>
                    )}
                  </div>
                  {!completed && (
                    <button
                      aria-label={`${index + 1}번 항목 삭제`}
                      className="grid size-9 shrink-0 place-items-center rounded-full text-ink-400 hover:bg-danger-bg hover:text-danger-ink"
                      onClick={() => onRemove(draft.itemKey)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size="var(--icon-xs)" />
                    </button>
                  )}
                </div>

                <label className="mt-4 block text-sm font-bold text-ink-400">
                  공간
                  <Select
                    aria-label={`${index + 1}번 항목 공간`}
                    autoComplete="off"
                    className="mt-1.5 h-11 px-3 text-base font-bold"
                    disabled={completed}
                    name={`review-item-${index + 1}-room`}
                    onChange={(event) => onChange(draft.itemKey, { roomZoneId: event.target.value })}
                    value={draft.roomZoneId}
                  >
                    {review.zones.map((zone) => (
                      <option key={zone.room_zone_id} value={zone.room_zone_id}>
                        {zone.name}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="mt-3 block text-sm font-bold text-ink-400">
                  짐 또는 작업 설명
                  <Textarea
                    aria-label={`${index + 1}번 항목 설명`}
                    aria-invalid={!completed && draft.description.trim().length === 0}
                    autoComplete="off"
                    className="mt-1.5 min-h-20 resize-none px-3 py-3 text-lg font-semibold leading-5"
                    disabled={completed}
                    maxLength={2000}
                    name={`review-item-${index + 1}-description`}
                    onChange={(event) => onChange(draft.itemKey, { description: event.target.value })}
                    required
                    value={draft.description}
                  />
                  {!completed && (
                    <span className="mt-1 flex justify-between gap-3 text-xs font-medium">
                      <span className="text-danger-ink">
                        {draft.description.trim().length === 0 ? "설명을 입력해 주세요" : ""}
                      </span>
                      <span className="ml-auto text-ink-400">
                        {draft.description.length}/2000
                      </span>
                    </span>
                  )}
                </label>
              </article>
            );
          })}

          {!completed && (
            <Button
              className="my-4 w-full"
              disabled={!canAdd}
              onClick={onAdd}
              size="chip"
              type="button"
              variant="secondary"
            >
              <Plus aria-hidden="true" size="var(--icon-xs)" />
              {canAdd ? "빠진 항목 직접 추가" : "항목은 최대 500개까지 추가할 수 있어요"}
            </Button>
          )}
        </div>
      </section>
    </form>
  );
}
