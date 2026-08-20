import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon as ArrowLeft, CheckCircleIcon as CheckCircle, ImageIcon as Image, MinusCircleIcon as MinusCircle, PaperPlaneTiltIcon as Send, PlusIcon as Plus } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast";
import { Input } from "@/components/ui/input";
import { createScopeProposal, workflowKeys, type Connection, type ScopeContent, type ScopeLocationConditions, type ScopeReview } from "@/features/workflow/api/workflow-api";
import { apiErrorMessage } from "@/features/workflow/api/workflow-api";

type DraftItem = { item_key: string; room_zone_id: string; name: string; quantity: number; unit: string; work_note: string };
type DraftAdjustment = { id: string; label: string; amount_krw: number };

const moneyFormatter = new Intl.NumberFormat("ko-KR");
const money = (amount: number) => `${moneyFormatter.format(amount)}원`;

function draftItemsFromScope(scope: ScopeReview): DraftItem[] {
  return scope.scope.room_groups.flatMap((group) => group.items.map((item) => ({
    item_key: item.item_key,
    room_zone_id: item.room_zone_id,
    name: item.name || item.description,
    quantity: item.quantity ?? 1,
    unit: item.unit ?? "개",
    work_note: item.work_note ?? "",
  })));
}

export function ProviderQuoteEditor({ connection, onBack, scope }: { connection: Connection; onBack: () => void; scope: ScopeReview | undefined }) {
  const queryClient = useQueryClient();
  const items = scope ? draftItemsFromScope(scope) : [];
  const [includedWorks, setIncludedWorks] = useState<string[]>(scope?.scope.included_works ?? []);
  const [exclusions, setExclusions] = useState<string[]>(scope?.scope.exclusions ?? []);
  const locationConditions = scope?.scope.location_conditions ?? [];
  const [baseAmount, setBaseAmount] = useState(scope?.quote?.base_amount_krw ?? 0);
  const [adjustments, setAdjustments] = useState<DraftAdjustment[]>(() => (scope?.quote?.adjustments ?? []).map((item) => ({ ...item, id: crypto.randomUUID() })));
  const [vehicleCount, setVehicleCount] = useState(scope?.execution_plan?.vehicle_count ?? 1);
  const [vehicleDescription, setVehicleDescription] = useState(scope?.execution_plan?.vehicle_description ?? "5톤 탑차");
  const [workerCount, setWorkerCount] = useState(scope?.execution_plan?.worker_count ?? 2);
  const [duration, setDuration] = useState(scope?.execution_plan?.estimated_duration_minutes ?? 480);
  const reason = scope?.proposal_reason ?? "고객 입력 범위와 이사 조건을 기준으로 산정했습니다.";

  const locked = scope?.scope.status === "customer_review" || scope?.scope.status === "confirmed";
  const total = baseAmount + adjustments.reduce((sum, item) => sum + item.amount_krw, 0);
  const normalizedIncluded = includedWorks.map((item) => item.trim()).filter(Boolean);
  const normalizedExclusions = exclusions.map((item) => item.trim()).filter(Boolean);
  const overlap = normalizedIncluded.find((item) => normalizedExclusions.includes(item));
  const adjustmentLabels = adjustments.map((item) => item.label.trim());
  const invalid = items.length === 0 || items.some((item) => !item.name.trim() || item.quantity < 1 || !item.unit.trim()) || baseAmount < 0 || total < 0 || !vehicleDescription.trim() || vehicleCount < 1 || workerCount < 1 || duration < 30 || Boolean(overlap) || adjustmentLabels.some((label) => !label) || new Set(adjustmentLabels).size !== adjustmentLabels.length;
  const content: ScopeContent = {
    schema_version: 2,
    items: items.map((item) => ({ item_key: item.item_key, room_zone_id: item.room_zone_id, name: item.name.trim(), quantity: item.quantity, unit: item.unit.trim(), work_note: item.work_note.trim() || null, review_status: "confirmed", source: "company" })),
    location_conditions: locationConditions,
  };
  const mutation = useMutation({
    mutationFn: () => createScopeProposal(connection, {
      source_scope_version_id: scope?.scope.id ?? "",
      content,
      quote: { base_amount_krw: baseAmount, adjustments: adjustments.map(({ label, amount_krw }) => ({ label: label.trim(), amount_krw })), total_amount_krw: total },
      execution_plan: { vehicle_count: vehicleCount, vehicle_description: vehicleDescription.trim(), worker_count: workerCount, estimated_duration_minutes: duration, notes: null },
      included_works: normalizedIncluded,
      exclusions: normalizedExclusions,
      reason: reason.trim(),
    }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: workflowKeys.scope(connection.jobId) }); onBack(); },
  });
  if (!scope) return <p className="py-10 text-ui-support text-ink-600">작업을 불러오는 중…</p>;

  return <div className="mx-auto max-w-[var(--shell-wide)]">
    <button className="mb-4 flex min-h-11 items-center gap-2 text-ui-control text-primary-700 hover:text-primary-800" onClick={onBack} type="button"><ArrowLeft aria-hidden="true" /> 작업 큐</button>
    {scope.scope.status === "revision_requested" ? <div className="mb-5 rounded-[var(--radius-component)] border border-warning bg-warning-bg p-4"><p className="text-ui-control text-warning-ink">고객 수정 요청</p><p className="mt-1 break-words text-ui-support text-ink-600">{scope.revision_request?.reason}</p><p className="mt-2 text-ui-micro text-warning-ink">기존 제안은 보존되고, 이번 제출은 새 버전으로 기록됩니다.</p></div> : null}
    <div className="ui-card ui-card-outlined grid xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
      <section className="min-w-0">
        <div className="border-b border-line p-5"><strong>{scope.job.customer_display_name}</strong><span className="ml-2 text-sm text-ink-600">{scope.job.origin_summary} → {scope.job.destination_summary}</span></div>
        <div className="p-4 sm:p-5">
          <div><h3 className="text-ui-section">고객 짐 목록</h3><p className="mt-1 text-ui-support text-ink-600">{items.length}개 품목</p></div>
          <div className="mt-4 overflow-hidden rounded-[var(--radius-component)] border border-line">
            <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 bg-surface-muted px-4 py-2 text-ui-micro text-ink-600"><span>품목</span><span>수량</span></div>
            {items.map((item) => <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-line px-4 py-2" key={item.item_key}>
              <strong className="min-w-0 truncate text-ui-control">{item.name}</strong>
              <span className="whitespace-nowrap text-ui-data tabular-nums text-ink-600">{item.quantity}{item.unit}</span>
            </div>)}
          </div>
          <EditableStringList disabled={locked} items={includedWorks} label="포함 작업" onChange={setIncludedWorks} tone="success" />
          <EditableStringList disabled={locked} items={exclusions} label="제외 작업" onChange={setExclusions} tone="neutral" />
          <LocationConditions job={scope.job} value={locationConditions} />
          <MediaEvidence media={scope.media_previews} />
        </div>
      </section>
      <section className="min-w-0 self-start border-t border-line p-5 sm:p-6 xl:sticky xl:top-28 xl:border-l xl:border-t-0">
        <h3 className="text-ui-section">견적과 실행 계획</h3>
        {locked ? <ReadOnlyQuoteSummary scope={scope} /> : <>
        <MoneyInput label="기본 금액" onChange={setBaseAmount} value={baseAmount} />
        <div className="mt-4 space-y-2">{adjustments.map((adjustment) => <div className="grid grid-cols-[minmax(0,1fr)_minmax(6rem,7.5rem)_auto] gap-2" key={adjustment.id}><Input aria-label="조정 항목" disabled={locked} onChange={(event) => setAdjustments((current) => current.map((item) => item.id === adjustment.id ? { ...item, label: event.target.value } : item))} placeholder="예: 계단 운반…" value={adjustment.label} /><Input aria-label="조정 금액" className="text-right" disabled={locked} onChange={(event) => setAdjustments((current) => current.map((item) => item.id === adjustment.id ? { ...item, amount_krw: Number(event.target.value) } : item))} type="number" value={adjustment.amount_krw} />{locked ? <span /> : <Button aria-label="조정 항목 삭제" onClick={() => setAdjustments((current) => current.filter((item) => item.id !== adjustment.id))} size="icon" variant="ghost"><MinusCircle aria-hidden="true" /></Button>}</div>)}</div>
        <Button className="mt-2" onClick={() => setAdjustments((current) => [...current, { id: crypto.randomUUID(), label: "", amount_krw: 0 }])} size="chip" variant="outline"><Plus aria-hidden="true" /> 금액 조정 추가</Button>
        <div className="mt-4 flex items-end justify-between border-t border-line pt-4"><span className="font-extrabold">총 제안 금액</span><strong className="text-2xl text-primary-700">{money(total)}</strong></div>
        <div className="mt-6 border-t border-line pt-5"><h4 className="font-extrabold">실행 계획</h4><div className="mt-3 grid grid-cols-2 gap-3"><NumberField disabled={locked} label="차량 수" min={1} onChange={setVehicleCount} value={vehicleCount} /><NumberField disabled={locked} label="작업 인원" min={1} onChange={setWorkerCount} value={workerCount} /><NumberField disabled={locked} label="예상 시간(분)" min={30} onChange={setDuration} value={duration} /><label className="text-xs font-bold text-ink-600">차량 종류<Input className="mt-1" disabled={locked} onChange={(event) => setVehicleDescription(event.target.value)} value={vehicleDescription} /></label></div></div>
        {overlap ? <p className="mt-3 text-ui-support text-danger-ink" role="alert">“{overlap}” 항목이 포함·제외 작업에 동시에 있습니다.</p> : null}
        {mutation.error ? <ErrorToast message={apiErrorMessage(mutation.error)} /> : null}
        <Button className="mt-5 w-full" disabled={invalid || mutation.isPending} onClick={() => mutation.mutate()} size="cta"><Send aria-hidden="true" /> {scope.scope.status === "revision_requested" ? "수정본 고객에게 보내기" : "고객에게 제안 보내기"}</Button>
        </>}
      </section>
    </div>
  </div>;
}

function ReadOnlyQuoteSummary({ scope }: { scope: ScopeReview }) {
  const plan = scope.execution_plan;
  return <>
    <p className="mt-4 border-y border-primary-100 bg-primary-50 px-4 py-3 text-ui-support text-primary-800">{scope.scope.status === "customer_review" ? "고객이 이 제안을 확인하고 있습니다." : "공동 확정된 견적입니다."}</p>
    <dl className="mt-4 divide-y divide-line border-y border-line text-ui-support">
      <div className="flex items-center justify-between gap-3 py-3"><dt className="text-ink-600">기본 금액</dt><dd className="tabular-nums">{money(scope.quote?.base_amount_krw ?? 0)}</dd></div>
      {scope.quote?.adjustments.map((item) => <div className="flex items-center justify-between gap-3 py-3" key={item.label}><dt className="min-w-0 truncate text-ink-600">{item.label}</dt><dd className="shrink-0 tabular-nums">{money(item.amount_krw)}</dd></div>)}
      <div className="flex items-end justify-between gap-3 py-4"><dt className="font-extrabold">총 제안 금액</dt><dd className="text-2xl font-extrabold tabular-nums text-primary-700">{money(scope.quote?.total_amount_krw ?? 0)}</dd></div>
    </dl>
    <section className="mt-6"><h4 className="font-extrabold">실행 계획</h4>{plan ? <dl className="mt-3 grid grid-cols-2 border-y border-line text-ui-support"><div className="border-b border-r border-line py-3 pr-3"><dt className="text-ui-micro text-ink-600">차량</dt><dd className="mt-1">{plan.vehicle_description} · {plan.vehicle_count}대</dd></div><div className="border-b border-line py-3 pl-3"><dt className="text-ui-micro text-ink-600">작업 인원</dt><dd className="mt-1">{plan.worker_count}명</dd></div><div className="col-span-2 py-3"><dt className="text-ui-micro text-ink-600">예상 시간</dt><dd className="mt-1">{plan.estimated_duration_minutes}분</dd></div></dl> : <p className="mt-3 text-ui-support text-ink-600">등록된 실행 계획이 없습니다.</p>}{plan?.notes ? <p className="mt-3 break-words text-ui-support text-ink-600">{plan.notes}</p> : null}</section>
  </>;
}

function EditableStringList({ disabled, items, label, onChange, tone }: { disabled: boolean; items: string[]; label: string; onChange: (items: string[]) => void; tone: "success" | "neutral" }) {
  return <section className="mt-7"><div className="flex items-center justify-between"><h4 className="flex items-center gap-2 font-extrabold">{tone === "success" ? <CheckCircle aria-hidden="true" className="text-success" weight="fill" /> : <MinusCircle aria-hidden="true" className="text-ink-500" />}{label}</h4>{disabled ? null : <Button onClick={() => onChange([...items, ""])} size="chip" variant="ghost"><Plus aria-hidden="true" /> 추가</Button>}</div>{disabled ? <ul className="mt-2 divide-y divide-line border-y border-line">{items.map((item, index) => <li className="py-3 text-ui-support" key={`${label}-${index}`}>{item}</li>)}</ul> : <div className="mt-2 space-y-2">{items.map((item, index) => <div className="flex gap-2" key={`${label}-${index}`}><Input aria-label={`${label} ${index + 1}`} maxLength={200} onChange={(event) => onChange(items.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} value={item} /><Button aria-label={`${label} ${index + 1} 삭제`} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} size="icon" variant="ghost"><MinusCircle aria-hidden="true" /></Button></div>)}</div>}</section>;
}

function conditionText(key: string, value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value === "string" || typeof value === "number") {
    const labels: Record<string, string> = { available: "가능", unavailable: "불가능", restricted: "제한", unknown: "미입력" };
    return labels[String(value)] ?? String(value);
  }
  if (typeof value !== "object") return null;
  const condition = value as { status?: string; value?: number | null; value_m?: number | null };
  if (condition.status !== "known") return null;
  if (condition.value != null) return key === "floor" ? `${condition.value}층` : String(condition.value);
  if (condition.value_m != null) return `${condition.value_m}m`;
  return null;
}

function LocationConditions({ job, value }: { job: ScopeReview["job"]; value: ScopeLocationConditions[] }) {
  return <section className="mt-7"><h4 className="font-extrabold">고객 입력 이사 조건</h4>{value.length ? <div className="mt-3 grid overflow-hidden rounded-[var(--radius-component)] border border-line divide-y divide-line lg:grid-cols-2 lg:divide-x lg:divide-y-0">{value.map((location) => {
    const conditions = location.conditions;
    const rows = [
      ["상세 주소", conditionText("detail_address", conditions.detail_address)],
      ["거주 형태", conditionText("residence_type", conditions.residence_type)],
      ["층수", conditionText("floor", conditions.floor)],
      ["엘리베이터", conditionText("elevator", conditions.elevator)],
      ["사다리차", conditionText("ladder", conditions.ladder)],
      ["주차", conditionText("parking_access", conditions.parking_access)],
      ["운반 거리", conditionText("carry_distance", conditions.carry_distance)],
    ].filter((row): row is [string, string] => Boolean(row[1]));
    const address = location.kind === "origin" ? job.origin_summary : job.destination_summary;
    return <section className="min-w-0 p-4" key={`${location.kind}-${location.location_id}`}><p className="text-ui-data text-primary-700">{location.kind === "origin" ? "출발지" : "도착지"}</p><strong className="mt-1 block truncate text-ui-control">{address ?? "주소 미입력"}</strong><dl className="mt-3 divide-y divide-line border-y border-line">{rows.map(([label, text]) => <div className="flex items-center justify-between gap-3 py-2 text-ui-data" key={label}><dt className="text-ink-600">{label}</dt><dd className="text-right">{text}</dd></div>)}</dl>{conditions.access_note ? <p className="mt-3 break-words text-ui-data text-ink-600">{String(conditions.access_note)}</p> : null}</section>;
  })}</div> : <p className="mt-3 border-y border-line py-4 text-ui-support text-ink-600">고객이 입력한 이사 조건이 없습니다.</p>}</section>;
}

function MediaEvidence({ media }: { media: ScopeReview["media_previews"] }) {
  if (media.length === 0) return null;
  return <section className="mt-7"><h4 className="flex items-center gap-2 font-extrabold"><Image aria-hidden="true" /> 촬영 근거</h4><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{media.map((asset, index) => asset.content_type.startsWith("image/") ? <img alt={`범위 촬영 근거 ${index + 1}`} className="aspect-[4/3] w-full rounded-[var(--radius-component)] object-cover" height="360" key={asset.media_asset_id} loading="lazy" src={asset.read_url} width="480" /> : <video className="aspect-[4/3] w-full rounded-[var(--radius-component)] bg-ink-900 object-cover" controls key={asset.media_asset_id} preload="metadata" src={asset.read_url} />)}</div></section>;
}

function MoneyInput({ disabled = false, label, onChange, value }: { disabled?: boolean; label: string; onChange: (value: number) => void; value: number }) { return <label className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(6rem,7.5rem)_auto] items-center gap-2 text-sm"><span className="text-ink-600">{label}</span><Input className="h-10 text-right tabular-nums" disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} type="number" value={value} /><span>원</span></label>; }
function NumberField({ disabled, label, min, onChange, value }: { disabled: boolean; label: string; min: number; onChange: (value: number) => void; value: number }) { return <label className="text-xs font-bold text-ink-600">{label}<Input className="mt-1" disabled={disabled} min={min} onChange={(event) => onChange(Number(event.target.value))} type="number" value={value} /></label>; }
