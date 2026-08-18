/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */
import { useState, type KeyboardEvent } from "react";
import {
  ArrowRightIcon as ArrowRight,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

import { mockApiEnabled } from "@/api/mock-api";
import { MobileFrame } from "@/components/layout/mobile-frame";
import { Button } from "@/components/ui/button";
import { rolePath } from "@/features/auth/model/auth-context";
import { type ParticipantRole } from "@/features/workflow/api/workflow-api";
import { cn } from "@/lib/utils";

const roles = [
  { id: "customer", label: "고객", startLabel: "고객으로 시작", asset: "/role-customer-house-isometric.png" },
  { id: "field_worker", label: "현장기사", startLabel: "현장기사로 시작", asset: "/role-field-worker-cargo-truck-isometric.png" },
  { id: "company_manager", label: "이사업체", startLabel: "이사업체로 시작", asset: "/role-company-building-isometric.png" },
] as const;
const primaryRoles = roles;

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
    const index = primaryRoles.findIndex((item) => item.id === role);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? primaryRoles.length - 1 : (index + (event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1) + primaryRoles.length) % primaryRoles.length;
    chooseRole(primaryRoles[nextIndex].id);
    document.getElementById(`role-${primaryRoles[nextIndex].id}`)?.focus();
  };
  const start = () => navigate(rolePath(selected));

  return (
    <div className="mobile-stage">
      <MobileFrame className="flex min-h-dvh flex-col bg-canvas">
        <header className="app-safe-header flex min-h-16 items-center justify-between gap-3 px-[var(--content-gutter)]">
          <strong className="text-xl font-black tracking-[var(--tracking-brand)] text-primary-800">짐확정</strong>
          <span className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-pill)] border border-line bg-surface px-3 text-ui-data text-ink-600">
            {mockApiEnabled ? "Mock 모드" : "보안 연결"}
          </span>
        </header>
        <main className="flex flex-1 flex-col px-[var(--content-gutter)] pb-40 pt-10" id="main-content">
          <div className="my-auto w-full">
            <section aria-labelledby="role-entry-title">
              <h1 className="text-ui-section font-black tracking-[var(--tracking-display)]" id="role-entry-title">어떤 역할로 시작할까요?</h1>
            </section>

            <div className="pt-4">
              <fieldset>
                <legend className="sr-only">연결 역할</legend>
                <div className="grid grid-cols-3 gap-2">
                  {primaryRoles.map((item) => {
                  const active = item.id === selected;
                  return (
                    <label
                      className={cn(
                        "interactive-row relative flex min-h-36 cursor-pointer flex-col items-start justify-between rounded-[var(--radius-feature)] border p-3 text-left transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-focus-ring",
                        active ? "border-primary-400 bg-primary-50" : "border-line bg-surface hover:border-primary-400 hover:bg-surface-muted",
                      )}
                      key={item.id}
                    >
                      <input checked={active} className="sr-only" id={`role-${item.id}`} name="participantRole" onChange={() => chooseRole(item.id)} onKeyDown={(event) => moveRole(event, item.id)} type="radio" value={item.id} />
                      <span className="grid size-16 shrink-0 place-items-center">
                        <img alt="" aria-hidden="true" className="size-16 object-contain" decoding="async" src={item.asset} />
                      </span>
                      <strong className="text-ui-component">{item.label}</strong>
                    </label>
                  );
                  })}
                </div>
              </fieldset>
            </div>
          </div>
        </main>
        <div className="app-fixed-action fixed inset-x-0 bottom-0 z-[var(--z-sticky)] mx-auto w-full max-w-[var(--shell-mobile)] px-[var(--content-gutter)] pt-3">
          <Button className="w-full" onClick={start} size="cta">{selectedRole.startLabel}<ArrowRight aria-hidden="true" /></Button>
        </div>
      </MobileFrame>
    </div>
  );
}
