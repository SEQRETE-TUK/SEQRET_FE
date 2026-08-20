import {
  InfoIcon as Info,
  QuestionIcon as Question,
  ShieldCheckIcon as ShieldCheck,
  SignOutIcon as LogOut,
} from "@phosphor-icons/react";
import { useState } from "react";

import { ListGroup, ListRow, PageIntro, SectionHeader } from "@/components/layout/app-primitives";
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

type Panel = "access" | "privacy" | "help" | "service";

const expiryFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

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
    <div className="mobile-screen">
      <PageIntro title={displayName} />

      <section aria-label="현재 접근 상태" className="ui-card ui-card-outlined ui-card-tinted mt-6 p-4">
        <p className="text-ui-control text-primary-700">{connected ? "현재 접근" : "시작 상태"}</p>
        <strong className="mt-1 block text-ui-component">{connected ? `${roleLabel} 권한으로 연결됨` : "아직 연결된 이사가 없어요"}</strong>
        <p className="mt-1 text-sm leading-5 text-ink-600">{accessDescription}</p>
        {connected ? <div className="mt-4 flex items-center justify-between border-t border-primary-100 pt-3 text-sm">
          <span className="text-ink-600">접근 만료</span>
          <span className="text-ui-data tabular-nums">{expires}</span>
        </div> : null}
      </section>

      <section className="mt-7" aria-labelledby="profile-menu-title">
        <SectionHeader><span id="profile-menu-title">설정과 안내</span></SectionHeader>
        <ListGroup label="설정과 안내">
          <ListRow leading={<ShieldCheck aria-hidden="true" className="size-6 text-primary-700" />} onClick={() => setPanel("access")}>내 접근 권한</ListRow>
          <ListRow leading={<Info aria-hidden="true" className="size-6 text-primary-700" />} onClick={() => setPanel("privacy")}>촬영·개인정보 안내</ListRow>
          <ListRow leading={<Question aria-hidden="true" className="size-6 text-primary-700" />} onClick={() => setPanel("help")}>{roleLabel} 도움말</ListRow>
          <ListRow onClick={() => setPanel("service")}>서비스 정보</ListRow>
        </ListGroup>
      </section>

      <Sheet onOpenChange={(open) => !open && setPanel(null)} open={panel !== null}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{panel === "access" ? "내 접근 권한" : panel === "privacy" ? "촬영·개인정보 안내" : panel === "help" ? `${roleLabel} 도움말` : "서비스 정보"}</SheetTitle>
            <SheetDescription>{panel === "access" ? connected ? "이사 연결 코드로 연결된 현재 역할과 만료 정보예요." : "아직 서버 작업에 연결되지 않은 시작 상태예요." : panel === "privacy" ? "현장 자료는 작업 확인과 기록을 위해서만 사용해요." : panel === "help" ? "현재 역할에서 지켜야 할 작업 원칙이에요." : "SEQRET 공동확인 기록의 범위와 의미예요."}</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-5">
            {panel === "access" ? <dl className="ui-card ui-card-outlined divide-y divide-line px-4"><div className="flex min-h-14 items-center justify-between gap-4"><dt className="text-ink-600">현재 역할</dt><dd className="text-ui-data">{roleLabel}</dd></div><div className="flex min-h-14 items-center justify-between gap-4"><dt className="text-ink-600">접근 상태</dt><dd className={`text-ui-data ${connected ? "text-success-ink" : "text-ink-600"}`}>{connected ? "연결됨" : "연결 전"}</dd></div>{connected ? <><div className="flex min-h-14 items-center justify-between gap-4"><dt className="text-ink-600">접근 만료</dt><dd className="text-ui-data text-right tabular-nums">{expires}</dd></div><div className="flex min-h-14 items-center justify-between gap-4"><dt className="text-ink-600">서버 권한</dt><dd className="text-ui-data">{permissions?.length ? "확인 완료" : "확인 필요"}</dd></div></> : null}</dl> : null}
            {panel === "privacy" ? <><PolicyCard title="촬영 자료">짐 검수, 현장 차이 증거와 완료 기록에만 사용합니다.</PolicyCard><PolicyCard title="접근 제한">현재 작업에 참여하고 허용된 역할만 비공개 자료를 볼 수 있습니다.</PolicyCard><PolicyCard title="보관 기준">작업 완료 후 서버에 설정된 보관기간에 따라 처리됩니다.</PolicyCard></> : null}
            {panel === "help" ? isCrew ? <><PolicyCard title="작업 전">소비자와 업체가 확인한 최신 승인본을 먼저 확인합니다.</PolicyCard><PolicyCard title="현장이 다를 때">추가 금액을 확정하지 말고 사진과 설명을 남겨 업체에 보고합니다.</PolicyCard><PolicyCard title="작업 완료">체크리스트와 완료 사진을 확인한 뒤 완료 기록을 제출합니다.</PolicyCard></> : <><PolicyCard title="현재 버전 확인">범위나 금액이 바뀌면 새 버전을 다시 확인합니다.</PolicyCard><PolicyCard title="응답 기록">확인, 수정 요청과 변경 응답은 역할과 시각이 기록됩니다.</PolicyCard></> : null}
            {panel === "service" ? <><PolicyCard title="공동확인 기록">같은 작업 범위와 금액을 확인했다는 거래 기록입니다.</PolicyCard><PolicyCard title="법적 범위">전자계약서, 전자서명, 결제 또는 책임 판정 문서가 아닙니다.</PolicyCard><PolicyCard title="정책 문서">정식 이용약관과 개인정보 처리방침은 운영 정책 확정 후 연결됩니다.</PolicyCard></> : null}
          </div>
          <SheetFooter className="border-t-0"><SheetClose render={<Button className="w-full" />}>확인</SheetClose></SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger render={<Button className="mt-7 w-full" size="cta" variant="destructiveSoft" />}>
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
    </div>
  );
}

function PolicyCard({ children, title }: { children: string; title: string }) {
  return <section className="ui-card ui-card-outlined p-4"><h3 className="text-ui-component">{title}</h3><p className="mt-1 text-ui-support text-ink-600">{children}</p></section>;
}
