import {
  CaretLeftIcon as CaretLeft,
  CaretRightIcon as CaretRight,
  CircleNotchIcon as LoaderCircle,
} from "@phosphor-icons/react";
import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { mockApiEnabled } from "@/api/mock-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/model/auth-context";
import { AddressSearchInput } from "@/features/consumer/ui/address-search-input";
import { apiErrorMessage } from "@/features/workflow/api/workflow-api";

type Step = "schedule" | "origin" | "destination";
type StopDraft = {
  address: string;
  detailAddress: string;
  elevator: "있음" | "없음" | "확인 필요";
  floor: string;
  memo: string;
  parking: "가능" | "불가능" | "확인 필요";
};

export const moveDraftStorageKey = "seqret-new-move-draft";

const stepOrder: Step[] = ["schedule", "origin", "destination"];
const stepLabel: Record<Step, string> = { schedule: "일정", origin: "출발지", destination: "도착지" };
const floorOptions = ["반지하", "1층", "2층", "3층", "4층", "5층 이상"];
const elevatorOptions: StopDraft["elevator"][] = ["있음", "없음", "확인 필요"];
const parkingOptions: StopDraft["parking"][] = ["가능", "불가능", "확인 필요"];
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

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
    memo: "",
    parking: kind === "origin" ? "가능" : "확인 필요",
  };
}

function Choice<T extends string>({ label, onChange, options, value }: { label: string; onChange: (value: T) => void; options: readonly T[]; value: T }) {
  return <fieldset><legend className="text-ui-support font-extrabold">{label}</legend><div className="mt-2 grid grid-cols-3 gap-2">{options.map((option) => <button aria-pressed={option === value} className={`min-h-12 rounded-[var(--radius-control)] border px-2 text-sm font-bold ${option === value ? "border-primary-600 bg-primary-50 text-primary-700" : "border-line bg-surface text-ink-600"}`} key={option} onClick={() => onChange(option)} type="button">{option}</button>)}</div></fieldset>;
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
    <div className="mt-2 grid grid-cols-7 gap-y-2">{days.map((day) => { const value = dateValue(day); const selected = value === selectedDate; const inMonth = day.getMonth() === month.getMonth(); return <button aria-label={`${value} 선택`} aria-pressed={selected} className={`mx-auto grid size-11 place-items-center rounded-full text-sm font-bold ${selected ? "bg-primary-600 text-white" : inMonth ? "text-ink-900" : "text-ink-400"}`} key={value} onClick={() => onSelect(value)} type="button">{day.getDate()}</button>; })}</div>
    <section className="mt-8 border-t border-line pt-6"><div className="flex items-center justify-between"><Label htmlFor="move-start-time">서비스 시작 시간</Label><span className="text-sm text-ink-600">시간 협의 가능</span></div><Input className="mt-3" id="move-start-time" onChange={(event) => onTime(event.target.value)} type="time" value={time} /></section>
  </div>;
}

function StopStep({ kind, onChange, value }: { kind: "origin" | "destination"; onChange: (value: StopDraft) => void; value: StopDraft }) {
  const update = <K extends keyof StopDraft>(key: K, next: StopDraft[K]) => onChange({ ...value, [key]: next });
  return <div className="space-y-7 px-5 pb-6 pt-3">
    <section className="space-y-4"><div><Label htmlFor={`new-${kind}-address`}>주소</Label><div className="mt-2"><AddressSearchInput id={`new-${kind}-address`} onChange={(next) => update("address", next)} value={value.address} /></div></div><div><Label htmlFor={`new-${kind}-detail`}>상세 주소</Label><Input className="mt-2" id={`new-${kind}-detail`} onChange={(event) => update("detailAddress", event.target.value)} placeholder="예: 301호" value={value.detailAddress} /></div></section>
    <section className="space-y-6 border-t border-line pt-6"><h2 className="text-ui-section font-black">운반 조건</h2><Choice label="층수" onChange={(next) => update("floor", next)} options={floorOptions} value={value.floor} /><Choice label="엘리베이터" onChange={(next) => update("elevator", next)} options={elevatorOptions} value={value.elevator} />{value.elevator === "없음" ? <p className="rounded-xl border border-warning bg-warning-bg px-4 py-3 text-sm text-warning-ink">엘리베이터가 없으면 계단 운반 비용이 추가될 수 있어요.</p> : null}</section>
    <section className="space-y-5 border-t border-line pt-6"><h2 className="text-ui-section font-black">차량 접근</h2><Choice label="건물 앞에 이사 차량이 정차할 수 있나요?" onChange={(next) => update("parking", next)} options={parkingOptions} value={value.parking} /></section>
  </div>;
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
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const index = stepOrder.indexOf(step);
  const valid = step === "schedule" ? Boolean(selectedDate && time) : step === "origin" ? Boolean(origin.address.trim()) : Boolean(destination.address.trim());

  const submit = async (event: FormEvent) => {
    event.preventDefault();
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
      onOpenChange(false);
      navigate("/consumer?tab=move&view=info", { replace: true });
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setCreating(false);
    }
  };

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

  return <Sheet onOpenChange={close} open={open}><SheetContent presentation="page"><SheetHeader className="border-b border-line px-16 pb-4 pt-[max(14px,env(safe-area-inset-top))] text-center"><SheetTitle>새 이사 {stepLabel[step]} 입력</SheetTitle></SheetHeader><div className="px-5 pt-4"><ol className="grid grid-cols-3 gap-2" aria-label={`새 이사 ${index + 1}/3 단계`}>{stepOrder.map((item, itemIndex) => <li className={`border-b-2 pb-2 text-center text-xs font-extrabold ${itemIndex <= index ? "border-primary-600 text-primary-700" : "border-line text-ink-400"}`} key={item}>{itemIndex + 1}. {stepLabel[item]}</li>)}</ol></div>{error ? <p className="mx-5 mt-4 rounded-xl bg-danger-bg p-3 text-sm font-bold text-danger-ink" role="alert">{error}</p> : null}<form onSubmit={submit}>{step === "schedule" ? <CalendarStep month={month} onMonth={setMonth} onSelect={setSelectedDate} onTime={setTime} selectedDate={selectedDate} time={time} /> : step === "origin" ? <StopStep kind="origin" onChange={setOrigin} value={origin} /> : <StopStep kind="destination" onChange={setDestination} value={destination} />}<SheetFooter className="grid grid-cols-[auto_1fr] gap-2">{index > 0 ? <Button onClick={previous} type="button" variant="outline">이전</Button> : null}{step === "destination" ? <Button disabled={!valid || creating} type="submit">{creating ? <><LoaderCircle aria-hidden="true" className="animate-spin" />초안 만드는 중</> : "이사 초안 만들기"}</Button> : <Button className={index === 0 ? "col-span-full" : ""} disabled={!valid} onClick={next} type="button">다음 · {stepLabel[stepOrder[index + 1]]}</Button>}</SheetFooter></form></SheetContent></Sheet>;
}
