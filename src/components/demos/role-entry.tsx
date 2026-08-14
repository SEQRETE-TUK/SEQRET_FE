"use client";

import { useState } from "react";
import { Building2, Check, HardHat, UserRound } from "lucide-react";

import { MobileFrame, StatusBar } from "@/components/demo-ui";
import { Button } from "@/components/ui/button";

const roles = [
  { id: "consumer", label: "사용자", description: "내 이사와 견적 확인", href: "/?role=consumer", icon: UserRound },
  { id: "provider", label: "업체", description: "견적 제안과 배차 관리", href: "/provider", icon: Building2 },
  { id: "crew", label: "작업자", description: "오늘 작업범위와 현장 기록", href: "/crew", icon: HardHat },
] as const;

type RoleId = (typeof roles)[number]["id"];

export function RoleEntry() {
  const [selected, setSelected] = useState<RoleId>("consumer");
  const role = roles.find((item) => item.id === selected) ?? roles[0];

  return (
    <MobileFrame className="flex min-h-dvh flex-col bg-canvas">
      <StatusBar />
      <main className="flex-1 px-6 pb-8 pt-9">
        <p className="text-[15px] font-extrabold tracking-[-0.4px] text-ink-900">SEQRET</p>
        <h1 className="mt-8 whitespace-nowrap text-[22px] leading-[30px] font-extrabold tracking-[-0.5px]">
          어떤 역할로 로그인할까요?
        </h1>
        <p className="mt-2 text-[13px] leading-[19px] text-ink-600">선택한 역할의 작업 화면으로 이동해요.</p>

        <div aria-label="로그인 역할" className="mt-8 grid gap-3" role="group">
          {roles.map((item) => {
            const active = item.id === selected;
            const Icon = item.icon;
            return (
              <button
                aria-pressed={active}
                className={`flex min-h-[88px] w-full items-center rounded-2xl border px-5 text-left ${
                  active ? "border-primary-400 bg-primary-50" : "border-line bg-white"
                }`}
                key={item.id}
                onClick={() => setSelected(item.id)}
                type="button"
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${active ? "bg-white text-primary-700" : "bg-canvas text-ink-600"}`}>
                  <Icon aria-hidden="true" className="size-6" strokeWidth={2} />
                </span>
                <span className="ml-4 min-w-0 flex-1">
                  <span className="block text-[17px] leading-6 font-bold">{item.label}</span>
                  <span className="mt-1 block whitespace-nowrap text-[12px] leading-4 text-ink-600">{item.description}</span>
                </span>
                <span className={`grid size-7 shrink-0 place-items-center rounded-full ${active ? "bg-primary-600 text-white" : "border border-line text-transparent"}`}>
                  <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />
                </span>
              </button>
            );
          })}
        </div>
      </main>

      <div className="border-t border-line bg-white px-6 pb-4 pt-4">
        <Button className="w-full" onClick={() => window.location.assign(role.href)} size="cta">
          {role.label}로 로그인
        </Button>
        <p className="mt-3 text-center text-[12px] leading-4 text-ink-400">역할은 다음 로그인에서 다시 선택할 수 있어요.</p>
        <div className="home-indicator" />
      </div>
    </MobileFrame>
  );
}
