"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CirclePlay,
  CircleUserRound,
  ClipboardList,
  Copy,
  FileDown,
  Flower2,
  Home,
  Info,
  Link2,
  MapPin,
  Minus,
  Monitor,
  PackagePlus,
  Play,
  Plus,
  Share2,
  ShieldCheck,
  Sofa,
  Truck,
  UserRound,
  Video,
  X,
} from "lucide-react";
import { MobileFrame, StatusBar } from "@/components/demo-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const ink = "text-[#191927]";
const muted = "text-[#8E90A0]";
const card = "rounded-[22px] bg-white";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button aria-label="이전 화면" onClick={onClick} className="grid size-9 place-items-center rounded-full bg-white text-[#191927]">
      <ArrowLeft size={22} strokeWidth={2} />
    </button>
  );
}

function Top({ onBack, title, aside }: { onBack: () => void; title?: string; aside?: ReactNode }) {
  return (
    <div className="flex h-14 items-center justify-between px-5">
      <BackButton onClick={onBack} />
      {title && <p className="text-[17px] font-bold tracking-[-0.3px]">{title}</p>}
      <div className="min-w-9 text-right text-[13px] font-semibold text-[#8E90A0]">{aside}</div>
    </div>
  );
}

function Bottom({ children }: { children: ReactNode }) {
  return <div className="mt-auto border-t border-[#E9EAF2] bg-white px-6 pb-7 pt-4">{children}</div>;
}

function Primary({ children, onClick, disabled = false }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="cta"
      className="w-full"
    >
      {children}
    </Button>
  );
}

function Outline({ children, onClick, danger = false }: { children: ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <Button onClick={onClick} variant={danger ? "destructive" : "outline"} size="cta">
      {children}
    </Button>
  );
}

function Dots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-3" aria-label={`${current}/4 단계`}>
      {[1, 2, 3, 4].map((dot) => <span key={dot} className={`size-2 rounded-full ${dot <= current ? "bg-[#4F46E5]" : "bg-[#E0E7FF]"}`} />)}
    </div>
  );
}

function Page({ children }: { children: ReactNode }) {
  return <div className={`flex min-h-[844px] flex-col bg-[#F4F5F9] ${ink}`}>{children}</div>;
}

function ConsumerHome({ next, go }: { next: () => void; go: (screen: number) => void }) {
  return (
    <Page>
      <StatusBar />
      <main className="flex-1 px-6 pb-6 pt-3">
        <div className="mb-6 flex items-center justify-between">
          <strong className="text-[24px] font-extrabold tracking-[-1px] text-[#4F46E5]">짐싸</strong>
          <button aria-label="내 정보" className="grid size-9 place-items-center rounded-full bg-white text-[#B4B6C3]"><CircleUserRound size={29} /></button>
        </div>
        <h1 className="mb-4 text-[24px] font-extrabold leading-[32px] tracking-[-0.5px]">민서님, 이사가<br />30일 남았어요</h1>
        <section className="mb-5 rounded-[24px] bg-[#4F46E5] p-5 text-white">
          <p className="text-[12px] font-semibold text-[#E0E7FF]">지금 할 일</p>
          <h2 className="mt-1 text-[17px] font-bold">한빛이사 수정안이 도착했어요</h2>
          <p className="mt-1 text-[13px] text-[#D8D9FF]">피아노 인력 추가 · +120,000원 · v3</p>
          <div className="my-5 flex items-center text-[12px] text-[#D8D9FF]">
            {[1, 2, 3].map((n) => <span key={n} className="grid size-6 place-items-center rounded-full bg-white font-bold text-[#4F46E5]">{n < 3 ? <Check size={14} /> : n}</span>)}
            <span className="mx-2 h-0.5 flex-1 bg-white/70" />
            <span>짐 확정 → 견적 → 공동확인</span>
          </div>
          <button onClick={() => go(5)} className="h-9 w-full rounded-full bg-white text-[14px] font-bold text-[#4F46E5]">수정안 확인하기 <ArrowRight className="inline" size={15} /></button>
        </section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-[17px] font-bold">9월 12일 (토) 이사</h2><Badge variant="warning">검토 중</Badge></div>
        <Card className="mb-4 p-5">
          <div className="flex items-start gap-3"><Truck className="mt-0.5 text-[#4B4B5C]" size={22} /><div><p className="text-[15px] font-bold">마포 성산동 → 성동 행당동</p><p className={`mt-1 text-[12px] ${muted}`}>12층 엘베 → 3층 계단 · 사다리차 확인 중</p></div></div>
          <div className="mt-4 flex justify-between border-t border-[#E9EAF2] pt-3"><span className={`text-[12px] font-semibold ${muted}`}>현재 견적</span><strong className="text-[18px]">1,280,000원</strong></div>
        </Card>
        <section className={`${card} flex items-center gap-3 p-4`}><span className="grid size-8 place-items-center rounded-full bg-[#E6F7EF] text-[#17A46B]"><ShieldCheck size={19} /></span><div><p className="text-[15px] font-bold">안심+ 보호가 적용 중이에요</p><p className={`text-[12px] ${muted}`}>승인 없는 추가금은 청구되지 않아요</p></div><ChevronRight className="ml-auto text-[#B7B9C5]" size={16} /></section>
        <p className={`mb-2 mt-6 text-[13px] font-semibold ${muted}`}>새 이사를 준비하시나요?</p>
        <Outline onClick={next}><Plus className="mr-1 inline" size={17} /> 새 작업 만들기</Outline>
      </main>
      <nav className="grid grid-cols-4 border-t border-[#E9EAF2] bg-white pb-6 pt-3 text-center text-[10px] text-[#8E90A0]">
        {([[Home, "홈"], [Truck, "내 이사"], [ClipboardList, "기록"], [UserRound, "내 정보"]] as const).map(([Icon, label], i) => <button key={label} className={`grid justify-items-center gap-1 ${i === 0 ? "font-bold text-[#191927]" : ""}`}><Icon size={21} />{label}</button>)}
      </nav>
    </Page>
  );
}

function Conditions({ next, back }: { next: () => void; back: () => void }) {
  const [elevator, setElevator] = useState("없어요");
  const [ladder, setLadder] = useState("모름");
  const [drop, setDrop] = useState("현장 확인 필요");
  const choices = (items: string[], value: string, set: (value: string) => void) => (
    <div className="grid grid-cols-3 gap-2">{items.map((item) => <button key={item} onClick={() => set(item)} className={`h-14 rounded-2xl border text-[14px] font-bold ${value === item ? (item.includes("모름") || item.includes("확인") ? "border-[#F5A623] bg-[#FFF6E5] text-[#9B6400]" : "border-[#191927] bg-[#191927] text-white") : "border-[#E0E2EC] bg-white text-[#8E90A0]"}`}>{item}</button>)}</div>
  );
  return (
    <Page>
      <StatusBar /><div className="flex items-center justify-between px-5"><BackButton onClick={back} /><Dots current={2} /><span className={`text-[13px] font-bold ${muted}`}>2/4</span></div>
      <main className="flex-1 px-6 pb-5 pt-5">
        <h1 className="text-[24px] font-extrabold leading-[32px] tracking-[-0.5px]">도착지 조건을<br />알려주세요</h1><p className={`mt-1 text-[13px] ${muted}`}>모르면 ‘모름’을 선택해도 돼요 — 업체가 확인해 드려요</p>
        <Card className="mt-5 flex items-center gap-3 p-5"><span className="grid size-8 place-items-center rounded-full bg-[#F4F5F9]"><MapPin size={20} /></span><div><p className="text-[14px] font-bold">성동구 행당동 · 빌라 3층</p><p className={`text-[12px] ${muted}`}>9월 12일 (토) 오전 8시 도착 예정</p></div><button className="ml-auto text-[12px] font-bold">변경</button></Card>
        <h2 className="mb-2 mt-7 text-[15px] font-bold">엘리베이터가 있나요?</h2>{choices(["있어요", "없어요", "모름"], elevator, setElevator)}
        {elevator === "없어요" && <p className="mt-2 rounded-xl bg-[#FFF6E5] px-4 py-3 text-[12px] font-bold text-[#9B6400]">3층 계단 작업 예상 — 사다리차 여부를 이어서 확인할게요</p>}
        <h2 className="mb-2 mt-6 text-[15px] font-bold">사다리차가 필요한가요?</h2>{choices(["필요", "불필요", "모름"], ladder, setLadder)}
        <h2 className="mb-2 mt-6 text-[15px] font-bold">짐을 내릴 위치는요?</h2><div className="grid grid-cols-2 gap-2">{["건물 바로 앞", "현장 확인 필요"].map((item) => <button key={item} onClick={() => setDrop(item)} className={`h-14 rounded-2xl border text-[14px] font-bold ${drop === item ? "border-[#F5A623] bg-[#FFF6E5] text-[#9B6400]" : "border-[#E0E2EC] bg-white text-[#8E90A0]"}`}>{item}</button>)}</div>
        <p className="mt-5 rounded-xl bg-[#EEF2FF] px-4 py-3 text-[12px] font-semibold text-[#4B4B5C]">‘모름’ 2건은 업체 검토 단계에서 함께 확정돼요</p>
      </main><Bottom><Primary onClick={next}>다음 · 짐 알려주기</Primary></Bottom>
    </Page>
  );
}

function Capture({ next, back }: { next: () => void; back: () => void }) {
  return (
    <Page><StatusBar /><div className="flex items-center justify-between px-5"><BackButton onClick={back} /><Dots current={3} /><span className={`text-[13px] font-bold ${muted}`}>3/4</span></div>
      <main className="flex-1 px-6 pb-4 pt-5"><h1 className="text-[24px] font-extrabold leading-[32px]">구역마다 한 번씩<br />천천히 찍어주세요</h1><p className={`mt-1 text-[13px] ${muted}`}>15~30초면 충분해요 · 얼굴·귀중품은 피해주세요</p>
        <section className="mt-5 rounded-[24px] bg-[#191927] p-4 text-white"><div className="relative grid h-36 place-items-center rounded-2xl bg-[#2B2B3E]"><span className="absolute left-3 top-3 rounded-full bg-[#E5484D] px-3 py-1 text-[11px] font-bold"><Video className="mr-1 inline" size={13} /> 주방 REC</span><span className="absolute right-3 top-3 text-[12px] font-bold">0:14</span><button aria-label="촬영" className="grid size-12 place-items-center rounded-full border-[6px] border-white/70 bg-[#E5484D]" /></div><div className="mt-4 flex items-center justify-between px-3 text-[12px]"><span>싱크대 → 냉장고 → 수납장 순서로 천천히</span><button className="rounded-full bg-white/10 px-3 py-2">넘어가기</button></div></section>
        <div className="mb-2 mt-6 flex justify-between text-[15px] font-bold"><span>촬영 현황</span><span>2/3 완료</span></div>
        {[['거실','0:24 · AI가 7개 짐 후보 발견',true],['침실','0:19 · 업로드 완료',true],['주방 — 촬영 중','지금 이 구역이에요',false]].map(([name,desc,done]) => <div key={String(name)} className={`mb-2 flex items-center gap-3 rounded-2xl border p-4 ${done ? "border-transparent bg-white" : "border-[#818CF8] bg-[#EEF2FF]"}`}><span className={`grid size-7 place-items-center rounded-full ${done ? "bg-[#E6F7EF] text-[#17A46B]" : "bg-[#4F46E5] text-white"}`}>{done ? <Check size={17} /> : <Video size={16} />}</span><div><p className="text-[14px] font-bold">{name}</p><p className={`text-[12px] ${done ? muted : "text-[#4F46E5]"}`}>{desc}</p></div>{done && <button className="ml-auto text-[12px] font-bold">다시 찍기</button>}</div>)}
        <div className="grid grid-cols-2 gap-2"><Outline><Plus className="mr-1 inline" size={16} /> 구역 추가</Outline><Outline><Camera className="mr-1 inline" size={16} /> 사진으로 대체</Outline></div>
      </main><Bottom><Primary onClick={next}>촬영 마치고 AI 분석 시작</Primary></Bottom></Page>
  );
}

function ConfirmItems({ next, back }: { next: () => void; back: () => void }) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const answer = () => step === 1 ? setStep(2) : setDone(true);
  return (
    <Page><StatusBar /><main className="flex-1 px-6 pb-5"><div className="flex items-start justify-between"><div><h1 className="text-[24px] font-extrabold leading-[32px]">2가지만 확인하면<br />짐 목록이 끝나요</h1><p className={`mt-1 text-[13px] ${muted}`}>AI가 영상에서 21개를 찾았어요 · 19개 자동 확정</p></div><span className="grid size-16 place-items-center rounded-full border-[5px] border-[#4F46E5] text-[14px] font-extrabold text-[#4F46E5]">19/21</span></div>
        <section className={`${card} mt-6 p-5`}><span className="rounded-full bg-[#FFF6E5] px-4 py-2 text-[12px] font-bold text-[#9B6400]">확인 {step}/2</span><div className="mt-4 flex gap-4"><button aria-label="근거 영상 재생" className="grid h-24 w-28 shrink-0 place-items-center rounded-2xl bg-[#E5E6EE] text-[#747785]"><CirclePlay size={38} fill="currentColor" className="text-[#747785]" /></button><div><h2 className="text-[17px] font-bold">{step === 1 ? "붙박이장인가요?" : "화분도 가져가나요?"}</h2><p className={`mt-1 text-[12px] ${muted}`}>{step === 1 ? "벽에 고정된 장은 운반에서 빠져요" : "직접 운반 여부를 확인해 주세요"}</p><div className="mt-2 h-2 w-24 rounded-full bg-[#E9EAF2]"><div className="h-2 w-1/2 rounded-full bg-[#F5A623]" /></div><p className="mt-1 text-[11px] font-bold text-[#9B6400]">AI 확신 {step === 1 ? 61 : 72}%</p></div></div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={answer} className="h-12 rounded-2xl bg-[#4F46E5] text-[14px] font-bold text-white">맞아요, {step === 1 ? "빼주세요" : "가져가요"}</button><button onClick={answer} className="h-12 rounded-2xl border border-[#E0E2EC] text-[14px] font-bold">아니요</button></div><p className={`mt-2 text-center text-[11px] ${muted}`}>다음 확인: 대형 화분 ×2 (거실)</p></section>
        <div className="mb-3 mt-7 flex justify-between text-[15px] font-bold"><span>자동 확정된 짐 19개</span><button className="text-[12px]">전체 보기</button></div><section className={`${card} flex items-center gap-3 p-4`}><span className="grid size-9 place-items-center rounded-xl bg-[#F4F5F9]"><PackagePlus size={19} /></span><div><p className="text-[14px] font-bold">거실 7 · 침실 5 · 주방 4 · 베란다 3</p><p className={`text-[12px] ${muted}`}>택배서 수량 조절 · 근거 영상 연결됨</p></div><ChevronRight className="ml-auto" size={16} /></section><button className="mt-4 h-12 w-full rounded-2xl border border-dashed border-[#D8DAE5] bg-white text-[14px] font-semibold"><Plus className="mr-1 inline" size={16} /> 영상에 없는 짐 추가</button><p className="mt-4 rounded-xl bg-[#EEF2FF] px-4 py-3 text-[12px] font-semibold">가격은 여기서 정하지 않아요 — 업체가 이 목록으로 견적을 내요</p>
      </main><Bottom><Primary onClick={next} disabled={!done}>{done ? "짐 목록 확정하기" : `확인 ${3 - step}건 남음`}</Primary><button onClick={back} className="mt-2 w-full py-1 text-[12px] text-[#8E90A0]">이전으로</button></Bottom></Page>
  );
}

function ScopeSummary({ next, back, go }: { next: () => void; back: () => void; go: (screen: number) => void }) {
  return (
    <Page><StatusBar /><Top onBack={back} title="작업범위 v3" aside="지난 버전" /><main className="flex-1 px-6 pb-5"><Card className="p-5"><div className="flex justify-between"><span className={`text-[12px] ${muted}`}>한빛이사 제안 총액</span><Badge variant="warning">확인 대기</Badge></div><p className="mt-2 text-[30px] font-extrabold tracking-[-0.5px]">1,280,000원</p><Badge className="mt-2" variant="danger">이전보다 +120,000</Badge><p className={`mt-4 text-[12px] ${muted}`}>5톤 1대 · 작업자 4명 · 6시간 · ★4.9 검증 파트너</p></Card>
        <h2 className="mb-3 mt-6 text-[15px] font-bold">이번에 달라진 것</h2><section className="rounded-2xl bg-[#FFF6E5] p-4"><div className="flex gap-3"><span className="grid size-8 place-items-center rounded-full bg-white text-[#F5A623]"><Plus size={20} /></span><div><p className="text-[14px] font-bold">피아노 전문 인력 1명 추가</p><p className="mt-1 text-[12px] text-[#9B6400]">사유: 안전 운반 · 침실 영상 근거 →</p></div><strong className="ml-auto text-[14px] text-[#E5484D]">+120,000</strong></div></section>
        <h2 className="mb-3 mt-6 text-[15px] font-bold">그대로인 것</h2><section className={`${card} space-y-2 p-4 text-[13px] font-semibold`}><p><Check className="mr-2 inline" size={17} />짐 21개 · 포장·운반·정리 · 냉장고 문 분리</p><p><Check className="mr-2 inline" size={17} />기본 견적 1,160,000원</p><p className="text-[#E5484D]"><X className="mr-2 inline" size={17} />제외: 폐기물 처리 · 입주청소</p></section>
        <h2 className="mb-3 mt-6 text-[15px] font-bold">함께 확인하는 사람</h2><section className={`${card} flex items-center p-4`}><span className="grid size-9 place-items-center rounded-full bg-[#17A46B] text-white">나</span><span className="-ml-1 grid size-9 place-items-center rounded-full bg-[#E9EAF2] text-[11px]">한</span><div className="ml-3"><p className="text-[14px] font-bold">나 확인함 · 한빛이사 대기</p><p className={`text-[12px] ${muted}`}>둘 다 확인하면 이 금액으로 잠겨요</p></div></section><p className="mt-4 rounded-xl bg-[#EEF2FF] px-4 py-3 text-[12px] font-semibold">확인은 서명이 아니라 ‘같은 내용을 봤다’는 기록이에요</p>
      </main><Bottom><div className="grid grid-cols-[2fr_1fr] gap-2"><Primary onClick={next}>이 내용대로 확인</Primary><Outline onClick={() => go(11)}>수정 요청</Outline></div></Bottom></Page>
  );
}

function OnsiteApproval({ next, back }: { next: () => void; back: () => void }) {
  const [more, setMore] = useState(false);
  return (
    <Page><StatusBar /><div className="px-6 pt-4"><h2 className="text-[17px] font-bold">오늘 · 이사 진행 중</h2><section className="mt-3 rounded-2xl bg-white/60 p-4"><p className="text-[14px] font-bold">09:40 상차 완료 · 도착지 이동 중</p><p className={`text-[12px] ${muted}`}>한빛이사 김도윤 팀 · 확정 1,280,000원</p></section></div><div className="mt-4 flex flex-1 flex-col rounded-t-[28px] bg-white px-6 pb-7 pt-3"><div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#DFE1EA]" /><div className="flex items-center justify-between"><span className="rounded-full bg-[#FDECEC] px-3 py-2 text-[11px] font-bold text-[#E5484D]">현장 추가 요청</span><button aria-label="닫기" onClick={back}><X size={22} className="text-[#8E90A0]" /></button></div><h1 className="mt-4 text-[24px] font-extrabold leading-[32px]">사다리차 150,000원,<br />승인하시겠어요?</h1><p className={`mt-1 text-[13px] ${muted}`}>김도윤 기사 · 10:55 · 도착지 엘리베이터 고장</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#F4F5F9] p-5"><p className={`text-[12px] ${muted}`}>거절하면</p><strong className="mt-3 block text-[20px]">1,280,000원</strong><p className={`mt-3 text-[11px] ${muted}`}>기존 금액 그대로<br />작업 방식은 협의</p></div><div className="rounded-2xl border-2 border-[#4F46E5] bg-[#EEF2FF] p-5"><p className="text-[12px] font-bold text-[#4F46E5]">승인하면</p><strong className="mt-3 block text-[20px] text-[#4F46E5]">1,430,000원</strong><p className={`mt-3 text-[11px] ${muted}`}>사다리차로 안전 하차<br />지연 없이 진행</p></div></div><h2 className="mb-2 mt-5 text-[15px] font-bold">현장 증빙 2건</h2><div className="grid grid-cols-2 gap-3">{['고장 엘리베이터','안내문'].map((label, i) => <button key={label} className="relative grid h-28 place-items-center rounded-2xl bg-[#E5E6EE]"><span className="grid size-8 place-items-center rounded-full bg-[#747785] text-white">{i ? <ClipboardList size={17} /> : <Play size={17} fill="white" />}</span><span className="absolute bottom-2 left-2 rounded bg-[#5A5C68] px-2 py-1 text-[10px] font-bold text-white">{label}</span></button>)}</div><p className="mt-4 rounded-xl bg-[#F4F5F9] px-4 py-3 text-[12px] font-semibold">구두 동의는 기록되지 않아요 · 여기서 응답해야 반영돼요</p>{more && <p className="mt-2 text-[12px] text-[#4B4B5C]">엘리베이터 고장으로 계단 운반 시 안전 위험과 지연이 예상됩니다.</p>}<div className="mt-auto"><Primary onClick={next}>승인하기 · 1,430,000원</Primary><div className="mt-3 grid grid-cols-2 gap-2"><Outline onClick={() => setMore(!more)}>설명 더 듣기</Outline><button onClick={next} className="font-bold text-[#E5484D]">거절할게요</button></div></div></div></Page>
  );
}

function Completion({ next, back }: { next: () => void; back: () => void }) {
  const [extra, setExtra] = useState(false);
  return (
    <Page><StatusBar /><Top onBack={back} title="이사 완료" aside={<span className="rounded-full bg-[#E6F7EF] px-3 py-2 text-[#17A46B]">작업 종료</span>} /><main className="flex-1 px-6 pb-5"><h1 className="mt-2 text-[24px] font-extrabold">고생하셨어요!</h1><p className={`mt-1 text-[13px] ${muted}`}>마지막으로 결과를 확인하고 마무리해 주세요</p><section className={`${card} mt-5 p-5`}><div className="flex justify-between"><h2 className="text-[15px] font-bold">전 · 후 비교</h2><button className="rounded-full bg-[#F4F5F9] px-4 py-2 text-[11px] font-bold">거실 <ChevronDown className="inline" size={13} /></button></div><div className="relative mt-3 grid h-36 grid-cols-2 overflow-hidden rounded-2xl bg-[#DADBE4]"><div className="border-r-2 border-white" /><div /><span className="absolute left-2 top-3 rounded bg-[#747785] px-2 py-1 text-[10px] text-white">전 09.10</span><span className="absolute right-2 top-3 rounded bg-[#191927] px-2 py-1 text-[10px] text-white">후 09.12</span><span className="absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#4F46E5] text-white">↔</span></div><p className={`mt-3 text-[11px] ${muted}`}>핸들을 밀어 비교 · 파손·책임 판단은 하지 않아요</p></section><section className={`${card} mt-4 p-5`}><p className={`text-[12px] ${muted}`}>최종 확정 금액</p><div className="mt-2 flex items-center justify-between"><strong className="text-[30px] font-extrabold">1,430,000원</strong><span className="rounded-full bg-[#E6F7EF] px-3 py-2 text-[11px] font-bold text-[#17A46B]">미승인 추가금 0원</span></div></section><section className={`${card} mt-4 p-5`}><h2 className="text-[15px] font-bold">기록에 없는 추가금 요구가 있었나요?</h2><p className={`mt-1 text-[12px] ${muted}`}>답변은 파트너 평가와 보호 정책에만 쓰여요</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setExtra(false)} className={`h-14 rounded-2xl font-bold ${!extra ? "bg-[#191927] text-white" : "border border-[#E0E2EC]"}`}>아니요, 없었어요</button><button onClick={() => setExtra(true)} className={`h-14 rounded-2xl font-bold ${extra ? "bg-[#191927] text-white" : "border border-[#E0E2EC]"}`}>네, 있었어요</button></div><p className={`mt-3 text-[11px] ${muted}`}>완료 확인은 배상청구권 포기가 아니에요</p></section></main><Bottom><Primary onClick={next}>완료 확인하고 기록 받기</Primary></Bottom></Page>
  );
}

function Analysis({ next, back, sheet = false }: { next: () => void; back: () => void; sheet?: boolean }) {
  const [sofa, setSofa] = useState(1);
  return (
    <Page><StatusBar /><Top onBack={back} title="영상 분석" aside="8/12" /><main className="flex-1 px-5 pb-5"><h1 className="mt-1 text-[24px] font-extrabold">분석이 끝나면 알려드릴까요?</h1><p className="mt-2 text-[15px] font-bold text-[#4B4B5C]">앱을 닫아도 분석은 계속돼요.</p><section className={`${card} mt-5 flex items-center gap-5 border border-[#E9EAF2] p-6`}><div className="grid size-24 shrink-0 place-items-center rounded-full border-[7px] border-[#4F46E5] border-r-[#E0E7FF]"><strong className="text-[20px]">60%</strong><span className="-mt-5 text-[11px] font-bold">분석 중</span></div><div><h2 className="text-[17px] font-bold">주방을 확인하고 있어요</h2><p className="mt-3 text-[13px]">거실·침실 분석 완료</p><div className="my-3 h-px bg-[#E9EAF2]" /><p className="text-[12px] font-semibold"><span className="mr-2 inline-block size-2 rounded-full bg-[#4F46E5]" />보통 1분 안에 끝나요</p></div></section><section className={`${card} mt-7 border border-[#E9EAF2] p-5`}><h2 className="text-[17px] font-bold">구역별 분석</h2>{[['거실','7개 발견',true],['침실','6개 발견',true],['주방','분석 중',false]].map(([room,status,done]) => <div key={String(room)} className="flex items-center gap-3 border-t border-[#E9EAF2] py-3"><span className={`grid size-7 place-items-center rounded-full ${done ? "bg-[#E6F7EF] text-[#17A46B]" : "text-[#4F46E5]"}`}>{done ? <Check size={16} /> : <span className="size-5 rounded-full border-2 border-[#4F46E5] border-b-transparent" />}</span><p className="text-[15px] font-bold">{room}</p><span className="ml-auto text-[12px] font-bold text-[#4B4B5C]">{status}</span></div>)}</section><section className={`${card} mt-7 flex gap-3 border border-[#E9EAF2] p-5`}><Info size={24} /><div><h2 className="text-[17px] font-bold">입력 내용은 안전하게 저장돼요</h2><p className="mt-2 text-[12px]">영상과 입력값은 분석이 멈춰도 그대로 남아요.</p><button className="mt-2 text-[12px] font-bold">계속 안 되면 직접 입력하기 <ChevronRight className="inline" size={16} /></button></div></section></main><Bottom><Primary onClick={next}><Bell className="mr-2 inline" size={18} />완료되면 알림 받기</Primary></Bottom>
      {sheet && (
        <Sheet open onOpenChange={(open) => !open && back()}>
          <SheetContent>
            <SheetHeader><SheetTitle>거실 짐 7개를 확인할까요?</SheetTitle><SheetDescription>수량과 운반 옵션을 바꿀 수 있어요</SheetDescription></SheetHeader>
            <div className="px-5">
              <Card className="border-[#E0E7FF] bg-[#EEF2FF] p-4"><div className="flex gap-3"><span className="grid size-11 place-items-center rounded-xl bg-white"><Sofa size={25} /></span><div><h2 className="text-[17px] font-bold">3인 소파</h2><p className="text-[12px]">일반 운반 · AI 93% · 근거 0:08</p></div><div className="ml-auto flex h-10 items-center gap-4 rounded-xl bg-white px-3"><button onClick={() => setSofa(Math.max(0, sofa - 1))}><Minus size={16} /></button><span>{sofa}</span><button onClick={() => setSofa(sofa + 1)}><Plus size={16} /></button></div></div><div className="mt-4 grid grid-cols-2 gap-2"><Outline>옵션 변경</Outline><Outline danger>이 짐 빼기</Outline></div></Card>
              {([[Monitor,"TV 65인치","1"], [Flower2,"대형 화분","2"]] as const).map(([Icon, name, count]) => <Card key={name} className="mt-3 flex items-center p-4"><span className="grid size-10 place-items-center rounded-xl bg-[#F4F5F9]"><Icon size={23} /></span><strong className="ml-3 text-[17px]">{name}</strong><div className="ml-auto flex h-10 items-center gap-4 rounded-xl bg-[#F4F5F9] px-3"><Minus size={15} /><span>{count}</span><Plus size={15} /></div></Card>)}
              <Button variant="outline" className="mt-3 w-full justify-between"><span>책장 · 러그 · 스탠드 · 3개</span><ChevronRight /></Button>
              <Button variant="outline" className="mt-3 w-full border-dashed"><Plus />이 공간에 짐 추가</Button>
            </div>
            <SheetFooter><Primary onClick={next}>저장하고 돌아가기</Primary></SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </Page>
  );
}

function Invite({ next, back }: { next: () => void; back: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Page><StatusBar /><Top onBack={back} /><main className="flex-1 px-6 pb-5"><h1 className="mt-4 text-[24px] font-extrabold leading-[32px]">계약한 업체를<br />초대해 주세요</h1><p className={`mt-1 text-[13px] ${muted}`}>업체는 가입 없이 링크로 들어와 짐 목록을 검토해요</p><section className="mt-5 rounded-[24px] bg-[#4F46E5] p-5 text-white"><div className="flex gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white/15"><Link2 size={20} /></span><div><p className="text-[14px] font-bold">업체 전용 비밀 링크</p><p className="text-[11px] text-[#D8D9FF]">이 링크를 받은 업체만 들어올 수 있어요</p></div></div><div className="mt-4 rounded-xl bg-white/15 px-4 py-3 text-[13px] font-bold">jimsa.kr/j/MOVE-240912/p/8f2k...x9</div><div className="mt-3 grid grid-cols-2 gap-2"><button className="h-12 rounded-xl bg-[#FEE500] font-bold text-[#191927]"><Share2 className="mr-2 inline" size={17} />카카오톡 공유</button><button onClick={() => setCopied(true)} className="h-12 rounded-xl bg-white font-bold text-[#4338CA]"><Copy className="mr-2 inline" size={17} />{copied ? "복사됨" : "링크 복사"}</button></div></section><h2 className="mb-3 mt-7 text-[15px] font-bold">보낸 초대</h2>{[['한빛이사','오늘 14:02 · 수락 · 짐 목록 검토 중','수락됨'],['두리익스프레스','어제 18:40 · 아직 열지 않음','대기']].map(([name,desc,state],i) => <section key={name} className={`${card} mb-3 flex items-center p-4`}><span className={`grid size-11 place-items-center rounded-xl text-[12px] font-bold ${i ? "bg-[#F4F5F9] text-[#8E90A0]" : "bg-[#EEF2FF] text-[#4F46E5]"}`}>{i ? '두리' : '한빛'}</span><div className="ml-3"><p className="text-[15px] font-bold">{name}</p><p className={`text-[11px] ${muted}`}>{desc}</p></div><span className={`ml-auto rounded-full px-3 py-2 text-[11px] font-bold ${i ? "bg-[#F4F5F9] text-[#8E90A0]" : "bg-[#E6F7EF] text-[#17A46B]"}`}>{state}</span>{i && <button className="ml-2 rounded-full bg-[#FDECEC] px-3 py-2 text-[11px] font-bold text-[#E5484D]">폐기</button>}</section>)}<p className="mt-7 px-5 text-[12px]"><button className="font-bold text-[#4F46E5]">링크를 잘못 보냈다면 폐기하세요</button><br />즉시 접근이 차단되고 새 링크를 만들 수 있어요</p></main><Bottom><Primary onClick={next}><Plus className="mr-1 inline" size={17} /> 다른 업체도 초대하기</Primary></Bottom></Page>
  );
}

function Revision({ next, back }: { next: () => void; back: () => void }) {
  const [topics, setTopics] = useState(["짐 목록 수정", "작업 방식"]);
  const toggle = (topic: string) => setTopics(topics.includes(topic) ? topics.filter((item) => item !== topic) : [...topics, topic]);
  return (
    <Page><StatusBar />
      <Sheet open onOpenChange={(open) => !open && back()}>
        <SheetContent>
          <SheetHeader><SheetTitle>어떤 점을 바꿀까요?</SheetTitle><SheetDescription>v3 기준 · 보내면 업체가 새 제안(v4)으로 답해요</SheetDescription></SheetHeader>
          <div className="px-6"><div className="grid grid-cols-2 gap-3">{["짐 목록 수정", "작업 방식", "금액 문의", "일정 · 조건"].map((topic) => { const selected = topics.includes(topic); return <button key={topic} onClick={() => toggle(topic)} className={`h-20 rounded-2xl border-2 p-4 text-left text-[13px] font-bold ${selected ? "border-[#4F46E5] bg-[#EEF2FF]" : "border-[#E9EAF2] text-[#8E90A0]"}`}><span className={`mb-3 grid size-6 place-items-center rounded-full ${selected ? "bg-[#4F46E5] text-white" : "bg-[#F4F5F9]"}`}>{selected && <Check size={14} />}</span>{topic}</button>})}</div><h2 className="mb-2 mt-6 text-[15px] font-bold">자세히 알려주세요</h2><textarea aria-label="수정 요청 내용" defaultValue="화분 하나는 지인에게 드리기로 해서 빼주세요. 에어컨은 도착지 설치까지 가능한지 확인 부탁드려요." className="h-28 w-full resize-none rounded-2xl border-0 bg-[#F4F5F9] p-4 text-[13px] leading-6 outline-none" /><div className="mt-4 grid grid-cols-[108px_1fr] gap-3"><Button variant="outline" className="h-20 border-dashed text-[11px] text-[#8E90A0]"><Camera />사진 (선택)</Button><div className="rounded-2xl bg-[#F4F2FF] p-4 text-[11px]"><strong className="text-[#4F46E5]">보내면 어떻게 되나요?</strong><p className="mt-1">기존 v3 확인은 유지 · 새 제안이 오면 다시 확인 후 확정돼요</p></div></div></div>
          <SheetFooter><Primary onClick={next} disabled={!topics.length}>수정 요청 보내기</Primary></SheetFooter>
        </SheetContent>
      </Sheet>
    </Page>
  );
}

function History({ back, restart }: { back: () => void; restart: () => void }) {
  const versions = [
    ["v4", "현장 변경 반영", "확정 · 잠김", "사다리차 승인 +150,000 → 1,430,000원", "09.12 11:02 · 변경요청 CR-010에서 자동 생성"],
    ["v3", "업체 수정안", "대체됨", "피아노 인력 +120,000 → 1,280,000원", "09.10 15:20 · 사유: 안전 운반 · 둘 다 확인"],
    ["v2", "내 수정 요청 반영", "대체됨", "대형 화분 2→1 · 1,160,000원", "09.09 20:11 · 업체 수정으로 내 확인 무효화"],
    ["v1", "AI 초안 기반 첫 제안", "대체됨", "물품 21개 · 1,160,000원", "09.09 18:03"],
  ];
  return (
    <Page><StatusBar /><Top onBack={back} /><main className="flex-1 px-6 pb-5"><h1 className="mt-2 text-[24px] font-extrabold leading-[32px]">금액이 어떻게<br />정해졌는지 볼까요?</h1><p className={`mt-1 text-[13px] ${muted}`}>모든 버전과 확인 기록이 남아요 · 삭제 불가</p><div className="mt-5 grid grid-cols-4 rounded-2xl bg-white p-3 text-center text-[12px] font-bold text-[#8E90A0]">{['1,160,000','1,160,000','1,280,000','1,430,000'].map((price,i) => <span key={`${price}-${i}`} className={i === 3 ? "text-[#4F46E5]" : ""}>{price}<span className={`mx-auto mt-3 block h-1 w-14 rounded-full ${i === 3 ? "bg-[#4F46E5]" : i === 2 ? "bg-[#B8B4FF]" : "bg-[#E5E6EE]"}`} /></span>)}</div><div className="relative mt-7 space-y-4 before:absolute before:bottom-0 before:left-[21px] before:top-0 before:w-px before:bg-[#DFE1EA]">{versions.map(([version,title,state,summary,time],i) => <div key={version} className="relative pl-11"><span className={`absolute left-2 top-4 grid size-7 place-items-center rounded-full text-[10px] font-bold text-white ${i === 0 ? "bg-[#4F46E5]" : "bg-[#C7C9D3]"}`}>{version}</span><section className={`rounded-[22px] p-5 ${i === 0 ? "border-2 border-[#B8B4FF] bg-white" : "bg-white"}`}><div className="flex items-center justify-between"><h2 className="text-[15px] font-bold">{title}</h2><span className={`rounded-full px-3 py-2 text-[10px] font-bold ${i === 0 ? "bg-[#E6F7EF] text-[#17A46B]" : "bg-[#F4F5F9] text-[#8E90A0]"}`}>{state}</span></div><p className="mt-2 text-[13px] font-semibold">{summary}</p><p className={`mt-2 text-[11px] ${muted}`}>{time}</p>{i === 0 && <p className="mt-3 text-[11px] font-bold text-[#17A46B]"><CheckCircle2 className="mr-1 inline" size={16} />둘 다 확인함 · 11:02</p>}</section></div>)}</div></main><Bottom><Outline onClick={restart}><FileDown className="mr-2 inline" size={18} />전체 기록 PDF로 저장</Outline></Bottom></Page>
  );
}

export function ConsumerDemo() {
  const [screen, setScreen] = useState(1);
  const go = (target: number) => setScreen(Math.min(12, Math.max(1, target)));
  const next = () => go(screen + 1);
  const back = () => go(screen - 1);
  let content: ReactNode;
  switch (screen) {
    case 1: content = <ConsumerHome next={next} go={go} />; break;
    case 2: content = <Conditions next={next} back={back} />; break;
    case 3: content = <Capture next={next} back={back} />; break;
    case 4: content = <ConfirmItems next={next} back={back} />; break;
    case 5: content = <ScopeSummary next={next} back={back} go={go} />; break;
    case 6: content = <OnsiteApproval next={next} back={back} />; break;
    case 7: content = <Completion next={next} back={back} />; break;
    case 8: content = <Analysis next={next} back={back} />; break;
    case 9: content = <Analysis next={next} back={back} sheet />; break;
    case 10: content = <Invite next={next} back={back} />; break;
    case 11: content = <Revision next={next} back={back} />; break;
    default: content = <History back={back} restart={() => go(1)} />;
  }
  return <MobileFrame>{content}</MobileFrame>;
}

export default ConsumerDemo;
