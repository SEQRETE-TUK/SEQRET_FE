import { useState, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowRightIcon as ArrowRight,
  BuildingsIcon as Building2,
  CheckIcon as Check,
  HardHatIcon as HardHat,
  CircleNotchIcon as LoaderCircle,
  UserIcon as UserRound,
} from "@phosphor-icons/react";
import {
  SecurityStatusIcon as ShieldCheck,
} from "@/components/icons";
import { useNavigate } from "react-router-dom";

import { MobileFrame } from "@/components/layout/mobile-frame";
import { mockAccessSecrets, mockApiEnabled } from "@/api/mock-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth, rolePath } from "@/features/auth/model/auth-context";
import { apiErrorMessage, type ParticipantRole } from "@/features/workflow/api/workflow-api";
import { cn } from "@/lib/utils";

const roles = [
  { id: "customer", label: "고객", startLabel: "고객으로 시작", description: "새 이사를 만들고 범위·견적을 확인해요", icon: UserRound },
  { id: "company_manager", label: "이사업체", startLabel: "이사업체로 시작", description: "견적, 현장 변경, 배차와 문서를 관리해요", icon: Building2 },
  { id: "field_worker", label: "현장기사", startLabel: "현장기사로 시작", description: "배차 확인부터 체크인·완료 기록까지 처리해요", icon: HardHat },
] as const;

function roomZones(value: string) {
  const names = value.split(",").map((name) => name.trim()).filter(Boolean);
  return (names.length ? names : ["전체 공간"]).map((name, sort_order) => ({ name, sort_order }));
}

export function RoleEntry() {
  const navigate = useNavigate();
  const { connect, onboard } = useAuth();
  const [selected, setSelected] = useState<ParticipantRole>("customer");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<"new" | "code">("new");
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);
  const [secret, setSecret] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState(mockApiEnabled ? "Mock 고객" : "");
  const [title, setTitle] = useState("우리 집 이사");
  const [scheduledAt, setScheduledAt] = useState(mockApiEnabled ? "2030-01-15T10:00" : "");
  const [origin, setOrigin] = useState(mockApiEnabled ? "Mock 출발지" : "");
  const [destination, setDestination] = useState(mockApiEnabled ? "Mock 도착지" : "");
  const [zones, setZones] = useState("거실, 침실, 주방");

  const selectedRole = roles.find((role) => role.id === selected)!;
  const firstStepValid = Boolean(customerName.trim() && title.trim() && scheduledAt);
  const secondStepValid = Boolean(origin.trim() && destination.trim());

  const submitSecret = async (event: FormEvent) => {
    event.preventDefault();
    if (!secret.trim() || connecting) return;
    setConnecting(true);
    setError(null);
    try {
      const session = await connect(secret, selected);
      setSecret("");
      navigate(rolePath(session.actor.role));
    } catch (caught) {
      setError(caught instanceof Error && !("status" in caught) ? caught.message : apiErrorMessage(caught));
    } finally {
      setConnecting(false);
    }
  };

  const submitOnboarding = async (event: FormEvent) => {
    event.preventDefault();
    if (creating || !secondStepValid) return;
    setCreating(true);
    setError(null);
    try {
      await onboard({
        title: title.trim(),
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        customer_display_name: customerName.trim(),
        locations: [
          { kind: "origin", label: origin.trim(), room_zones: roomZones(zones) },
          { kind: "destination", label: destination.trim(), room_zones: roomZones(zones) },
        ],
      });
      navigate("/consumer");
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setCreating(false);
    }
  };

  const chooseRole = (role: ParticipantRole) => {
    setSelected(role);
    setEntryMode(role === "customer" ? "new" : "code");
    setOnboardingStep(1);
    setError(null);
    setSecret(mockApiEnabled ? mockAccessSecrets[role] : "");
  };

  const moveRole = (event: KeyboardEvent<HTMLInputElement>, role: ParticipantRole) => {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const currentIndex = roles.findIndex((item) => item.id === role);
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? roles.length - 1
        : (currentIndex + (event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1) + roles.length) % roles.length;
    const nextRole = roles[nextIndex];
    chooseRole(nextRole.id);
    document.getElementById(`role-${nextRole.id}`)?.focus();
  };

  return (
    <div className="mobile-stage">
      <MobileFrame className="flex min-h-dvh flex-col bg-canvas">
        <header className="app-safe-header flex min-w-0 items-center justify-between gap-3 px-5 pb-3">
          <strong className="shrink-0 text-lg font-black tracking-[-0.04em] text-primary-800">SEQRET</strong>
          <span className="inline-flex min-w-0 items-center justify-end gap-1.5 text-right text-xs leading-4 font-bold text-ink-600">
            <ShieldCheck aria-hidden="true" className="text-primary-700" size="var(--icon-xs)" weight="bold" />
            <span className="min-w-0">{mockApiEnabled ? "Mock 모드" : "보안 연결"}</span>
          </span>
        </header>

        <main className="min-w-0 flex-1 px-5 pb-32 pt-8" id="main-content">
          <h1 className="max-w-[19rem] break-keep text-[30px] leading-[1.2] font-extrabold tracking-[-0.04em] text-ink-900 min-[380px]:text-[32px]">
            어떤 역할로 시작할까요?
          </h1>
          <p className="mt-3 max-w-[21rem] text-base leading-6 text-ink-600">
            역할에 따라 확인할 정보와 처리할 작업이 달라집니다.
          </p>

          <fieldset className="mt-8 min-w-0 border-y border-line bg-surface">
            <legend className="sr-only">연결 역할</legend>
            {roles.map((item) => {
              const active = item.id === selected;
              const Icon = item.icon;
              return (
                <label
                  className={cn(
                    "interactive-row flex min-h-[88px] w-full cursor-pointer items-center gap-3 border-b border-line px-4 py-4 text-left last:border-b-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-2px] has-[:focus-visible]:outline-focus-ring",
                    active && "bg-primary-50/70",
                  )}
                  key={item.id}
                >
                  <input
                    checked={active}
                    className="sr-only"
                    id={`role-${item.id}`}
                    name="participantRole"
                    onChange={() => chooseRole(item.id)}
                    onKeyDown={(event) => moveRole(event, item.id)}
                    type="radio"
                    value={item.id}
                  />
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", active ? "bg-primary-600 text-accent-ink" : "bg-surface-muted text-ink-600")}>
                    <Icon aria-hidden="true" size="var(--icon-md)" weight="duotone" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-base leading-6">{item.label}</strong>
                    <span className="mt-0.5 block text-sm leading-5 text-ink-600">{item.description}</span>
                  </span>
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border", active ? "border-primary-600 bg-primary-600 text-accent-ink" : "border-line bg-surface")}>
                    {active ? <Check aria-hidden="true" className="size-3.5" /> : null}
                  </span>
                </label>
              );
            })}
          </fieldset>

          <div className="mt-6 flex items-start gap-3 border-l-2 border-primary-600 bg-surface-muted px-4 py-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-primary-700" size="var(--icon-sm)" weight="bold" />
            <p className="text-sm leading-5 text-ink-600">
              업체와 현장기사는 초대에서 받은 일회성 보안코드로 연결합니다.
            </p>
          </div>
        </main>

        <div className="app-safe-bottom fixed inset-x-0 bottom-0 z-[var(--z-sticky)] mx-auto w-full max-w-[var(--shell-mobile)] border-t border-line bg-surface/95 px-5 pt-4 backdrop-blur">
          <Button className="w-full" onClick={() => setSheetOpen(true)} size="cta">
            {selectedRole.startLabel} <ArrowRight aria-hidden="true" />
          </Button>
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{selectedRole.label} 연결</SheetTitle>
              <SheetDescription>
                {selected === "customer" ? "새 이사를 만들거나 기존 보안코드로 이어서 진행하세요." : "초대에서 받은 보안코드를 확인합니다."}
              </SheetDescription>
            </SheetHeader>

            {selected === "customer" ? (
              <div className="px-5">
                <div className="grid grid-cols-2 rounded-[var(--radius-input)] bg-canvas p-1" role="tablist" aria-label="고객 연결 방식">
                  <button className={cn("min-h-11 rounded-lg px-3 text-sm font-bold", entryMode === "new" ? "bg-surface text-ink-900 shadow-[var(--shadow-card)]" : "text-ink-600")} onClick={() => { setEntryMode("new"); setError(null); }} role="tab" aria-selected={entryMode === "new"} type="button">새 이사</button>
                  <button className={cn("min-h-11 rounded-lg px-3 text-sm font-bold", entryMode === "code" ? "bg-surface text-ink-900 shadow-[var(--shadow-card)]" : "text-ink-600")} onClick={() => { setEntryMode("code"); setError(null); if (mockApiEnabled) setSecret(mockAccessSecrets.customer); }} role="tab" aria-selected={entryMode === "code"} type="button">보안코드</button>
                </div>
              </div>
            ) : null}

            {error ? <p aria-live="polite" className="mx-5 mt-4 rounded-xl bg-danger-bg p-3 text-sm font-bold leading-5 text-danger-ink">{error}</p> : null}

            {selected === "customer" && entryMode === "new" ? (
              <form className="mt-5" onSubmit={submitOnboarding}>
                <div className="px-5">
                  <div className="mb-5 flex items-center gap-3" aria-label={`새 이사 만들기 ${onboardingStep}/2 단계`}>
                    <span className="h-1.5 flex-1 rounded-full bg-primary-600" />
                    <span className={cn("h-1.5 flex-1 rounded-full", onboardingStep === 2 ? "bg-primary-600" : "bg-line")} />
                    <span className="text-xs font-bold text-ink-600">{onboardingStep}/2</span>
                  </div>

                  {onboardingStep === 1 ? (
                    <div className="space-y-4">
                      <div><Label htmlFor="customer-name">이름</Label><Input autoComplete="name" className="mt-2" id="customer-name" maxLength={100} name="customerName" onChange={(event) => setCustomerName(event.target.value)} required value={customerName} /></div>
                      <div><Label htmlFor="job-title">이사 이름</Label><Input autoComplete="off" className="mt-2" id="job-title" maxLength={200} name="jobTitle" onChange={(event) => setTitle(event.target.value)} required value={title} /></div>
                      <div><Label htmlFor="scheduled-at">예정 일시</Label><Input autoComplete="off" className="mt-2" id="scheduled-at" name="scheduledAt" onChange={(event) => setScheduledAt(event.currentTarget.value)} required type="datetime-local" value={scheduledAt} /></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div><Label htmlFor="origin">출발지 표시명</Label><Input autoComplete="off" className="mt-2" id="origin" maxLength={100} name="originLabel" onChange={(event) => setOrigin(event.target.value)} placeholder="예: 성수동 아파트…" required value={origin} /></div>
                      <div><Label htmlFor="destination">도착지 표시명</Label><Input autoComplete="off" className="mt-2" id="destination" maxLength={100} name="destinationLabel" onChange={(event) => setDestination(event.target.value)} placeholder="예: 합정동 오피스텔…" required value={destination} /></div>
                      <div><Label htmlFor="zones">확인할 공간</Label><Input autoComplete="off" className="mt-2" id="zones" name="roomZones" onChange={(event) => setZones(event.target.value)} value={zones} /><p className="mt-2 min-h-5 text-sm text-ink-600">쉼표로 구분해 주세요.</p></div>
                    </div>
                  )}
                </div>
                <SheetFooter className="grid grid-cols-[auto_1fr] gap-2">
                  {onboardingStep === 2 ? <Button onClick={() => setOnboardingStep(1)} type="button" variant="outline">이전</Button> : null}
                  {onboardingStep === 1 ? (
                    <Button className="col-span-full w-full" disabled={!firstStepValid} onClick={() => setOnboardingStep(2)} type="button">주소 입력</Button>
                  ) : (
                    <Button disabled={!secondStepValid || creating} type="submit">
                      {creating ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> 만드는 중…</> : "새 이사 만들기"}
                    </Button>
                  )}
                </SheetFooter>
              </form>
            ) : (
              <form className="mt-5" onSubmit={submitSecret}>
                <div className="px-5">
                  <Label htmlFor="access-secret">보안코드</Label>
                  <Input autoCapitalize="none" autoComplete="off" className="mt-2" id="access-secret" minLength={40} name="accessSecret" onChange={(event) => setSecret(event.target.value)} required spellCheck={false} type="password" value={secret} />
                  <p className="mt-2 min-h-5 text-sm leading-5 text-ink-600">{mockApiEnabled ? "Mock 보안코드가 자동 입력되었습니다." : "코드는 저장하거나 URL·로그에 남기지 않습니다."}</p>
                </div>
                <SheetFooter>
                  <Button className="w-full" disabled={!secret.trim() || connecting} size="cta" type="submit">
                    {connecting ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> 확인 중…</> : selected === "customer" ? "고객으로 연결" : `${selectedRole.label}로 연결`}
                  </Button>
                </SheetFooter>
              </form>
            )}
          </SheetContent>
        </Sheet>
      </MobileFrame>
    </div>
  );
}
