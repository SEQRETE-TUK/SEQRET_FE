import {
  CheckIcon as Check,
  ImageIcon as Image,
  PlusIcon as Plus,
  ArrowCounterClockwiseIcon as RotateCcw,
  TrashIcon as Trash2,
} from "@phosphor-icons/react";
import {
  WarningStatusIcon as AlertTriangle,
} from "@/components/icons";
import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AnalysisReview } from "@/features/capture/api/capture-api";
import { movingItemCatalog } from "@/features/capture/model/moving-item-catalog";
import { FilterChip } from "@/components/layout/app-primitives";
import {
  movingItemCategoryForName,
  type MovingItemCategory,
} from "@/components/moving-item-assets";

export interface AnalysisReviewDraftItem {
  itemKey: string;
  roomZoneId: string;
  description: string;
  name?: string;
  quantity?: number | null;
  unit?: string | null;
  workNote?: string | null;
}

interface AnalysisReviewPanelProps {
  canAdd: boolean;
  draftItems: AnalysisReviewDraftItem[];
  hasUnsavedChanges: boolean;
  onAdd: (description?: string) => void;
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
  가구: "text-primary-700",
  가전: "text-success-ink",
  기타: "text-warning-ink",
};
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
        {(["가구", "가전", "기타"] as ManualCategory[]).map((category) => <section className="mt-7 first:mt-0" key={category}><h3 className="text-ui-section font-black">{category}</h3><div className="mt-3 grid grid-cols-4 gap-2">{movingItemCatalog.filter((item) => item.category === category).map(({ icon, label }) => { const active = selected.has(label); return <button aria-pressed={active} className={`press-static relative flex min-h-[104px] min-w-0 flex-col items-center justify-center rounded-xl px-0.5 text-center ${active ? "bg-primary-50 text-primary-800" : "bg-surface text-ink-900"}`} key={label} onClick={() => toggle(label)} type="button"><span className={`grid size-10 place-items-center ${manualCategoryTone[category]}`}><img alt="" aria-hidden="true" className="size-10 object-contain" src={icon} /></span><span className="mt-1 line-clamp-2 text-xs leading-4">{label}</span>{active ? <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary-600 text-white"><Check aria-hidden="true" className="size-3" weight="bold" /></span> : null}</button>; })}</div></section>)}
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
  const [categoryFilter, setCategoryFilter] = useState<"전체" | MovingItemCategory>("전체");
  const completed = review.review_scope_version_id !== null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };
  const categoryCounts = (Object.keys(manualCategoryTone) as ManualCategory[]).reduce(
    (counts, category) => {
      counts[category] = draftItems.filter((item) =>
        movingItemCategoryForName(item.name || item.description) === category,
      ).length;
      return counts;
    },
    {} as Record<ManualCategory, number>,
  );
  const visibleDraftItems = draftItems.filter(
    (item) =>
      categoryFilter === "전체" ||
      movingItemCategoryForName(item.name || item.description) === categoryFilter,
  );
  const selectedCatalog = movingItemCatalog.filter(
    (item) => categoryFilter === "전체" || item.category === categoryFilter,
  );
  const selectedLabels = new Set(
    draftItems.map((item) => (item.name || item.description).trim()).filter(Boolean),
  );

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

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="짐 분류">
            <FilterChip active={categoryFilter === "전체"} onClick={() => setCategoryFilter("전체")}>
              전체 {draftItems.length}
            </FilterChip>
            {(Object.keys(manualCategoryTone) as ManualCategory[]).map((category) => (
              <FilterChip
                active={categoryFilter === category}
                key={category}
                onClick={() => setCategoryFilter(category)}
              >
                {category} {categoryCounts[category]}
              </FilterChip>
            ))}
          </div>
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

          {visibleDraftItems.map((draft, index) => {
            const source = review.items.find((item) => item.item_key === draft.itemKey);
            return (
              <article className="py-5" key={draft.itemKey}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={source?.source === "customer" ? "neutral" : "primary"}>
                      {source?.source === "customer" || !source ? "직접 추가" : "AI 제안"}
                    </Badge>
                    {source?.review_required && <Badge variant="warning">확인 필요</Badge>}
                    <Badge variant="neutral">
                      {movingItemCategoryForName(draft.name || draft.description)}
                    </Badge>
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
                  {review.scope_schema_version === 2 ? "짐 이름" : "짐 또는 작업 설명"}
                  <Textarea
                    aria-label={`${index + 1}번 항목 설명`}
                    aria-invalid={!completed && draft.description.trim().length === 0}
                    autoComplete="off"
                    className="mt-1.5 min-h-20 resize-none px-3 py-3 text-lg font-semibold leading-5"
                    disabled={completed}
                    maxLength={2000}
                    name={`review-item-${index + 1}-description`}
                    onChange={(event) => onChange(draft.itemKey, review.scope_schema_version === 2 ? { name: event.target.value, description: event.target.value } : { description: event.target.value })}
                    required
                    value={review.scope_schema_version === 2 ? draft.name ?? "" : draft.description}
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
                {review.scope_schema_version === 2 && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="text-sm font-bold text-ink-400">
                      수량
                      <Input className="mt-1.5 px-3" disabled={completed} min="1" onChange={(event) => onChange(draft.itemKey, { quantity: Number(event.target.value) })} required type="number" value={draft.quantity ?? ""} />
                    </label>
                    <label className="text-sm font-bold text-ink-400">
                      단위
                      <Input className="mt-1.5 px-3" disabled={completed} maxLength={20} onChange={(event) => onChange(draft.itemKey, { unit: event.target.value })} required value={draft.unit ?? ""} />
                    </label>
                    <label className="col-span-2 text-sm font-bold text-ink-400">
                      작업 메모
                      <Textarea className="mt-1.5 min-h-20" disabled={completed} maxLength={500} onChange={(event) => onChange(draft.itemKey, { workNote: event.target.value || null })} value={draft.workNote ?? ""} />
                    </label>
                  </div>
                )}
              </article>
            );
          })}

          {!completed && (
            <div className="border-t border-line bg-canvas px-4 py-4">
              <p className="text-sm font-bold text-ink-600">분류에서 짐을 바로 추가할 수 있어요</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedCatalog.map(({ label }) => {
                  const selected = selectedLabels.has(label);
                  return (
                    <Button
                      disabled={!canAdd || selected}
                      key={label}
                      onClick={() => onAdd(label)}
                      size="chip"
                      type="button"
                      variant="outline"
                    >
                      <Plus aria-hidden="true" size="var(--icon-xs)" /> {label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {!completed && (
            <Button
              className="my-4 w-full"
              disabled={!canAdd}
              onClick={() => onAdd()}
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
