import { useState, type KeyboardEvent } from "react";
import {
  ArrowRightIcon as ArrowRight,
  BuildingsIcon as Building2,
  CheckIcon as Check,
  HardHatIcon as HardHat,
  UserIcon as UserRound,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

import { mockApiEnabled } from "@/api/mock-api";
import { SecurityStatusIcon as ShieldCheck } from "@/components/icons";
import { MobileFrame } from "@/components/layout/mobile-frame";
import { Button } from "@/components/ui/button";
import { rolePath } from "@/features/auth/model/auth-context";
import { type ParticipantRole } from "@/features/workflow/api/workflow-api";
import { cn } from "@/lib/utils";

const roles = [
  { id: "customer", label: "고객", startLabel: "고객으로 시작", description: "홈에서 새 이사를 만들고 진행 상황을 확인해요", icon: UserRound },
  { id: "company_manager", label: "이사업체", startLabel: "이사업체로 시작", description: "견적, 현장 변경, 배차와 문서를 관리해요", icon: Building2 },
  { id: "field_worker", label: "현장기사", startLabel: "현장기사로 시작", description: "배차 확인부터 체크인·완료 기록까지 처리해요", icon: HardHat },
] as const;

export function RoleEntry() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ParticipantRole>("customer");
  const selectedRole = roles.find((role) => role.id === selected)!;

  const chooseRole = (role: ParticipantRole) => {
    setSelected(role);
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
  const start = () => navigate(rolePath(selected));

  return (
    <div className="mobile-stage">
      <MobileFrame className="flex min-h-dvh flex-col bg-canvas">
        <header className="app-safe-header flex items-center justify-between gap-3 px-5 pb-3">
          <strong className="text-lg font-black tracking-[var(--tracking-display)] text-primary-800">SEQRET</strong>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-600"><ShieldCheck aria-hidden="true" className="text-primary-700" size="var(--icon-xs)" weight="bold" />{mockApiEnabled ? "Mock 모드" : "보안 연결"}</span>
        </header>
        <main className="flex-1 px-5 pb-32 pt-8" id="main-content">
          <h1 className="max-w-[19rem] text-ui-section leading-9 font-extrabold tracking-[var(--tracking-display)] min-[380px]:text-ui-section">어떤 역할로 시작할까요?</h1>
          <fieldset className="mt-6 border-y border-line bg-surface">
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
          <div className="mt-6 flex items-start gap-3 border-l-2 border-primary-600 bg-surface-muted px-4 py-3"><ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-primary-700" size="var(--icon-sm)" weight="bold" /><p className="text-sm leading-5 text-ink-600">업체와 현장기사는 각 화면에서 초대 코드를 입력해 이사 건을 연결합니다.</p></div>
        </main>
        <div className="app-fixed-action fixed inset-x-0 bottom-0 z-[var(--z-sticky)] mx-auto w-full max-w-[var(--shell-mobile)] border-t border-line bg-surface/95 px-5 pt-4 backdrop-blur"><Button className="w-full" onClick={start} size="cta">{selectedRole.startLabel} <ArrowRight aria-hidden="true" /></Button></div>
      </MobileFrame>
    </div>
  );
}
