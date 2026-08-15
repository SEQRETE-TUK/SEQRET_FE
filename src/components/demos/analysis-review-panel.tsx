import {
  AlertTriangle,
  CheckCircle2,
  Image,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AnalysisReview } from "@/features/capture/capture-api";

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
      <Card className="mt-5 overflow-hidden border-primary-100">
        <div className="bg-primary-50 p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-primary-700">
              {completed ? <CheckCircle2 size={22} /> : <Sparkles size={22} />}
            </span>
            <div>
              <h2 className="text-[17px] font-extrabold">
                {completed ? "AI 초안 검토를 마쳤어요" : "AI가 찾은 항목을 확인해요"}
              </h2>
              <p className="mt-1 text-[12px] leading-5 text-ink-600">
                {completed
                  ? "확정한 내용은 변경 이력으로 안전하게 보존돼요."
                  : "틀린 설명은 고치고, 빠진 짐은 직접 추가해 주세요."}
              </p>
            </div>
          </div>

          {!completed && hasUnsavedChanges && (
            <p
              className="mt-4 rounded-xl border border-warning bg-warning-bg px-3 py-2 text-[11px] font-bold text-warning-ink"
              role="status"
            >
              아직 확정하지 않은 변경이 있어요. 이 화면을 나가면 사라져요.
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            {review.zones.map((zone) => (
              <div className="rounded-xl border border-primary-100 bg-white px-3 py-3" key={zone.room_zone_id}>
                <div className="flex items-center gap-2">
                  <Image className="text-primary-700" size={16} />
                  <p className="truncate text-[12px] font-bold">{zone.name}</p>
                </div>
                <p className="mt-1 text-[11px] text-ink-400">
                  확인 {zone.ready_media_count}/{zone.total_media_count}
                  {zone.failed_media_count > 0 && ` · 실패 ${zone.failed_media_count}`}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 p-4">
          {!completed && removedItemDescription && (
            <div
              aria-live="polite"
              className="flex items-center gap-3 rounded-2xl border border-line bg-canvas px-4 py-3"
              role="status"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold">항목에서 제외했어요</p>
                <p className="mt-0.5 truncate text-[11px] text-ink-400">
                  {removedItemDescription}
                </p>
              </div>
              <Button
                onClick={onRestoreRemoved}
                size="chip"
                type="button"
                variant="outline"
              >
                <RotateCcw size={15} /> 되돌리기
              </Button>
            </div>
          )}

          {draftItems.length === 0 && (
            <div className="rounded-2xl bg-warning-bg p-4 text-center">
              <AlertTriangle className="mx-auto text-warning" size={22} />
              <p className="mt-2 text-[13px] font-bold">최소 한 개의 항목이 필요해요</p>
            </div>
          )}

          {draftItems.map((draft, index) => {
            const source = review.items.find((item) => item.item_key === draft.itemKey);
            return (
              <article className="rounded-2xl border border-line bg-white p-4" key={draft.itemKey}>
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
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>

                <label className="mt-4 block text-[11px] font-bold text-ink-400">
                  공간
                  <select
                    aria-label={`${index + 1}번 항목 공간`}
                    className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] font-bold outline-none focus:border-primary-600 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-400 disabled:bg-[#F5F6F8]"
                    disabled={completed}
                    onChange={(event) => onChange(draft.itemKey, { roomZoneId: event.target.value })}
                    value={draft.roomZoneId}
                  >
                    {review.zones.map((zone) => (
                      <option key={zone.room_zone_id} value={zone.room_zone_id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-3 block text-[11px] font-bold text-ink-400">
                  짐 또는 작업 설명
                  <textarea
                    aria-label={`${index + 1}번 항목 설명`}
                    aria-invalid={!completed && draft.description.trim().length === 0}
                    className="mt-1.5 min-h-20 w-full resize-none rounded-xl border border-line bg-white px-3 py-3 text-[14px] font-semibold leading-5 outline-none focus:border-primary-600 disabled:bg-[#F5F6F8] disabled:text-ink-600"
                    disabled={completed}
                    maxLength={2000}
                    onChange={(event) => onChange(draft.itemKey, { description: event.target.value })}
                    required
                    value={draft.description}
                  />
                  {!completed && (
                    <span className="mt-1 flex justify-between gap-3 text-[10px] font-medium">
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
              className="w-full"
              disabled={!canAdd}
              onClick={onAdd}
              size="chip"
              type="button"
              variant="secondary"
            >
              <Plus size={17} />
              {canAdd ? "빠진 항목 직접 추가" : "항목은 최대 500개까지 추가할 수 있어요"}
            </Button>
          )}
        </div>
      </Card>
    </form>
  );
}
