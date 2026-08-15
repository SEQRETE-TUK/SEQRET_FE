import {
  ImageIcon as Image,
  PlusIcon as Plus,
  ArrowCounterClockwiseIcon as RotateCcw,
  TrashIcon as Trash2,
} from "@phosphor-icons/react";
import {
  WarningStatusIcon as AlertTriangle,
} from "@/components/icons";
import type { FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AnalysisReview, RoomZone } from "@/features/capture/api/capture-api";

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

export function ManualScopeEditor({
  draftItems,
  onAdd,
  onChange,
  onRemove,
  onSubmit,
  zones,
}: {
  draftItems: AnalysisReviewDraftItem[];
  onAdd: () => void;
  onChange: (itemKey: string, changes: Partial<AnalysisReviewDraftItem>) => void;
  onRemove: (itemKey: string) => void;
  onSubmit: () => void;
  zones: RoomZone[];
}) {
  return (
    <form id={MANUAL_SCOPE_FORM_ID} onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <section className="mt-6 border-t border-line pt-5">
        <h2 className="text-xl font-extrabold">짐 목록을 직접 작성해요</h2>
        <p className="mt-1 text-ui-support leading-5 text-ink-600">
          AI 분석 없이 공간과 짐 설명을 입력해 업체 검토용 초안을 만들 수 있어요.
        </p>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {draftItems.map((draft, index) => (
            <article className="py-5" key={draft.itemKey}>
              <div className="flex items-center justify-between gap-3">
                <Badge variant="neutral">직접 입력 {index + 1}</Badge>
                {draftItems.length > 1 ? (
                  <button
                    aria-label={`${index + 1}번 항목 삭제`}
                    className="grid size-9 place-items-center rounded-full text-ink-400 hover:bg-danger-bg hover:text-danger-ink"
                    onClick={() => onRemove(draft.itemKey)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={17} />
                  </button>
                ) : null}
              </div>
              <label className="mt-4 block text-sm font-bold text-ink-400">
                공간
                <Select
                  autoComplete="off"
                  className="mt-1.5 h-11 px-3 text-base font-bold"
                  name={`manual-item-${index + 1}-room`}
                  onChange={(event) => onChange(draft.itemKey, { roomZoneId: event.target.value })}
                  value={draft.roomZoneId}
                >
                  {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
                </Select>
              </label>
              <label className="mt-3 block text-sm font-bold text-ink-400">
                짐 또는 작업 설명
                <Textarea
                  aria-invalid={draft.description.trim().length === 0}
                  autoComplete="off"
                  className="mt-1.5 min-h-20 resize-none px-3 py-3 text-lg font-semibold leading-5"
                  maxLength={2000}
                  name={`manual-item-${index + 1}-description`}
                  onChange={(event) => onChange(draft.itemKey, { description: event.target.value })}
                  placeholder="예: 3인용 소파 1개"
                  required
                  value={draft.description}
                />
              </label>
            </article>
          ))}
          <Button className="my-4 w-full" onClick={onAdd} size="chip" type="button" variant="secondary">
            <Plus aria-hidden="true" size={17} />
            항목 추가
          </Button>
        </div>
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
                  <Image aria-hidden="true" className="text-primary-700" size={16} />
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
                <RotateCcw aria-hidden="true" size={15} /> 되돌리기
              </Button>
            </div>
          )}

          {draftItems.length === 0 && (
            <div className="bg-warning-bg p-4 text-center">
              <AlertTriangle aria-hidden="true" className="mx-auto text-warning" size={22} />
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
                      <Trash2 aria-hidden="true" size={17} />
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
              <Plus aria-hidden="true" size={17} />
              {canAdd ? "빠진 항목 직접 추가" : "항목은 최대 500개까지 추가할 수 있어요"}
            </Button>
          )}
        </div>
      </section>
    </form>
  );
}
