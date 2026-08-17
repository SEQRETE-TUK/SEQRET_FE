import { useState, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowRightIcon as ArrowRight,
  BuildingsIcon as Building2,
  CheckIcon as Check,
  CircleNotchIcon as LoaderCircle,
  HardHatIcon as HardHat,
  UserIcon as UserRound,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

import { mockAccessSecrets, mockApiEnabled } from "@/api/mock-api";
import { SecurityStatusIcon as ShieldCheck } from "@/components/icons";
import { MobileFrame } from "@/components/layout/mobile-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { rolePath, useAuth } from "@/features/auth/model/auth-context";
import { apiErrorMessage, type ParticipantRole } from "@/features/workflow/api/workflow-api";
import { cn } from "@/lib/utils";

const roles = [
  { id: "customer", label: "고객", startLabel: "고객으로 시작", description: "홈에서 새 이사를 만들고 진행 상황을 확인해요", icon: UserRound },
  { id: "company_manager", label: "이사업체", startLabel: "이사업체로 시작", description: "견적, 현장 변경, 배차와 문서를 관리해요", icon: Building2 },
  { id: "field_worker", label: "현장기사", startLabel: "현장기사로 시작", description: "배차 확인부터 체크인·완료 기록까지 처리해요", icon: HardHat },
] as const;

export function RoleEntry() {
  const navigate = useNavigate();
  const { connect } = useAuth();
  const [selected, setSelected] = useState<ParticipantRole>("customer");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedRole = roles.find((role) => role.id === selected)!;

  const chooseRole = (role: ParticipantRole) => {
    setSelected(role);
    setError(null);
    setSecret(mockApiEnabled && role !== "customer" ? mockAccessSecrets[role] : "");
  };
  const moveRole = (event: KeyboardEvent<HTMLInputElement>, role: ParticipantRole) => {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = roles.findIndex((item) => item.id === role);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? roles.length - 1 : (index + (event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1) + roles.length) % roles.length;
    chooseRole(roles[nextIndex].id);
    document.getElementById(`role-${roles[nextIndex].id}`)?.focus();
  };
  const start = () => {
    if (selected === "customer") {
      navigate("/consumer");
      return;
    }
    setSheetOpen(true);
  };
  const submitSecret = async (event: FormEvent) => {
    event.preventDefault();
    if (!secret.trim() || connecting) return;
    setConnecting(true);
    setError(null);
    try {
      const next = await connect(secret, selected);
      navigate(rolePath(next.actor.role));
    } catch (caught) {
      setError(caught instanceof Error && !("status" in caught) ? caught.message : apiErrorMessage(caught));
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="mobile-stage">
      <MobileFrame className="flex min-h-dvh flex-col bg-canvas">
        <header className="app-safe-header flex items-center justify-between gap-3 px-5 pb-3">
          <strong className="text-lg font-black tracking-[-0.04em] text-primary-800">SEQRET</strong>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-600"><ShieldCheck aria-hidden="true" className="text-primary-700" size="var(--icon-xs)" weight="bold" />{mockApiEnabled ? "Mock 모드" : "보안 연결"}</span>
        </header>
        <main className="flex-1 px-5 pb-32 pt-8" id="main-content">
          <h1 className="max-w-[19rem] text-[30px] leading-[1.2] font-extrabold tracking-[-0.04em] min-[380px]:text-[32px]">어떤 역할로 시작할까요?</h1>
          <p className="mt-3 max-w-[21rem] text-base leading-6 text-ink-600">역할에 따라 확인할 정보와 처리할 작업이 달라집니다.</p>
          <fieldset className="mt-8 border-y border-line bg-surface">
            <legend className="sr-only">연결 역할</legend>
            {roles.map((item) => {
              const active = item.id === selected;
              const Icon = item.icon;
              return <label className={cn("interactive-row flex min-h-[88px] cursor-pointer items-center gap-3 border-b border-line px-4 py-4 last:border-b-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring", active && "bg-primary-50/70")} key={item.id}>
                <input checked={active} className="sr-only" id={`role-${item.id}`} name="participantRole" onChange={() => chooseRole(item.id)} onKeyDown={(event) => moveRole(event, item.id)} type="radio" value={item.id} />
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", active ? "bg-primary-600 text-white" : "bg-surface-muted text-ink-600")}><Icon aria-hidden="true" size="var(--icon-md)" weight="duotone" /></span>
                <span className="min-w-0 flex-1"><strong className="block text-base leading-6">{item.label}</strong><span className="mt-0.5 block text-sm leading-5 text-ink-600">{item.description}</span></span>
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border", active ? "border-primary-600 bg-primary-600 text-white" : "border-line bg-surface")}>{active ? <Check aria-hidden="true" className="size-3.5" /> : null}</span>
              </label>;
            })}
          </fieldset>
          <div className="mt-6 flex items-start gap-3 border-l-2 border-primary-600 bg-surface-muted px-4 py-3"><ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-primary-700" size="var(--icon-sm)" weight="bold" /><p className="text-sm leading-5 text-ink-600">업체와 현장기사는 초대에서 받은 보안코드로 연결합니다.</p></div>
        </main>
        <div className="app-safe-bottom fixed inset-x-0 bottom-0 z-[var(--z-sticky)] mx-auto w-full max-w-[var(--shell-mobile)] border-t border-line bg-surface/95 px-5 pt-4 backdrop-blur"><Button className="w-full" onClick={start} size="cta">{selectedRole.startLabel} <ArrowRight aria-hidden="true" /></Button></div>
        <Sheet onOpenChange={setSheetOpen} open={sheetOpen}>
          <SheetContent>
            <SheetHeader><SheetTitle>{selectedRole.label} 연결</SheetTitle><SheetDescription>초대에서 받은 보안코드를 확인합니다.</SheetDescription></SheetHeader>
            {error ? <p aria-live="polite" className="mx-5 mt-4 rounded-xl bg-danger-bg p-3 text-sm font-bold text-danger-ink">{error}</p> : null}
            <form className="mt-5" onSubmit={submitSecret}>
              <div className="px-5"><Label htmlFor="access-secret">보안코드</Label><Input autoCapitalize="none" autoComplete="off" className="mt-2" id="access-secret" minLength={40} onChange={(event) => setSecret(event.target.value)} required spellCheck={false} type="password" value={secret} /><p className="mt-2 text-sm leading-5 text-ink-600">{mockApiEnabled ? "Mock 보안코드가 자동 입력되었습니다." : "초대 메시지의 코드를 붙여 넣어 주세요."}</p></div>
              <SheetFooter><Button className="w-full" disabled={!secret.trim() || connecting} size="cta" type="submit">{connecting ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> 확인 중…</> : `${selectedRole.label}로 연결`}</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </MobileFrame>
    </div>
  );
}
