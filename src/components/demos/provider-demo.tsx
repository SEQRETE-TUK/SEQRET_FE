"use client";

import Link from "@/components/native-link";
import Image from "@/components/native-image";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Home,
  LoaderCircle,
  Play,
  Plus,
  Send,
  ShieldCheck,
  Truck,
  Users,
  Video,
  X,
} from "lucide-react";
import { MobileFrame, StatusBar } from "@/components/demo-ui";
import { DemoFeedbackProvider, useDemoFeedback } from "@/components/demos/demo-feedback";
import { DemoLinkState } from "@/components/demos/demo-link-state";
import { useDemoQuery } from "@/components/demos/use-demo-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const ink = "text-ink-900";
const muted = "text-ink-400";
const baseQuote = 1_160_000;
const quoteItems = [
  { id: "piano", label: "피아노 전문 인력 1명", detail: "3층 계단 하차 · 근거 영상 0:12", amount: 120_000 },
  { id: "ladder", label: "사다리차 예약", detail: "도착지 계단 운반 대체", amount: 150_000 },
  { id: "appliance", label: "가전 분해·설치", detail: "세탁기·냉장고 분리 작업", amount: 80_000 },
  { id: "packing", label: "포장 자재 추가", detail: "완충재·박스 보강", amount: 40_000 },
] as const;

type QuoteItemId = (typeof quoteItems)[number]["id"];

function MobileHeader({
  title,
  onBack,
  trailing,
}: {
  title: string;
  onBack?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <header className="flex h-14 items-center px-5">
      {onBack && (
        <button aria-label="이전 화면" className="-ml-2 grid size-11 place-items-center" onClick={onBack} type="button">
          <ArrowLeft size={20} />
        </button>
      )}
      <p className={`flex-1 text-center text-[17px] font-bold ${ink}`}>{title}</p>
      <div className="min-w-11 text-right">{trailing}</div>
    </header>
  );
}

function MobileBottom({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <footer className="mt-auto border-t border-line bg-white px-5 pb-6 pt-4">
      {children}
      {sub && <div className={`mt-3 text-center text-xs font-medium ${muted}`}>{sub}</div>}
    </footer>
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex justify-center gap-1.5 py-2" aria-label={`업체 화면 ${current + 1}/6`}>
      {Array.from({ length: 6 }, (_, i) => <span className={`h-1.5 rounded-full ${i === current ? "w-5 bg-primary-600" : "w-1.5 bg-[#D8DAE4]"}`} key={i} />)}
    </div>
  );
}

function Invite({ next, jump }: { next: () => void; jump: (screen: number) => void }) {
  const [declined, setDeclined] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const notify = useDemoFeedback();
  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]">
      <main className="px-5 pt-3">
        <div className="flex items-center gap-3">
          <strong className="text-2xl font-black tracking-[-1px] text-primary-600">SEQRET</strong>
          <Badge variant="primary">업체용</Badge>
        </div>
        <h1 className={`mt-6 text-[22px] font-extrabold leading-[30px] tracking-[-0.5px] ${ink}`}>조건이 맞는 이사 건이<br />도착했어요</h1>
        <p className={`mt-1 text-[13px] ${muted}`}>AI가 정리한 짐 목록을 보고 견적을 신청할 수 있어요</p>

        <Card className="mt-4 p-5">
          <div className="flex items-center justify-between text-xs"><b className={ink}>9월 12일 (토) 오전 8시</b><Badge variant="primary">D-30</Badge></div>
          <h2 className={`mt-2 text-xl font-extrabold ${ink}`}>마포 성산동 → 성동 행당동</h2>
          <p className={`mt-1 text-[13px] ${muted}`}>12층 엘리베이터 · 3층 계단 · 사다리차 미정</p>
          <div className="my-4 h-px bg-line" />
          {[['짐 목록','21개 확정 · 영상 3구역'],['특이사항','업라이트 피아노'],['고객 상태','짐 목록 확정 완료']].map(([k,v]) => (
            <div className="mt-2 flex justify-between text-[13px]" key={k}><span className={muted}>{k}</span><b className={ink}>{v}</b></div>
          ))}
        </Card>

        <h2 className={`mb-2 mt-6 text-[17px] font-bold ${ink}`}>견적을 신청하면 이렇게 진행돼요</h2>
        <Card className="p-4">
          {['영상·짐 목록 검토 후 견적 제안','고객과 같은 카드로 공동확인','당일 변경도 기록으로 안전하게'].map((item, i) => (
            <div className="flex min-h-12 items-center gap-3" key={item}><span className="grid size-7 place-items-center rounded-full bg-primary-50 text-xs font-bold text-primary-600">{i + 1}</span><b className={`text-[13px] ${ink}`}>{item}</b></div>
          ))}
        </Card>
        <button className="mt-4 w-full rounded-xl bg-primary-50 px-4 py-3 text-left text-xs font-bold text-primary-600" onClick={() => jump(3)} type="button">고객에게 선택됐나요? 배차·인력으로 이동 <ChevronRight className="float-right" size={16} /></button>
      </main>
      <MobileBottom sub={<button className="inline-flex min-h-11 items-center" onClick={() => { setDeclined(true); notify("이 매칭 건을 목록에서 숨겼어요."); }} type="button">{declined ? "숨김 · 다시 검토하기" : "이 건은 맡지 않을래요"}</button>}>
        <Button className="w-full" disabled={accepting} onClick={() => { if (accepting) return; setAccepting(true); setDeclined(false); window.setTimeout(next, 450); }} size="cta">{accepting ? <><LoaderCircle className="demo-spin" size={18} /> 검토 준비 중...</> : "견적 검토 시작"}</Button>
      </MobileBottom>
    </div>
  );
}

function Quote({ next, back, itemIds, setItemIds }: { next: () => void; back: () => void; itemIds: QuoteItemId[]; setItemIds: (ids: QuoteItemId[]) => void }) {
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const notify = useDemoFeedback();
  const selectedItems = quoteItems.filter((item) => itemIds.includes(item.id));
  const included = itemIds.includes("piano");
  const total = baseQuote + selectedItems.reduce((sum, item) => sum + item.amount, 0);
  const toggleItem = (id: QuoteItemId) => setItemIds(itemIds.includes(id) ? itemIds.filter((itemId) => itemId !== id) : [...itemIds, id]);
  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]">
      <MobileHeader onBack={back} title="짐 검토 · 견적" trailing={<Badge variant="primary">한빛이사</Badge>} />
      <main className="px-5">
        <h1 className={`mt-2 text-[22px] font-extrabold leading-[30px] tracking-[-0.5px] ${ink}`}>확인할 건 1가지,<br />나머진 준비됐어요</h1>
        <Card className="mt-3 p-4">
          <Badge variant="warning">확인 필요</Badge>
          <div className="mt-3 flex gap-3">
            <button aria-label="피아노 근거 영상 재생" onClick={() => notify("피아노 근거 영상 0:12를 열었어요.")} className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl" type="button"><Image alt="업라이트 피아노 근거" className="object-cover" fill sizes="112px" src="/upright-piano-evidence.png" /><span className="absolute inset-0 grid place-items-center bg-ink-900/25 text-white"><Play className="fill-current" size={26} /></span></button>
            <div><b className={ink}>업라이트 피아노</b><p className={`mt-1 text-xs ${muted}`}>3층 계단 하차 예상<br />전문 인력 추가가 필요해 보여요</p></div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button onClick={() => !included && toggleItem("piano")} size="chip" variant={included ? "secondary" : "outline"}>인력 +1 반영</Button>
            <Button onClick={() => included && toggleItem("piano")} size="chip" variant={!included ? "secondary" : "outline"}>반영 안 함</Button>
          </div>
        </Card>
        <div className="mt-5 flex items-center justify-between"><h2 className={`text-[17px] font-bold ${ink}`}>견적 구성</h2><span className={`text-[12px] font-bold ${muted}`}>확정 품목 21개 기준</span></div>
        <Card className="mt-2 p-4">
          <div className="flex justify-between text-[13px]"><span className={muted}>기본 견적 · 5톤 1대 · 4명 · 6시간</span><b>{baseQuote.toLocaleString()}</b></div>
          {selectedItems.map((item) => <div className="mt-3 flex min-h-11 items-center gap-2 text-[13px]" key={item.id}><span className={`min-w-0 flex-1 ${muted}`}>{item.label}</span><b>{item.amount.toLocaleString()}</b><button aria-label={`${item.label} 제외`} className="grid size-11 place-items-center text-ink-400" onClick={() => toggleItem(item.id)} type="button"><X size={17} /></button></div>)}
          <Button className="mt-3" onClick={() => setItemsOpen(true)} size="chip" variant="outline"><Plus size={16} /> 항목 선택</Button>
          <div className="my-3 h-px bg-line" />
          <div className="flex items-end justify-between"><b className={ink}>제안 총액</b><strong className="text-[28px] font-extrabold tracking-[-0.5px] text-ink-900">{total.toLocaleString()}원</strong></div>
          <p className={`mt-2 text-xs ${muted}`}>포함 포장·운반·정리 · 제외 폐기물/입주청소</p>
        </Card>
        <div className="mt-5 px-5"><b className={`text-[13px] ${ink}`}>고객에게 보낼 한마디</b><p className={`mt-1 text-[13px] ${muted}`}>피아노 전문 인력이 안전하게 옮겨드릴게요.</p></div>
      </main>
      <MobileBottom>
        <div className="grid grid-cols-[1fr_136px] gap-2"><Button disabled={sending} onClick={() => { if (sending) return; setSending(true); window.setTimeout(next, 350); }} size="cta">{sending ? <><LoaderCircle className="demo-spin" size={18} /> 준비 중...</> : "수정안 검토하기"}</Button><Button className="whitespace-nowrap" disabled={sending} onClick={() => { setSaved(true); notify("견적 초안을 임시 저장했어요."); }} size="cta" variant="outline">{saved ? "저장됨" : "임시 저장"}</Button></div>
      </MobileBottom>
      <Sheet open={itemsOpen} onOpenChange={setItemsOpen}><SheetContent><SheetHeader><SheetTitle>추가 견적 항목 선택</SheetTitle><SheetDescription>필요한 작업을 선택하면 제안 총액에 바로 반영돼요.</SheetDescription></SheetHeader><div className="space-y-2 px-5">{quoteItems.map((item) => { const selected = itemIds.includes(item.id); return <button aria-pressed={selected} className={`flex min-h-[72px] w-full items-center rounded-2xl border p-4 text-left ${selected ? "border-primary-400 bg-primary-50" : "border-line bg-white"}`} key={item.id} onClick={() => toggleItem(item.id)} type="button"><span className={`grid size-7 shrink-0 place-items-center rounded-lg ${selected ? "bg-primary-600 text-white" : "border border-line text-transparent"}`}><Check size={17} /></span><span className="ml-3 min-w-0 flex-1"><b className="block text-[14px]">{item.label}</b><small className={`mt-1 block text-[12px] ${muted}`}>{item.detail}</small></span><b className="ml-2 text-[14px]">+{item.amount.toLocaleString()}</b></button>; })}</div><SheetFooter><Button className="w-full" onClick={() => setItemsOpen(false)} size="cta">선택 항목 반영 · {total.toLocaleString()}원</Button></SheetFooter></SheetContent></Sheet>
    </div>
  );
}

function Revision({ next, back, itemIds }: { next: () => void; back: () => void; itemIds: QuoteItemId[] }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const notify = useDemoFeedback();
  const selectedItems = quoteItems.filter((item) => itemIds.includes(item.id));
  const total = baseQuote + selectedItems.reduce((sum, item) => sum + item.amount, 0);
  const send = () => {
    if (sending || sent) return;
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setSent(true);
      notify("수정안 v3을 박민서 고객에게 보냈어요.");
      window.setTimeout(() => setAccepted(true), 1200);
    }, 550);
  };
  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]">
      <MobileHeader onBack={back} title="수정안 확인" />
      <main className="px-5">
        <h1 className={`mt-2 whitespace-nowrap text-[22px] font-extrabold ${ink}`}>고객에게 보낼 내용을 확인해 주세요</h1>
        <p className={`mt-2 text-[13px] ${muted}`}>새 수정안을 보내면 기존 v2 확인은 종료되고 v3 수락을 기다려요.</p>

        <Card className="mt-5 divide-y divide-line px-4">
          <div className="flex min-h-14 items-center justify-between text-[13px]"><span className={muted}>기본 견적</span><b>{baseQuote.toLocaleString()}원</b></div>
          {selectedItems.map((item) => <div className="flex min-h-14 items-center justify-between gap-3 text-[13px]" key={item.id}><span className="min-w-0 flex-1"><b className="block">{item.label}</b><small className={`mt-1 block ${muted}`}>{item.detail}</small></span><b className="text-danger-ink">+{item.amount.toLocaleString()}원</b></div>)}
        </Card>

        <Card className="mt-4 p-5">
          <div className="flex items-end justify-between"><span className={`text-[13px] ${muted}`}>기존 v2 · {baseQuote.toLocaleString()}원</span><span className="text-[12px] font-bold text-danger-ink">+{(total - baseQuote).toLocaleString()}원</span></div>
          <div className="mt-2 flex items-end justify-between"><b>새 제안 v3</b><strong className="text-[28px] font-extrabold">{total.toLocaleString()}원</strong></div>
        </Card>

        <label className={`mt-5 block text-[15px] font-bold ${ink}`}>고객에게 보일 변경 사유<textarea className="mt-2 h-24 w-full resize-none rounded-2xl border border-line bg-white p-4 text-[13px] font-medium outline-none" defaultValue="전문 작업자와 사다리차를 추가해 안전하게 운반합니다." /></label>

        {sent && <div className={`demo-pop mt-4 rounded-2xl p-4 ${accepted ? "bg-success-bg" : "bg-warning-bg"}`}><p className={`text-[13px] font-bold ${accepted ? "text-success-ink" : "text-warning-ink"}`}>{accepted ? "박민서 고객이 v3을 수락했어요" : "수정안 v3을 보냈어요 · 고객 수락 대기"}</p><p className={`mt-1 text-xs ${muted}`}>{accepted ? "이 견적으로 배차와 작업자를 등록할 수 있어요." : "고객 화면에도 같은 항목과 총액이 표시돼요."}</p></div>}
      </main>
      <MobileBottom sub={sent ? <button className="inline-flex min-h-11 items-center" onClick={back} type="button">견적 구성으로 돌아가기</button> : "전송 전에는 견적 구성을 다시 수정할 수 있어요"}>
        {!sent ? <Button className="w-full" disabled={sending} onClick={send} size="cta">{sending ? <><LoaderCircle className="demo-spin" size={18} /> 전송 중...</> : <><Send size={18} /> 고객에게 수정안 보내기</>}</Button> : <Button className="w-full" disabled={!accepted} onClick={next} size="cta">{accepted ? "배차·인력 등록하기" : "박민서 고객 수락 대기"}</Button>}
      </MobileBottom>
    </div>
  );
}

const crew = [['김도윤 · 팀장','피아노 · 가구조립'],['최민석','피아노 · 중량물'],['박진호','가구조립'],['이현수','포장 · 운반']];

function Assignment({ next, back, demoState = "" }: { next: () => void; back: () => void; demoState?: string }) {
  const [sent, setSent] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const notify = useDemoFeedback();
  const conflictLabel = demoState === "vehicle-conflict" ? "VEHICLE_SCHEDULE · 선택 차량이 다른 작업과 겹쳐요" : demoState === "worker-conflict" ? "WORKER_SCHEDULE · 김도윤 팀장 일정이 겹쳐요" : demoState === "cert-missing" ? "CERT_EXPIRED · 피아노 작업 자격 확인이 필요해요" : "";
  const conflict = Boolean(conflictLabel);
  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]">
      <MobileHeader onBack={back} title="배차 · 인력" trailing={<Badge variant="warning">피아노 포함</Badge>} />
      <main className="px-5">
        <h1 className={`mt-2 text-[22px] font-extrabold ${ink}`}>{conflict ? "확인할 배차 문제가 있어요" : "팀 구성이 끝났어요"}</h1><p className={`mt-1 text-xs ${muted}`}>확정 범위 v3 · 일정·용량·자격·근무시간 7종 검사</p>
        <div className={`mt-4 flex items-center gap-4 rounded-3xl p-4 ${conflict ? "border border-warning bg-warning-bg" : "bg-success-bg"}`}><span className={`grid size-9 place-items-center rounded-full text-white ${conflict ? "bg-warning" : "bg-success"}`}>{conflict ? <AlertTriangle size={20} /> : <Check size={20} />}</span><div><b className={ink}>{conflict ? "충돌 해결 필요" : "충돌 없음 · 배정 가능"}</b><p className={`text-xs ${conflict ? "text-warning-ink" : muted}`}>{conflict ? conflictLabel : "일정·용량·자격·근무시간 7종 검사 통과"}</p></div></div>
        <h2 className={`mb-2 mt-5 text-[15px] font-bold ${ink}`}>차량</h2><Card className="border-primary-400 p-4"><div className="flex items-center gap-3"><Truck className="text-primary-600" /><div className="flex-1"><b className={ink}>5톤 리프트 · 12가3456</b><p className={`text-xs ${muted}`}>적재함 28㎡ ≥ 필요 24㎡</p></div><Badge variant="primary">선택</Badge></div></Card>
        <div className="mt-5 flex items-center justify-between"><h2 className={`text-[15px] font-bold ${ink}`}>작업자 4명</h2><Badge variant="success">필수 역량 충족</Badge></div>
        <Card className="mt-2 divide-y divide-line px-4">
          {crew.map(([name], i) => <div className="flex h-12 items-center gap-3" key={name}><span className="grid size-8 place-items-center rounded-full bg-primary-50 text-xs font-bold text-primary-600">{name[0]}</span><b className={`flex-1 text-[13px] ${ink}`}>{name}</b>{i < 2 && <Badge variant="warning">피아노 자격</Badge>}<span className="text-xs font-bold text-success-ink">배정됨</span></div>)}
        </Card>
          {sent && <div className="demo-pop mt-4 rounded-2xl bg-success-bg p-4"><p className="text-center text-xs font-bold text-success-ink">작업자 4명에게 전용 링크를 보냈어요.</p></div>}
      </main>
      <MobileBottom sub={<button className="inline-flex min-h-11 items-center" onClick={() => { setSent(false); notify("배정을 다시 편집할 수 있게 열었어요."); }} type="button">인원 바꾸기</button>}><Button className="w-full" disabled={conflict || assigning} onClick={() => { if (sent) { next(); return; } if (assigning) return; setAssigning(true); window.setTimeout(() => { setAssigning(false); setSent(true); notify("배정을 확정하고 작업자 전용 링크를 발송했어요."); }, 500); }} size="cta">{conflict ? "충돌을 먼저 해결해 주세요" : assigning ? <><LoaderCircle className="demo-spin" size={18} /> 배정 확정 중...</> : sent ? "당일 현황으로 이동" : "배정 확정 · 링크 발송"}</Button></MobileBottom>
    </div>
  );
}

function Operation({ next, back, demoState = "" }: { next: () => void; back: () => void; demoState?: string }) {
  const [issueOpen, setIssueOpen] = useState(demoState.startsWith("field-issue"));
  const [delta, setDelta] = useState("150000");
  const [proposalSent, setProposalSent] = useState(false);
  const [issueApproved, setIssueApproved] = useState(demoState === "field-issue-processed");
  const [proposalSending, setProposalSending] = useState(false);
  const [evidenceRetried, setEvidenceRetried] = useState(false);
  const [pauseResolved, setPauseResolved] = useState(false);
  const notify = useDemoFeedback();
  const projected = 1_280_000 + Number(delta || 0);
  const issueProcessed = demoState === "field-issue-processed";
  const issueConflict = demoState === "field-issue-conflict";
  const issueStale = demoState === "field-issue-stale";
  const evidenceFailed = demoState === "field-issue-evidence-error" && !evidenceRetried;
  const workPaused = demoState === "field-issue-paused";
  const issueBlocked = issueProcessed || issueConflict || issueStale || evidenceFailed;
  const issueBlockLabel = issueProcessed ? "이미 처리된 이슈예요" : issueConflict ? "다른 담당자가 먼저 제안했어요" : issueStale ? "최신 승인본을 다시 불러와 주세요" : evidenceFailed ? "증빙을 다시 불러와 주세요" : "";
  useEffect(() => {
    if (!demoState.startsWith("field-issue")) return;
    const timer = window.setTimeout(() => setIssueOpen(true), 0);
    return () => window.clearTimeout(timer);
  }, [demoState]);
  if (demoState === "job-terminated" || demoState === "job-cancelled") {
    const cancelled = demoState === "job-cancelled";
    return (
      <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]"><MobileHeader onBack={back} title="오늘 · 박민서 고객" trailing={<Badge variant="danger">{cancelled ? "작업 취소" : "작업 종료"}</Badge>} /><main className="px-5"><div className="demo-pop mt-2 rounded-2xl border border-danger bg-danger-bg p-5"><AlertTriangle className="text-danger-ink" size={26} /><h1 className={`mt-4 text-[21px] font-extrabold ${ink}`}>{cancelled ? "이 작업은 취소됐어요" : "이 작업은 종료됐어요"}</h1><p className={`mt-2 text-[13px] leading-5 ${muted}`}>{cancelled ? "이사 작업 자체가 취소되어 배차·현장 변경·완료 기록을 더 진행할 수 없어요. 기존 기록은 삭제하지 않고 취소 상태와 함께 보존해요." : "외부 협의 후 작업 종료가 기록되어 신규 변경요청, 추가 작업 진행, 완료 기록 준비를 더 이상 할 수 없어요."}</p><p className="mt-3 text-xs font-bold text-[#B4232C]">{cancelled ? "CANCELLED · 07:12" : "TERMINATED · 11:18"}</p></div><Card className="mt-4 p-4"><div className="flex justify-between text-[13px]"><span className={muted}>마지막 범위</span><b>v3 · 1,280,000원</b></div><div className="mt-3 flex justify-between text-[13px]"><span className={muted}>후속 작업</span><b>{cancelled ? "배차·작업 시작 차단" : "CR-01 · 종료 처리"}</b></div><p className={`mt-4 text-xs ${muted}`}>기존 승인·변경·감사 기록은 그대로 보존돼요.</p></Card></main><MobileBottom><Button className="w-full" disabled>{cancelled ? "취소된 작업 · 진행 불가" : "종료된 작업 · 추가 처리 불가"}</Button></MobileBottom></div>
    );
  }
  if (demoState === "job-paused" && !pauseResolved) {
    return (
      <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]"><MobileHeader onBack={back} title="오늘 · 박민서 고객" trailing={<Badge variant="warning">일시 중지</Badge>} /><main className="px-5"><div className="demo-pop mt-2 rounded-2xl border border-warning bg-warning-bg p-5"><Clock3 className="text-warning" size={26} /><h1 className={`mt-4 text-[21px] font-extrabold ${ink}`}>작업이 일시 중지됐어요</h1><p className={`mt-2 text-[13px] leading-5 ${muted}`}>거절된 현장 변경과 안전 확인이 필요해 승인 범위 밖 작업을 멈춘 상태예요. 서비스 밖 협의가 끝난 뒤 재개 상태를 기록할 수 있어요.</p></div><Card className="mt-4 p-4"><div className="flex justify-between text-[13px]"><span className={muted}>유효한 승인본</span><b>v3 · 유지</b></div><div className="mt-3 flex justify-between text-[13px]"><span className={muted}>현재 총액</span><b>1,280,000원</b></div><div className="mt-3 flex justify-between text-[13px]"><span className={muted}>중지 사유</span><b>CR-01 거절 · 안전 협의</b></div></Card><p className={`mt-4 rounded-xl bg-primary-50 px-4 py-3 text-xs ${muted}`}>재개해도 거절된 변경 금액을 승인으로 소급 기록하지 않아요.</p></main><MobileBottom><Button className="w-full" onClick={() => { setPauseResolved(true); notify("외부 협의 후 작업 재개를 11:22로 기록했어요. 기존 승인본 v3은 그대로 유지돼요."); }} size="cta">외부 협의 후 작업 재개</Button></MobileBottom></div>
    );
  }
  const flow = [
    ["08:02", "체크인 · 안전확인 3종", "done"],
    ["09:40", "상차 완료 · 사진 6장", "done"],
    issueApproved ? ["11:02", "고객 승인 · v4 확정", "done"] : proposalSent ? ["10:57", "변경안 v4 · 고객 수락 대기", "wait"] : ["10:55", "사다리차 요청 · 확인 필요", "wait"],
    ["다음", "도착지 하차", "next"],
    ["다음", "완료 기록", "next"],
  ];
  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]">
      <MobileHeader onBack={back} title="오늘 · 박민서 고객" trailing={<Badge variant="success">진행 중</Badge>} />
      <main className="px-5">
        <section className="border-b border-line pb-5 pt-2"><div className="flex items-center justify-between"><b className="text-[12px] text-success-ink">08:02 체크인 · 안전확인 통과</b><button className="min-h-11 px-2 text-[13px] font-bold text-ink-600" onClick={() => notify("김도윤 팀장에게 전화 연결을 요청했어요.")} type="button">팀장에게 전화</button></div><h1 className={`mt-1 text-[24px] font-extrabold ${ink}`}>출발지 상차 중</h1><p className={`mt-2 text-[13px] ${muted}`}>김도윤 팀 · 작업자 4명</p><p className={`mt-1 text-[13px] ${muted}`}>양측 수락 견적 v3 · 1,280,000원</p></section>

        {!issueApproved && <Card className="mt-5 p-5"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning-bg text-warning-ink"><Clock3 size={21} /></span><div className="min-w-0 flex-1"><p className="text-[12px] font-bold text-warning-ink">{proposalSent ? "고객 수락 대기" : "지금 확인할 현장 요청"}</p><h2 className={`mt-1 text-[18px] font-extrabold ${ink}`}>사다리차가 필요해요</h2><p className={`mt-1 text-[12px] ${muted}`}>도착지 엘리베이터 고장 · 증빙 2건</p></div></div>{proposalSent && <p className="mt-4 border-t border-line pt-4 text-[13px] font-bold text-warning-ink">변경안 v4을 보냈어요. 박민서 고객의 수락을 기다려요.</p>}</Card>}
        {issueApproved && <div className="demo-pop mt-5 rounded-2xl bg-success-bg p-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-success text-white"><Check size={20} /></span><div><b className="text-[15px] text-success-ink">사다리차 변경 승인 완료</b><p className={`mt-1 text-[12px] ${muted}`}>v4 · 최종 1,430,000원</p></div></div></div>}

        <h2 className={`mb-2 mt-6 text-[17px] font-bold ${ink}`}>오늘 진행 기록</h2>
        <ol className="overflow-hidden rounded-2xl border border-line bg-white px-4">{flow.map(([time, label, state]) => <li className="flex min-h-14 items-center gap-3 border-b border-line last:border-b-0" key={`${time}-${label}`}><span className={`grid size-7 shrink-0 place-items-center rounded-full ${state === "done" ? "bg-success-bg text-success-ink" : state === "wait" ? "bg-warning-bg text-warning-ink" : "bg-canvas text-ink-400"}`}>{state === "done" ? <Check size={16} /> : <Clock3 size={15} />}</span><span className={`w-11 text-[12px] font-bold ${state === "next" ? muted : ink}`}>{time}</span><b className={`min-w-0 flex-1 text-[13px] ${state === "next" ? muted : ink}`}>{label}</b></li>)}</ol>
      </main>
      <MobileBottom sub={<button className="inline-flex min-h-11 items-center" onClick={() => notify("작업자 4명 모두 체크인했고 김도윤 기사가 현장 요청을 보고했어요.")} type="button">작업자 4명 현황</button>}>{issueApproved ? <Button className="w-full" onClick={next} size="cta">완료 기록 준비</Button> : proposalSent ? <Button className="w-full" disabled size="cta">박민서 고객 수락 대기</Button> : <Button className="w-full" onClick={() => setIssueOpen(true)} size="cta">사다리차 견적 검토</Button>}</MobileBottom>
      <Sheet open={issueOpen} onOpenChange={setIssueOpen}><SheetContent><SheetHeader><SheetTitle>현장 이슈 견적</SheetTitle><SheetDescription>기사 보고는 증빙으로만 사용하고, 금액과 변경 작업은 업체가 확정해 고객에게 보내요.</SheetDescription></SheetHeader><div className="space-y-4 px-5">{workPaused && <div className="rounded-xl bg-danger-bg p-3 text-[12px] font-bold text-danger-ink">작업 일시 중지됨 · 변경안 결정 전 승인 범위 밖 작업은 진행하지 않아요</div>}{(issueProcessed || issueConflict || issueStale) && <div className={`rounded-xl p-3 text-[12px] font-bold ${issueProcessed ? "bg-success-bg text-success-ink" : "bg-warning-bg text-warning-ink"}`}>{issueProcessed ? "FIELD-01은 v4 변경안으로 이미 처리됐어요." : issueConflict ? "다른 업체 담당자가 FIELD-01 제안을 먼저 만들었어요. 중복 제안은 차단됩니다." : "기준 승인본이 v3에서 변경됐어요. 최신 버전을 다시 불러온 뒤 제안해 주세요."}</div>}<Card className="border-warning bg-warning-bg p-4"><Badge variant="warning">FIELD-01 · 10:55</Badge><p className={`mt-2 text-[14px] font-bold ${ink}`}>도착지 엘리베이터 고장 · 사다리차 필요</p><p className={`mt-1 text-xs ${muted}`}>5층 창측 진입 가능 · 기사 증빙 사진 2장</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => notify("고장 엘리베이터 사진을 열었어요.")} className="h-16 rounded-xl bg-white text-xs font-bold">고장 사진</button><button onClick={() => evidenceFailed ? setEvidenceRetried(true) : notify("관리실 안내문 사진을 열었어요.")} className={`h-16 rounded-xl text-xs font-bold ${evidenceFailed ? "border border-warning bg-warning-bg text-warning-ink" : "bg-white"}`}>{evidenceFailed ? "안내문 로드 실패 · 재시도" : "안내문"}</button></div></Card><Card className="p-4"><div className="flex justify-between text-[13px]"><span className={muted}>기준 승인본</span><b>{issueStale ? "v3 · 최신 아님" : "v3 · 1,280,000원"}</b></div><div className="mt-3 flex justify-between text-[13px]"><span className={muted}>추가 작업</span><b>사다리차 하차</b></div></Card><label className={`block text-[13px] font-bold ${ink}`}>증감 금액<input disabled={issueProcessed || issueConflict || issueStale} value={delta} onChange={(event) => setDelta(event.target.value)} type="number" min="0" className="mt-2 h-12 w-full rounded-xl bg-canvas px-4 text-right text-[16px] font-bold outline-none disabled:opacity-50" /></label><label className={`block text-[13px] font-bold ${ink}`}>고객에게 보일 변경 사유<textarea disabled={issueProcessed || issueConflict || issueStale} defaultValue="도착지 엘리베이터 고장으로 계단 운반 대신 사다리차 작업이 필요합니다." className="mt-2 h-20 w-full resize-none rounded-xl bg-canvas p-4 text-[13px] outline-none disabled:opacity-50" /></label><Card className="border-primary-400 bg-primary-50 p-4"><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center"><div><span className={`text-[11px] ${muted}`}>기존 총액</span><b className="block text-[15px]">1,280,000원</b></div><ChevronRight className="text-primary-600" /><div><span className="text-[11px] font-bold text-primary-600">변경 후</span><b className="block text-[18px] text-primary-600">{projected.toLocaleString()}원</b></div></div></Card></div><SheetFooter><Button disabled={!Number(delta) || proposalSending || issueBlocked} className="w-full" onClick={() => { if (proposalSending || issueBlocked) return; setProposalSending(true); window.setTimeout(() => { setProposalSending(false); setProposalSent(true); setIssueOpen(false); notify("변경안 v4 제안을 고객에게 보냈어요."); window.setTimeout(() => setIssueApproved(true), 1200); }, 550); }} size="cta">{proposalSending ? <><LoaderCircle className="demo-spin" size={18} /> 전송 중...</> : issueBlocked ? issueBlockLabel : "변경안 고객에게 보내기"}</Button></SheetFooter></SheetContent></Sheet>
    </div>
  );
}

function Completion({ back, demoState = "" }: { back: () => void; demoState?: string }) {
  const [requested, setRequested] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [docState, setDocState] = useState<"ready" | "preparing" | "failed">(demoState === "docs-failed" ? "failed" : "ready");
  const notify = useDemoFeedback();
  useEffect(() => {
    if (demoState !== "docs-failed") return;
    const timer = window.setTimeout(() => setDocState("failed"), 0);
    return () => window.clearTimeout(timer);
  }, [demoState]);
  const prepareDocuments = () => {
    if (docState === "preparing") return;
    setDocState("preparing");
    window.setTimeout(() => {
      setDocState("ready");
      notify("문서 패키지를 다시 준비했어요.");
    }, 650);
  };
  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]">
      <MobileHeader onBack={back} title="완료 · 정산" trailing={<Badge variant="success">작업 종료</Badge>} />
      <main className="px-5">
        <h1 className={`mt-2 text-[22px] font-extrabold leading-[30px] ${ink}`}>기록까지 마치면<br />이 건은 끝나요</h1>
        <Card className="mt-4 border-primary-400 p-5"><span className={`text-xs ${muted}`}>최종 확정액 (v4 · 승인 변경 포함)</span><strong className={`mt-2 block text-[28px] font-extrabold ${ink}`}>1,430,000원</strong><Badge className="mt-3" variant="success">미승인 추가금 0원 · 분쟁 없음</Badge></Card>
        <div className="mt-5 flex items-center justify-between"><h2 className={`text-[15px] font-bold ${ink}`}>완료 증빙</h2><Badge variant="warning">1구역 대기</Badge></div>
        <div className="mt-2 grid grid-cols-3 gap-2">{[['거실 5장',true],['침실 6장',true],['주방·베란다',false]].map(([label,done]) => <button onClick={() => notify(done ? `${label} 완료 기록을 열었어요.` : `${label} 완료 미디어를 기다리고 있어요.`)} className={`grid h-24 place-items-center rounded-xl border ${done ? 'border-transparent bg-line' : 'border-dashed border-warning bg-warning-bg'}`} key={String(label)} type="button">{done ? <Check className="rounded-full bg-success p-1 text-white" /> : <Video className="text-warning" />}<span className={`-mt-3 text-[11px] font-bold ${done ? ink : 'text-warning-ink'}`}>{label}</span></button>)}</div>
        <h2 className={`mb-2 mt-5 text-[15px] font-bold ${ink}`}>완료 확인</h2><Card className="p-4"><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-success text-white"><Check size={18} /></span><b className={`flex-1 text-[13px] ${ink}`}>한빛이사 (나) · 14:21</b></div><div className="mt-3 flex items-center gap-3"><span className="size-8 rounded-full border border-line" /><b className={`flex-1 text-[13px] ${ink}`}>박민서 고객</b><Badge variant={requested ? 'warning' : 'primary'}>{requested ? '알림 보냄' : '리마인드'}</Badge></div></Card>
        <div className={`mt-5 flex items-center gap-3 rounded-2xl px-5 py-4 ${docState === "failed" ? "bg-warning-bg" : "bg-white"}`}><FileText className={docState === "failed" ? "text-warning" : muted} /><div className="flex-1"><b className={`text-[13px] ${ink}`}>문서 패키지</b><p className={`text-xs ${docState === "failed" ? "text-warning-ink" : muted}`}>{docState === "failed" ? "문서 생성에 실패했어요 · 완료 기록은 정상 보존됨" : docState === "preparing" ? "견적서·변경 기록·완료 기록을 묶는 중..." : "견적서 v3 · 변경 승인 기록 · 완료 확인 기록"}</p></div><Button disabled={docState === "preparing"} onClick={() => docState === "ready" ? notify("현재 확정 버전 기준 PDF를 열었어요.") : prepareDocuments()} size="chip" variant="outline">{docState === "preparing" ? <LoaderCircle className="demo-spin" size={15} /> : docState === "failed" ? <><AlertTriangle size={15} /> 재시도</> : <><Download size={15} /> PDF</>}</Button></div>
          {requested && <div className="demo-pop mt-4 rounded-2xl bg-success-bg p-4"><p className="text-[13px] font-bold text-success-ink">고객 완료 확인 요청 전송 완료</p><p className={`mt-1 text-xs ${muted}`}>고객은 완료 사진·최종 금액·변경 기록을 확인한 뒤 완료 확인 또는 문제 신고를 할 수 있어요.</p></div>}
      </main>
      <MobileBottom sub="고객의 완료 확인은 작업 종료 사실을 기록하는 기능이에요"><Button className="w-full" disabled={requested || requesting} onClick={() => { if (requested || requesting) return; setRequesting(true); window.setTimeout(() => { setRequesting(false); setRequested(true); notify("고객 완료 확인 요청을 보냈어요."); }, 550); }} size="cta">{requesting ? <><LoaderCircle className="demo-spin" size={18} /> 요청 전송 중...</> : requested ? '완료 확인 요청 보냄' : '완료 확인 요청 보내기'}</Button></MobileBottom>
    </div>
  );
}

export function ProviderMobileDemo() {
  const [screen, setScreen] = useState(0);
  const [quoteItemIds, setQuoteItemIds] = useState<QuoteItemId[]>(["piano"]);
  const requestedScreen = useDemoQuery("screen");
  const demoState = useDemoQuery("state");
  useEffect(() => {
    const parsed = Number(requestedScreen);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5) return;
    const timer = window.setTimeout(() => setScreen(parsed), 0);
    return () => window.clearTimeout(timer);
  }, [requestedScreen]);
  const linkState = demoState === "link-expired" || demoState === "link-revoked" || demoState === "link-invalid" ? demoState : null;
  return (
    <DemoFeedbackProvider><MobileFrame><StatusBar />
      {linkState ? <DemoLinkState roleLabel="업체" state={linkState} /> : <div key={screen} className="demo-screen-enter">
        {screen === 0 && <Invite jump={setScreen} next={() => setScreen(1)} />}
        {screen === 1 && <Quote back={() => setScreen(0)} itemIds={quoteItemIds} next={() => setScreen(2)} setItemIds={setQuoteItemIds} />}
        {screen === 2 && <Revision back={() => setScreen(1)} itemIds={quoteItemIds} next={() => setScreen(3)} />}
        {screen === 3 && <Assignment back={() => setScreen(2)} demoState={demoState} next={() => setScreen(4)} />}
        {screen === 4 && <Operation back={() => setScreen(3)} demoState={demoState} next={() => setScreen(5)} />}
        {screen === 5 && <Completion back={() => setScreen(4)} demoState={demoState} />}
        <StepDots current={screen} />
      </div>}
    </MobileFrame></DemoFeedbackProvider>
  );
}

type WebView = "cases" | "quote" | "assign" | "operate";

function WebShell({ view, setView, children }: { view: WebView; setView: (view: WebView) => void; children: ReactNode }) {
  const notify = useDemoFeedback();
  const nav: [WebView, string, ReactNode][] = [
    ["cases", "이사 건 관리", <Home key="home" size={18} />],
    ["quote", "범위 · 견적", <FileText key="quote" size={18} />],
    ["assign", "배차 · 인력", <Users key="assign" size={18} />],
    ["operate", "당일 운영", <Clock3 key="operate" size={18} />],
  ];
  return (
    <div className="min-h-screen bg-canvas text-ink-900">
      <header className="flex h-16 items-center border-b border-line bg-white px-7"><strong className="text-2xl font-black text-primary-800">SEQRET</strong><Badge className="ml-4" variant="primary">파트너 PWA</Badge><button onClick={() => notify("현재 링크 참여자: 한빛이사 · 이상담 관리자")} className={`ml-auto inline-flex min-h-11 items-center px-2 text-[13px] font-bold ${muted}`} type="button">한빛이사 · 이상담 관리자⌄</button></header>
      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="w-[220px] shrink-0 border-r border-line bg-white p-3 max-lg:hidden">{nav.map(([id,label,icon]) => <button className={`mb-1 flex h-11 w-full items-center gap-3 rounded-xl px-4 text-left text-[13px] font-bold ${view === id ? 'bg-primary-50 text-primary-800' : 'text-ink-600'}`} key={id} onClick={() => setView(id)} type="button">{icon}{label}</button>)}</aside>
        <main className="min-w-0 flex-1 p-7 max-md:p-4">
          <div className="mb-4 hidden gap-2 overflow-x-auto max-lg:flex">{nav.map(([id,label]) => <Button key={id} onClick={() => setView(id)} size="chip" variant={view === id ? 'default' : 'outline'}>{label}</Button>)}</div>
          {children}
        </main>
      </div>
    </div>
  );
}

const rows = [
  ['박민서 · 09.12 (토) 08:00','마포 성산동 → 성동 행당동','v3','1,280,000원','작업 중'],
  ['이수진 · 09.14 (월) 09:00','강서 화곡동 → 고양 덕양구','v1','견적 전','검토 대기'],
  ['최영호 · 09.15 (화) 07:30','송파 잠실동 → 성남 분당구','v2','960,000원','고객 확인 대기'],
];

function CasesView({ open }: { open: (view: WebView) => void }) {
  const [filter, setFilter] = useState('전체 12');
  return <><div className="flex items-center"><h1 className="text-[26px] font-extrabold leading-[34px]">이사 건 관리</h1><Button className="ml-auto" onClick={() => open('quote')}><Plus size={18} /> 새 매칭 건 검토</Button></div>
    <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">{[['검토 대기','3건','neutral'],['고객 확인 대기','2건','warning'],['오늘 작업','1건','primary'],['이번 주 완료','7건','success']].map(([label,value,tone]) => <Card className="p-5" key={label}><span className={`text-[13px] ${muted}`}>{label}</span><strong className={`mt-1 block text-2xl ${tone === 'warning' ? 'text-warning' : tone === 'success' ? 'text-success-ink' : tone === 'primary' ? 'text-primary-800' : ink}`}>{value}</strong></Card>)}</div>
    <Card className="mt-5 p-4"><div className="flex gap-2 overflow-x-auto">{['전체 12','검토 대기 3','확인 대기 2','진행 중 1'].map(label => <Button key={label} onClick={() => setFilter(label)} size="chip" variant={filter === label ? 'default' : 'ghost'}>{label}</Button>)}</div></Card>
    <Card className="mt-4 overflow-x-auto rounded-none border-0"><table className="w-full min-w-[760px] text-left text-[13px]"><thead className="bg-[#FAFAFC] text-ink-400"><tr>{['고객 · 이사일','구간','범위 버전','총액','상태','액션'].map(h => <th className="px-5 py-4" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i) => <tr className="border-t border-line" key={row[0]}>{row.map((cell,j) => <td className={`px-5 py-4 ${j === 0 || j === 3 ? 'font-bold' : ''}`} key={cell}>{j === 4 ? <Badge variant={i === 0 ? 'primary' : 'warning'}>{cell}</Badge> : cell}</td>)}<td className="px-5 py-4"><Button onClick={() => open(i === 0 ? 'operate' : 'quote')} size="chip" variant={i === 0 ? 'default' : 'outline'}>{i === 0 ? '운영 보기' : '검토 시작'}</Button></td></tr>)}</tbody></table></Card>
    <div className="mt-5 rounded-2xl bg-primary-50 p-5 text-[13px] text-primary-800"><b>처리할 알림 2건</b><p className={`mt-1 ${muted}`}>박민서 건 변경요청 CR-01 고객 응답 대기 · 이수진 건 새 짐 목록 도착</p></div></>;
}

function QuoteView({ next }: { next: () => void }) {
  const [extra, setExtra] = useState(true);
  const [sending, setSending] = useState(false);
  const notify = useDemoFeedback();
  return <><Badge variant="warning">고객 수락 대기 (v3)</Badge><h1 className="mt-4 text-[26px] font-extrabold leading-[34px]">작업범위 검토 · 견적</h1><p className={`mt-1 text-[13px] ${muted}`}>고객 확정 짐 21개 · 영상 3구역 · AI 초안 v1 기반</p>
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]"><Card className="overflow-hidden"><div className="flex items-center border-b border-line p-4"><b>공간 · 품목</b><Button onClick={() => notify("원본 영상 3개를 새 미디어 뷰어에서 열었어요.")} className="ml-auto" size="chip" variant="secondary"><Video size={16} /> 원본 영상 열기</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-[13px]"><thead className="bg-[#FAFAFC] text-ink-400"><tr>{['품목','수량','작업','AI 신뢰도','상태'].map(h => <th className="px-5 py-3" key={h}>{h}</th>)}</tr></thead><tbody>{[['거실 · 3인 소파','1','일반 운반','93%','확인'],['침실 · 업라이트 피아노','1','전문 운반','95%','인력 추가'],['침실 · 붙박이장?','1','현장 확인','61%','검토 필요'],['주방 · 양문형 냉장고','1','문 분리','98%','확인']].map((r,i) => <tr className="border-t border-line" key={r[0]}>{r.map((c,j) => <td className={`px-5 py-4 ${j === 0 ? 'font-bold' : ''} ${j === 3 ? (i === 0 || i === 3 ? 'text-success-ink' : 'text-warning') : ''}`} key={c}>{j === 4 ? <Badge variant={i === 0 || i === 3 ? 'success' : 'warning'}>{c}</Badge> : c}</td>)}</tr>)}</tbody></table></div><div className="m-5"><b>근거 영상</b><button onClick={() => notify("침실 0:19 근거 영상을 재생했어요.")} className="demo-interactive-card relative mt-3 block h-40 w-full overflow-hidden rounded-xl text-left" type="button"><Image alt="업라이트 피아노 근거 영상" className="object-cover" fill sizes="760px" src="/upright-piano-evidence.png" /><span className="absolute inset-0 bg-ink-900/20" /><span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-lg bg-ink-900/80 px-3 py-2 text-[12px] font-bold text-white"><Play className="fill-current" size={16} /> 침실 0:19 · 피아노</span></button></div></Card>
      <div className="space-y-5"><Card className="border-primary-400 p-5"><h2 className="text-[17px] font-bold">견적 구성</h2><div className="mt-5 flex justify-between text-[13px]"><span>기본 견적</span><b>1,160,000</b></div><button className="mt-4 flex min-h-11 w-full items-center justify-between" onClick={() => setExtra(!extra)} type="button"><span className="text-[13px]">피아노 전문 인력 +1</span><b>{extra ? '120,000' : '제외'}</b></button><button onClick={() => notify("새 견적 라인아이템을 추가했어요.")} className="mt-4 inline-flex min-h-11 items-center text-[13px] font-bold text-primary-800" type="button"><Plus className="inline" size={15} /> 항목 추가</button><div className="my-4 h-px bg-line" /><div className="flex items-end justify-between"><b>제안 총액</b><strong className="text-2xl text-primary-800">{(extra ? 1280000 : 1160000).toLocaleString()}원</strong></div><Button className="mt-6 w-full" disabled={sending} onClick={() => { if (sending) return; setSending(true); window.setTimeout(next, 500); }} size="cta">{sending ? <><LoaderCircle className="demo-spin" size={18} /> 전송 중...</> : "견적 제안 보내기 (v3)"}</Button></Card><Card className="p-5"><h2 className="font-bold">제안 수락 상태</h2><div className="mt-4 flex justify-between text-[13px]"><b>박민서 (고객)</b><Badge>수락 대기</Badge></div><div className="mt-3 flex justify-between text-[13px]"><b>한빛이사</b><Badge variant="success">제안 완료</Badge></div></Card></div></div></>;
}

function FieldIssueView({ demoState = "" }: { demoState?: string }) {
  const [delta, setDelta] = useState("150000");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(demoState === "field-issue-processed");
  const [evidenceFailed, setEvidenceFailed] = useState(demoState === "field-issue-evidence-error");
  const notify = useDemoFeedback();
  const blocked = demoState === "field-issue-conflict" || demoState === "field-issue-stale" || evidenceFailed;
  const total = 1_280_000 + Number(delta || 0);
  const warning = demoState === "field-issue-conflict"
    ? "다른 담당자가 먼저 변경안을 작성 중이에요. 중복 전송은 차단됩니다."
    : demoState === "field-issue-stale"
      ? "기준 승인범위가 변경됐어요. 최신 버전을 확인한 뒤 다시 작성해 주세요."
      : evidenceFailed
        ? "증빙 사진 1장을 불러오지 못했어요. 나머지 입력은 유지됩니다."
        : "현장 이슈 FIELD-01 · 작업 일시 중지 없이 검토할 수 있어요.";

  return <>
    <div className="flex items-start justify-between gap-4">
      <div><Badge variant={sent ? "success" : "warning"}>{sent ? "고객 전송 완료" : "입력 필요"}</Badge><h1 className="mt-3 text-[26px] font-extrabold leading-[34px]">현장 이슈 견적</h1><p className={`mt-1 text-[13px] ${muted}`}>도착지 엘리베이터 고장 · 10:55 · 기준 승인범위 v3</p></div>
      <Link className="rounded-xl border border-line bg-white px-4 py-3 text-[13px] font-bold" href="/crew?screen=3">작업자 보고 보기</Link>
    </div>
    <div className={`mt-5 rounded-xl px-4 py-3 text-[13px] font-bold ${blocked ? "bg-warning-bg text-warning-ink" : sent ? "bg-success-bg text-success-ink" : "bg-primary-50 text-primary-800"}`}>{warning}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
      <div className="space-y-5">
        <Card className="p-5"><div className="flex items-center justify-between"><h2 className="text-[17px] font-bold">현장 증빙 · 기사 설명</h2><Badge variant="warning">FIELD-01</Badge></div><p className="mt-3 text-[14px] font-bold">엘리베이터 고장으로 사다리차 하차가 필요합니다.</p><p className={`mt-1 text-[13px] ${muted}`}>5층 창문 진입 가능 · 김도윤 기사 · 증빙 2건</p><div className="mt-4 grid grid-cols-2 gap-3"><button className="demo-interactive-card relative h-28 overflow-hidden rounded-xl" onClick={() => notify("고장 엘리베이터 사진을 열었어요.")} type="button"><Image alt="고장 엘리베이터" className="object-cover" fill sizes="320px" src="/elevator-outage-evidence.png" /><span className="absolute inset-x-0 bottom-0 bg-ink-900/75 px-3 py-2 text-left text-[12px] font-bold text-white">고장 엘리베이터</span></button><button className={`demo-interactive-card relative h-28 overflow-hidden rounded-xl text-[13px] font-bold ${evidenceFailed ? "bg-danger-bg text-danger-ink" : ""}`} onClick={() => { setEvidenceFailed(false); notify("안내문 증빙을 다시 불러왔어요."); }} type="button">{evidenceFailed ? <span className="absolute inset-0 grid place-items-center"><AlertTriangle size={22} />불러오기 실패 · 재시도</span> : <><Image alt="엘리베이터 고장 안내문" className="object-cover" fill sizes="320px" src="/elevator-outage-evidence.png" style={{ objectPosition: "49% 45%" }} /><span className="absolute inset-x-0 bottom-0 bg-ink-900/75 px-3 py-2 text-left text-[12px] text-white">고장 안내문</span></>}</button></div></Card>
        <Card className="overflow-hidden"><div className="border-b border-line p-5"><h2 className="text-[17px] font-bold">변경 작업</h2></div><div className="grid grid-cols-[1fr_80px_1fr_110px] gap-3 px-5 py-4 text-[12px] text-ink-400"><span>항목</span><span>수량</span><span>작업</span><span>상태</span></div><div className="grid grid-cols-[1fr_80px_1fr_110px] items-center gap-3 border-t border-line px-5 py-4 text-[13px]"><b>사다리차</b><span>1</span><span>하차 추가</span><Badge variant="warning">업체 확정</Badge></div><div className="grid grid-cols-[1fr_80px_1fr_110px] items-center gap-3 border-t border-line px-5 py-4 text-[13px]"><b>확정 범위</b><span>21개</span><span>기존 작업 유지</span><Badge variant="primary">v3 최신</Badge></div></Card>
      </div>
      <div className="space-y-5">
        <Card className="border-primary-400 p-5"><h2 className="text-[17px] font-bold">변경 편집</h2><div className="mt-5 flex justify-between text-[13px]"><span className={muted}>기존 금액</span><b>1,280,000원</b></div><label className="mt-4 block text-[13px] font-bold">증감 금액<input className="mt-2 h-12 w-full rounded-xl bg-canvas px-4 text-right text-[16px] font-bold outline-none" disabled={sent} min="0" onChange={(event) => setDelta(event.target.value)} type="number" value={delta} /></label><label className="mt-4 block text-[13px] font-bold">변경 사유<textarea className="mt-2 h-24 w-full resize-none rounded-xl bg-canvas p-4 text-[13px] outline-none" defaultValue="엘리베이터 고장으로 사다리차 하차 방법이 필요합니다." disabled={sent} /></label><div className="my-5 h-px bg-line" /><div className="flex items-end justify-between"><b>변경 후 총액</b><strong className="text-2xl text-primary-800">{total.toLocaleString()}원</strong></div><Button className="mt-6 w-full" disabled={blocked || sent || sending || !Number(delta)} onClick={() => { setSending(true); window.setTimeout(() => { setSending(false); setSent(true); notify("변경안 v4를 고객에게 보냈어요."); }, 500); }} size="cta">{sending ? <><LoaderCircle className="demo-spin" size={18} /> 전송 중...</> : sent ? "고객 전송 완료" : blocked ? "문제를 먼저 해결해 주세요" : "변경안 고객에게 보내기"}</Button></Card>
        <Card className="p-5"><h2 className="font-bold">추가 확인</h2><div className="mt-4 flex justify-between text-[13px]"><b>현장기사</b><Badge variant="success">전달 완료</Badge></div><div className="mt-3 flex justify-between text-[13px]"><b>고객</b><Badge variant={sent ? "warning" : "neutral"}>{sent ? "응답 대기" : "전송 전"}</Badge></div></Card>
      </div>
    </div>
  </>;
}

function AssignView({ next, demoState = "" }: { next: () => void; demoState?: string }) {
  const [vehicle, setVehicle] = useState(0);
  const [assigning, setAssigning] = useState(false);
  const externalConflictLabel = demoState === "worker-conflict" ? "WORKER_SCHEDULE · 김도윤 팀장이 같은 시간대 다른 작업에 배정돼 있어요" : demoState === "cert-missing" ? "CERT_EXPIRED · 피아노 전문 작업자 자격 만료 여부를 확인해야 해요" : "";
  const conflict = vehicle === 1 || Boolean(externalConflictLabel);
  const conflictLabel = vehicle === 1 ? "VEHICLE_SCHEDULE · 09:30 다른 작업과 겹쳐요" : externalConflictLabel;
  const notify = useDemoFeedback();
  return <><Badge variant="warning">피아노 작업 포함</Badge><h1 className="mt-4 text-[26px] font-extrabold leading-[34px]">배차 · 인력 배정</h1><p className={`mt-1 text-[13px] ${muted}`}>확정 범위 v3 · 5톤 1대 · 작업자 4명 · 예상 6시간</p><div className="mt-5 grid gap-5 xl:grid-cols-2"><div className="space-y-5"><Card className="p-5"><div className="flex justify-between"><b>차량 선택</b><Badge>후보 2대</Badge></div>{[['12가3456 · 5톤 리프트 · 적재함 28㎡','당일 일정 없음'],['34나7890 · 5톤 · 적재함 26㎡','09:30 다른 일정과 충돌']].map(([name,sub],i) => <button className={`demo-interactive-card mt-3 flex w-full items-center rounded-xl border p-4 text-left ${vehicle === i ? (i ? 'border-warning bg-warning-bg' : 'border-primary-400 bg-primary-50') : 'border-line'}`} key={name} onClick={() => setVehicle(i)} type="button"><span className={`mr-3 size-5 rounded-full border-2 ${vehicle === i ? `border-[6px] ${i ? 'border-warning' : 'border-primary-800'}` : 'border-[#D8DAE4]'}`} /><div><b>{name}</b><p className={`text-xs ${i ? 'text-warning' : muted}`}>{sub}</p></div></button>)}</Card><Card className="p-5"><div className="flex justify-between"><b>작업자 배정</b><Badge variant={externalConflictLabel ? "warning" : "success"}>4 / 4명</Badge></div>{crew.map(([name,skill], index) => <div className="flex h-12 items-center border-b border-line text-[13px] last:border-0" key={name}><b className="w-52">{name}</b><span className={`flex-1 ${muted}`}>{skill}</span>{externalConflictLabel && index === 0 ? <Badge variant="warning">확인 필요</Badge> : <Button onClick={() => notify(`${name}의 일정·자격 상세를 확인했어요.`)} size="chip">배정됨</Button>}</div>)}</Card></div><div className="space-y-5"><Card className={`p-5 ${conflict ? 'border-warning bg-warning-bg' : 'border-success bg-success-bg'}`}><h2 className="font-bold">충돌 확인 (7종 자동 검사)</h2>{conflict ? <div className="mt-5 space-y-3 text-[13px] font-bold text-warning-ink"><p>! {conflictLabel}</p><p>✓ 차량 용량 · 필요 24㎡ / 후보 {vehicle === 1 ? "26" : "28"}㎡</p><p>✓ 인원 충족 · 4/4</p><p className="text-danger-ink">문제 항목을 해결하기 전에는 배정을 확정할 수 없어요.</p></div> : <div className="mt-5 grid grid-cols-2 gap-5 text-[13px] font-bold text-success-ink">{['차량 일정 · 충돌 없음','차량 용량 · 여유 4㎡','작업자 일정 · 충돌 없음','인원 충족 · 4/4','피아노 자격 · 2명 유효','근무시간 · 예상 7.5h'].map(x => <span key={x}>✓ {x}</span>)}</div>}</Card><Card className="p-5"><b>작업자 전달 메모</b><textarea className="mt-4 h-20 w-full resize-none rounded-xl border border-line bg-[#FAFAFC] p-4 text-[13px] outline-none" defaultValue="피아노 이동 전 바닥 보강 · 도착지 엘리베이터 상태 우선 확인\n고객 연락은 팀장만 · 동호수는 현장에서 안내" /></Card><Button disabled={conflict || assigning} className="w-full" onClick={() => { if (conflict || assigning) return; setAssigning(true); window.setTimeout(next, 500); }} size="cta">{conflict ? '충돌을 먼저 해결해 주세요' : assigning ? <><LoaderCircle className="demo-spin" size={18} /> 배정 확정 중...</> : '배정 확정 · 작업자 링크 발송'}</Button></div></div></>;
}

function OperateView({ demoState = "" }: { demoState?: string }) {
  const [requested, setRequested] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [docState, setDocState] = useState<"ready" | "preparing" | "failed">(demoState === "docs-failed" ? "failed" : "ready");
  const notify = useDemoFeedback();
  useEffect(() => {
    if (demoState !== "docs-failed") return;
    const timer = window.setTimeout(() => setDocState("failed"), 0);
    return () => window.clearTimeout(timer);
  }, [demoState]);
  const retryDocuments = () => {
    if (docState === "preparing") return;
    setDocState("preparing");
    window.setTimeout(() => {
      setDocState("ready");
      notify("문서 패키지를 다시 만들었어요.");
    }, 650);
  };
  return <><Badge variant="primary">작업 중</Badge><h1 className="mt-4 text-[26px] font-extrabold leading-[34px]">당일 운영 · 완료</h1><div className="mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]"><div className="space-y-5"><Card className="p-5"><h2 className="text-[17px] font-bold">실시간 타임라인</h2><div className="mt-6 space-y-7">{[['08:02 · 팀 체크인 · 안전확인 3종 통과','done'],['09:40 · 출발지 상차 완료 · 사진 6장','done'],['10:55 · 변경요청 CR-01 (사다리차 +150,000원)','wait'],['11:02 · 고객 승인 → v4 확정 · 총액 1,430,000원','done'],['도착지 하차 · 진행 중','next'],['완료 기록 · 대기','next']].map(([label,state]) => <button onClick={() => notify(`${label} 이벤트 상세를 열었어요.`)} className="demo-interactive-card flex min-h-11 w-full items-center gap-4 rounded-xl px-2 text-left" key={label}><span className={`size-4 rounded-full ${state === 'done' ? 'bg-success' : state === 'wait' ? 'bg-warning' : 'bg-[#E4E6ED]'}`} /><b className={`text-[13px] ${state === 'next' ? muted : ink}`}>{label}</b>{state === 'wait' && <Badge className="ml-auto" variant="warning">처리 기록</Badge>}</button>)}</div></Card><Card className="p-5"><h2 className="font-bold">완료 증빙 수신 현황</h2><div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">{[['거실 전/후','완료'],['침실 전/후','완료'],['주방·베란다','대기'],['차량 적재','완료']].map(([label,state]) => <button onClick={() => notify(`${label}: ${state} 상태를 확인했어요.`)} className={`demo-interactive-card grid h-24 place-items-center rounded-xl ${state === '대기' ? 'bg-warning-bg text-warning-ink' : 'bg-canvas text-success-ink'}`} key={label}><ShieldCheck size={22} /><b className="text-[13px]">{label} · {state}</b></button>)}</div></Card></div><div className="space-y-5"><Card className="border-primary-400 p-5"><h2 className="font-bold">금액 요약</h2><div className="mt-5 flex justify-between text-[13px]"><span className={muted}>기본 합의 (v3)</span><b>1,280,000원</b></div><div className="mt-4 flex justify-between text-[13px]"><span className={muted}>승인 변경 CR-01</span><b>+150,000원</b></div><div className="my-5 h-px bg-line" /><div className="flex justify-between"><b>최종 확정액 (v4)</b><strong className="text-2xl text-primary-800">1,430,000원</strong></div></Card><Card className="p-5"><h2 className="font-bold">완료 확인</h2><div className="mt-4 flex justify-between text-[13px]"><b>한빛이사 (나)</b><Badge variant="success">확인함</Badge></div><div className="mt-3 flex justify-between text-[13px]"><b>박민서 (고객)</b><Badge variant={requested ? 'warning' : 'neutral'}>{requested ? '요청 보냄' : '대기'}</Badge></div><Button disabled={requested || requesting} className="mt-4 w-full" onClick={() => { if (requested || requesting) return; setRequesting(true); window.setTimeout(() => { setRequesting(false); setRequested(true); notify("고객 완료 확인 요청을 보냈어요."); }, 550); }}>{requesting ? <><LoaderCircle className="demo-spin" size={16} /> 요청 중...</> : requested ? "완료 확인 요청 보냄" : "완료 확인 요청 보내기"}</Button></Card><Card className={docState === "failed" ? "border-warning bg-warning-bg p-5" : "p-5"}><h2 className="font-bold">문서 패키지</h2><p className={`mt-3 text-[13px] ${docState === "failed" ? "text-warning-ink" : muted}`}>{docState === "failed" ? "문서 생성 실패 · 작업 및 감사 기록은 정상 보존됨" : docState === "preparing" ? "문서 패키지 준비 중..." : "견적서 v3 · 변경 승인 기록 CR-01 · 완료 확인 기록 · 근무기록"}</p><Button disabled={docState === "preparing"} onClick={() => docState === "ready" ? notify("현재 확정 상태 기준 문서 패키지를 열었어요.") : retryDocuments()} className="mt-4" variant="outline">{docState === "preparing" ? <><LoaderCircle className="demo-spin" size={16} /> 준비 중</> : docState === "failed" ? <><AlertTriangle size={16} /> 문서 재시도</> : <><Download size={16} /> PDF 일괄 내려받기</>}</Button></Card></div></div></>;
}

export function ProviderWebDemo() {
  const [view, setView] = useState<WebView>("cases");
  const requestedView = useDemoQuery("view");
  const demoState = useDemoQuery("state");
  useEffect(() => {
    if (!(["cases", "quote", "assign", "operate"] as string[]).includes(requestedView)) return;
    const timer = window.setTimeout(() => setView(requestedView as WebView), 0);
    return () => window.clearTimeout(timer);
  }, [requestedView]);
  return <DemoFeedbackProvider><WebShell setView={setView} view={view}>
    <div key={view} className="demo-screen-enter">
      {view === "cases" && <CasesView open={setView} />}
      {view === "quote" && (demoState.startsWith("field-issue") ? <FieldIssueView demoState={demoState} /> : <QuoteView next={() => setView("assign")} />)}
      {view === "assign" && <AssignView demoState={demoState} next={() => setView("operate")} />}
      {view === "operate" && <OperateView demoState={demoState} />}
    </div>
  </WebShell></DemoFeedbackProvider>;
}
