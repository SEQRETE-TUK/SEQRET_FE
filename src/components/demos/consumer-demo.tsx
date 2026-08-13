"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
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
  LoaderCircle,
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
import { DemoFeedbackProvider, useDemoFeedback } from "@/components/demos/demo-feedback";
import { DemoLinkState } from "@/components/demos/demo-link-state";
import { useDemoQuery } from "@/components/demos/use-demo-query";
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

function Outline({ children, onClick, danger = false, disabled = false }: { children: ReactNode; onClick?: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <Button disabled={disabled} onClick={onClick} variant={danger ? "destructive" : "outline"} size="cta">
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
  return <div className={`demo-screen-enter flex min-h-[880px] flex-col bg-[#F4F5F9] ${ink}`}>{children}</div>;
}

function ConsumerHome({ next, go }: { next: () => void; go: (screen: number) => void }) {
  const notify = useDemoFeedback();
  return (
    <Page>
      <StatusBar />
      <main className="flex-1 px-6 pb-6 pt-3">
        <div className="mb-6 flex items-center justify-between">
          <strong className="text-[24px] font-extrabold tracking-[-1px] text-[#4F46E5]">짐싸</strong>
          <button aria-label="내 정보" onClick={() => notify("내 정보는 MVP 데모에서 링크 권한 안내로 제공돼요.")} className="grid size-9 place-items-center rounded-full bg-white text-[#B4B6C3]"><CircleUserRound size={29} /></button>
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
        <button onClick={() => notify("승인되지 않은 변경은 현재 확정 총액에 반영되지 않아요.")} className={`${card} flex w-full items-center gap-3 p-4 text-left`}><span className="grid size-8 place-items-center rounded-full bg-[#E6F7EF] text-[#17A46B]"><ShieldCheck size={19} /></span><div><p className="text-[15px] font-bold">안심+ 보호가 적용 중이에요</p><p className={`text-[12px] ${muted}`}>승인 없는 추가금은 확정 금액에 반영되지 않아요</p></div><ChevronRight className="ml-auto text-[#B7B9C5]" size={16} /></button>
        <p className={`mb-2 mt-6 text-[13px] font-semibold ${muted}`}>새 이사를 준비하시나요?</p>
        <Outline onClick={next}><Plus className="mr-1 inline" size={17} /> 새 작업 만들기</Outline>
      </main>
      <nav className="grid grid-cols-4 border-t border-[#E9EAF2] bg-white pb-6 pt-3 text-center text-[10px] text-[#8E90A0]">
        {([[Home, "홈"], [Truck, "내 이사"], [ClipboardList, "기록"], [UserRound, "내 정보"]] as const).map(([Icon, label], i) => (
          <button
            key={label}
            onClick={() => {
              if (label === "홈") go(1);
              if (label === "내 이사") go(5);
              if (label === "기록") go(12);
              if (label === "내 정보") notify("내 정보 화면은 해커톤 MVP 범위에서 제외돼요.");
            }}
            className={`grid justify-items-center gap-1 ${i === 0 ? "font-bold text-[#191927]" : ""}`}
          >
            <Icon size={21} />
            {label}
          </button>
        ))}
      </nav>
    </Page>
  );
}

function Conditions({ next, back }: { next: () => void; back: () => void }) {
  const [elevator, setElevator] = useState("없어요");
  const [ladder, setLadder] = useState("모름");
  const [drop, setDrop] = useState("현장 확인 필요");
  const [saving, setSaving] = useState(false);
  const notify = useDemoFeedback();
  const choices = (items: string[], value: string, set: (value: string) => void) => (
    <div className="grid grid-cols-3 gap-2">{items.map((item) => <button key={item} onClick={() => set(item)} className={`h-14 rounded-2xl border text-[14px] font-bold ${value === item ? (item.includes("모름") || item.includes("확인") ? "border-[#F5A623] bg-[#FFF6E5] text-[#9B6400]" : "border-[#191927] bg-[#191927] text-white") : "border-[#E0E2EC] bg-white text-[#8E90A0]"}`}>{item}</button>)}</div>
  );
  return (
    <Page>
      <StatusBar /><div className="flex items-center justify-between px-5"><BackButton onClick={back} /><Dots current={2} /><span className={`text-[13px] font-bold ${muted}`}>2/4</span></div>
      <main className="flex-1 px-6 pb-5 pt-5">
        <h1 className="text-[24px] font-extrabold leading-[32px] tracking-[-0.5px]">도착지 조건을<br />알려주세요</h1><p className={`mt-1 text-[13px] ${muted}`}>모르면 ‘모름’을 선택해도 돼요 — 업체가 확인해 드려요</p>
        <Card className="mt-5 flex items-center gap-3 p-5"><span className="grid size-8 place-items-center rounded-full bg-[#F4F5F9]"><MapPin size={20} /></span><div><p className="text-[14px] font-bold">성동구 행당동 · 빌라 3층</p><p className={`text-[12px] ${muted}`}>9월 12일 (토) 오전 8시 도착 예정</p></div><button onClick={() => notify("주소·주거형태 변경 입력을 다시 열었어요.")} className="ml-auto text-[12px] font-bold">변경</button></Card>
        <h2 className="mb-2 mt-7 text-[15px] font-bold">엘리베이터가 있나요?</h2>{choices(["있어요", "없어요", "모름"], elevator, setElevator)}
        {elevator === "없어요" && <p className="mt-2 rounded-xl bg-[#FFF6E5] px-4 py-3 text-[12px] font-bold text-[#9B6400]">3층 계단 작업 예상 — 사다리차 여부를 이어서 확인할게요</p>}
        <h2 className="mb-2 mt-6 text-[15px] font-bold">사다리차가 필요한가요?</h2>{choices(["필요", "불필요", "모름"], ladder, setLadder)}
        <h2 className="mb-2 mt-6 text-[15px] font-bold">짐을 내릴 위치는요?</h2><div className="grid grid-cols-2 gap-2">{["건물 바로 앞", "현장 확인 필요"].map((item) => <button key={item} onClick={() => setDrop(item)} className={`h-14 rounded-2xl border text-[14px] font-bold ${drop === item ? "border-[#F5A623] bg-[#FFF6E5] text-[#9B6400]" : "border-[#E0E2EC] bg-white text-[#8E90A0]"}`}>{item}</button>)}</div>
        <p className="mt-5 rounded-xl bg-[#EEF2FF] px-4 py-3 text-[12px] font-semibold text-[#4B4B5C]">‘모름’ 2건은 업체 검토 단계에서 함께 확정돼요</p>
      </main><Bottom><Primary disabled={saving} onClick={() => { if (saving) return; setSaving(true); window.setTimeout(next, 450); }}>{saving ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />조건 저장 중...</> : "다음 · 짐 알려주기"}</Primary></Bottom>
    </Page>
  );
}

function Capture({ next, back }: { next: () => void; back: () => void }) {
  const [zones, setZones] = useState([
    { name: "거실", detail: "0:24 · AI가 7개 짐 후보 발견", done: true },
    { name: "침실", detail: "0:19 · 업로드 완료", done: true },
    { name: "주방", detail: "지금 이 구역이에요", done: false },
  ]);
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const notify = useDemoFeedback();
  const activeIndex = Math.max(0, zones.findIndex((zone) => !zone.done));
  const activeZone = zones[activeIndex] ?? zones[0];
  const allDone = zones.every((zone) => zone.done);
  const completeZone = (index: number, detail: string) => setZones((current) => current.map((zone, item) => item === index ? { ...zone, done: true, detail } : zone));
  return (
    <Page><StatusBar /><div className="flex items-center justify-between px-5"><BackButton onClick={back} /><Dots current={3} /><span className={`text-[13px] font-bold ${muted}`}>3/4</span></div>
      <main className="flex-1 px-6 pb-4 pt-5"><h1 className="text-[24px] font-extrabold leading-[32px]">구역마다 한 번씩<br />천천히 찍어주세요</h1><p className={`mt-1 text-[13px] ${muted}`}>15~30초면 충분해요 · 얼굴·귀중품은 피해주세요</p>
        <section className="mt-5 rounded-[24px] bg-[#191927] p-4 text-white"><div className="relative grid h-36 place-items-center rounded-2xl bg-[#2B2B3E]"><span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold ${recording ? "bg-[#E5484D]" : "bg-white/15"}`}><Video className="mr-1 inline" size={13} /> {activeZone?.name ?? "촬영"} {recording ? "REC" : "READY"}</span><span className="absolute right-3 top-3 text-[12px] font-bold">{recording ? "0:14" : "0:00"}</span><button aria-label={recording ? "촬영 종료" : "촬영 시작"} onClick={() => { if (recording) { completeZone(activeIndex, "0:18 · 업로드 완료"); notify(`${activeZone?.name ?? "구역"} 촬영을 저장했어요.`); } setRecording(!recording); }} className={`grid size-12 place-items-center rounded-full border-[6px] border-white/70 ${recording ? "bg-white" : "bg-[#E5484D]"}`} /></div><div className="mt-4 flex items-center justify-between px-3 text-[12px]"><span>천천히 한 바퀴 돌며 큰 짐과 동선을 보여주세요</span><button onClick={() => notify("촬영을 건너뛰려면 사진 대체 또는 직접 입력을 선택해 주세요.")} className="rounded-full bg-white/10 px-3 py-2">넘어가기</button></div></section>
        <div className="mb-2 mt-6 flex justify-between text-[15px] font-bold"><span>촬영 현황</span><span>{zones.filter((zone) => zone.done).length}/{zones.length} 완료</span></div>
        {zones.map((zone, index) => <div key={zone.name} className={`mb-2 flex items-center gap-3 rounded-2xl border p-4 ${zone.done ? "border-transparent bg-white" : "border-[#818CF8] bg-[#EEF2FF]"}`}><span className={`grid size-7 place-items-center rounded-full ${zone.done ? "bg-[#E6F7EF] text-[#17A46B]" : "bg-[#4F46E5] text-white"}`}>{zone.done ? <Check size={17} /> : <Video size={16} />}</span><div><p className="text-[14px] font-bold">{zone.name}{!zone.done && index === activeIndex ? " — 촬영 필요" : ""}</p><p className={`text-[12px] ${zone.done ? muted : "text-[#4F46E5]"}`}>{zone.detail}</p></div>{zone.done && <button onClick={() => setZones((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, done: false, detail: "다시 촬영해 주세요" } : item))} className="ml-auto text-[12px] font-bold">다시 찍기</button>}</div>)}
        <div className="grid grid-cols-2 gap-2"><Outline onClick={() => { const name = `추가 구역 ${zones.length - 2}`; setZones((current) => [...current, { name, detail: "촬영 전", done: false }]); notify(`${name}을 추가했어요.`); }}><Plus className="mr-1 inline" size={16} /> 구역 추가</Outline><Outline onClick={() => { completeZone(activeIndex, "사진 3장 · 직접 입력으로 대체"); notify(`${activeZone?.name ?? "구역"}을 사진으로 대체했어요.`); }}><Camera className="mr-1 inline" size={16} /> 사진으로 대체</Outline></div>
      </main><Bottom><Primary onClick={() => { if (!allDone || submitting) return; setSubmitting(true); window.setTimeout(next, 500); }} disabled={!allDone || submitting}>{submitting ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />업로드 확인 중...</> : allDone ? "촬영 마치고 AI 분석 시작" : `남은 구역 ${zones.filter((zone) => !zone.done).length}개`}</Primary></Bottom></Page>
  );
}

function ConfirmItems({ next, back, openItems }: { next: () => void; back: () => void; openItems: () => void }) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const notify = useDemoFeedback();
  const answer = () => step === 1 ? setStep(2) : setDone(true);
  return (
    <Page><StatusBar /><main className="flex-1 px-6 pb-5"><div className="flex items-start justify-between"><div><h1 className="text-[24px] font-extrabold leading-[32px]">2가지만 확인하면<br />짐 목록이 끝나요</h1><p className={`mt-1 text-[13px] ${muted}`}>AI가 영상에서 21개를 찾았어요 · 19개 자동 확정</p></div><span className="grid size-16 place-items-center rounded-full border-[5px] border-[#4F46E5] text-[14px] font-extrabold text-[#4F46E5]">19/21</span></div>
        <section className={`${card} mt-6 p-5`}><span className="rounded-full bg-[#FFF6E5] px-4 py-2 text-[12px] font-bold text-[#9B6400]">확인 {step}/2</span><div className="mt-4 flex gap-4"><button aria-label="근거 영상 재생" onClick={() => notify("근거 영상의 해당 시점(0:08)을 열었어요.")} className="grid h-24 w-28 shrink-0 place-items-center rounded-2xl bg-[#E5E6EE] text-[#747785]"><CirclePlay size={38} fill="currentColor" className="text-[#747785]" /></button><div><h2 className="text-[17px] font-bold">{step === 1 ? "붙박이장인가요?" : "화분도 가져가나요?"}</h2><p className={`mt-1 text-[12px] ${muted}`}>{step === 1 ? "벽에 고정된 장은 운반에서 빠져요" : "직접 운반 여부를 확인해 주세요"}</p><div className="mt-2 h-2 w-24 rounded-full bg-[#E9EAF2]"><div className="h-2 w-1/2 rounded-full bg-[#F5A623]" /></div><p className="mt-1 text-[11px] font-bold text-[#9B6400]">AI 확신 {step === 1 ? 61 : 72}%</p></div></div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={answer} className="h-12 rounded-2xl bg-[#4F46E5] text-[14px] font-bold text-white">맞아요, {step === 1 ? "빼주세요" : "가져가요"}</button><button onClick={answer} className="h-12 rounded-2xl border border-[#E0E2EC] text-[14px] font-bold">아니요</button></div><p className={`mt-2 text-center text-[11px] ${muted}`}>다음 확인: 대형 화분 ×2 (거실)</p></section>
        <div className="mb-3 mt-7 flex justify-between text-[15px] font-bold"><span>자동 확정된 짐 19개</span><button onClick={openItems} className="text-[12px]">전체 보기</button></div><button onClick={openItems} className={`${card} flex w-full items-center gap-3 p-4 text-left`}><span className="grid size-9 place-items-center rounded-xl bg-[#F4F5F9]"><PackagePlus size={19} /></span><div><p className="text-[14px] font-bold">거실 7 · 침실 5 · 주방 4 · 베란다 3</p><p className={`text-[12px] ${muted}`}>수량 조절 · 근거 영상 연결됨</p></div><ChevronRight className="ml-auto" size={16} /></button><button onClick={openItems} className="mt-4 h-12 w-full rounded-2xl border border-dashed border-[#D8DAE5] bg-white text-[14px] font-semibold"><Plus className="mr-1 inline" size={16} /> 영상에 없는 짐 추가</button><p className="mt-4 rounded-xl bg-[#EEF2FF] px-4 py-3 text-[12px] font-semibold">가격은 여기서 정하지 않아요 — 업체가 이 목록으로 견적을 내요</p>
      </main><Bottom><Primary onClick={() => { if (!done || saving) return; setSaving(true); window.setTimeout(next, 450); }} disabled={!done || saving}>{saving ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />짐 목록 저장 중...</> : done ? "짐 목록 확정하기" : `확인 ${3 - step}건 남음`}</Primary><button onClick={back} className="mt-2 w-full py-1 text-[12px] text-[#8E90A0]">이전으로</button></Bottom></Page>
  );
}

function ScopeSummary({ next, back, go }: { next: () => void; back: () => void; go: (screen: number) => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const notify = useDemoFeedback();
  return (
    <Page><StatusBar /><Top onBack={back} title="작업범위 v3" aside={<button onClick={() => go(12)}>지난 버전</button>} /><main className="flex-1 px-6 pb-5"><Card className="p-5"><div className="flex justify-between"><span className={`text-[12px] ${muted}`}>한빛이사 제안 총액</span><Badge variant={confirmed ? "success" : "warning"}>{confirmed ? "양측 확인 · 잠김" : "내 확인 필요"}</Badge></div><p className="mt-2 text-[30px] font-extrabold tracking-[-0.5px]">1,280,000원</p><Badge className="mt-2" variant="danger">이전보다 +120,000</Badge><p className={`mt-4 text-[12px] ${muted}`}>5톤 1대 · 작업자 4명 · 6시간 · 소비자가 초대한 참여자</p></Card>
        <h2 className="mb-3 mt-6 text-[15px] font-bold">이번에 달라진 것</h2><button onClick={() => notify("침실 근거 영상 0:12와 업체 변경 사유를 열었어요.")} className="w-full rounded-2xl bg-[#FFF6E5] p-4 text-left"><div className="flex gap-3"><span className="grid size-8 place-items-center rounded-full bg-white text-[#F5A623]"><Plus size={20} /></span><div><p className="text-[14px] font-bold">피아노 전문 인력 1명 추가</p><p className="mt-1 text-[12px] text-[#9B6400]">사유: 안전 운반 · 침실 영상 근거 →</p></div><strong className="ml-auto text-[14px] text-[#E5484D]">+120,000</strong></div></button>
        <h2 className="mb-3 mt-6 text-[15px] font-bold">그대로인 것</h2><section className={`${card} space-y-2 p-4 text-[13px] font-semibold`}><p><Check className="mr-2 inline" size={17} />짐 21개 · 포장·운반·정리 · 냉장고 문 분리</p><p><Check className="mr-2 inline" size={17} />기본 견적 1,160,000원</p><p className="text-[#E5484D]"><X className="mr-2 inline" size={17} />제외: 폐기물 처리 · 입주청소</p></section>
        <h2 className="mb-3 mt-6 text-[15px] font-bold">함께 확인하는 사람</h2><section className={`${card} flex items-center p-4`}><span className={`grid size-9 place-items-center rounded-full ${confirmed ? "bg-[#17A46B] text-white" : "bg-[#F4F5F9] text-[#8E90A0]"}`}>나</span><span className="-ml-1 grid size-9 place-items-center rounded-full bg-[#17A46B] text-[11px] text-white">한</span><div className="ml-3"><p className="text-[14px] font-bold">{confirmed ? "나 확인함 · 한빛이사 확인함" : "나 확인 대기 · 한빛이사 확인함"}</p><p className={`text-[12px] ${muted}`}>{confirmed ? "v3가 승인본으로 잠겼어요" : "내가 확인하면 이 버전이 승인본으로 잠겨요"}</p></div></section><p className="mt-4 rounded-xl bg-[#EEF2FF] px-4 py-3 text-[12px] font-semibold">확인은 서명이 아니라 ‘같은 내용을 봤다’는 기록이에요</p>
        {confirmed && <div className="demo-pop mt-4 rounded-2xl bg-[#E6F7EF] p-4"><p className="text-[13px] font-bold text-[#17A46B]">v3 공동확인 완료</p><p className={`mt-1 text-[12px] ${muted}`}>이제 업체가 승인본 기준으로 배차·인력을 확정할 수 있어요.</p><Link className="mt-3 flex h-11 items-center justify-center rounded-xl bg-[#191927] text-[13px] font-bold text-white" href="/provider?screen=3">업체 배차 화면으로 이어보기</Link></div>}
      </main><Bottom>{confirmed ? <Outline onClick={next}>현장 변경 승인 데모 바로보기</Outline> : <div className="grid grid-cols-[2fr_1fr] gap-2"><Primary disabled={confirming} onClick={() => { if (confirming) return; setConfirming(true); window.setTimeout(() => { setConfirming(false); setConfirmed(true); notify("소비자 확인을 기록했고 v3가 양측 확인 완료 상태로 잠겼어요."); }, 500); }}>{confirming ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />확인 기록 중...</> : "이 내용대로 확인"}</Primary><Outline onClick={() => go(11)}>수정 요청</Outline></div>}</Bottom></Page>
  );
}

function OnsiteApproval({ next, back }: { next: () => void; back: () => void }) {
  const [decisionMode, setDecisionMode] = useState<"explain" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [response, setResponse] = useState("");
  const [approved, setApproved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const notify = useDemoFeedback();
  const sendDecision = () => {
    if (!decisionMode || !note.trim()) return;
    const label = decisionMode === "explain" ? "설명 요청됨" : "거절됨";
    setResponse(`${label} · 11:04`);
    setDecisionMode(null);
    setNote("");
    notify(`${label} 상태로 기록했어요.`);
  };
  return (
    <Page><StatusBar /><div className="px-6 pt-4"><h2 className="text-[17px] font-bold">오늘 · 이사 진행 중</h2><section className="mt-3 rounded-2xl bg-white/60 p-4"><p className="text-[14px] font-bold">09:40 상차 완료 · 도착지 이동 중</p><p className={`text-[12px] ${muted}`}>한빛이사 김도윤 팀 · 확정 1,280,000원</p></section></div><div className="mt-4 flex flex-1 flex-col rounded-t-[28px] bg-white px-6 pb-7 pt-3"><div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#DFE1EA]" /><div className="flex items-center justify-between"><span className={`rounded-full px-3 py-2 text-[11px] font-bold ${approved ? "bg-[#E6F7EF] text-[#17A46B]" : "bg-[#FDECEC] text-[#E5484D]"}`}>{approved ? "승인 완료 · v4" : "현장 추가 요청"}</span><button aria-label="닫기" onClick={back}><X size={22} className="text-[#8E90A0]" /></button></div><h1 className="mt-4 text-[24px] font-extrabold leading-[32px]">사다리차 150,000원,<br />승인하시겠어요?</h1><p className={`mt-1 text-[13px] ${muted}`}>김도윤 기사 · 10:55 · 도착지 엘리베이터 고장</p>{response && <p className="mt-3 rounded-xl bg-[#FFF6E5] px-4 py-3 text-[12px] font-bold text-[#9B6400]">{response} · 기존 승인본 v3과 1,280,000원은 그대로 유지돼요</p>}<div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#F4F5F9] p-5"><p className={`text-[12px] ${muted}`}>현재 금액</p><strong className="mt-3 block text-[20px]">1,280,000원</strong><p className={`mt-3 text-[11px] ${muted}`}>승인 전에는<br />기존 총액 유지</p></div><div className="rounded-2xl border-2 border-[#4F46E5] bg-[#EEF2FF] p-5"><p className="text-[12px] font-bold text-[#4F46E5]">승인 후 총액</p><strong className="mt-3 block text-[20px] text-[#4F46E5]">1,430,000원</strong><p className={`mt-3 text-[11px] ${muted}`}>증감액 +150,000원<br />새 버전 v4 생성</p></div></div><h2 className="mb-2 mt-5 text-[15px] font-bold">현장 증빙 2건</h2><div className="grid grid-cols-2 gap-3">{['고장 엘리베이터','안내문'].map((label, i) => <button onClick={() => notify(`${label} 증빙을 크게 열었어요.`)} key={label} className="demo-interactive-card relative grid h-28 place-items-center rounded-2xl bg-[#E5E6EE]"><span className="grid size-8 place-items-center rounded-full bg-[#747785] text-white">{i ? <ClipboardList size={17} /> : <Play size={17} fill="white" />}</span><span className="absolute bottom-2 left-2 rounded bg-[#5A5C68] px-2 py-1 text-[10px] font-bold text-white">{label}</span></button>)}</div><p className="mt-4 rounded-xl bg-[#F4F5F9] px-4 py-3 text-[12px] font-semibold">구두 동의는 승인으로 기록되지 않아요 · 여기서 응답해야 반영돼요</p>{approved && <div className="demo-pop mt-4 rounded-2xl bg-[#E6F7EF] p-4"><p className="text-[13px] font-bold text-[#17A46B]">변경 승인 완료 · v4 생성</p><p className={`mt-1 text-[12px] ${muted}`}>작업자는 승인된 새 범위로 작업을 계속할 수 있어요.</p><Link className="mt-3 flex h-11 items-center justify-center rounded-xl bg-[#191927] text-[13px] font-bold text-white" href="/crew?screen=4">작업자 완료 기록으로 이어보기</Link></div>}<div className="mt-auto">{approved ? <Outline onClick={next}>고객 완료 화면 바로보기</Outline> : <><Primary disabled={submitting} onClick={() => { if (submitting) return; setSubmitting(true); window.setTimeout(() => { setApproved(true); setSubmitting(false); notify("변경을 승인했고 v4가 생성됐어요."); }, 550); }}>{submitting ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />처리 중...</> : "승인하기 · 1,430,000원"}</Primary><div className="mt-3 grid grid-cols-2 gap-2"><Outline onClick={() => setDecisionMode("explain")}>설명 요청</Outline><button onClick={() => setDecisionMode("reject")} className="font-bold text-[#E5484D]">거절할게요</button></div></>}</div></div>
      <Sheet open={decisionMode !== null} onOpenChange={(open) => !open && setDecisionMode(null)}><SheetContent><SheetHeader><SheetTitle>{decisionMode === "reject" ? "변경을 거절할까요?" : "어떤 설명이 더 필요한가요?"}</SheetTitle><SheetDescription>응답과 시각은 변경요청 기록에 남고 기존 승인본은 덮어쓰지 않아요.</SheetDescription></SheetHeader><div className="px-6"><textarea aria-label="변경 응답 사유" value={note} onChange={(event) => setNote(event.target.value.slice(0, 2000))} placeholder={decisionMode === "reject" ? "거절 사유를 입력해 주세요" : "추가로 확인하고 싶은 내용을 입력해 주세요"} className="h-32 w-full resize-none rounded-2xl bg-[#F4F5F9] p-4 text-[13px] outline-none" /><p className={`mt-2 text-right text-[11px] ${muted}`}>{note.length}/2000</p></div><SheetFooter><Primary disabled={!note.trim()} onClick={sendDecision}>{decisionMode === "reject" ? "거절 보내기" : "설명 요청 보내기"}</Primary></SheetFooter></SheetContent></Sheet>
    </Page>
  );
}

function Completion({ next, back, demoState = "" }: { next: () => void; back: () => void; demoState?: string }) {
  const [extra, setExtra] = useState(false);
  const [roomIndex, setRoomIndex] = useState(0);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueType, setIssueType] = useState("작업 누락");
  const [issueNote, setIssueNote] = useState("");
  const [issueSent, setIssueSent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [mediaRetried, setMediaRetried] = useState(false);
  const [dataRetried, setDataRetried] = useState(false);
  const notify = useDemoFeedback();
  const rooms = ["거실", "침실", "주방·베란다"];
  const mediaFailed = demoState === "completion-media-error" && !mediaRetried;
  const dataFailed = demoState === "completion-data-error" && !dataRetried;
  const requestBlocked = demoState === "completion-request-expired" || demoState === "completion-request-revoked" || demoState === "completion-already-confirmed";
  const requestMessage = demoState === "completion-request-expired" ? "완료 확인 요청의 응답 기간이 끝났어요. 업체에 새 요청을 부탁해 주세요." : demoState === "completion-request-revoked" ? "업체가 이 완료 확인 요청을 철회했어요. 현재 요청에는 응답할 수 없어요." : demoState === "completion-already-confirmed" ? "이미 완료 확인한 요청이에요. 확인 시각과 결과는 감사 기록에 보존돼요." : "";
  return (
    <Page><StatusBar /><Top onBack={back} title="이사 완료" aside={<span className="rounded-full bg-[#E6F7EF] px-3 py-2 text-[#17A46B]">작업 종료</span>} /><main className="flex-1 px-6 pb-5"><h1 className="mt-2 text-[24px] font-extrabold">고생하셨어요!</h1><p className={`mt-1 text-[13px] ${muted}`}>완료 기록과 최종 금액을 확인하고 마무리해 주세요</p>{requestBlocked && <div className={`demo-pop mt-4 rounded-2xl p-4 ${demoState === "completion-already-confirmed" ? "bg-[#E6F7EF] text-[#176B4A]" : "border border-[#F5A623] bg-[#FFF6E5] text-[#9A6200]"}`}><p className="text-[13px] font-bold">{demoState === "completion-already-confirmed" ? "완료 확인됨 · 14:28" : "현재 요청에 응답할 수 없어요"}</p><p className="mt-1 text-xs leading-5 text-[#4B4B5C]">{requestMessage}</p></div>}{issueSent && <p className="mt-3 rounded-xl bg-[#FFF6E5] px-4 py-3 text-[12px] font-bold text-[#9B6400]">문제 신고가 접수됐어요 · 완료 확인과 별도로 기록됩니다</p>}{dataFailed && <div className="demo-pop mt-4 rounded-2xl border border-[#F5A623] bg-[#FFF6E5] p-4"><div className="flex gap-3"><AlertTriangle className="shrink-0 text-[#F5A623]" size={20} /><div><p className="text-[13px] font-bold text-[#9A6200]">최종 범위와 금액을 불러오지 못했어요</p><p className="mt-1 text-xs text-[#4B4B5C]">완료 확인은 데이터가 복구될 때까지 막아두었어요.</p></div></div><button onClick={() => { setDataRetried(true); notify("최종 범위와 금액을 다시 불러왔어요."); }} className="mt-3 text-[12px] font-bold text-[#4F46E5]">다시 불러오기</button></div>}<section className={`${card} mt-5 p-5`}><div className="flex justify-between"><h2 className="text-[15px] font-bold">전 · 후 비교</h2><button onClick={() => setRoomIndex((roomIndex + 1) % rooms.length)} className="rounded-full bg-[#F4F5F9] px-4 py-2 text-[11px] font-bold">{rooms[roomIndex]} <ChevronDown className="inline" size={13} /></button></div>{mediaFailed ? <div className="demo-pop mt-3 grid h-36 place-items-center rounded-2xl border border-dashed border-[#F5A623] bg-[#FFF6E5] px-5 text-center"><div><AlertTriangle className="mx-auto text-[#F5A623]" size={25} /><p className="mt-2 text-[13px] font-bold text-[#9A6200]">완료 사진 1장을 불러오지 못했어요</p><button onClick={() => { setMediaRetried(true); notify("실패한 완료 사진만 다시 불러왔어요."); }} className="mt-2 text-[12px] font-bold text-[#4F46E5]">사진 다시 불러오기</button></div></div> : <button aria-label="전후 기록 크게 보기" onClick={() => notify(`${rooms[roomIndex]} 작업 전후 기록을 크게 열었어요.`)} className="demo-interactive-card relative mt-3 grid h-36 w-full grid-cols-2 overflow-hidden rounded-2xl bg-[#DADBE4]"><div className="border-r-2 border-white" /><div /><span className="absolute left-2 top-3 rounded bg-[#747785] px-2 py-1 text-[10px] text-white">전 09.10</span><span className="absolute right-2 top-3 rounded bg-[#191927] px-2 py-1 text-[10px] text-white">후 09.12</span><span className="absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#4F46E5] text-white">↔</span></button>}<p className={`mt-3 text-[11px] ${muted}`}>사람이 전후 기록을 확인하는 자료예요 · 파손·원인·책임을 자동 판단하지 않아요</p></section><section className={`${card} mt-4 p-5`}><p className={`text-[12px] ${muted}`}>최종 확정 금액 · v4</p><div className="mt-2 flex items-center justify-between"><strong className="text-[30px] font-extrabold">{dataFailed ? "—" : "1,430,000원"}</strong><span className="rounded-full bg-[#E6F7EF] px-3 py-2 text-[11px] font-bold text-[#17A46B]">승인 변경 +150,000원</span></div><p className={`mt-2 text-[11px] ${muted}`}>{dataFailed ? "데이터를 다시 불러와 주세요" : "기본 합의 1,280,000원 + 승인된 현장 변경 150,000원"}</p></section><section className={`${card} mt-4 p-5`}><h2 className="text-[15px] font-bold">기록에 없는 추가금 요구가 있었나요?</h2><p className={`mt-1 text-[12px] ${muted}`}>완료 후 제품 지표 확인을 위한 질문이에요</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setExtra(false)} className={`h-14 rounded-2xl font-bold ${!extra ? "bg-[#191927] text-white" : "border border-[#E0E2EC]"}`}>아니요, 없었어요</button><button onClick={() => setExtra(true)} className={`h-14 rounded-2xl font-bold ${extra ? "bg-[#191927] text-white" : "border border-[#E0E2EC]"}`}>네, 있었어요</button></div><p className={`mt-3 text-[11px] ${muted}`}>완료 확인은 작업 종료 사실의 기록이며 파손 없음이나 권리 포기를 의미하지 않아요</p></section></main><Bottom><div className="grid grid-cols-[2fr_1fr] gap-2"><Primary disabled={confirming || dataFailed || requestBlocked} onClick={() => { if (confirming || dataFailed || requestBlocked) return; setConfirming(true); window.setTimeout(() => { notify("완료 확인을 기록했어요."); next(); }, 500); }}>{confirming ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />확인 기록 중...</> : requestBlocked ? demoState === "completion-already-confirmed" ? "이미 완료 확인함" : "현재 요청 응답 불가" : dataFailed ? "데이터 복구 후 확인 가능" : "완료 확인"}</Primary><Outline disabled={requestBlocked} onClick={() => setIssueOpen(true)}>문제 신고</Outline></div></Bottom>
      <Sheet open={issueOpen} onOpenChange={setIssueOpen}><SheetContent><SheetHeader><SheetTitle>어떤 문제가 있었나요?</SheetTitle><SheetDescription>신고는 완료 확인과 별도로 감사 기록에 남아요.</SheetDescription></SheetHeader><div className="px-6"><div className="grid grid-cols-2 gap-2">{["작업 누락", "파손", "금액", "기타"].map((type) => <button key={type} onClick={() => setIssueType(type)} className={`h-12 rounded-xl border text-[13px] font-bold ${issueType === type ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]" : "border-[#E9EAF2]"}`}>{type}</button>)}</div><textarea aria-label="문제 신고 상세" value={issueNote} onChange={(event) => setIssueNote(event.target.value.slice(0, 2000))} placeholder="상세 내용을 입력해 주세요" className="mt-4 h-32 w-full resize-none rounded-2xl bg-[#F4F5F9] p-4 text-[13px] outline-none" /><p className={`mt-2 text-right text-[11px] ${muted}`}>{issueNote.length}/2000</p></div><SheetFooter><Primary disabled={!issueNote.trim() || reporting} onClick={() => { if (reporting) return; setReporting(true); window.setTimeout(() => { setReporting(false); setIssueSent(true); setIssueOpen(false); setIssueNote(""); notify(`${issueType} 문제 신고를 접수했어요.`); }, 500); }}>{reporting ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />접수 중...</> : "문제 신고 접수"}</Primary></SheetFooter></SheetContent></Sheet>
    </Page>
  );
}

function Analysis({ next, back, sheet = false, demoState = "" }: { next: () => void; back: () => void; sheet?: boolean; demoState?: string }) {
  const [sofa, setSofa] = useState(1);
  const [tv, setTv] = useState(1);
  const [plants, setPlants] = useState(2);
  const [failed, setFailed] = useState(demoState === "analysis-failed");
  const [retrying, setRetrying] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [notificationSet, setNotificationSet] = useState(false);
  const notify = useDemoFeedback();
  const retry = () => {
    if (retrying) return;
    setRetrying(true);
    window.setTimeout(() => {
      setRetrying(false);
      setFailed(false);
      notify("AI 분석을 다시 시작했어요. 기존 입력과 완료된 업로드는 그대로 유지돼요.");
    }, 650);
  };
  return (
    <Page><StatusBar /><Top onBack={back} title={sheet ? "짐 목록" : "영상 분석"} aside={sheet ? "거실 7" : "8/12"} /><main className="flex-1 px-5 pb-5"><h1 className="mt-1 text-[24px] font-extrabold">{sheet ? "거실 짐을 확인해 주세요" : failed ? "분석을 완료하지 못했어요" : analysisDone ? "분석이 끝났어요" : "분석이 끝나면 알려드릴까요?"}</h1><p className="mt-2 text-[15px] font-bold text-[#4B4B5C]">{sheet ? "수량과 운반 옵션은 언제든 수정할 수 있어요." : failed ? "촬영과 입력 내용은 그대로 보존되어 있어요." : analysisDone ? "확인 필요한 항목 2개만 검수하면 돼요." : "앱을 닫아도 분석은 계속돼요."}</p>{!sheet && (failed ? <><section className={`${card} demo-pop mt-5 border border-[#F5A623] p-6`}><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#FFF6E5] text-[#F5A623]"><AlertTriangle size={23} /></span><div><h2 className="text-[17px] font-bold">AI 분석에 일시적인 오류가 생겼어요</h2><p className={`mt-2 text-[13px] leading-5 ${muted}`}>완료된 거실·침실 업로드와 사용자가 입력한 값은 지우지 않았어요. 재시도하거나 직접 입력으로 계속할 수 있어요.</p><p className="mt-2 text-[11px] font-bold text-[#9B6400]">ANALYSIS_TEMPORARY_ERROR · retry 0/3</p></div></div><Button disabled={retrying} onClick={retry} className="mt-5 w-full" size="cta" variant="outline">{retrying ? <><LoaderCircle className="demo-spin" size={18} />재시도 중...</> : "분석 다시 시도"}</Button></section><section className={`${card} mt-5 flex gap-3 border border-[#E9EAF2] p-5`}><Info size={24} /><div><h2 className="text-[17px] font-bold">AI 없이도 계속할 수 있어요</h2><p className="mt-2 text-[12px]">사진과 체크리스트로 품목을 직접 입력해도 업체 초대와 공동확인까지 진행할 수 있어요.</p><button onClick={() => { notify("AI 실패 상태에서 직접 입력 모드로 전환했어요."); next(); }} className="mt-3 text-[12px] font-bold text-[#4F46E5]">직접 입력으로 계속 <ChevronRight className="inline" size={16} /></button></div></section></> : <><section className={`${card} mt-5 flex items-center gap-5 border border-[#E9EAF2] p-6`}><div className={`grid size-24 shrink-0 place-items-center rounded-full border-[7px] ${analysisDone ? "border-[#17A46B]" : "border-[#4F46E5] border-r-[#E0E7FF]"}`}><strong className="text-[20px]">{analysisDone ? "100%" : "60%"}</strong><span className="-mt-5 text-[11px] font-bold">{analysisDone ? "완료" : "분석 중"}</span></div><div><h2 className="text-[17px] font-bold">{analysisDone ? "모든 구역 분석 완료" : "주방을 확인하고 있어요"}</h2><p className="mt-3 text-[13px]">{analysisDone ? "21개 품목 후보 · 확인 필요 2개" : "거실·침실 분석 완료"}</p><div className="my-3 h-px bg-[#E9EAF2]" /><p className="text-[12px] font-semibold"><span className={`${analysisDone ? "" : "demo-pulse"} mr-2 inline-block size-2 rounded-full ${analysisDone ? "bg-[#17A46B]" : "bg-[#4F46E5]"}`} />{analysisDone ? "결과를 검수할 수 있어요" : "보통 1분 안에 끝나요"}</p></div></section><section className={`${card} mt-7 border border-[#E9EAF2] p-5`}><h2 className="text-[17px] font-bold">구역별 분석</h2>{[['거실','7개 발견',true],['침실','6개 발견',true],['주방',analysisDone ? '8개 발견' : '분석 중',analysisDone]].map(([room,status,done]) => <div key={String(room)} className="flex items-center gap-3 border-t border-[#E9EAF2] py-3"><span className={`grid size-7 place-items-center rounded-full ${done ? "bg-[#E6F7EF] text-[#17A46B]" : "text-[#4F46E5]"}`}>{done ? <Check size={16} /> : <LoaderCircle className="demo-spin" size={20} />}</span><p className="text-[15px] font-bold">{room}</p><span className="ml-auto text-[12px] font-bold text-[#4B4B5C]">{status}</span></div>)}</section><section className={`${card} mt-7 flex gap-3 border border-[#E9EAF2] p-5`}><Info size={24} /><div><h2 className="text-[17px] font-bold">입력 내용은 안전하게 저장돼요</h2><p className="mt-2 text-[12px]">영상과 입력값은 분석이 멈춰도 그대로 남아요.</p><button onClick={() => { notify("AI 분석 없이 직접 입력 모드로 전환했어요."); next(); }} className="mt-2 text-[12px] font-bold">계속 안 되면 직접 입력하기 <ChevronRight className="inline" size={16} /></button></div></section></>)}</main>{!sheet && <Bottom><Primary disabled={failed || !analysisDone} onClick={next}>{failed ? "분석 재시도 후 이용 가능" : analysisDone ? "분석 결과 확인하기" : "분석 완료 후 확인 가능"}</Primary>{!failed && !analysisDone && <Outline disabled={notificationSet} onClick={() => { if (notificationSet) return; setNotificationSet(true); notify("분석 완료 알림을 켰어요. 분석은 계속 진행돼요."); window.setTimeout(() => setAnalysisDone(true), 900); }}><Bell className="mr-2 inline" size={18} />{notificationSet ? "완료 알림 설정됨" : "완료되면 알림 받기"}</Outline>}</Bottom>}
      {sheet && (
        <Sheet open onOpenChange={(open) => !open && back()}>
          <SheetContent>
            <SheetHeader><SheetTitle>거실 짐 7개를 확인할까요?</SheetTitle><SheetDescription>수량과 운반 옵션을 바꿀 수 있어요</SheetDescription></SheetHeader>
            <div className="px-5">
              {sofa > 0 ? <Card className="border-[#E0E7FF] bg-[#EEF2FF] p-4"><div className="flex gap-3"><span className="grid size-11 place-items-center rounded-xl bg-white"><Sofa size={25} /></span><div><h2 className="text-[17px] font-bold">3인 소파</h2><p className="text-[12px]">일반 운반 · AI 93% · 근거 0:08</p></div><div className="ml-auto flex h-10 items-center gap-4 rounded-xl bg-white px-3"><button aria-label="소파 수량 줄이기" onClick={() => setSofa(Math.max(0, sofa - 1))}><Minus size={16} /></button><span>{sofa}</span><button aria-label="소파 수량 늘리기" onClick={() => setSofa(sofa + 1)}><Plus size={16} /></button></div></div><div className="mt-4 grid grid-cols-2 gap-2"><Outline onClick={() => notify("소파 옵션을 업체 포장 · 일반 운반으로 변경했어요.")}>옵션 변경</Outline><Outline danger onClick={() => setSofa(0)}>이 짐 빼기</Outline></div></Card> : <button onClick={() => setSofa(1)} className="w-full rounded-2xl bg-[#FDECEC] p-4 text-[13px] font-bold text-[#E5484D]">소파 제외됨 · 되돌리기</button>}
              <Card className="mt-3 flex items-center p-4"><span className="grid size-10 place-items-center rounded-xl bg-[#F4F5F9]"><Monitor size={23} /></span><strong className="ml-3 text-[17px]">TV 65인치</strong><div className="ml-auto flex h-10 items-center gap-4 rounded-xl bg-[#F4F5F9] px-3"><button aria-label="TV 수량 줄이기" onClick={() => setTv(Math.max(0, tv - 1))}><Minus size={15} /></button><span>{tv}</span><button aria-label="TV 수량 늘리기" onClick={() => setTv(tv + 1)}><Plus size={15} /></button></div></Card>
              <Card className="mt-3 flex items-center p-4"><span className="grid size-10 place-items-center rounded-xl bg-[#F4F5F9]"><Flower2 size={23} /></span><strong className="ml-3 text-[17px]">대형 화분</strong><div className="ml-auto flex h-10 items-center gap-4 rounded-xl bg-[#F4F5F9] px-3"><button aria-label="화분 수량 줄이기" onClick={() => setPlants(Math.max(0, plants - 1))}><Minus size={15} /></button><span>{plants}</span><button aria-label="화분 수량 늘리기" onClick={() => setPlants(plants + 1)}><Plus size={15} /></button></div></Card>
              <Button onClick={() => notify("접힌 품목 3개를 펼쳤어요: 책장 · 러그 · 스탠드")} variant="outline" className="mt-3 w-full justify-between"><span>책장 · 러그 · 스탠드 · 3개</span><ChevronRight /></Button>
              <Button onClick={() => notify("거실에 새 짐 입력 행을 추가했어요.")} variant="outline" className="mt-3 w-full border-dashed"><Plus />이 공간에 짐 추가</Button>
            </div>
            <SheetFooter><Primary onClick={() => { notify("짐 목록 수정을 저장했어요."); next(); }}>저장하고 돌아가기</Primary></SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </Page>
  );
}

function Invite({ next, back }: { next: () => void; back: () => void }) {
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const notify = useDemoFeedback();
  return (
    <Page><StatusBar /><Top onBack={back} /><main className="flex-1 px-6 pb-5"><h1 className="mt-4 text-[24px] font-extrabold leading-[32px]">계약한 업체를<br />초대해 주세요</h1><p className={`mt-1 text-[13px] ${muted}`}>업체는 가입 없이 링크로 들어와 짐 목록을 검토해요</p><section className={`mt-5 rounded-[24px] p-5 text-white ${revoked ? "bg-[#747785]" : "bg-[#4F46E5]"}`}><div className="flex gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white/15"><Link2 size={20} /></span><div><p className="text-[14px] font-bold">업체 전용 비밀 링크</p><p className="text-[11px] text-white/75">{revoked ? "기존 링크는 폐기됐어요" : "이 링크를 받은 업체만 들어올 수 있어요"}</p></div></div><div className="mt-4 rounded-xl bg-white/15 px-4 py-3 text-[13px] font-bold">{revoked ? "새 링크를 재발급해 주세요" : "jimsa.kr/j/MOVE-240912/p/8f2k...x9"}</div><div className="mt-3 grid grid-cols-2 gap-2"><button disabled={revoked} onClick={() => notify("카카오톡 공유용 초대 메시지를 준비했어요.")} className="h-12 rounded-xl bg-[#FEE500] font-bold text-[#191927] disabled:opacity-50"><Share2 className="mr-2 inline" size={17} />카카오톡 공유</button><button onClick={() => { if (revoked) { setRevoked(false); notify("새 업체 링크를 발급했어요."); } else { setCopied(true); notify("업체 링크를 복사했어요."); } }} className="h-12 rounded-xl bg-white font-bold text-[#4338CA]"><Copy className="mr-2 inline" size={17} />{revoked ? "재발급" : copied ? "복사됨" : "링크 복사"}</button></div></section><h2 className="mb-3 mt-7 text-[15px] font-bold">보낸 초대</h2><section className={`${card} mb-3 flex items-center p-4`}><span className="grid size-11 place-items-center rounded-xl bg-[#EEF2FF] text-[12px] font-bold text-[#4F46E5]">한빛</span><div className="ml-3"><p className="text-[15px] font-bold">한빛이사</p><p className={`text-[11px] ${muted}`}>오늘 14:02 · 수락 · 짐 목록 검토 중</p></div><button onClick={next} className="ml-auto rounded-full bg-[#E6F7EF] px-3 py-2 text-[11px] font-bold text-[#17A46B]">검토 보기</button></section><Link className="demo-interactive-card mb-3 flex min-h-12 items-center justify-between rounded-2xl border border-[#E0E7FF] bg-[#EEF2FF] px-4 text-[13px] font-bold text-[#4F46E5]" href="/provider?screen=0"><span>업체가 받은 초대 화면으로 이어보기</span><ChevronRight size={17} /></Link><section className={`${card} mb-3 flex items-center p-4`}><span className="grid size-11 place-items-center rounded-xl bg-[#F4F5F9] text-[12px] font-bold text-[#8E90A0]">두리</span><div className="ml-3"><p className="text-[15px] font-bold">두리익스프레스</p><p className={`text-[11px] ${muted}`}>{revoked ? "초대 폐기됨" : "어제 18:40 · 아직 열지 않음"}</p></div>{!revoked && <button onClick={() => { setRevoked(true); notify("대기 중인 링크를 폐기했어요."); }} className="ml-auto rounded-full bg-[#FDECEC] px-3 py-2 text-[11px] font-bold text-[#E5484D]">폐기</button>}</section></main><Bottom><Primary onClick={() => { setCopied(false); setRevoked(false); notify("새 업체 초대 링크를 하나 더 만들었어요."); }}><Plus className="mr-1 inline" size={17} /> 다른 업체도 초대하기</Primary></Bottom></Page>
  );
}

function Revision({ next, back }: { next: () => void; back: () => void }) {
  const [topics, setTopics] = useState(["짐 목록 수정", "작업 방식"]);
  const [note, setNote] = useState("화분 하나는 지인에게 드리기로 해서 빼주세요. 에어컨은 도착지 설치까지 가능한지 확인 부탁드려요.");
  const [photo, setPhoto] = useState(false);
  const [sending, setSending] = useState(false);
  const notify = useDemoFeedback();
  const toggle = (topic: string) => setTopics(topics.includes(topic) ? topics.filter((item) => item !== topic) : [...topics, topic]);
  return (
    <Page><StatusBar />
      <Sheet open onOpenChange={(open) => !open && back()}>
        <SheetContent>
          <SheetHeader><SheetTitle>어떤 점을 바꿀까요?</SheetTitle><SheetDescription>v3 기준 · 보내면 업체가 새 제안(v4)으로 답해요</SheetDescription></SheetHeader>
          <div className="px-6"><div className="grid grid-cols-2 gap-3">{["짐 목록 수정", "작업 방식", "금액 문의", "일정 · 조건"].map((topic) => { const selected = topics.includes(topic); return <button key={topic} onClick={() => toggle(topic)} className={`h-20 rounded-2xl border-2 p-4 text-left text-[13px] font-bold ${selected ? "border-[#4F46E5] bg-[#EEF2FF]" : "border-[#E9EAF2] text-[#8E90A0]"}`}><span className={`mb-3 grid size-6 place-items-center rounded-full ${selected ? "bg-[#4F46E5] text-white" : "bg-[#F4F5F9]"}`}>{selected && <Check size={14} />}</span>{topic}</button>})}</div><h2 className="mb-2 mt-6 text-[15px] font-bold">자세히 알려주세요</h2><textarea aria-label="수정 요청 내용" value={note} onChange={(event) => setNote(event.target.value.slice(0, 2000))} className="h-28 w-full resize-none rounded-2xl border-0 bg-[#F4F5F9] p-4 text-[13px] leading-6 outline-none" /><p className={`mt-1 text-right text-[11px] ${muted}`}>{note.length}/2000</p><div className="mt-4 grid grid-cols-[108px_1fr] gap-3"><Button onClick={() => setPhoto(!photo)} variant="outline" className="h-20 border-dashed text-[11px] text-[#8E90A0]"><Camera />{photo ? "사진 1장" : "사진 (선택)"}</Button><div className="rounded-2xl bg-[#F4F2FF] p-4 text-[11px]"><strong className="text-[#4F46E5]">보내면 어떻게 되나요?</strong><p className="mt-1">업체가 새 제안 버전으로 답하고, 양측이 같은 버전을 다시 확인해요</p></div></div></div>
          <SheetFooter><Primary onClick={() => { if (sending) return; setSending(true); window.setTimeout(() => { notify("수정 요청을 보냈고 상태가 ‘수정 요청됨’으로 바뀌었어요."); next(); }, 500); }} disabled={!topics.length || !note.trim() || sending}>{sending ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />전송 중...</> : "수정 요청 보내기"}</Primary></SheetFooter>
        </SheetContent>
      </Sheet>
    </Page>
  );
}

function History({ back }: { back: () => void }) {
  const notify = useDemoFeedback();
  const versions = [
    ["v4", "현장 변경 반영", "확정 · 잠김", "사다리차 승인 +150,000 → 1,430,000원", "09.12 11:02 · 변경요청 CR-010에서 자동 생성"],
    ["v3", "업체 수정안", "대체됨", "피아노 인력 +120,000 → 1,280,000원", "09.10 15:20 · 사유: 안전 운반 · 둘 다 확인"],
    ["v2", "내 수정 요청 반영", "대체됨", "대형 화분 2→1 · 1,160,000원", "09.09 20:11 · 업체 수정으로 내 확인 무효화"],
    ["v1", "AI 초안 기반 첫 제안", "대체됨", "물품 21개 · 1,160,000원", "09.09 18:03"],
  ];
  return (
    <Page><StatusBar /><Top onBack={back} /><main className="flex-1 px-6 pb-5"><h1 className="mt-2 text-[24px] font-extrabold leading-[32px]">금액이 어떻게<br />정해졌는지 볼까요?</h1><p className={`mt-1 text-[13px] ${muted}`}>확정 버전은 덮어쓰지 않고 이전 기록과 함께 보존돼요</p><div className="mt-5 grid grid-cols-4 rounded-2xl bg-white p-3 text-center text-[12px] font-bold text-[#8E90A0]">{['1,160,000','1,160,000','1,280,000','1,430,000'].map((price,i) => <span key={`${price}-${i}`} className={i === 3 ? "text-[#4F46E5]" : ""}>{price}<span className={`mx-auto mt-3 block h-1 w-14 rounded-full ${i === 3 ? "bg-[#4F46E5]" : i === 2 ? "bg-[#B8B4FF]" : "bg-[#E5E6EE]"}`} /></span>)}</div><div className="relative mt-7 space-y-4 before:absolute before:bottom-0 before:left-[21px] before:top-0 before:w-px before:bg-[#DFE1EA]">{versions.map(([version,title,state,summary,time],i) => <div key={version} className="relative pl-11"><span className={`absolute left-2 top-4 grid size-7 place-items-center rounded-full text-[10px] font-bold text-white ${i === 0 ? "bg-[#4F46E5]" : "bg-[#C7C9D3]"}`}>{version}</span><button onClick={() => notify(`${version} 상세 기록을 열었어요.`)} className={`w-full rounded-[22px] p-5 text-left ${i === 0 ? "border-2 border-[#B8B4FF] bg-white" : "bg-white"}`}><div className="flex items-center justify-between"><h2 className="text-[15px] font-bold">{title}</h2><span className={`rounded-full px-3 py-2 text-[10px] font-bold ${i === 0 ? "bg-[#E6F7EF] text-[#17A46B]" : "bg-[#F4F5F9] text-[#8E90A0]"}`}>{state}</span></div><p className="mt-2 text-[13px] font-semibold">{summary}</p><p className={`mt-2 text-[11px] ${muted}`}>{time}</p>{i === 0 && <p className="mt-3 text-[11px] font-bold text-[#17A46B]"><CheckCircle2 className="mr-1 inline" size={16} />둘 다 확인함 · 11:02</p>}</button></div>)}</div></main><Bottom><Outline onClick={() => notify("승인본과 변경 기록을 포함한 PDF를 준비했어요.")}><FileDown className="mr-2 inline" size={18} />전체 기록 PDF로 저장</Outline></Bottom></Page>
  );
}

export function ConsumerDemo() {
  const [screen, setScreen] = useState(1);
  const requestedScreen = useDemoQuery("screen");
  const demoState = useDemoQuery("state");
  useEffect(() => {
    const parsed = Number(requestedScreen);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) return;
    const timer = window.setTimeout(() => setScreen(parsed), 0);
    return () => window.clearTimeout(timer);
  }, [requestedScreen]);
  const go = (target: number) => setScreen(Math.min(12, Math.max(1, target)));
  const nextMap: Record<number, number> = { 1: 2, 2: 3, 3: 8, 8: 4, 4: 10, 9: 4, 10: 5, 11: 5, 5: 6, 6: 7, 7: 12, 12: 1 };
  const backMap: Record<number, number> = { 2: 1, 3: 2, 8: 3, 4: 8, 9: 4, 10: 4, 5: 10, 11: 5, 6: 5, 7: 6, 12: 7 };
  const next = () => go(nextMap[screen] ?? 1);
  const back = () => go(backMap[screen] ?? 1);
  let content: ReactNode;
  switch (screen) {
    case 1: content = <ConsumerHome next={next} go={go} />; break;
    case 2: content = <Conditions next={next} back={back} />; break;
    case 3: content = <Capture next={next} back={back} />; break;
    case 4: content = <ConfirmItems next={next} back={back} openItems={() => go(9)} />; break;
    case 5: content = <ScopeSummary next={next} back={back} go={go} />; break;
    case 6: content = <OnsiteApproval next={next} back={back} />; break;
    case 7: content = <Completion next={next} back={back} demoState={demoState} />; break;
    case 8: content = <Analysis next={next} back={back} demoState={demoState} />; break;
    case 9: content = <Analysis next={next} back={back} demoState={demoState} sheet />; break;
    case 10: content = <Invite next={next} back={back} />; break;
    case 11: content = <Revision next={next} back={back} />; break;
    default: content = <History back={back} />;
  }
  const linkState = demoState === "link-expired" || demoState === "link-revoked" || demoState === "link-invalid" ? demoState : null;
  return <DemoFeedbackProvider><MobileFrame>{linkState ? <><StatusBar /><DemoLinkState roleLabel="고객" state={linkState} /></> : <div key={screen} className="demo-screen-enter">{content}</div>}</MobileFrame></DemoFeedbackProvider>;
}

export default ConsumerDemo;
