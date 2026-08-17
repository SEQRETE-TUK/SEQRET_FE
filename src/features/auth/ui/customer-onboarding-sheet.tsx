import { CircleNotchIcon as LoaderCircle } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { mockApiEnabled } from "@/api/mock-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/model/auth-context";
import { apiErrorMessage } from "@/features/workflow/api/workflow-api";
import { cn } from "@/lib/utils";

function roomZones(value: string) {
  const names = value.split(",").map((name) => name.trim()).filter(Boolean);
  return (names.length ? names : ["전체 공간"]).map((name, sort_order) => ({ name, sort_order }));
}

export function CustomerOnboardingSheet({ onOpenChange, open }: { onOpenChange: (open: boolean) => void; open: boolean }) {
  const { onboard } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState(mockApiEnabled ? "Mock 고객" : "");
  const [title, setTitle] = useState("우리 집 이사");
  const [scheduledAt, setScheduledAt] = useState(mockApiEnabled ? "2030-01-15T10:00" : "");
  const [origin, setOrigin] = useState(mockApiEnabled ? "Mock 출발지" : "");
  const [destination, setDestination] = useState(mockApiEnabled ? "Mock 도착지" : "");
  const [zones, setZones] = useState("거실, 침실, 주방");
  const firstStepValid = Boolean(customerName.trim() && title.trim() && scheduledAt);
  const secondStepValid = Boolean(origin.trim() && destination.trim());

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (creating || !secondStepValid) return;
    setCreating(true);
    setError(null);
    try {
      await onboard({
        title: title.trim(),
        scheduled_at: new Date(scheduledAt).toISOString(),
        customer_display_name: customerName.trim(),
        locations: [
          { kind: "origin", label: origin.trim(), room_zones: roomZones(zones) },
          { kind: "destination", label: destination.trim(), room_zones: roomZones(zones) },
        ],
      });
      onOpenChange(false);
      navigate("/consumer/capture", { replace: true });
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Sheet onOpenChange={(next) => { onOpenChange(next); if (!next) { setStep(1); setError(null); } }} open={open}>
      <SheetContent>
        <SheetHeader><SheetTitle>새 이사 시작</SheetTitle><SheetDescription>일정과 이동 경로를 먼저 입력해 주세요.</SheetDescription></SheetHeader>
        {error ? <p aria-live="polite" className="mx-5 mt-4 rounded-xl bg-danger-bg p-3 text-sm font-bold leading-5 text-danger-ink">{error}</p> : null}
        <form className="mt-5" onSubmit={submit}>
          <div className="px-5">
            <div aria-label={`새 이사 만들기 ${step}/2 단계`} className="mb-5 flex items-center gap-3"><span className="h-1.5 flex-1 rounded-full bg-primary-600" /><span className={cn("h-1.5 flex-1 rounded-full", step === 2 ? "bg-primary-600" : "bg-line")} /><span className="text-xs font-bold text-ink-600">{step}/2</span></div>
            {step === 1 ? <div className="space-y-4">
              <div><Label htmlFor="customer-name">이름</Label><Input autoComplete="name" className="mt-2" id="customer-name" maxLength={100} onChange={(event) => setCustomerName(event.target.value)} required value={customerName} /></div>
              <div><Label htmlFor="job-title">이사 이름</Label><Input autoComplete="off" className="mt-2" id="job-title" maxLength={200} onChange={(event) => setTitle(event.target.value)} required value={title} /></div>
              <div><Label htmlFor="scheduled-at">예정 일시</Label><Input autoComplete="off" className="mt-2" id="scheduled-at" onChange={(event) => setScheduledAt(event.currentTarget.value)} required type="datetime-local" value={scheduledAt} /></div>
            </div> : <div className="space-y-4">
              <div><Label htmlFor="origin">출발지</Label><Input autoComplete="off" className="mt-2" id="origin" maxLength={100} onChange={(event) => setOrigin(event.target.value)} placeholder="예: 성수동 원룸" required value={origin} /></div>
              <div><Label htmlFor="destination">도착지</Label><Input autoComplete="off" className="mt-2" id="destination" maxLength={100} onChange={(event) => setDestination(event.target.value)} placeholder="예: 자양동 오피스텔" required value={destination} /></div>
              <div><Label htmlFor="zones">촬영할 공간</Label><Input autoComplete="off" className="mt-2" id="zones" onChange={(event) => setZones(event.target.value)} value={zones} /><p className="mt-2 text-sm text-ink-600">쉼표로 구분해 주세요.</p></div>
            </div>}
          </div>
          <SheetFooter className="grid grid-cols-[auto_1fr] gap-2">
            {step === 2 ? <Button onClick={() => setStep(1)} type="button" variant="outline">이전</Button> : null}
            {step === 1 ? <Button className="col-span-full w-full" disabled={!firstStepValid} onClick={() => setStep(2)} type="button">주소 입력</Button> : <Button disabled={!secondStepValid || creating} type="submit">{creating ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> 만드는 중…</> : "촬영 시작"}</Button>}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
