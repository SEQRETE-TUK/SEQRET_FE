import {
  SignOutIcon as LogOut,
} from "@phosphor-icons/react";
import {
  SecurityStatusIcon as ShieldCheck,
} from "@/components/icons";

import { Button } from "@/components/ui/button";
import { InfoCallout, ListGroup, ListRow, PageIntro, SectionHeader, StatusTag } from "@/components/layout/app-primitives";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function ConnectedProfile({
  detail,
  displayName,
  onDisconnect,
  roleLabel,
}: {
  detail: string;
  displayName: string;
  onDisconnect: () => void;
  roleLabel: string;
}) {
  const menus = ["연결된 이사 정보", "변경·확인 기록", "보안 및 접근 정보"];
  return (
    <div className="mobile-screen">
      <PageIntro eyebrow={<span className="inline-flex items-center gap-2">{roleLabel}<StatusTag tone="success">연결됨</StatusTag></span>} title={displayName} description={detail} />

      <section className="mt-7" aria-labelledby="connection-menu-title">
        <SectionHeader><span id="connection-menu-title">계정과 기록</span></SectionHeader>
        <ListGroup variant="plain">
          {menus.map((menu) => (
            <ListRow key={menu} onClick={() => undefined}>{menu}</ListRow>
          ))}
        </ListGroup>
      </section>

      <InfoCallout icon={<ShieldCheck aria-hidden="true" size={18} weight="fill" />}>접근 정보는 이 기기에만 유지됩니다. 연결을 종료하면 새 보안코드가 필요할 수 있어요.</InfoCallout>

      <Sheet>
        <SheetTrigger className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-input)] border border-line bg-surface px-5 text-[15px] font-bold text-danger-ink">
          <LogOut aria-hidden="true" className="size-5" /> 연결 종료
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>연결을 종료할까요?</SheetTitle>
            <SheetDescription>현재 기기에서 접근 정보가 지워집니다. 다시 들어오려면 새 보안코드가 필요할 수 있어요.</SheetDescription>
          </SheetHeader>
          <SheetFooter className="grid grid-cols-2 gap-2">
            <SheetClose render={<Button variant="outline" />}>계속 사용</SheetClose>
            <Button onClick={onDisconnect} variant="destructive">연결 종료</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
