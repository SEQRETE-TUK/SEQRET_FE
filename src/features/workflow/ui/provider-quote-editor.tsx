import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon as ArrowLeft, CheckCircleIcon as CheckCircle, ImageIcon as Image, MinusCircleIcon as MinusCircle, PaperPlaneTiltIcon as Send, PlusIcon as Plus } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [items, setItems] = useState<DraftItem[]>(() => scope ? draftItemsFromScope(scope) : []);
  const [includedWorks, setIncludedWorks] = useState<string[]>(scope?.scope.included_works ?? []);
  const [exclusions, setExclusions] = useState<string[]>(scope?.scope.exclusions ?? []);
  const [locationConditions, setLocationConditions] = useState<ScopeLocationConditions[]>(() => structuredClone(scope?.scope.location_conditions ?? []));
  const [baseAmount, setBaseAmount] = useState(scope?.quote?.base_amount_krw ?? 0);
  const [adjustments, setAdjustments] = useState<DraftAdjustment[]>(() => (scope?.quote?.adjustments ?? []).map((item) => ({ ...item, id: crypto.randomUUID() })));
  const [reason, setReason] = useState(scope?.proposal_reason ?? "촬영 결과와 현장 조건을 반영한 견적입니다.");
  const [vehicleCount, setVehicleCount] = useState(scope?.execution_plan?.vehicle_count ?? 1);
  const [vehicleDescription, setVehicleDescription] = useState(scope?.execution_plan?.vehicle_description ?? "5톤 탑차");
  const [workerCount, setWorkerCount] = useState(scope?.execution_plan?.worker_count ?? 2);
  const [duration, setDuration] = useState(scope?.execution_plan?.estimated_duration_minutes ?? 480);
  const [planNotes, setPlanNotes] = useState(scope?.execution_plan?.notes ?? "");

  const locked = scope?.scope.status === "customer_review" || scope?.scope.status === "confirmed";
  const total = baseAmount + adjustments.reduce((sum, item) => sum + item.amount_krw, 0);
  const normalizedIncluded = includedWorks.map((item) => item.trim()).filter(Boolean);
  const normalizedExclusions = exclusions.map((item) => item.trim()).filter(Boolean);
  const overlap = normalizedIncluded.find((item) => normalizedExclusions.includes(item));
  const adjustmentLabels = adjustments.map((item) => item.label.trim());
  const invalid = items.length === 0 || items.some((item) => !item.name.trim() || item.quantity < 1 || !item.unit.trim()) || baseAmount < 0 || total < 0 || !reason.trim() || !vehicleDescription.trim() || vehicleCount < 1 || workerCount < 1 || duration < 30 || Boolean(overlap) || adjustmentLabels.some((label) => !label) || new Set(adjustmentLabels).size !== adjustmentLabels.length;
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
      execution_plan: { vehicle_count: vehicleCount, vehicle_description: vehicleDescription.trim(), worker_count: workerCount, estimated_duration_minutes: duration, notes: planNotes.trim() || null },
      included_works: normalizedIncluded,
      exclusions: normalizedExclusions,
      reason: reason.trim(),
    }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: workflowKeys.scope(connection.jobId) }); onBack(); },
  });
  if (!scope) return <p className="py-10 text-ui-support text-ink-600">작업을 불러오는 중…</p>;
  const rooms = scope.scope.room_groups.map((group) => ({ id: group.room_zone_id, label: group.label }));
  const updateItem = (itemKey: string, patch: Partial<DraftItem>) => setItems((current) => current.map((item) => item.item_key === itemKey ? { ...item, ...patch } : item));
  const addItem = () => setItems((current) => [...current, { item_key: `company-${crypto.randomUUID()}`, room_zone_id: rooms[0]?.id ?? "", name: "", quantity: 1, unit: "개", work_note: "" }]);

  return <div className="mx-auto max-w-[var(--shell-wide)]">
    <button className="mb-4 flex min-h-11 items-center gap-2 text-ui-control text-primary-700 hover:text-primary-800" onClick={onBack} type="button"><ArrowLeft aria-hidden="true" /> 작업 관리</button>
    {scope.scope.status === "revision_requested" ? <div className="mb-5 rounded-[var(--radius-card)] border border-warning bg-warning-bg p-4"><p className="text-ui-control text-warning-ink">고객 수정 요청</p><p className="mt-1 break-words text-ui-support text-ink-600">{scope.revision_request?.reason}</p><p className="mt-2 text-ui-micro text-warning-ink">기존 제안은 보존되고, 이번 제출은 새 버전으로 기록됩니다.</p></div> : null}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
      <section className="ui-card ui-card-outlined overflow-hidden">
        <div className="border-b border-line p-5"><strong>{scope.job.customer_display_name}</strong><span className="ml-2 text-sm text-ink-600">{scope.job.origin_summary} → {scope.job.destination_summary}</span></div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-ui-section">짐과 작업 내용</h3><p className="mt-1 text-ui-support text-ink-600">수량·단위·작업 메모까지 한 버전에 저장됩니다.</p></div>{locked ? null : <Button onClick={addItem} size="chip" variant="outline"><Plus aria-hidden="true" /> 항목 추가</Button>}</div>
          <div className="mt-4 space-y-3">{items.map((item, index) => <div className="rounded-[var(--radius-card)] border border-line p-4" key={item.item_key}><div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)_80px_80px_auto]"><label className="text-xs font-bold text-ink-600">공간<select className="mt-1 h-11 w-full rounded-[var(--radius-control)] border border-input bg-surface px-3 text-sm text-ink-900" disabled={locked} onChange={(event) => updateItem(item.item_key, { room_zone_id: event.target.value })} value={item.room_zone_id}>{rooms.map((room) => <option key={room.id} value={room.id}>{room.label}</option>)}</select></label><label className="text-xs font-bold text-ink-600">항목명<Input className="mt-1" disabled={locked} maxLength={200} onChange={(event) => updateItem(item.item_key, { name: event.target.value })} value={item.name} /></label><label className="text-xs font-bold text-ink-600">수량<Input className="mt-1" disabled={locked} min="1" onChange={(event) => updateItem(item.item_key, { quantity: Number(event.target.value) })} type="number" value={item.quantity} /></label><label className="text-xs font-bold text-ink-600">단위<Input className="mt-1" disabled={locked} maxLength={20} onChange={(event) => updateItem(item.item_key, { unit: event.target.value })} value={item.unit} /></label>{locked ? null : <Button aria-label={`${item.name || index + 1} 항목 삭제`} className="self-end" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((row) => row.item_key !== item.item_key))} size="icon" variant="ghost"><MinusCircle aria-hidden="true" /></Button>}</div><label className="mt-3 block text-xs font-bold text-ink-600">작업 메모<Input className="mt-1" disabled={locked} maxLength={500} onChange={(event) => updateItem(item.item_key, { work_note: event.target.value })} placeholder="예: 문 분리 후 운반…" value={item.work_note} /></label></div>)}</div>
          <EditableStringList disabled={locked} items={includedWorks} label="포함 작업" onChange={setIncludedWorks} tone="success" />
          <EditableStringList disabled={locked} items={exclusions} label="제외 작업" onChange={setExclusions} tone="neutral" />
          <LocationConditionsEditor disabled={locked} onChange={setLocationConditions} value={locationConditions} />
          <MediaEvidence media={scope.media_previews} />
        </div>
      </section>
      <section className="ui-card ui-card-outlined ui-card-pad self-start xl:sticky xl:top-28">
        <h3 className="text-ui-section">견적과 실행 계획</h3>
        {locked ? <div className="mt-4 rounded-[var(--radius-control)] border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-bold text-primary-800">{scope.scope.status === "customer_review" ? "고객이 이 제안을 확인하고 있습니다." : "공동 확정된 견적입니다."}</div> : null}
        <MoneyInput disabled={locked} label="기본 금액" onChange={setBaseAmount} value={baseAmount} />
        <div className="mt-4 space-y-2">{adjustments.map((adjustment) => <div className="grid grid-cols-[minmax(0,1fr)_minmax(6rem,7.5rem)_auto] gap-2" key={adjustment.id}><Input aria-label="조정 항목" disabled={locked} onChange={(event) => setAdjustments((current) => current.map((item) => item.id === adjustment.id ? { ...item, label: event.target.value } : item))} placeholder="예: 계단 운반…" value={adjustment.label} /><Input aria-label="조정 금액" className="text-right" disabled={locked} onChange={(event) => setAdjustments((current) => current.map((item) => item.id === adjustment.id ? { ...item, amount_krw: Number(event.target.value) } : item))} type="number" value={adjustment.amount_krw} />{locked ? <span /> : <Button aria-label="조정 항목 삭제" onClick={() => setAdjustments((current) => current.filter((item) => item.id !== adjustment.id))} size="icon" variant="ghost"><MinusCircle aria-hidden="true" /></Button>}</div>)}</div>
        {locked ? null : <Button className="mt-2" onClick={() => setAdjustments((current) => [...current, { id: crypto.randomUUID(), label: "", amount_krw: 0 }])} size="chip" variant="outline"><Plus aria-hidden="true" /> 금액 조정 추가</Button>}
        <div className="mt-4 flex items-end justify-between border-t border-line pt-4"><span className="font-extrabold">총 제안 금액</span><strong className="text-2xl text-primary-700">{money(total)}</strong></div>
        <div className="mt-6 border-t border-line pt-5"><h4 className="font-extrabold">실행 계획</h4><div className="mt-3 grid grid-cols-2 gap-3"><NumberField disabled={locked} label="차량 수" min={1} onChange={setVehicleCount} value={vehicleCount} /><NumberField disabled={locked} label="작업 인원" min={1} onChange={setWorkerCount} value={workerCount} /><NumberField disabled={locked} label="예상 시간(분)" min={30} onChange={setDuration} value={duration} /><label className="text-xs font-bold text-ink-600">차량 종류<Input className="mt-1" disabled={locked} onChange={(event) => setVehicleDescription(event.target.value)} value={vehicleDescription} /></label></div><label className="mt-3 block text-xs font-bold text-ink-600">기사 전달 메모<Textarea className="mt-1" disabled={locked} maxLength={1000} onChange={(event) => setPlanNotes(event.target.value)} value={planNotes} /></label></div>
        <label className="mt-5 block text-sm font-extrabold" htmlFor="proposal-reason">제안 사유</label><Textarea className="mt-2" disabled={locked} id="proposal-reason" maxLength={2000} onChange={(event) => setReason(event.target.value)} value={reason} />
        {overlap ? <p className="mt-3 text-ui-support text-danger-ink" role="alert">“{overlap}” 항목이 포함·제외 작업에 동시에 있습니다.</p> : null}
        {mutation.error ? <p className="mt-3 text-ui-support text-danger-ink" role="alert">{apiErrorMessage(mutation.error)}</p> : null}
        {locked ? null : <Button className="mt-5 w-full" disabled={invalid || mutation.isPending} onClick={() => mutation.mutate()} size="cta"><Send aria-hidden="true" /> {scope.scope.status === "revision_requested" ? "수정본 고객에게 보내기" : "고객에게 제안 보내기"}</Button>}
      </section>
    </div>
  </div>;
}

function EditableStringList({ disabled, items, label, onChange, tone }: { disabled: boolean; items: string[]; label: string; onChange: (items: string[]) => void; tone: "success" | "neutral" }) {
  return <section className="mt-7"><div className="flex items-center justify-between"><h4 className="flex items-center gap-2 font-extrabold">{tone === "success" ? <CheckCircle className="text-success" weight="fill" /> : <MinusCircle className="text-ink-500" />}{label}</h4>{disabled ? null : <Button onClick={() => onChange([...items, ""])} size="chip" variant="ghost"><Plus aria-hidden="true" /> 추가</Button>}</div><div className="mt-2 space-y-2">{items.map((item, index) => <div className="flex gap-2" key={`${label}-${index}`}><Input aria-label={`${label} ${index + 1}`} disabled={disabled} maxLength={200} onChange={(event) => onChange(items.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} value={item} />{disabled ? null : <Button aria-label={`${label} ${index + 1} 삭제`} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} size="icon" variant="ghost"><MinusCircle aria-hidden="true" /></Button>}</div>)}</div></section>;
}

function LocationConditionsEditor({ disabled, onChange, value }: { disabled: boolean; onChange: (value: ScopeLocationConditions[]) => void; value: ScopeLocationConditions[] }) {
  const patch = (index: number, conditions: Record<string, unknown>) => onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, conditions: { ...item.conditions, ...conditions } } : item));
  return <section className="mt-7"><h4 className="font-extrabold">현장 조건</h4><p className="mt-1 text-sm text-ink-600">견적에 영향을 주는 층수, 승강기, 주차 조건을 확인합니다.</p>{value.length ? <div className="mt-3 grid gap-3 lg:grid-cols-2">{value.map((location, index) => { const floor = location.conditions.floor as { status?: string; value?: number | null } | undefined; const carry = location.conditions.carry_distance as { status?: string; value_m?: number | null } | undefined; return <div className="rounded-xl border border-line p-4" key={location.location_id}><strong>{location.kind === "origin" ? "출발지" : "도착지"}</strong><div className="mt-3 grid grid-cols-2 gap-3"><label className="text-xs font-bold text-ink-600">층수<Input className="mt-1" disabled={disabled} onChange={(event) => { const raw = event.target.value; patch(index, { floor: raw === "" ? { status: "unknown", value: null } : { status: "known", value: Number(raw) } }); }} placeholder="미정" type="number" value={floor?.status === "known" ? floor.value ?? "" : ""} /></label><label className="text-xs font-bold text-ink-600">운반 거리(m)<Input className="mt-1" disabled={disabled} min="0" onChange={(event) => { const raw = event.target.value; patch(index, { carry_distance: raw === "" ? { status: "unknown", value_m: null } : { status: "known", value_m: Number(raw) } }); }} placeholder="미정" type="number" value={carry?.status === "known" ? carry.value_m ?? "" : ""} /></label><ConditionSelect disabled={disabled} label="승강기" onChange={(next) => patch(index, { elevator: next })} options={[["unknown", "미정"], ["available", "사용 가능"], ["unavailable", "사용 불가"]]} value={String(location.conditions.elevator ?? "unknown")} /><ConditionSelect disabled={disabled} label="주차" onChange={(next) => patch(index, { parking_access: next })} options={[["unknown", "미정"], ["available", "진입 가능"], ["restricted", "제한"], ["unavailable", "불가"]]} value={String(location.conditions.parking_access ?? "unknown")} /></div><label className="mt-3 block text-xs font-bold text-ink-600">접근 메모<Input className="mt-1" disabled={disabled} maxLength={1000} onChange={(event) => patch(index, { access_note: event.target.value.trim() ? event.target.value : null })} value={String(location.conditions.access_note ?? "")} /></label></div>; })}</div> : <p className="mt-3 rounded-xl bg-surface-muted p-4 text-sm text-ink-600">등록된 구조화 현장 조건이 없습니다. 고객 검수 단계에서 입력된 경우 이곳에서 수정할 수 있습니다.</p>}</section>;
}

function ConditionSelect({ disabled, label, onChange, options, value }: { disabled: boolean; label: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]>; value: string }) {
  return <label className="text-xs font-bold text-ink-600">{label}<select className="mt-1 h-11 w-full rounded-[var(--radius-control)] border border-input bg-surface px-3 text-sm text-ink-900" disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value}>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}

function MediaEvidence({ media }: { media: ScopeReview["media_previews"] }) {
  return <section className="mt-7"><h4 className="flex items-center gap-2 font-extrabold"><Image aria-hidden="true" /> 촬영 근거</h4>{media.length ? <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{media.map((asset, index) => asset.content_type.startsWith("image/") ? <img alt={`범위 촬영 근거 ${index + 1}`} className="aspect-[4/3] w-full rounded-[var(--radius-card)] object-cover" height="360" key={asset.media_asset_id} loading="lazy" src={asset.read_url} width="480" /> : <video className="aspect-[4/3] w-full rounded-[var(--radius-card)] bg-ink-900 object-cover" controls key={asset.media_asset_id} preload="metadata" src={asset.read_url} />)}</div> : <p className="mt-3 rounded-[var(--radius-card)] bg-surface-muted p-4 text-sm text-ink-600">표시할 촬영 근거가 없습니다.</p>}</section>;
}

function MoneyInput({ disabled = false, label, onChange, value }: { disabled?: boolean; label: string; onChange: (value: number) => void; value: number }) { return <label className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(6rem,7.5rem)_auto] items-center gap-2 text-sm"><span className="text-ink-600">{label}</span><Input className="h-10 text-right tabular-nums" disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} type="number" value={value} /><span>원</span></label>; }
function NumberField({ disabled, label, min, onChange, value }: { disabled: boolean; label: string; min: number; onChange: (value: number) => void; value: number }) { return <label className="text-xs font-bold text-ink-600">{label}<Input className="mt-1" disabled={disabled} min={min} onChange={(event) => onChange(Number(event.target.value))} type="number" value={value} /></label>; }
