import {
  InfoIcon as Info,
  QuestionIcon as Question,
  ShieldCheckIcon as ShieldCheck,
  SignOutIcon as LogOut,
} from "@phosphor-icons/react";
import { useState } from "react";

import { ListGroup, ListRow } from "@/components/layout/app-primitives";
import { Button } from "@/components/ui/button";
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

type Panel = "access" | "privacy" | "help";

const expiryFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function ProfileIcon() {
  return <svg aria-hidden="true" className="size-16 text-primary-600" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a95.76,95.76,0,0,1-31.8,71.37A72,72,0,0,0,128,160a40,40,0,1,0-40-40,40,40,0,0,0,40,40,72,72,0,0,0-64.2,39.37h0A96,96,0,1,1,224,128Z" opacity="0.2" /><path d="M128,28A100,100,0,1,0,228,128,100.11,100.11,0,0,0,128,28ZM68.87,198.42a68,68,0,0,1,118.26,0,91.8,91.8,0,0,1-118.26,0Zm124.3-5.55a75.61,75.61,0,0,0-44.51-34,44,44,0,1,0-41.32,0,75.61,75.61,0,0,0-44.51,34,92,92,0,1,1,130.34,0ZM128,156a36,36,0,1,1,36-36A36,36,0,0,1,128,156Z" /></svg>;
}

export function ConnectedProfile({
  connected = true,
  displayName,
  expiresAt,
  onDisconnect,
  permissions,
  roleLabel,
}: {
  connected?: boolean;
  displayName: string;
  expiresAt?: string;
  onDisconnect: () => void;
  permissions?: string[];
  roleLabel: string;
}) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const expires = expiresAt ? expiryFormatter.format(new Date(expiresAt)) : "서버 확인 필요";
  const isCrew = roleLabel === "현장기사";
  const accessDescription = connected ? isCrew ? "최신 승인본과 허용된 현장 작업만 볼 수 있어요." : "현재 역할에 허용된 작업 정보만 볼 수 있어요." : "새 이사를 만들거나 이사 연결 코드로 기존 이사를 불러오면 연결돼요.";

  return (
    <div className="mobile-screen flex min-h-dvh flex-col" style={{ padding: 0 }}>
    <section className="bg-surface px-[var(--content-gutter)] pb-4">
        <header className="app-safe-header mt-3 flex min-h-[calc(var(--header-height)+var(--space-md))] flex-col items-center justify-center gap-0.5 pt-2">
          <ProfileIcon />
          <h2 className="text-ui-component">{displayName.endsWith("님") ? displayName : `${displayName}님`}</h2>
        </header>

      <section aria-label="현재 접근 상태" className="ui-card ui-card-outlined ui-card-tinted mt-3 p-4">
          <strong className="block text-ui-component">{connected ? `${roleLabel} 권한으로 연결됨` : "아직 연결된 이사가 없어요"}</strong>
          <p className="mt-1 text-sm leading-5 text-ink-600">{accessDescription}</p>
          {connected ? <div className="mt-4 flex items-center justify-between border-t border-primary-100 pt-3 text-sm">
            <span className="text-ink-600">접근 만료</span>
            <span className="text-ui-data tabular-nums">{expires}</span>
          </div> : null}
        </section>
      </section>

      <div aria-hidden="true" className="h-2 shrink-0 bg-canvas" />

    <section className="flex flex-1 flex-col bg-surface px-[var(--content-gutter)] pt-5" style={{ paddingBottom: "calc(var(--bottom-rail-height) + var(--space-xl))" }}>
        <section aria-labelledby="profile-menu-title">
          <h3 className="text-ui-component" id="profile-menu-title">설정과 안내</h3>
          <ListGroup className="ui-card-outlined" label="설정과 안내">
            <ListRow className="min-h-14 py-2" leading={<ShieldCheck aria-hidden="true" className="size-6 text-primary-700" />} onClick={() => setPanel("access")}>내 접근 권한</ListRow>
            <ListRow className="min-h-14 py-2" leading={<Info aria-hidden="true" className="size-6 text-primary-700" />} onClick={() => setPanel("privacy")}>촬영·개인정보 안내</ListRow>
            <ListRow className="min-h-14 py-2" leading={<Question aria-hidden="true" className="size-6 text-primary-700" />} onClick={() => setPanel("help")}>{roleLabel} 도움말</ListRow>
          </ListGroup>
        </section>

      <Sheet onOpenChange={(open) => !open && setPanel(null)} open={panel !== null}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{panel === "access" ? "내 접근 권한" : panel === "privacy" ? "촬영·개인정보 안내" : `${roleLabel} 도움말`}</SheetTitle>
            <SheetDescription>{panel === "access" ? connected ? "이사 연결 코드로 연결된 현재 역할과 만료 정보예요." : "아직 서버 작업에 연결되지 않은 시작 상태예요." : panel === "privacy" ? "현장 자료는 작업 확인과 기록을 위해서만 사용해요." : "현재 역할에서 지켜야 할 작업 원칙이에요."}</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-5">
            {panel === "access" ? <dl className="ui-card ui-card-outlined divide-y divide-line px-4"><div className="flex min-h-14 items-center justify-between gap-4"><dt className="text-ink-600">현재 역할</dt><dd className="text-ui-data">{roleLabel}</dd></div><div className="flex min-h-14 items-center justify-between gap-4"><dt className="text-ink-600">접근 상태</dt><dd className={`text-ui-data ${connected ? "text-success-ink" : "text-ink-600"}`}>{connected ? "연결됨" : "연결 전"}</dd></div>{connected ? <><div className="flex min-h-14 items-center justify-between gap-4"><dt className="text-ink-600">접근 만료</dt><dd className="text-ui-data text-right tabular-nums">{expires}</dd></div><div className="flex min-h-14 items-center justify-between gap-4"><dt className="text-ink-600">서버 권한</dt><dd className="text-ui-data">{permissions?.length ? "확인 완료" : "확인 필요"}</dd></div></> : null}</dl> : null}
            {panel === "privacy" ? <><PolicyCard title="촬영 자료">짐 검수, 현장 차이 증거와 완료 기록에만 사용합니다.</PolicyCard><PolicyCard title="접근 제한">현재 작업에 참여하고 허용된 역할만 비공개 자료를 볼 수 있습니다.</PolicyCard><PolicyCard title="보관 기준">작업 완료 후 서버에 설정된 보관기간에 따라 처리됩니다.</PolicyCard></> : null}
            {panel === "help" ? isCrew ? <><PolicyCard title="작업 전">소비자와 업체가 확인한 최신 승인본을 먼저 확인합니다.</PolicyCard><PolicyCard title="현장이 다를 때">추가 금액을 확정하지 말고 사진과 설명을 남겨 업체에 보고합니다.</PolicyCard><PolicyCard title="작업 완료">체크리스트와 완료 사진을 확인한 뒤 완료 기록을 제출합니다.</PolicyCard></> : <><PolicyCard title="현재 버전 확인">범위나 금액이 바뀌면 새 버전을 다시 확인합니다.</PolicyCard><PolicyCard title="응답 기록">확인, 수정 요청과 변경 응답은 역할과 시각이 기록됩니다.</PolicyCard></> : null}
          </div>
          <SheetFooter className="border-t-0"><SheetClose render={<Button className="w-full" />}>확인</SheetClose></SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger render={<Button className="mt-7 w-full" size="cta" variant="outline" />}>
          <LogOut aria-hidden="true" className="size-5" /> 이 기기에서 연결 해제
        </SheetTrigger>
        <SheetContent showClose={false}>
          <SheetHeader>
            <SheetTitle>이 기기에서 연결을 해제할까요?</SheetTitle>
            <SheetDescription>{connected ? "현재 기기의 연결만 지워집니다. 이사 연결 코드로 다시 들어올 수 있어요." : "현재 기기에 입력한 이름과 시작 상태가 지워집니다."}</SheetDescription>
          </SheetHeader>
          <SheetFooter className="grid grid-cols-2 gap-2">
            <SheetClose render={<Button variant="secondary" />}>계속 사용</SheetClose>
            <Button onClick={onDisconnect} variant="destructive">연결 해제</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      </section>
    </div>
  );
}

function PolicyCard({ children, title }: { children: string; title: string }) {
  return <section className="ui-card ui-card-outlined p-4"><h3 className="text-ui-component">{title}</h3><p className="mt-1 text-ui-support text-ink-600">{children}</p></section>;
}
