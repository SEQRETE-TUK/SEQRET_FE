"use client";

import Link from "next/link";
import Image from "next/image";
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
  CircleUserRound,
  ClipboardList,
  FileDown,
  Flower2,
  Home,
  Info,
  LoaderCircle,
  MapPin,
  Minus,
  Monitor,
  PackagePlus,
  Play,
  Plus,
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

const ink = "text-ink-900";
const muted = "text-ink-400";
const card = "rounded-2xl bg-white";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button aria-label="이전 화면" onClick={onClick} className="grid size-11 place-items-center text-ink-900">
      <ArrowLeft size={22} strokeWidth={2} />
    </button>
  );
}

function Top({ onBack, title, aside }: { onBack: () => void; title?: string; aside?: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center justify-between bg-canvas/95 px-5 backdrop-blur-sm">
      <BackButton onClick={onBack} />
      {title && <p className="text-[17px] font-bold tracking-[-0.3px]">{title}</p>}
      <div className="min-w-11 text-right text-[13px] font-semibold text-ink-600 [&>button]:inline-flex [&>button]:min-h-11 [&>button]:items-center [&>button]:rounded-xl [&>button]:border [&>button]:border-line [&>button]:bg-white [&>button]:px-3">{aside}</div>
    </div>
  );
}

function Bottom({ children }: { children: ReactNode }) {
  return <div className="mt-auto border-t border-line bg-white px-6 pb-7 pt-4">{children}</div>;
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
      {[1, 2, 3, 4].map((dot) => <span key={dot} className={`size-2 rounded-full ${dot <= current ? "bg-primary-600" : "bg-primary-100"}`} />)}
    </div>
  );
}

function Page({ children }: { children: ReactNode }) {
  return <div className={`flex min-h-[880px] flex-col bg-canvas ${ink}`}>{children}</div>;
}

function ConsumerNav({ active, go }: { active: "home" | "move" | "records" | "profile"; go: (screen: number) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto grid w-full max-w-[440px] grid-cols-4 border-t border-line bg-white pb-6 pt-3 text-center text-[10px] text-ink-400">
      {([[Home, "홈", "home"], [Truck, "내 이사", "move"], [ClipboardList, "기록", "records"], [UserRound, "내 정보", "profile"]] as const).map(([Icon, label, id]) => (
        <button
          key={label}
          onClick={() => {
            if (id === "home") go(1);
            if (id === "move") go(14);
            if (id === "records") go(12);
            if (id === "profile") go(15);
          }}
          className={`grid min-h-11 justify-items-center gap-1 ${active === id ? "font-bold text-primary-700" : ""}`}
        >
          <Icon size={21} />
          {label}
        </button>
      ))}
    </nav>
  );
}

function MoveRoute({ onClick }: { onClick?: () => void }) {
  const content = (
    <>
      <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div><div className="flex items-center gap-2 text-[12px] font-bold text-ink-400"><MapPin size={16} />출발지</div><p className="mt-2 text-[16px] font-extrabold leading-6">마포구<br />성산동</p><p className="mt-1 text-[12px] text-ink-600">12층 · 엘리베이터</p></div>
        <span className="grid size-9 place-items-center rounded-full bg-canvas text-ink-600"><ArrowRight size={18} /></span>
        <div><div className="flex items-center gap-2 text-[12px] font-bold text-ink-400"><MapPin size={16} />목적지</div><p className="mt-2 text-[16px] font-extrabold leading-6">성동구<br />행당동</p><p className="mt-1 text-[12px] font-semibold text-warning-ink">3층 · 계단</p></div>
      </div>
      {onClick && <ChevronRight className="ml-auto shrink-0 text-ink-400" size={20} />}
    </>
  );
  return onClick ? <button className="flex w-full items-center text-left" onClick={onClick}>{content}</button> : <div className="flex items-center">{content}</div>;
}

function ConsumerHome({ go }: { go: (screen: number) => void }) {
  return (
    <Page>
      <StatusBar />
      <main className="flex-1 px-6 pb-28 pt-3">
        <div className="mb-7 flex items-center justify-between">
          <strong className="text-[24px] font-extrabold tracking-[-1px] text-primary-600">SEQRET</strong>
          <button aria-label="내 정보" onClick={() => go(15)} className="grid size-11 place-items-center text-ink-600"><CircleUserRound size={29} strokeWidth={1.8} /></button>
        </div>
        <h1 className="mb-5 text-[28px] font-extrabold leading-9 tracking-[-0.5px]">민서님, 이사까지<br />30일 남았어요</h1>
        <Card className="mb-7 overflow-hidden border-primary-100">
          <div className="p-5">
            <p className="text-[12px] font-bold text-ink-400">지금 확인할 일</p>
            <h2 className="mt-2 text-[20px] font-extrabold leading-7">한빛이사가 보낸<br />수정안을 확인해 주세요</h2>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-[13px]"><span className="text-ink-600">피아노 전문 인력 1명</span><strong className="text-danger-ink">+120,000원</strong></div>
          </div>
          <button onClick={() => go(5)} className="flex h-14 w-full items-center justify-between bg-primary-600 px-5 text-[15px] font-bold text-white">수정안 확인하기 <ArrowRight size={18} /></button>
        </Card>
        <div className="mb-3"><h2 className="text-[18px] font-bold">9월 12일 토요일</h2><p className="mt-1 text-[12px] text-ink-400">오전 8시 출발 예정</p><p className="mt-2 flex items-center gap-2 text-[13px] font-bold text-warning-ink"><span className="size-2 rounded-full bg-warning" />한빛이사 수정안 확인 대기</p></div>
        <Card className="p-5">
          <MoveRoute onClick={() => go(14)} />
          <div className="mt-5 flex items-end justify-between border-t border-line pt-4"><span className="text-[12px] font-semibold text-ink-400">현재 제안 금액</span><strong className="text-[20px]">1,280,000원</strong></div>
        </Card>
        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between"><div><p className="text-[12px] font-bold text-ink-400">견적 비교</p><h2 className="mt-1 text-[18px] font-extrabold">다른 업체 견적도 도착했어요</h2></div><button onClick={() => go(10)} className="min-h-11 px-2 text-[13px] font-bold text-primary-700">전체 3개</button></div>
          <div className="space-y-3">
            {[["두리익스프레스", "1,240,000원", "평점 4.8 · 포장이사"], ["바른이사", "1,310,000원", "평점 4.9 · 파손 보상"]].map(([name, price, detail]) => <button key={name} onClick={() => go(10)} className="flex min-h-[76px] w-full items-center rounded-2xl bg-white px-5 text-left"><span className="grid size-10 place-items-center rounded-xl bg-canvas text-[12px] font-extrabold text-ink-600">{name.slice(0, 2)}</span><span className="ml-3 flex-1"><b className="block text-[15px]">{name}</b><small className="mt-1 block text-[12px] text-ink-400">{detail}</small></span><strong className="text-[16px]">{price}</strong></button>)}
          </div>
        </section>
      </main>
      <ConsumerNav active="home" go={go} />
    </Page>
  );
}

function MoveHub({ go }: { go: (screen: number) => void }) {
  return (
    <Page>
      <StatusBar />
      <header className="flex h-14 items-center px-6"><h1 className="text-[22px] font-extrabold">내 이사</h1></header>
      <main className="flex-1 px-6 pb-28 pt-3">
        <p className="text-[13px] font-semibold text-ink-400">9월 12일 토요일 · 오전 8시</p>
        <h2 className="mt-1 text-[26px] font-extrabold leading-[34px]">출발지와 목적지</h2>
        <Card className="mt-5 p-5"><MoveRoute /></Card>

        <section className="mt-7">
          <p className="text-[12px] font-bold text-ink-400">다음 할 일</p>
          <Card className="mt-2 overflow-hidden border-primary-100">
            <div className="p-5"><h3 className="text-[18px] font-bold">업체 수정안 확인</h3><p className="mt-1 text-[13px] text-ink-600">피아노 인력 추가 · 제안 총액 1,280,000원</p></div>
            <button onClick={() => go(5)} className="flex h-14 w-full items-center justify-between bg-primary-600 px-5 text-[15px] font-bold text-white">내용 확인하기 <ArrowRight size={18} /></button>
          </Card>
        </section>

        <section className="mt-7">
          <h2 className="text-[17px] font-bold">이사 관리</h2>
          <Card className="mt-3 divide-y divide-line px-5">
            {([
              ["짐 목록", "21개 · 영상 3개", 4, PackagePlus],
              ["도착한 견적", "3개 업체가 신청했어요", 10, Truck],
              ["변경 기록", "현재 v3 · 이전 버전 2개", 12, ClipboardList],
            ] as const).map(([label, description, target, Icon]) => (
              <button className="flex min-h-[72px] w-full items-center gap-3 text-left" key={String(label)} onClick={() => go(Number(target))}>
                <span className="grid size-10 place-items-center rounded-xl bg-canvas text-ink-600"><Icon size={20} /></span>
                <span className="min-w-0 flex-1"><b className="block text-[15px]">{label as string}</b><small className="mt-0.5 block text-[12px] text-ink-400">{description as string}</small></span>
                <ChevronRight className="text-ink-400" size={18} />
              </button>
            ))}
          </Card>
        </section>

        <Button className="mt-6 w-full" onClick={() => go(2)} size="cta" variant="outline"><Plus size={18} />새 이사 준비하기</Button>
      </main>
      <ConsumerNav active="move" go={go} />
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
    <div className="grid grid-cols-3 gap-2">{items.map((item) => <button key={item} onClick={() => set(item)} className={`h-14 rounded-2xl border text-[14px] font-bold ${value === item ? (item.includes("모름") || item.includes("확인") ? "border-warning bg-warning-bg text-warning-ink" : "border-ink-900 bg-ink-900 text-white") : "border-[#E0E2EC] bg-white text-ink-400"}`}>{item}</button>)}</div>
  );
  return (
    <Page>
      <StatusBar /><div className="flex items-center justify-between px-5"><BackButton onClick={back} /><Dots current={2} /><span className={`text-[13px] font-bold ${muted}`}>2/4</span></div>
      <main className="flex-1 px-6 pb-5 pt-5">
        <h1 className="text-[22px] font-extrabold leading-[30px] tracking-[-0.5px]">도착지 조건을<br />알려주세요</h1><p className={`mt-1 text-[13px] ${muted}`}>모르면 ‘모름’을 선택해도 돼요 — 업체가 확인해 드려요</p>
        <Card className="mt-5 flex items-center gap-3 p-5"><span className="grid size-8 place-items-center rounded-full bg-canvas"><MapPin size={20} /></span><div><p className="text-[14px] font-bold">성동구 행당동 · 빌라 3층</p><p className={`text-[12px] ${muted}`}>9월 12일 (토) 오전 8시 도착 예정</p></div><button onClick={() => notify("주소·주거형태 변경 입력을 다시 열었어요.")} className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-[12px] font-bold">변경</button></Card>
        <h2 className="mb-2 mt-7 text-[15px] font-bold">엘리베이터가 있나요?</h2>{choices(["있어요", "없어요", "모름"], elevator, setElevator)}
        {elevator === "없어요" && <p className="mt-2 rounded-xl bg-warning-bg px-4 py-3 text-[12px] font-bold text-warning-ink">3층 계단 작업 예상 — 사다리차 여부를 이어서 확인할게요</p>}
        <h2 className="mb-2 mt-6 text-[15px] font-bold">사다리차가 필요한가요?</h2>{choices(["필요", "불필요", "모름"], ladder, setLadder)}
        <h2 className="mb-2 mt-6 text-[15px] font-bold">짐을 내릴 위치는요?</h2><div className="grid grid-cols-2 gap-2">{["건물 바로 앞", "현장 확인 필요"].map((item) => <button key={item} onClick={() => setDrop(item)} className={`h-14 rounded-2xl border text-[14px] font-bold ${drop === item ? "border-warning bg-warning-bg text-warning-ink" : "border-[#E0E2EC] bg-white text-ink-400"}`}>{item}</button>)}</div>
        <p className="mt-5 rounded-xl bg-primary-50 px-4 py-3 text-[12px] font-semibold text-ink-600">‘모름’ 2건은 업체 검토 단계에서 함께 확정돼요</p>
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
      <main className="flex-1 px-6 pb-4 pt-5"><h1 className="text-[22px] font-extrabold leading-[30px]">구역마다 한 번씩<br />천천히 찍어주세요</h1><p className={`mt-1 text-[13px] ${muted}`}>15~30초면 충분해요 · 얼굴·귀중품은 피해주세요</p>
        <section className="mt-5 rounded-[24px] bg-ink-900 p-4 text-white"><div className="relative grid h-36 place-items-center rounded-2xl bg-[#2B2B3E]"><span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold ${recording ? "bg-danger" : "bg-white/15"}`}><Video className="mr-1 inline" size={13} /> {activeZone?.name ?? "촬영"} {recording ? "REC" : "READY"}</span><span className="absolute right-3 top-3 text-[12px] font-bold">{recording ? "0:14" : "0:00"}</span><button aria-label={recording ? "촬영 종료" : "촬영 시작"} onClick={() => { if (recording) { completeZone(activeIndex, "0:18 · 업로드 완료"); notify(`${activeZone?.name ?? "구역"} 촬영을 저장했어요.`); } setRecording(!recording); }} className={`grid size-12 place-items-center rounded-full border-[6px] border-white/70 ${recording ? "bg-white" : "bg-danger"}`} /></div><div className="mt-4 flex items-center justify-between gap-3 px-3 text-[12px]"><span>천천히 한 바퀴 돌며 큰 짐과 동선을 보여주세요</span><button onClick={() => notify("촬영을 건너뛰려면 사진 대체 또는 직접 입력을 선택해 주세요.")} className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-white/10 px-3">넘어가기</button></div></section>
        <div className="mb-2 mt-6 flex justify-between text-[15px] font-bold"><span>촬영 현황</span><span>{zones.filter((zone) => zone.done).length}/{zones.length} 완료</span></div>
        {zones.map((zone, index) => <div key={zone.name} className={`mb-2 flex items-center gap-3 rounded-2xl border p-4 ${zone.done ? "border-transparent bg-white" : "border-primary-400 bg-primary-50"}`}><span className={`grid size-7 place-items-center rounded-full ${zone.done ? "bg-success-bg text-success-ink" : "bg-primary-600 text-white"}`}>{zone.done ? <Check size={17} /> : <Video size={16} />}</span><div><p className="text-[14px] font-bold">{zone.name}{!zone.done && index === activeIndex ? " — 촬영 필요" : ""}</p><p className={`text-[12px] ${zone.done ? muted : "text-primary-600"}`}>{zone.detail}</p></div>{zone.done && <button onClick={() => setZones((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, done: false, detail: "다시 촬영해 주세요" } : item))} className="ml-auto inline-flex min-h-11 items-center px-2 text-[12px] font-bold">다시 찍기</button>}</div>)}
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
    <Page><StatusBar /><main className="flex-1 px-6 pb-5"><div className="flex items-start justify-between"><div><h1 className="text-[22px] font-extrabold leading-[30px]">2가지만 확인하면<br />짐 목록이 끝나요</h1><p className={`mt-1 text-[13px] ${muted}`}>AI가 영상에서 찾은 짐 중 애매한 항목만 물어볼게요</p></div><span className="grid size-16 place-items-center rounded-full border-[5px] border-primary-600 text-[14px] font-extrabold text-primary-600">{done ? "21/21" : "19/21"}</span></div>
        <section className={`${card} mt-6 p-5`}><span className="text-[12px] font-bold text-warning-ink">확인 {step}/2</span><h2 className="mt-4 text-[19px] font-extrabold leading-7">{step === 1 ? "붙박이장인가요?" : "화분도 가져가나요?"}</h2><p className="mt-1 text-[14px] font-bold leading-5 text-ink-600">{step === 1 ? "벽에 고정된 장은 운반에서 빠져요" : "이삿짐에 포함할지 확인해 주세요"}</p><button aria-label="근거 영상 재생" onClick={() => notify("근거 영상의 해당 시점(0:08)을 열었어요.")} className="relative mt-4 h-36 w-full overflow-hidden rounded-2xl bg-canvas">{step === 1 ? <Image src="/built-in-wardrobe-evidence.png" alt="거실 벽에 고정된 붙박이장 영상 장면" fill sizes="280px" className="object-cover" /> : <Flower2 className="absolute inset-0 m-auto text-ink-400" size={42} />}<span className="absolute inset-0 grid place-items-center bg-ink-900/15"><span className="grid size-11 place-items-center rounded-full bg-white text-ink-900"><Play size={20} fill="currentColor" /></span></span><span className="absolute bottom-3 left-3 rounded-lg bg-ink-900/80 px-2 py-1 text-[11px] font-bold text-white">AI 판단 확률 {step === 1 ? 61 : 72}%</span></button><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={answer} className="h-12 rounded-2xl bg-primary-600 text-[14px] font-bold text-white">맞아요</button><button onClick={answer} className="h-12 rounded-2xl border border-line text-[14px] font-bold">아니요</button></div><p className={`mt-2 text-center text-[11px] ${muted}`}>다음 확인: 대형 화분 ×2</p></section>
        <div className="mb-3 mt-7 flex justify-between text-[15px] font-bold"><span>확정된 짐 19개</span><button onClick={openItems} className="inline-flex min-h-11 items-center px-2 text-[12px]">전체 보기</button></div><button onClick={openItems} className={`${card} flex w-full items-center gap-3 p-4 text-left`}><span className="grid size-9 place-items-center rounded-xl bg-canvas"><PackagePlus size={19} /></span><div><p className="text-[15px] font-bold">방별 짐 목록</p><p className={`text-[12px] ${muted}`}>수량을 확인하거나 수정할 수 있어요</p></div><ChevronRight className="ml-auto" size={18} /></button><button onClick={openItems} className="mt-4 h-12 w-full rounded-2xl border-2 border-primary-400 bg-white text-[14px] font-bold text-primary-700"><Plus className="mr-1 inline" size={16} /> 영상에 없는 짐 추가</button><p className="mt-4 text-center text-[12px] font-semibold text-ink-600">가격은 업체가 이 목록을 보고 제안해요</p>
      </main><Bottom><Primary onClick={() => { if (!done || saving) return; setSaving(true); window.setTimeout(next, 450); }} disabled={!done || saving}>{saving ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />짐 목록 저장 중...</> : done ? "짐 목록 확정하기" : `확인 ${3 - step}건 남음`}</Primary><button onClick={back} className="mt-2 inline-flex min-h-11 w-full items-center justify-center text-[12px] text-ink-400">이전으로</button></Bottom></Page>
  );
}

function ScopeSummary({ next, back, go, demoState = "" }: { next: () => void; back: () => void; go: (screen: number) => void; demoState?: string }) {
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [stateResolved, setStateResolved] = useState(false);
  const notify = useDemoFeedback();
  if (demoState === "provider-no-participation") {
    return (
      <Page><StatusBar /><Top onBack={back} title="소비자 단독 카드" aside={<button onClick={() => go(12)}>지난 버전</button>} />
        <main className="flex-1 px-6 pb-5">
          <div className="demo-pop rounded-2xl border border-warning bg-warning-bg p-4"><p className="text-[13px] font-bold text-warning-ink">업체 미참여 · 공동확인 전</p><p className={`mt-1 text-xs leading-5 ${muted}`}>이 카드는 소비자가 정리한 단독 초안이에요. 출력·공유할 수 있지만 합의 완료나 승인본으로 표시하지 않아요.</p></div>
          <Card className="mt-4 p-5"><div className="flex justify-between"><span className={`text-[12px] ${muted}`}>내가 정리한 작업범위</span><Badge variant="warning">공동확인 전</Badge></div><p className="mt-2 text-[28px] font-extrabold">금액 미정</p><p className={`mt-3 text-xs ${muted}`}>짐 21개 · 도착지 조건 입력 완료 · 업체가 참여하면 이 초안부터 검토해요</p></Card>
          <h2 className="mb-3 mt-6 text-[15px] font-bold">확인 상태</h2><Card className="p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-primary-50 text-xs font-bold text-primary-600">나</span><div><p className="text-[14px] font-bold">소비자 초안 작성 완료</p><p className={`text-xs ${muted}`}>업체 확인 없음 · 승인본 아님</p></div></div></Card>
          <p className="mt-4 rounded-xl bg-primary-50 px-4 py-3 text-xs font-semibold">업체가 나중에 참여하면 현재 단독 초안을 기준으로 업체 검토를 시작해요.</p>
        </main><Bottom><div className="grid grid-cols-2 gap-2"><Primary onClick={() => go(10)}>업체 초대하기</Primary><Outline onClick={() => notify("‘공동확인 전’ 표시가 포함된 소비자 단독 카드 출력본을 준비했어요.")}>단독 카드 출력</Outline></div></Bottom>
      </Page>
    );
  }
  if ((demoState === "integrity-error" || demoState === "confirmation-version-mismatch") && !stateResolved) {
    const integrityError = demoState === "integrity-error";
    return (
      <Page><StatusBar /><Top onBack={back} title="작업범위 확인" aside="v3" />
        <main className="flex-1 px-6 pb-5"><div className={`demo-pop rounded-2xl border p-5 ${integrityError ? "border-danger bg-danger-bg" : "border-warning bg-warning-bg"}`}><AlertTriangle className={integrityError ? "text-danger-ink" : "text-warning"} size={24} /><h1 className="mt-4 text-[21px] font-extrabold">{integrityError ? "승인본 무결성을 확인하지 못했어요" : "같은 버전을 보고 있지 않아요"}</h1><p className={`mt-2 text-[13px] leading-5 ${muted}`}>{integrityError ? "저장된 v3 본문과 무결성 확인값이 일치하지 않아 확인을 차단했어요. 서버의 승인본을 다시 불러와야 해요." : "나는 v3를 열었지만 업체는 새 제안 v4를 제출했어요. 버전 ID가 다르면 공동확인을 완료할 수 없어요."}</p><p className="mt-3 text-xs font-bold text-warning-ink">{integrityError ? "SCOPE_INTEGRITY_MISMATCH" : "SCOPE_VERSION_CONFLICT · local v3 / latest v4"}</p></div><Card className="mt-4 p-5"><div className="flex justify-between text-[13px]"><span className={muted}>현재 확인 상태</span><b>확인 차단</b></div><div className="mt-3 flex justify-between text-[13px]"><span className={muted}>기존 승인본</span><b>{integrityError ? "검증 필요" : "v3 유지"}</b></div><p className={`mt-4 text-xs ${muted}`}>자동 덮어쓰기나 자동 확인 처리는 하지 않아요.</p></Card></main>
        <Bottom><Primary onClick={() => { setStateResolved(true); notify(integrityError ? "서버 승인본을 다시 불러와 무결성 확인을 통과했어요." : "최신 제안 v4를 불러왔어요. 이제 같은 버전에서 수락할 수 있어요."); }}>{integrityError ? "승인본 다시 불러오기" : "최신 제안 다시 불러오기"}</Primary><Outline disabled>이 버전 수락</Outline></Bottom>
      </Page>
    );
  }
  if (demoState === "confirmation-invalidated") {
    return (
      <Page><StatusBar /><Top onBack={back} title="작업범위 v4" aside={<button onClick={() => go(12)}>지난 버전</button>} />
        <main className="flex-1 px-6 pb-5"><div className="demo-pop rounded-2xl border border-warning bg-warning-bg p-4"><p className="text-[13px] font-bold text-warning-ink">기존 수락이 취소됐어요</p><p className={`mt-1 text-xs leading-5 ${muted}`}>한쪽이 v3 수락 후 작업범위를 수정해 새 v4를 만들었어요. v3의 수락은 새 버전에 자동 승계되지 않아요.</p></div><Card className="mt-4 p-5"><div className="flex justify-between"><span className={`text-xs ${muted}`}>새 제안 총액 · v4</span><Badge variant="warning">양측 재수락 필요</Badge></div><strong className="mt-2 block text-[28px]">1,280,000원</strong><p className={`mt-3 text-xs ${muted}`}>화분 2→1 · 작업 방식 메모 수정 · 금액은 동일</p></Card><h2 className="mb-3 mt-6 text-[15px] font-bold">수락 상태</h2><Card className="space-y-3 p-4"><div className="flex justify-between text-[13px]"><b>박민서 고객</b><Badge variant="warning">다시 수락 필요</Badge></div><div className="flex justify-between text-[13px]"><b>한빛이사</b><Badge variant="warning">다시 수락 필요</Badge></div><div className="border-t border-line pt-3 text-xs text-ink-400">v3 수락 기록은 이력에 남지만 v4 승인에는 사용되지 않아요.</div></Card></main><Bottom><Primary onClick={() => notify("v4 소비자 수락을 기록했어요. 업체 수락이 남아 있어 아직 승인본은 아니에요.")}>이 버전 수락</Primary><Outline onClick={() => go(11)}>다시 수정 요청</Outline></Bottom>
      </Page>
    );
  }
  return (
    <Page><StatusBar /><Top onBack={back} title="한빛이사 견적 v3" aside={<button className="font-bold text-primary-700" onClick={() => go(12)}>지난 버전</button>} /><main className="flex-1 px-6 pb-5"><h1 className="mb-5 mt-3 text-[26px] font-extrabold leading-[34px] tracking-[-0.5px]">한빛이사 견적을<br />수락할까요?</h1><Card className="p-5"><div className="flex items-center justify-between"><span className={`text-[14px] font-semibold ${muted}`}>제안 총액</span><span className={`text-[13px] font-bold ${confirmed ? "text-success-ink" : "text-warning-ink"}`}>{confirmed ? "수락 완료" : "내 수락 대기"}</span></div><p className="mt-2 text-[32px] font-extrabold tracking-[-0.5px]">1,280,000원</p><div className="mt-4 flex items-center justify-between border-t border-line pt-4"><span className="text-[13px] text-ink-600">기존 견적 대비</span><strong className="text-[16px] text-danger-ink">+120,000원</strong></div><p className={`mt-4 text-[14px] leading-6 ${muted}`}>5톤 1대 · 작업자 4명 · 예상 6시간</p></Card>
        <h2 className="mb-3 mt-7 text-[17px] font-bold">이번에 달라진 것</h2><button onClick={() => notify("침실 근거 영상 0:12와 업체 변경 사유를 열었어요.")} className="w-full rounded-2xl bg-warning-bg p-5 text-left"><div className="flex gap-3"><span className="grid size-9 place-items-center rounded-full bg-white text-warning"><Plus size={21} /></span><div className="min-w-0 flex-1"><p className="text-[16px] font-bold">피아노 전문 인력 1명 추가</p><p className="mt-1 text-[13px] leading-5 text-warning-ink">안전 운반을 위해 필요해요 · 영상 근거 보기</p></div><strong className="text-[16px] text-danger-ink">+120,000</strong></div></button>
        <h2 className="mb-3 mt-7 text-[17px] font-bold">그대로인 것</h2><section className={`${card} space-y-3 p-5 text-[14px] font-semibold`}><p><Check className="mr-2 inline" size={18} />짐 21개 · 포장·운반·정리</p><p><Check className="mr-2 inline" size={18} />기본 견적 1,160,000원</p><p className="text-danger-ink"><X className="mr-2 inline" size={18} />폐기물 처리 · 입주청소 제외</p></section>
        <h2 className="mb-3 mt-7 text-[17px] font-bold">수락 상태</h2><section className={`${card} space-y-2 p-5`}><label className="flex min-h-11 items-center gap-3"><input aria-label="한빛이사 수락 완료" type="checkbox" checked readOnly className="size-5 accent-[#17A46B]" /><span><b className="block text-[15px]">한빛이사</b><small className="text-[12px] text-ink-400">이 견적으로 진행 요청함</small></span></label><label className="flex min-h-11 items-center gap-3"><input aria-label="박민서 고객 수락 상태" type="checkbox" checked={confirmed} readOnly className="size-5 accent-[#17A46B]" /><span><b className="block text-[15px]">박민서 고객</b><small className="text-[12px] text-ink-400">{confirmed ? "수락 완료" : "수락 대기"}</small></span></label><p className="border-t border-line pt-4 text-[13px] leading-5 text-ink-600">{confirmed ? "양쪽이 수락해 v3가 승인본으로 잠겼어요." : "내가 수락하면 v3가 승인본으로 잠겨요."}</p></section>
        {confirmed && <div className="demo-pop mt-4 rounded-2xl bg-success-bg p-4"><p className="text-[14px] font-bold text-success-ink">v3 승인본 생성 완료</p><p className={`mt-1 text-[13px] ${muted}`}>업체가 승인본 기준으로 배차와 인력을 확정할 수 있어요.</p><Link className="mt-3 flex h-11 items-center justify-center rounded-xl bg-ink-900 text-[13px] font-bold text-white" href="/provider?screen=3">업체 배차 화면으로 이어보기</Link></div>}
      </main><Bottom>{confirmed ? <Outline onClick={next}>현장 변경 승인 데모 바로보기</Outline> : <div className="grid grid-cols-2 gap-2"><Primary disabled={confirming} onClick={() => { if (confirming) return; setConfirming(true); window.setTimeout(() => { setConfirming(false); setConfirmed(true); notify("소비자 수락을 기록했고 v3 승인본을 생성했어요."); }, 500); }}>{confirming ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />수락 기록 중...</> : "이 버전 수락"}</Primary><Outline onClick={() => go(11)}>수정 요청</Outline></div>}</Bottom></Page>
  );
}

function OnsiteApproval({ next, back, demoState = "" }: { next: () => void; back: () => void; demoState?: string }) {
  const [decisionMode, setDecisionMode] = useState<"explain" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [response, setResponse] = useState("");
  const [approved, setApproved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const notify = useDemoFeedback();
  const requestCancelled = demoState === "change-cancelled";
  const requestExpired = demoState === "change-expired";
  const explanationPending = demoState === "change-explanation-requested";
  if (requestCancelled || requestExpired || explanationPending) {
    const title = requestCancelled ? "변경요청이 철회됐어요" : requestExpired ? "변경요청 응답 기간이 끝났어요" : "추가 설명을 기다리고 있어요";
    const description = requestCancelled ? "업체가 CR-01 요청을 철회했어요. 기존 승인본 v3과 1,280,000원은 그대로 유지돼요." : requestExpired ? "작업 종료 또는 응답기한 경과로 이 요청에는 더 이상 응답할 수 없어요. 기존 승인본은 바뀌지 않아요." : "설명 요청 상태에서는 업체의 새 리비전이 올 때까지 총액과 승인본을 바꾸지 않아요.";
    return (
      <Page><StatusBar /><Top onBack={back} title="현장 변경" aside={<Badge variant="warning">{requestCancelled ? "CANCELLED" : requestExpired ? "EXPIRED" : "설명 요청됨"}</Badge>} />
        <main className="flex-1 px-6 pb-5"><div className="demo-pop rounded-2xl border border-warning bg-warning-bg p-5"><AlertTriangle className="text-warning" size={24} /><h1 className="mt-4 text-[21px] font-extrabold">{title}</h1><p className={`mt-2 text-[13px] leading-5 ${muted}`}>{description}</p></div><Card className="mt-4 p-5"><div className="flex justify-between text-[13px]"><span className={muted}>기준 승인본</span><b>v3 · 유지</b></div><div className="mt-3 flex justify-between text-[13px]"><span className={muted}>현재 확정 금액</span><b>1,280,000원</b></div><div className="mt-3 flex justify-between text-[13px]"><span className={muted}>요청 증감액</span><b className="text-ink-400">+150,000원 · 미반영</b></div></Card>{explanationPending && <Card className="mt-4 border-primary-400 bg-primary-50 p-4"><p className="text-[13px] font-bold text-primary-600">내 설명 요청 · 11:04</p><p className={`mt-1 text-xs ${muted}`}>“사다리차가 꼭 필요한 근거와 작업 가능 위치를 더 알려주세요.”</p><p className="mt-3 text-xs font-bold">업체 답변 또는 수정 리비전 대기</p></Card>}</main>
        <Bottom><Primary disabled>{explanationPending ? "업체 답변 대기" : "이 요청에는 응답할 수 없음"}</Primary><Outline onClick={back}>현재 작업으로 돌아가기</Outline></Bottom>
      </Page>
    );
  }
  const sendDecision = () => {
    if (!decisionMode || !note.trim()) return;
    const label = decisionMode === "explain" ? "설명 요청됨" : "거절됨";
    setResponse(`${label} · 11:04`);
    setDecisionMode(null);
    setNote("");
    notify(`${label} 상태로 기록했어요.`);
  };
  return (
    <Page><StatusBar /><div className="px-6 pt-4"><h2 className="text-[17px] font-bold">오늘 · 이사 진행 중</h2><section className="mt-3 rounded-2xl bg-white/60 p-4"><p className="text-[14px] font-bold">09:40 상차 완료 · 도착지 이동 중</p><p className={`text-[12px] ${muted}`}>한빛이사 김도윤 팀 · 확정 1,280,000원</p></section></div><div className="mt-4 flex flex-1 flex-col rounded-t-[28px] bg-white px-6 pb-7 pt-3"><div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#DFE1EA]" /><div className="flex items-center justify-between"><span className={`rounded-full px-3 py-2 text-[11px] font-bold ${approved ? "bg-success-bg text-success-ink" : "bg-danger-bg text-danger-ink"}`}>{approved ? "승인 완료 · v4" : "현장 추가 요청"}</span><button aria-label="닫기" className="grid size-11 place-items-center rounded-full" onClick={back}><X size={22} className="text-ink-400" /></button></div><h1 className="mt-4 text-[22px] font-extrabold leading-[30px]">사다리차 150,000원,<br />승인하시겠어요?</h1><p className={`mt-1 text-[13px] ${muted}`}>김도윤 기사 · 10:55 · 도착지 엘리베이터 고장</p>{response && <p className="mt-3 rounded-xl bg-warning-bg px-4 py-3 text-[12px] font-bold text-warning-ink">{response} · 기존 승인본 v3과 1,280,000원은 그대로 유지돼요</p>}<div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-canvas p-5"><p className={`text-[12px] ${muted}`}>현재 금액</p><strong className="mt-3 block text-[20px]">1,280,000원</strong><p className={`mt-3 text-[11px] ${muted}`}>승인 전에는<br />기존 총액 유지</p></div><div className="rounded-2xl border-2 border-primary-600 bg-primary-50 p-5"><p className="text-[12px] font-bold text-primary-600">승인 후 총액</p><strong className="mt-3 block text-[20px] text-primary-600">1,430,000원</strong><p className={`mt-3 text-[11px] ${muted}`}>증감액 +150,000원<br />새 버전 v4 생성</p></div></div><h2 className="mb-2 mt-5 text-[15px] font-bold">현장 증빙 2건</h2><div className="grid grid-cols-2 gap-3">{['고장 엘리베이터','고장 안내문'].map((label, i) => <button onClick={() => notify(`${label} 증빙을 크게 열었어요.`)} key={label} className="demo-interactive-card relative h-28 overflow-hidden rounded-2xl"><Image alt={label} className="object-cover" fill sizes="160px" src="/elevator-outage-evidence.png" style={{ objectPosition: i ? "50% 46%" : "34% 50%" }} /><span className="absolute inset-x-0 bottom-0 bg-ink-900/75 px-3 py-2 text-left text-[11px] font-bold text-white">{label}</span></button>)}</div><p className="mt-4 text-[12px] font-semibold text-ink-600">구두 동의는 승인으로 기록되지 않아요 · 여기서 응답해야 반영돼요</p>{approved && <div className="demo-pop mt-4 rounded-2xl bg-success-bg p-4"><p className="text-[13px] font-bold text-success-ink">변경 승인 완료 · v4 생성</p><p className={`mt-1 text-[12px] ${muted}`}>작업자는 승인된 새 범위로 작업을 계속할 수 있어요.</p><Link className="mt-3 flex h-11 items-center justify-center rounded-xl bg-ink-900 text-[13px] font-bold text-white" href="/crew?screen=2&state=latest-v4">작업자 최신 승인범위 보기</Link></div>}<div className="mt-auto">{approved ? <Outline onClick={next}>고객 완료 화면 바로보기</Outline> : <><Primary disabled={submitting} onClick={() => { if (submitting) return; setSubmitting(true); window.setTimeout(() => { setApproved(true); setSubmitting(false); notify("변경을 승인했고 v4가 생성됐어요."); }, 550); }}>{submitting ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />처리 중...</> : "승인하기 · 1,430,000원"}</Primary><div className="mt-3 grid grid-cols-2 gap-2"><Outline onClick={() => setDecisionMode("explain")}>설명 요청</Outline><button onClick={() => setDecisionMode("reject")} className="h-14 rounded-2xl border border-danger font-bold text-danger-ink">거절하기</button></div></>}</div></div>
      <Sheet open={decisionMode !== null} onOpenChange={(open) => !open && setDecisionMode(null)}><SheetContent><SheetHeader><SheetTitle>{decisionMode === "reject" ? "변경을 거절할까요?" : "어떤 설명이 더 필요한가요?"}</SheetTitle><SheetDescription>응답과 시각은 변경요청 기록에 남고 기존 승인본은 덮어쓰지 않아요.</SheetDescription></SheetHeader><div className="px-6"><textarea aria-label="변경 응답 사유" value={note} onChange={(event) => setNote(event.target.value.slice(0, 2000))} placeholder={decisionMode === "reject" ? "거절 사유를 입력해 주세요" : "추가로 확인하고 싶은 내용을 입력해 주세요"} className="h-32 w-full resize-none rounded-2xl bg-canvas p-4 text-[13px] outline-none" /><p className={`mt-2 text-right text-[11px] ${muted}`}>{note.length}/2000</p></div><SheetFooter><Primary disabled={!note.trim()} onClick={sendDecision}>{decisionMode === "reject" ? "거절 보내기" : "설명 요청 보내기"}</Primary></SheetFooter></SheetContent></Sheet>
    </Page>
  );
}

function Completion({ next, back, demoState = "" }: { next: () => void; back: () => void; demoState?: string }) {
  const [extra, setExtra] = useState<boolean | null>(null);
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
  if (demoState === "completion-no-media") {
    return (
      <Page><StatusBar /><Top onBack={back} title="이사 완료" aside={<span className="rounded-full bg-success-bg px-3 py-2 text-success-ink">작업 종료</span>} />
        <main className="flex-1 px-6 pb-5"><h1 className="mt-2 text-[22px] font-extrabold leading-[30px]">완료 기록을 확인해 주세요</h1><p className={`mt-1 text-[13px] ${muted}`}>완료 미디어가 없어도 작업 종료 사실과 최종 금액은 별도로 확인할 수 있어요.</p><section className={`${card} mt-5 p-5`}><div className="flex items-center justify-between"><h2 className="text-[15px] font-bold">전 · 후 비교</h2><Badge variant="neutral">완료 미디어 없음</Badge></div><div className="mt-4 grid h-36 place-items-center rounded-2xl border border-dashed border-[#D8DAE5] bg-canvas px-6 text-center"><div><Camera className="mx-auto text-ink-400" size={28} /><p className="mt-2 text-[14px] font-bold">제출된 완료 사진·영상이 없어요</p><p className={`mt-1 text-xs leading-5 ${muted}`}>미디어 유무와 작업 완료 상태는 별도로 기록돼요.</p></div></div><p className={`mt-3 text-[11px] ${muted}`}>서비스는 완료 미디어로 파손 여부, 원인 또는 책임을 자동 판단하지 않아요.</p></section><section className={`${card} mt-4 p-5`}><p className={`text-xs ${muted}`}>최종 확정 금액 · v4</p><strong className="mt-2 block text-[30px] font-extrabold">1,430,000원</strong><p className={`mt-2 text-xs ${muted}`}>기본 합의 1,280,000원 + 승인 변경 150,000원</p></section><section className={`${card} mt-4 p-5`}><h2 className="text-[15px] font-bold">기록에 없는 추가금 요구가 있었나요?</h2><div className="mt-3 grid grid-cols-3 gap-2"><button onClick={() => setExtra(false)} className={`h-14 rounded-2xl text-[12px] font-bold ${extra === false ? "bg-ink-900 text-white" : "border border-[#E0E2EC]"}`}>아니요</button><button onClick={() => setExtra(true)} className={`h-14 rounded-2xl text-[12px] font-bold ${extra === true ? "bg-ink-900 text-white" : "border border-[#E0E2EC]"}`}>네</button><button onClick={() => setExtra(null)} className={`h-14 rounded-2xl text-[12px] font-bold ${extra === null ? "bg-canvas text-ink-600" : "border border-[#E0E2EC]"}`}>응답 안 함</button></div><p className={`mt-3 text-[11px] ${muted}`}>응답하지 않아도 완료 확인은 가능하며 응답 없음 상태로 기록돼요.</p></section></main>
        <Bottom><Primary disabled={confirming} onClick={() => { if (confirming) return; setConfirming(true); window.setTimeout(() => { notify("완료 미디어 없음 상태와 함께 작업 완료 확인을 기록했어요."); next(); }, 500); }}>{confirming ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />확인 기록 중...</> : "완료 확인"}</Primary></Bottom>
      </Page>
    );
  }
  return (
    <Page><StatusBar /><Top onBack={back} title="이사 완료" aside={<span className="rounded-full bg-success-bg px-3 py-2 text-success-ink">작업 종료</span>} /><main className="flex-1 px-6 pb-5"><h1 className="mt-2 text-[22px] font-extrabold leading-[30px]">고생하셨어요!</h1><p className={`mt-1 text-[13px] ${muted}`}>완료 기록과 최종 금액을 확인하고 마무리해 주세요</p>{requestBlocked && <div className={`demo-pop mt-4 rounded-2xl p-4 ${demoState === "completion-already-confirmed" ? "bg-success-bg text-success-ink" : "border border-warning bg-warning-bg text-warning-ink"}`}><p className="text-[13px] font-bold">{demoState === "completion-already-confirmed" ? "완료 확인됨 · 14:28" : "현재 요청에 응답할 수 없어요"}</p><p className="mt-1 text-xs leading-5 text-ink-600">{requestMessage}</p></div>}{issueSent && <p className="mt-3 rounded-xl bg-warning-bg px-4 py-3 text-[12px] font-bold text-warning-ink">문제 신고가 접수됐어요 · 완료 확인과 별도로 기록됩니다</p>}{dataFailed && <div className="demo-pop mt-4 rounded-2xl border border-warning bg-warning-bg p-4"><div className="flex gap-3"><AlertTriangle className="shrink-0 text-warning" size={20} /><div><p className="text-[13px] font-bold text-warning-ink">최종 범위와 금액을 불러오지 못했어요</p><p className="mt-1 text-xs text-ink-600">완료 확인은 데이터가 복구될 때까지 막아두었어요.</p></div></div><button onClick={() => { setDataRetried(true); notify("최종 범위와 금액을 다시 불러왔어요."); }} className="mt-3 inline-flex min-h-11 items-center text-[12px] font-bold text-primary-600">다시 불러오기</button></div>}<section className={`${card} mt-5 p-5`}><div className="flex justify-between"><h2 className="text-[15px] font-bold">전 · 후 비교</h2><button onClick={() => setRoomIndex((roomIndex + 1) % rooms.length)} className="min-h-11 rounded-full bg-canvas px-4 text-[11px] font-bold">{rooms[roomIndex]} <ChevronDown className="inline" size={13} /></button></div>{mediaFailed ? <div className="demo-pop mt-3 grid h-36 place-items-center rounded-2xl border border-dashed border-warning bg-warning-bg px-5 text-center"><div><AlertTriangle className="mx-auto text-warning" size={25} /><p className="mt-2 text-[13px] font-bold text-warning-ink">완료 사진 1장을 불러오지 못했어요</p><button onClick={() => { setMediaRetried(true); notify("실패한 완료 사진만 다시 불러왔어요."); }} className="mt-2 inline-flex min-h-11 items-center text-[12px] font-bold text-primary-600">사진 다시 불러오기</button></div></div> : <button aria-label="전후 기록 크게 보기" onClick={() => notify(`${rooms[roomIndex]} 작업 전후 기록을 크게 열었어요.`)} className="demo-interactive-card relative mt-3 grid h-36 w-full grid-cols-2 overflow-hidden rounded-2xl"><span className="relative border-r-2 border-white"><Image alt={`${rooms[roomIndex]} 작업 전`} className="object-cover" fill sizes="160px" src="/built-in-wardrobe-evidence.png" /></span><span className="relative"><Image alt={`${rooms[roomIndex]} 작업 후`} className="object-cover" fill sizes="160px" src="/room-after-evidence.png" /></span><span className="absolute left-2 top-3 rounded bg-ink-900/75 px-2 py-1 text-[10px] text-white">전 09.10</span><span className="absolute right-2 top-3 rounded bg-ink-900/75 px-2 py-1 text-[10px] text-white">후 09.12</span><span className="absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink-900">↔</span></button>}<p className={`mt-3 text-[11px] ${muted}`}>사람이 전후 기록을 확인하는 자료예요 · 파손·원인·책임을 자동 판단하지 않아요</p></section><section className={`${card} mt-4 p-5`}><p className={`text-[12px] ${muted}`}>최종 확정 금액 · v4</p><div className="mt-2 flex items-center justify-between"><strong className="text-[30px] font-extrabold">{dataFailed ? "—" : "1,430,000원"}</strong><span className="rounded-full bg-success-bg px-3 py-2 text-[11px] font-bold text-success-ink">승인 변경 +150,000원</span></div><p className={`mt-2 text-[11px] ${muted}`}>{dataFailed ? "데이터를 다시 불러와 주세요" : "기본 합의 1,280,000원 + 승인된 현장 변경 150,000원"}</p></section><section className={`${card} mt-4 p-5`}><h2 className="text-[15px] font-bold">기록에 없는 추가금 요구가 있었나요?</h2><p className={`mt-1 text-[12px] ${muted}`}>선택은 선택사항이에요 · 아무것도 고르지 않으면 응답 안 함으로 기록돼요</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setExtra(false)} className={`h-14 rounded-2xl font-bold ${extra === false ? "bg-ink-900 text-white" : "border border-[#E0E2EC]"}`}>아니요, 없었어요</button><button onClick={() => setExtra(true)} className={`h-14 rounded-2xl font-bold ${extra === true ? "bg-ink-900 text-white" : "border border-[#E0E2EC]"}`}>네, 있었어요</button></div><p className={`mt-3 text-[11px] ${muted}`}>완료 확인은 작업 종료 사실의 기록이며 파손 없음이나 권리 포기를 의미하지 않아요</p></section></main><Bottom><div className="grid grid-cols-2 gap-2"><Primary disabled={confirming || dataFailed || requestBlocked} onClick={() => { if (confirming || dataFailed || requestBlocked) return; setConfirming(true); window.setTimeout(() => { notify("완료 확인을 기록했어요."); next(); }, 500); }}>{confirming ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />확인 기록 중...</> : requestBlocked ? demoState === "completion-already-confirmed" ? "이미 완료 확인함" : "현재 요청 응답 불가" : dataFailed ? "데이터 복구 후 확인 가능" : "완료 확인"}</Primary><Outline disabled={requestBlocked} onClick={() => setIssueOpen(true)}>문제 신고</Outline></div></Bottom>
      <Sheet open={issueOpen} onOpenChange={setIssueOpen}><SheetContent><SheetHeader><SheetTitle>어떤 문제가 있었나요?</SheetTitle><SheetDescription>신고는 완료 확인과 별도로 감사 기록에 남아요.</SheetDescription></SheetHeader><div className="px-6"><div className="grid grid-cols-2 gap-2">{["작업 누락", "파손", "금액", "기타"].map((type) => <button key={type} onClick={() => setIssueType(type)} className={`h-12 rounded-xl border text-[13px] font-bold ${issueType === type ? "border-primary-600 bg-primary-50 text-primary-600" : "border-line"}`}>{type}</button>)}</div><textarea aria-label="문제 신고 상세" value={issueNote} onChange={(event) => setIssueNote(event.target.value.slice(0, 2000))} placeholder="상세 내용을 입력해 주세요" className="mt-4 h-32 w-full resize-none rounded-2xl bg-canvas p-4 text-[13px] outline-none" /><p className={`mt-2 text-right text-[11px] ${muted}`}>{issueNote.length}/2000</p></div><SheetFooter><Primary disabled={!issueNote.trim() || reporting} onClick={() => { if (reporting) return; setReporting(true); window.setTimeout(() => { setReporting(false); setIssueSent(true); setIssueOpen(false); setIssueNote(""); notify(`${issueType} 문제 신고를 접수했어요.`); }, 500); }}>{reporting ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />접수 중...</> : "문제 신고 접수"}</Primary></SheetFooter></SheetContent></Sheet>
    </Page>
  );
}

function CompletionComparison({ next, back }: { next: () => void; back: () => void }) {
  const [roomIndex, setRoomIndex] = useState(0);
  const rooms = [
    ["거실", "09.11 14:02", "09.12 14:08"],
    ["침실", "09.11 14:10", "09.12 14:12"],
    ["주방·베란다", "09.11 14:18", "09.12 14:20"],
  ];
  const [room, beforeAt, afterAt] = rooms[roomIndex];

  return (
    <Page>
      <StatusBar />
      <Top onBack={back} title="작업 전후 기록" aside={<Badge variant="success">확인 완료</Badge>} />
      <main className="flex-1 px-5 pb-5">
        <h1 className="mt-2 text-[22px] font-extrabold leading-[30px]">같은 공간을<br />전·후로 확인해요</h1>
        <p className={`mt-2 text-[13px] ${muted}`}>완료 확인 뒤에도 촬영 시각과 원본 기록은 그대로 보존돼요.</p>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {rooms.map(([label], index) => (
            <button
              className={`h-11 shrink-0 rounded-full px-4 text-[12px] font-bold ${roomIndex === index ? "bg-ink-900 text-white" : "bg-white text-ink-600"}`}
              key={label}
              onClick={() => setRoomIndex(index)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <Card className="mt-4 p-5">
          <h2 className="text-[17px] font-bold">{room} · 같은 구역 기준</h2>
          <p className={`mt-2 text-[12px] leading-5 ${muted}`}>자동 차이·파손 판정 없이 사람이 촬영 시각과 기록만 비교해요.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[["작업 전", beforeAt], ["완료", afterAt]].map(([label, time]) => (
              <button className="demo-interactive-card overflow-hidden rounded-2xl border border-line bg-white text-left" key={label} type="button">
                <span className="relative block h-32"><Image alt={`${room} ${label}`} className="object-cover" fill sizes="160px" src={label === "작업 전" ? "/built-in-wardrobe-evidence.png" : "/room-after-evidence.png"} /></span>
                <span className="block p-4"><b className="block text-[14px]">{label}</b><span className={`mt-1 block text-[12px] ${muted}`}>{time}</span></span>
              </button>
            ))}
          </div>
        </Card>
        <Card className="mt-4 p-5">
          <h2 className="text-[15px] font-bold">기록 안내</h2>
          <p className="mt-2 text-[13px] leading-5">이 화면은 작업 전후 기록을 사람이 확인하기 위한 자료예요.</p>
          <p className={`mt-2 text-[12px] leading-5 ${muted}`}>서비스는 파손 여부, 원인 또는 책임 주체를 자동 판단하지 않아요.</p>
        </Card>
      </main>
      <Bottom><Primary onClick={next}>완료 기록 보기</Primary></Bottom>
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
    <Page><StatusBar /><Top onBack={back} title={sheet ? "짐 목록" : "영상 분석"} aside={sheet ? "거실 7" : "8/12"} /><main className="flex-1 px-5 pb-5"><h1 className="mt-1 text-[22px] font-extrabold leading-[30px]">{sheet ? "거실 짐을 확인해 주세요" : failed ? "분석을 완료하지 못했어요" : analysisDone ? "분석이 끝났어요" : "분석이 끝나면 알려드릴까요?"}</h1><p className="mt-2 text-[15px] font-bold text-ink-600">{sheet ? "수량과 운반 옵션은 언제든 수정할 수 있어요." : failed ? "촬영과 입력 내용은 그대로 보존되어 있어요." : analysisDone ? "확인 필요한 항목 2개만 검수하면 돼요." : "앱을 닫아도 분석은 계속돼요."}</p>{!sheet && (failed ? <><section className={`${card} demo-pop mt-5 border border-warning p-6`}><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-warning-bg text-warning"><AlertTriangle size={23} /></span><div><h2 className="text-[17px] font-bold">AI 분석에 일시적인 오류가 생겼어요</h2><p className={`mt-2 text-[13px] leading-5 ${muted}`}>완료된 거실·침실 업로드와 사용자가 입력한 값은 지우지 않았어요. 재시도하거나 직접 입력으로 계속할 수 있어요.</p><p className="mt-2 text-[11px] font-bold text-warning-ink">ANALYSIS_TEMPORARY_ERROR · retry 0/3</p></div></div><Button disabled={retrying} onClick={retry} className="mt-5 w-full" size="cta" variant="outline">{retrying ? <><LoaderCircle className="demo-spin" size={18} />재시도 중...</> : "분석 다시 시도"}</Button></section><section className={`${card} mt-5 flex gap-3 border border-line p-5`}><Info size={24} /><div><h2 className="text-[17px] font-bold">AI 없이도 계속할 수 있어요</h2><p className="mt-2 text-[12px]">사진과 체크리스트로 품목을 직접 입력해도 업체 초대와 공동확인까지 진행할 수 있어요.</p><button onClick={() => { notify("AI 실패 상태에서 직접 입력 모드로 전환했어요."); next(); }} className="mt-3 inline-flex min-h-11 items-center text-[12px] font-bold text-primary-600">직접 입력으로 계속 <ChevronRight className="inline" size={16} /></button></div></section></> : <><section className={`${card} mt-5 flex items-center gap-5 border border-line p-6`}><div className={`grid size-24 shrink-0 place-items-center rounded-full border-[7px] ${analysisDone ? "border-success" : "border-primary-600 border-r-[#E0E7FF]"}`}><strong className="text-[20px]">{analysisDone ? "100%" : "60%"}</strong><span className="-mt-5 text-[11px] font-bold">{analysisDone ? "완료" : "분석 중"}</span></div><div><h2 className="text-[17px] font-bold">{analysisDone ? "모든 구역 분석 완료" : "주방을 확인하고 있어요"}</h2><p className="mt-3 text-[13px]">{analysisDone ? "21개 품목 후보 · 확인 필요 2개" : "거실·침실 분석 완료"}</p><div className="my-3 h-px bg-line" /><p className="text-[12px] font-semibold"><span className={`${analysisDone ? "" : "demo-pulse"} mr-2 inline-block size-2 rounded-full ${analysisDone ? "bg-success" : "bg-primary-600"}`} />{analysisDone ? "결과를 검수할 수 있어요" : "보통 1분 안에 끝나요"}</p></div></section><section className={`${card} mt-7 border border-line p-5`}><h2 className="text-[17px] font-bold">구역별 분석</h2>{[['거실','7개 발견',true],['침실','6개 발견',true],['주방',analysisDone ? '8개 발견' : '분석 중',analysisDone]].map(([room,status,done]) => <div key={String(room)} className="flex items-center gap-3 border-t border-line py-3"><span className={`grid size-7 place-items-center rounded-full ${done ? "bg-success-bg text-success-ink" : "text-primary-600"}`}>{done ? <Check size={16} /> : <LoaderCircle className="demo-spin" size={20} />}</span><p className="text-[15px] font-bold">{room}</p><span className="ml-auto text-[12px] font-bold text-ink-600">{status}</span></div>)}</section><section className={`${card} mt-7 flex gap-3 border border-line p-5`}><Info size={24} /><div><h2 className="text-[17px] font-bold">입력 내용은 안전하게 저장돼요</h2><p className="mt-2 text-[12px]">영상과 입력값은 분석이 멈춰도 그대로 남아요.</p><button onClick={() => { notify("AI 분석 없이 직접 입력 모드로 전환했어요."); next(); }} className="mt-2 inline-flex min-h-11 items-center text-[12px] font-bold">계속 안 되면 직접 입력하기 <ChevronRight className="inline" size={16} /></button></div></section></>)}</main>{!sheet && <Bottom><Primary disabled={failed || !analysisDone} onClick={next}>{failed ? "분석 재시도 후 이용 가능" : analysisDone ? "분석 결과 확인하기" : "분석 완료 후 확인 가능"}</Primary>{!failed && !analysisDone && <Outline disabled={notificationSet} onClick={() => { if (notificationSet) return; setNotificationSet(true); notify("분석 완료 알림을 켰어요. 분석은 계속 진행돼요."); window.setTimeout(() => setAnalysisDone(true), 900); }}><Bell className="mr-2 inline" size={18} />{notificationSet ? "완료 알림 설정됨" : "완료되면 알림 받기"}</Outline>}</Bottom>}
      {sheet && (
        <Sheet open onOpenChange={(open) => !open && back()}>
          <SheetContent>
            <SheetHeader><SheetTitle>거실 짐 7개를 확인할까요?</SheetTitle><SheetDescription>수량과 운반 옵션을 바꿀 수 있어요</SheetDescription></SheetHeader>
            <div className="px-5">
              {sofa > 0 ? <Card className="border-primary-100 bg-primary-50 p-4"><div className="flex gap-3"><span className="grid size-11 place-items-center rounded-xl bg-white"><Sofa size={25} /></span><div><h2 className="text-[17px] font-bold">3인 소파</h2><p className="text-[12px]">일반 운반 · AI 93% · 근거 0:08</p></div><div className="ml-auto flex h-11 items-center rounded-xl bg-white"><button className="grid size-11 place-items-center" aria-label="소파 수량 줄이기" onClick={() => setSofa(Math.max(0, sofa - 1))}><Minus size={16} /></button><span>{sofa}</span><button className="grid size-11 place-items-center" aria-label="소파 수량 늘리기" onClick={() => setSofa(sofa + 1)}><Plus size={16} /></button></div></div><div className="mt-4 grid grid-cols-2 gap-2"><Outline onClick={() => notify("소파 옵션을 업체 포장 · 일반 운반으로 변경했어요.")}>옵션 변경</Outline><Outline danger onClick={() => setSofa(0)}>이 짐 빼기</Outline></div></Card> : <button onClick={() => setSofa(1)} className="w-full rounded-2xl bg-danger-bg p-4 text-[13px] font-bold text-danger-ink">소파 제외됨 · 되돌리기</button>}
              <Card className="mt-3 flex items-center p-4"><span className="grid size-10 place-items-center rounded-xl bg-canvas"><Monitor size={23} /></span><strong className="ml-3 text-[17px]">TV 65인치</strong><div className="ml-auto flex h-11 items-center rounded-xl bg-canvas"><button className="grid size-11 place-items-center" aria-label="TV 수량 줄이기" onClick={() => setTv(Math.max(0, tv - 1))}><Minus size={15} /></button><span>{tv}</span><button className="grid size-11 place-items-center" aria-label="TV 수량 늘리기" onClick={() => setTv(tv + 1)}><Plus size={15} /></button></div></Card>
              <Card className="mt-3 flex items-center p-4"><span className="grid size-10 place-items-center rounded-xl bg-canvas"><Flower2 size={23} /></span><strong className="ml-3 text-[17px]">대형 화분</strong><div className="ml-auto flex h-11 items-center rounded-xl bg-canvas"><button className="grid size-11 place-items-center" aria-label="화분 수량 줄이기" onClick={() => setPlants(Math.max(0, plants - 1))}><Minus size={15} /></button><span>{plants}</span><button className="grid size-11 place-items-center" aria-label="화분 수량 늘리기" onClick={() => setPlants(plants + 1)}><Plus size={15} /></button></div></Card>
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
  const [selected, setSelected] = useState("한빛이사");
  const notify = useDemoFeedback();
  const quotes = [
    ["한빛이사", "1,280,000원", "평점 4.9 · 5톤 · 작업자 4명", "+120,000원", "추천"],
    ["두리익스프레스", "1,240,000원", "평점 4.8 · 5톤 · 작업자 4명", "+80,000원", "최저가"],
    ["바른이사", "1,310,000원", "평점 4.9 · 파손 보상 강화", "+150,000원", "보상 강화"],
  ];
  return (
    <Page>
      <StatusBar />
      <Top onBack={back} title="도착한 견적" />
      <main className="flex-1 px-6 pb-5">
        <h1 className="mt-4 text-[26px] font-extrabold leading-[34px]">3개 업체가<br />견적을 보냈어요</h1>
        <p className={`mt-2 text-[14px] leading-6 ${muted}`}>AI가 정리한 짐 목록을 본 업체가 직접 신청했어요. 가격과 조건을 비교해 선택하세요.</p>
        <div className="mt-5 flex items-center justify-between border-y border-line py-4 text-[13px]"><span className="text-ink-600">AI 예상 견적</span><strong className="text-[17px]">1,160,000원</strong></div>
        <div className="mt-5 space-y-3">
          {quotes.map(([name, price, detail, delta, label]) => {
            const active = selected === name;
            return <button key={name} onClick={() => setSelected(name)} className={`w-full rounded-2xl border-2 bg-white p-5 text-left ${active ? "border-primary-600" : "border-transparent"}`}><div className="flex items-start justify-between"><div><span className={`text-[12px] font-bold ${label === "추천" ? "text-primary-700" : "text-ink-400"}`}>{label}</span><h2 className="mt-1 text-[18px] font-extrabold">{name}</h2></div><span className={`grid size-6 place-items-center rounded-full border-2 ${active ? "border-primary-600 bg-primary-600 text-white" : "border-line"}`}>{active && <Check size={15} />}</span></div><p className="mt-4 text-[24px] font-extrabold">{price}</p><div className="mt-3 flex items-center justify-between text-[13px]"><span className="text-ink-600">{detail}</span><strong className="text-danger-ink">{delta}</strong></div></button>;
          })}
        </div>
        <p className="mt-4 text-center text-[12px] leading-5 text-ink-400">업체 선택 전에는 연락처가 서로 공개되지 않아요.</p>
      </main>
      <Bottom><Primary onClick={() => { if (selected === "한빛이사") next(); else notify(`${selected} 견적 상세를 열었어요.`); }}>선택한 견적 자세히 보기</Primary></Bottom>
    </Page>
  );
}

function Revision({ next, back, demoState = "" }: { next: () => void; back: () => void; demoState?: string }) {
  const [topics, setTopics] = useState(["짐 목록 수정", "작업 방식"]);
  const [note, setNote] = useState("화분 하나는 지인에게 드리기로 해서 빼주세요. 에어컨은 도착지 설치까지 가능한지 확인 부탁드려요.");
  const [photo, setPhoto] = useState(false);
  const [sending, setSending] = useState(false);
  const [conflictResolved, setConflictResolved] = useState(false);
  const notify = useDemoFeedback();
  const toggle = (topic: string) => setTopics(topics.includes(topic) ? topics.filter((item) => item !== topic) : [...topics, topic]);
  if (demoState === "scope-conflict" && !conflictResolved) {
    return (
      <Page><StatusBar /><Sheet open onOpenChange={(open) => !open && back()}><SheetContent><SheetHeader><SheetTitle>수정 중 새 버전이 도착했어요</SheetTitle><SheetDescription>동시에 편집한 내용을 자동으로 덮어쓰지 않아요.</SheetDescription></SheetHeader><div className="px-6"><div className="demo-pop rounded-2xl border border-warning bg-warning-bg p-4"><AlertTriangle className="text-warning" size={22} /><p className="mt-3 text-[14px] font-bold text-warning-ink">기준 버전 충돌 · local v3 / latest v4</p><p className={`mt-2 text-xs leading-5 ${muted}`}>내가 v3를 기준으로 수정하는 동안 업체가 v4를 제출했어요. 최신 버전을 확인하기 전에는 새 수정안을 보낼 수 없어요.</p></div><Card className="mt-4 p-4"><p className={`text-xs ${muted}`}>작성 중인 메모는 유지돼요</p><p className="mt-2 text-[13px] font-semibold leading-5">{note}</p></Card></div><SheetFooter><Primary onClick={() => { setConflictResolved(true); notify("최신 v4를 불러왔어요. 작성 중이던 메모와 선택 항목은 유지됐어요."); }}>v4 다시 불러오기 · 작성 내용 유지</Primary></SheetFooter></SheetContent></Sheet></Page>
    );
  }
  return (
    <Page><StatusBar />
      <Sheet open onOpenChange={(open) => !open && back()}>
        <SheetContent>
          <SheetHeader><SheetTitle>어떤 점을 바꿀까요?</SheetTitle><SheetDescription>v3 기준 · 보내면 업체가 새 제안(v4)으로 답해요</SheetDescription></SheetHeader>
          <div className="px-6"><div className="grid grid-cols-2 gap-3">{["짐 목록 수정", "작업 방식", "금액 문의", "일정 · 조건"].map((topic) => { const selected = topics.includes(topic); return <button key={topic} onClick={() => toggle(topic)} className={`h-20 rounded-2xl border-2 p-4 text-left text-[13px] font-bold ${selected ? "border-primary-600 bg-primary-50" : "border-line text-ink-400"}`}><span className={`mb-3 grid size-6 place-items-center rounded-full ${selected ? "bg-primary-600 text-white" : "bg-canvas"}`}>{selected && <Check size={14} />}</span>{topic}</button>})}</div><h2 className="mb-2 mt-6 text-[15px] font-bold">자세히 알려주세요</h2><textarea aria-label="수정 요청 내용" value={note} onChange={(event) => setNote(event.target.value.slice(0, 2000))} className="h-28 w-full resize-none rounded-2xl border-0 bg-canvas p-4 text-[13px] leading-6 outline-none" /><p className={`mt-1 text-right text-[11px] ${muted}`}>{note.length}/2000</p><div className="mt-4 grid grid-cols-[108px_1fr] gap-3"><Button onClick={() => setPhoto(!photo)} variant="outline" className="h-20 border-dashed text-[11px] text-ink-400"><Camera />{photo ? "사진 1장" : "사진 (선택)"}</Button><div className="rounded-2xl bg-primary-50 p-4 text-[11px]"><strong className="text-primary-600">보내면 어떻게 되나요?</strong><p className="mt-1">업체가 새 제안 버전으로 답하고, 양측이 같은 버전을 다시 확인해요</p></div></div></div>
          <SheetFooter><Primary onClick={() => { if (sending) return; setSending(true); window.setTimeout(() => { notify("수정 요청을 보냈고 상태가 ‘수정 요청됨’으로 바뀌었어요."); next(); }, 500); }} disabled={!topics.length || !note.trim() || sending}>{sending ? <><LoaderCircle className="demo-spin mr-2 inline" size={18} />전송 중...</> : "수정 요청 보내기"}</Primary></SheetFooter>
        </SheetContent>
      </Sheet>
    </Page>
  );
}

function History({ back, go }: { back: () => void; go: (screen: number) => void }) {
  const notify = useDemoFeedback();
  const [selected, setSelected] = useState("v4");
  const versions = [
    ["v4", "현재 승인본", "1,430,000원", "사다리차 승인으로 150,000원이 추가됐어요.", "9월 12일 11:02"],
    ["v3", "업체 수정 견적", "1,280,000원", "피아노 전문 인력 1명이 추가됐어요.", "9월 10일 15:20"],
    ["v2", "내 수정 요청", "1,160,000원", "대형 화분 수량을 2개에서 1개로 바꿨어요.", "9월 9일 20:11"],
    ["v1", "첫 견적", "1,160,000원", "AI 짐 목록을 기준으로 받은 최초 견적이에요.", "9월 9일 18:03"],
  ];
  return (
    <Page><StatusBar /><Top onBack={back} title="변경 기록" /><main className="flex-1 px-6 pb-5"><h1 className="mt-3 text-[26px] font-extrabold leading-[34px]">승인본과 변경 내역</h1><p className={`mt-2 text-[14px] leading-6 ${muted}`}>현재 적용되는 금액과 이전에 바뀐 이유를 버전별로 확인할 수 있어요.</p>
      <Card className="mt-5 border-success bg-white p-5"><div className="flex items-center gap-2 text-[13px] font-bold text-success-ink"><CheckCircle2 size={18} />현재 승인본 · v4</div><strong className="mt-3 block text-[30px] font-extrabold">1,430,000원</strong><p className="mt-2 text-[13px] leading-5 text-ink-600">한빛이사와 박민서 고객이 모두 수락했어요.</p></Card>
      <h2 className="mb-3 mt-7 text-[17px] font-bold">버전 기록</h2><div className="space-y-3">{versions.map(([version,title,price,summary,time]) => { const open = selected === version; return <Card key={version} className={open ? "border-primary-400" : ""}><button onClick={() => setSelected(open ? "" : version)} className="flex min-h-[76px] w-full items-center p-4 text-left"><span className={`grid size-10 shrink-0 place-items-center rounded-xl text-[12px] font-extrabold ${version === "v4" ? "bg-success-bg text-success-ink" : "bg-canvas text-ink-600"}`}>{version}</span><span className="ml-3 min-w-0 flex-1"><b className="block text-[15px]">{title}</b><small className="mt-1 block text-[12px] text-ink-400">{time} · {price}</small></span><ChevronDown className={`ml-2 shrink-0 text-ink-400 ${open ? "rotate-180" : ""}`} size={18} /></button>{open && <div className="border-t border-line px-4 pb-4 pt-3"><p className="text-[13px] leading-5 text-ink-600">{summary}</p><button onClick={() => version === "v3" ? go(5) : notify(`${version} 상세 승인 기록을 열었어요.`)} className="mt-3 min-h-11 text-[13px] font-bold text-primary-700">이 버전 상세 보기</button></div>}</Card>; })}</div>
    </main><Bottom><Outline onClick={() => notify("승인본과 변경 기록을 포함한 PDF를 준비했어요.")}><FileDown className="mr-2 inline" size={18} />전체 기록 PDF로 저장</Outline></Bottom></Page>
  );
}

function Profile({ go }: { go: (screen: number) => void }) {
  const [alerts, setAlerts] = useState(true);
  const notify = useDemoFeedback();
  return (
    <Page><StatusBar /><header className="flex h-14 items-center px-6"><h1 className="text-[22px] font-extrabold">내 정보</h1></header><main className="flex-1 px-6 pb-28 pt-3">
      <Card className="flex items-center p-5"><span className="grid size-14 place-items-center rounded-full bg-primary-50 text-primary-700"><UserRound size={28} /></span><div className="ml-4"><h2 className="text-[20px] font-extrabold">박민서</h2><p className="mt-1 text-[13px] text-ink-400">010-****-3041</p></div><button onClick={() => notify("이름과 연락처 수정 화면을 열었어요.")} className="ml-auto min-h-11 min-w-12 px-2 text-[13px] font-bold text-primary-700">수정</button></Card>
      <h2 className="mb-3 mt-7 text-[17px] font-bold">내 이사</h2><Card className="divide-y divide-line px-5"><button onClick={() => go(14)} className="flex min-h-[72px] w-full items-center text-left"><span className="grid size-10 place-items-center rounded-xl bg-canvas"><Truck size={20} /></span><span className="ml-3 flex-1"><b className="block text-[15px]">9월 12일 이사</b><small className="mt-1 block text-[12px] text-ink-400">마포구 성산동 → 성동구 행당동</small></span><ChevronRight size={18} className="text-ink-400" /></button><button onClick={() => go(12)} className="flex min-h-[72px] w-full items-center text-left"><span className="grid size-10 place-items-center rounded-xl bg-canvas"><ClipboardList size={20} /></span><span className="ml-3 flex-1"><b className="block text-[15px]">승인본과 변경 기록</b><small className="mt-1 block text-[12px] text-ink-400">현재 승인본 v4</small></span><ChevronRight size={18} className="text-ink-400" /></button></Card>
      <h2 className="mb-3 mt-7 text-[17px] font-bold">알림과 계정</h2><Card className="divide-y divide-line px-5"><div className="flex min-h-[72px] items-center"><span className="grid size-10 place-items-center rounded-xl bg-canvas"><Bell size={20} /></span><span className="ml-3 flex-1"><b className="block text-[15px]">진행 알림</b><small className="mt-1 block text-[12px] text-ink-400">견적·수정·현장 요청 알림</small></span><button role="switch" aria-checked={alerts} aria-label="진행 알림" onClick={() => setAlerts(!alerts)} className="relative grid h-11 w-14 place-items-center"><span className={`relative h-7 w-12 rounded-full ${alerts ? "bg-primary-600" : "bg-line"}`}><span className={`absolute top-1 size-5 rounded-full bg-white transition-transform ${alerts ? "left-6" : "left-1"}`} /></span></button></div><button onClick={() => notify("개인정보 및 서비스 이용약관을 열었어요.")} className="flex min-h-[64px] w-full items-center text-left"><span className="flex-1 text-[15px] font-bold">개인정보 및 약관</span><ChevronRight size={18} className="text-ink-400" /></button></Card>
      <button onClick={() => notify("로그아웃 확인을 열었어요.")} className="mt-6 min-h-11 text-[13px] font-bold text-danger-ink">로그아웃</button>
    </main><ConsumerNav active="profile" go={go} /></Page>
  );
}

export function ConsumerDemo() {
  const [screen, setScreen] = useState(1);
  const [trail, setTrail] = useState<number[]>([]);
  const requestedScreen = useDemoQuery("screen");
  const demoState = useDemoQuery("state");
  useEffect(() => {
    const parsed = Number(requestedScreen);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 15) return;
    const timer = window.setTimeout(() => { setScreen(parsed); setTrail([]); }, 0);
    return () => window.clearTimeout(timer);
  }, [requestedScreen]);
  const go = (target: number) => {
    const bounded = Math.min(15, Math.max(1, target));
    if (bounded === screen) return;
    setTrail((current) => [...current, screen]);
    setScreen(bounded);
  };
  const nextMap: Record<number, number> = { 1: 2, 2: 3, 3: 8, 8: 4, 4: 10, 9: 4, 10: 5, 11: 5, 5: 6, 6: 7, 7: 13, 13: 12, 12: 1 };
  const backMap: Record<number, number> = { 2: 1, 3: 2, 8: 3, 4: 8, 9: 4, 10: 4, 5: 10, 11: 5, 6: 5, 7: 6, 13: 7, 12: 13, 14: 1 };
  const next = () => go(nextMap[screen] ?? 1);
  const back = () => {
    const previous = trail.at(-1);
    if (previous) {
      setTrail((current) => current.slice(0, -1));
      setScreen(previous);
      return;
    }
    setScreen(backMap[screen] ?? 1);
  };
  let content: ReactNode;
  switch (screen) {
    case 1: content = <ConsumerHome go={go} />; break;
    case 2: content = <Conditions next={next} back={back} />; break;
    case 3: content = <Capture next={next} back={back} />; break;
    case 4: content = <ConfirmItems next={next} back={back} openItems={() => go(9)} />; break;
    case 5: content = <ScopeSummary next={next} back={back} go={go} demoState={demoState} />; break;
    case 6: content = <OnsiteApproval next={next} back={back} demoState={demoState} />; break;
    case 7: content = <Completion next={next} back={back} demoState={demoState} />; break;
    case 8: content = <Analysis next={next} back={back} demoState={demoState} />; break;
    case 9: content = <Analysis next={next} back={back} demoState={demoState} sheet />; break;
    case 10: content = <Invite next={next} back={back} />; break;
    case 11: content = <Revision next={next} back={back} demoState={demoState} />; break;
    case 13: content = <CompletionComparison next={next} back={back} />; break;
    case 14: content = <MoveHub go={go} />; break;
    case 15: content = <Profile go={go} />; break;
    default: content = <History back={back} go={go} />;
  }
  const linkState = demoState === "link-expired" || demoState === "link-revoked" || demoState === "link-invalid" ? demoState : null;
  return <DemoFeedbackProvider><MobileFrame>{linkState ? <><StatusBar /><DemoLinkState roleLabel="고객" state={linkState} /></> : <div key={screen}>{content}</div>}</MobileFrame></DemoFeedbackProvider>;
}

export default ConsumerDemo;
