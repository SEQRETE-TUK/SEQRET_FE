import {
  BuildingApartmentIcon,
  BuildingOfficeIcon,
  CaretLeftIcon as CaretLeft,
  CaretRightIcon as CaretRight,
  HouseIcon,
  HouseLineIcon,
  CircleNotchIcon as LoaderCircle,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { mockApiEnabled } from "@/api/mock-api";
import { InventoryQuantityRow } from "@/components/layout/app-primitives";
import { Button } from "@/components/ui/button";
import { MobilePageHeader } from "@/components/layout/mobile-app-shell";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet";
import { MovingItemIcon } from "@/components/moving-item-icon";
import { useAuth } from "@/features/auth/model/auth-context";
import { AddressSearchInput } from "@/features/consumer/ui/address-search-input";
import { apiErrorMessage } from "@/features/workflow/api/workflow-api";

type Step = "schedule" | "origin" | "destination" | "items";
type StopDraft = {
  address: string;
  detailAddress: string;
  elevator: "있음" | "없음";
  floor: string;
  ladder: "사용" | "사용 안 함";
  memo: string;
  parking: "가능" | "불가능";
  residenceType: string;
};

export const moveDraftStorageKey = "seqret-new-move-draft";

const stepOrder: Step[] = ["schedule", "origin", "destination", "items"];
const floorOptions = ["반지하", "1층", "2층", "3층", "4층", "5층 이상"];
const ladderOptions: StopDraft["ladder"][] = ["사용", "사용 안 함"];
const elevatorOptions: StopDraft["elevator"][] = ["있음", "없음"];
const parkingOptions: StopDraft["parking"][] = ["가능", "불가능"];
const residenceOptions = ["아파트", "빌라·연립", "오피스텔", "단독주택"];
const residenceIcons = {
  아파트: <BuildingApartmentIcon aria-hidden="true" size="var(--icon-sm)" />,
  "빌라·연립": <HouseLineIcon aria-hidden="true" size="var(--icon-sm)" />,
  오피스텔: <BuildingOfficeIcon aria-hidden="true" size="var(--icon-sm)" />,
  단독주택: <HouseIcon aria-hidden="true" size="var(--icon-sm)" />,
};
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const inventoryItems = ["침대", "책상", "의자", "서랍장", "스탠드", "냉장고", "전자레인지", "식탁", "주방 의자", "신발장"];

function roomZones() {
  return ["거실", "침실", "주방"].map((name, sort_order) => ({ name, sort_order }));
}

function dateValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function createStop(kind: Exclude<Step, "schedule">): StopDraft {
  return {
    address: mockApiEnabled ? (kind === "origin" ? "서울 성동구 성수동 1가" : "서울 광진구 자양동 오피스텔") : "",
    detailAddress: mockApiEnabled ? (kind === "origin" ? "301호" : "502호") : "",
    elevator: kind === "origin" ? "없음" : "있음",
    floor: kind === "origin" ? "3층" : "5층 이상",
    ladder: "사용 안 함",
    memo: "",
    parking: kind === "origin" ? "가능" : "불가능",
    residenceType: kind === "origin" ? "아파트" : "오피스텔",
  };
}

function CalendarStep({ month, onMonth, onSelect, selectedDate, time, onTime }: { month: Date; onMonth: (date: Date) => void; onSelect: (date: string) => void; selectedDate: string; time: string; onTime: (value: string) => void }) {
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  }, [month]);
  return <div className="px-5 pb-6 pt-3">
    <div className="flex items-center justify-between"><button aria-label="이전 달" className="grid size-11 place-items-center rounded-[var(--radius-control)] border border-line" onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} type="button"><CaretLeft aria-hidden="true" /></button><strong className="text-ui-section tracking-[var(--tracking-display)]">{month.getFullYear()}. {String(month.getMonth() + 1).padStart(2, "0")}</strong><button aria-label="다음 달" className="grid size-11 place-items-center rounded-[var(--radius-control)] border border-line" onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} type="button"><CaretRight aria-hidden="true" /></button></div>
    <div className="mt-6 grid grid-cols-7 border-b border-line pb-3 text-center text-sm font-bold text-ink-600">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
    <div className="mt-2 grid grid-cols-7 gap-y-2">{days.map((day) => { const value = dateValue(day); const selected = value === selectedDate; const inMonth = day.getMonth() === month.getMonth(); return <button aria-label={`${value} 선택`} aria-pressed={selected} className={`mx-auto grid size-11 place-items-center rounded-full text-sm font-bold ${selected ? "border border-primary-600 bg-primary-50 text-primary-700" : inMonth ? "text-ink-900" : "text-ink-400"}`} key={value} onClick={() => onSelect(value)} type="button">{day.getDate()}</button>; })}</div>
    <section className="mt-8 border-t border-line pt-6"><div className="flex items-center justify-between"><Label htmlFor="move-start-time">서비스 시작 시간</Label><span className="text-sm text-ink-600">시간 협의 가능</span></div><Input className="mt-3" id="move-start-time" onChange={(event) => onTime(event.target.value)} type="time" value={time} /></section>
  </div>;
}

function StopStep({ kind, onChange, value }: { kind: "origin" | "destination"; onChange: (value: StopDraft) => void; value: StopDraft }) {
  const update = <K extends keyof StopDraft>(key: K, next: StopDraft[K]) => onChange({ ...value, [key]: next });
  return <div className="space-y-2 bg-canvas pt-0">
    <section className="space-y-4 bg-surface px-5 py-6"><div><Label className="text-ui-component" htmlFor={`new-${kind}-address`}>주소</Label><div className="mt-2"><AddressSearchInput id={`new-${kind}-address`} onChange={(next) => update("address", next)} value={value.address} /></div></div><div><Input id={`new-${kind}-detail`} onChange={(event) => update("detailAddress", event.target.value)} placeholder="상세 주소 입력 (동/호수 등)" value={value.detailAddress} /></div></section>
    <section className="flex flex-col gap-8 bg-surface px-5 py-6"><ChoiceGroup appearance="outlined" columns={3} label="층수" onChange={(next) => update("floor", next)} options={floorOptions} scroll value={value.floor} /><ChoiceGroup columns={2} label="사다리차 사용 여부" onChange={(next) => update("ladder", next)} options={ladderOptions} value={value.ladder ?? "사용 안 함"} /><ChoiceGroup columns={2} label="엘리베이터 유무" onChange={(next) => update("elevator", next)} options={elevatorOptions} value={value.elevator} /><ChoiceGroup columns={2} label="주차 가능 여부" onChange={(next) => update("parking", next)} options={parkingOptions} value={value.parking === "가능" ? "가능" : "불가능"} /><ChoiceGroup appearance="outlined" columns={3} icons={residenceIcons} label="거주지 형태" onChange={(next) => update("residenceType", next)} options={residenceOptions} value={value.residenceType ?? "아파트"} /></section>
  </div>;
}

function InventoryStep({ onQuantityChange, quantities }: { onQuantityChange: (name: string, quantity: number) => void; quantities: Record<string, number> }) {
  return <div className="bg-canvas px-5 pb-24 pt-4"><p className="text-sm leading-6 text-ink-600">이사할 짐을 확인하고 수량을 선택해 주세요.</p><div className="mt-4 space-y-2">{inventoryItems.map((name) => { const quantity = quantities[name] ?? 1; return <InventoryQuantityRow icon={<MovingItemIcon name={name} />} key={name} name={name} onDecrease={() => onQuantityChange(name, quantity - 1)} onIncrease={() => onQuantityChange(name, quantity + 1)} onRemove={() => onQuantityChange(name, 0)} quantity={quantity} />; })}</div></div>;
}

export function CustomerOnboardingSheet({ onOpenChange, open }: { onOpenChange: (open: boolean) => void; open: boolean }) {
  const { onboard, session } = useAuth();
  const navigate = useNavigate();
  const initialDate = mockApiEnabled ? new Date(2026, 7, 25) : new Date();
  const [step, setStep] = useState<Step>("schedule");
  const [month, setMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateValue(initialDate));
  const [time, setTime] = useState("09:00");
  const [origin, setOrigin] = useState(() => createStop("origin"));
  const [destination, setDestination] = useState(() => createStop("destination"));
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const index = stepOrder.indexOf(step);
  const selectedItemCount = inventoryItems.reduce((total, name) => total + (quantities[name] ?? 1), 0);
  const valid = step === "schedule" ? Boolean(selectedDate && time) : step === "origin" ? Boolean(origin.address.trim()) : step === "destination" ? Boolean(destination.address.trim()) : selectedItemCount > 0;

  const submit = async () => {
    if (step !== "destination" || creating || !valid) return;
    setCreating(true);
    setError(null);
    const scheduledAt = `${selectedDate}T${time}`;
    try {
      window.sessionStorage.setItem(moveDraftStorageKey, JSON.stringify({ schedule: scheduledAt, stops: { origin, destination } }));
      await onboard({
        title: "우리 집 이사",
        scheduled_at: new Date(scheduledAt).toISOString(),
        customer_display_name: session?.actor.display_name ?? (mockApiEnabled ? "김서큐" : "고객"),
        locations: [
          { kind: "origin", label: origin.address.trim(), room_zones: roomZones() },
          { kind: "destination", label: destination.address.trim(), room_zones: roomZones() },
        ],
      });
      setStep("items");
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setCreating(false);
    }
  };

  const finish = () => {
    if (!valid) return;
    onOpenChange(false);
    navigate("/consumer?tab=move&view=items", { replace: true });
  };

  const updateQuantity = (name: string, quantity: number) => setQuantities((current) => ({ ...current, [name]: Math.max(0, quantity) }));

  const close = (next: boolean) => {
    if (!next && step !== "schedule") {
      setStep(stepOrder[Math.max(index - 1, 0)]);
      setError(null);
      return;
    }
    onOpenChange(next);
    if (!next) { setStep("schedule"); setError(null); }
  };
  const next = () => { if (valid) setStep(stepOrder[Math.min(index + 1, stepOrder.length - 1)]); };
  const previous = () => setStep(stepOrder[Math.max(index - 1, 0)]);

  return <Sheet onOpenChange={close} open={open}><SheetContent className="!transition-none !transform-none" presentation="page" showClose={false}><MobilePageHeader onBack={() => close(false)} title={step === "schedule" ? "새 이사 일정 입력" : step === "origin" ? "출발지 정보" : step === "destination" ? "도착지 정보" : "짐 목록 선택"} />{error ? <p className="mx-5 mt-4 rounded-xl bg-danger-bg p-3 text-sm font-bold text-danger-ink" role="alert">{error}</p> : null}<form onSubmit={(event) => { event.preventDefault(); void submit(); }}>{step === "schedule" ? <CalendarStep month={month} onMonth={setMonth} onSelect={setSelectedDate} onTime={setTime} selectedDate={selectedDate} time={time} /> : step === "origin" ? <StopStep kind="origin" onChange={setOrigin} value={origin} /> : step === "destination" ? <StopStep kind="destination" onChange={setDestination} value={destination} /> : <InventoryStep onQuantityChange={updateQuantity} quantities={quantities} />}<SheetFooter className="grid grid-cols-[auto_1fr] gap-2">{index > 0 ? <Button className="min-w-[calc(var(--control-touch)*2)]" onClick={previous} type="button" variant="outline">이전</Button> : null}{step === "destination" ? <Button disabled={!valid || creating} key="destination-next" type="submit">{creating ? <><LoaderCircle aria-hidden="true" className="animate-spin" />짐 목록 준비 중</> : "다음"}</Button> : step === "items" ? <Button disabled={!valid} key="items-submit" onClick={finish} type="button">견적 링크 생성</Button> : <Button className={index === 0 ? "col-span-full" : ""} disabled={!valid} key="step-next" onClick={next} type="button">다음</Button>}</SheetFooter></form></SheetContent></Sheet>;
}
