import Image from "@/components/native-image";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeftIcon as ArrowLeft,
  CameraIcon as Camera,
  CheckIcon as Check,
  CaretRightIcon as ChevronRight,
  CircleNotchIcon as LoaderCircle,
  PhoneIcon as Phone,
  XIcon as X,
} from "@phosphor-icons/react";
import {
  WarningStatusIcon as AlertTriangle,
  SecurityStatusIcon as ShieldCheck,
} from "@/components/icons";
import { MobileFrame, StatusBar } from "@/components/layout/mobile-frame";
import { DemoFeedbackProvider } from "@/features/scope/ui/demo-feedback";
import { useDemoFeedback } from "@/features/scope/model/demo-feedback-context";
import { DemoLinkState } from "@/features/scope/ui/demo-link-state";
import { useDemoQuery } from "@/features/scope/model/use-demo-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function Header({
  title,
  back,
  close,
  badge,
}: {
  title: string;
  back?: () => void;
  close?: () => void;
  badge?: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 bg-canvas/95 px-5 backdrop-blur">
      {(back || close) && (
        <button
          aria-label={close ? "닫기" : "이전 화면"}
          className="-ml-2 grid size-11 place-items-center text-ink-900"
          onClick={close ?? back}
          type="button"
        >
          {close ? <X size={24} strokeWidth={2} /> : <ArrowLeft size={24} strokeWidth={2} />}
        </button>
      )}
      <h1 className="text-ui-section font-bold leading-6 tracking-[-0.3px] text-ink-900">{title}</h1>
      {badge && <Badge className="ml-auto" variant="success">{badge}</Badge>}
    </header>
  );
}

function Action({
  children,
  onClick,
  disabled,
  secondary,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Button
      className="w-full rounded-xl"
      disabled={disabled}
      onClick={onClick}
      size="cta"
      type="button"
      variant={secondary ? "outline" : "default"}
    >
      {children}
    </Button>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Card className={`rounded-2xl p-4 ${className}`}>{children}</Card>;
}

function Bottom({ children }: { children: ReactNode }) {
  return <footer className="sticky bottom-0 mt-auto space-y-2 border-t border-line bg-white px-5 pb-6 pt-4">{children}</footer>;
}

function Assignment({ next }: { next: () => void }) {
  const [starting, setStarting] = useState(false);
  const notify = useDemoFeedback();

  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]">
      <main className="px-5 pb-6 pt-5">
        <div className="flex items-center justify-between">
          <strong className="text-2xl font-black tracking-[-0.8px] text-primary-600">SEQRET</strong>
          <Badge variant="neutral">작업자용</Badge>
        </div>

        <p className="mt-8 text-base font-bold text-primary-600">오늘 배정된 작업</p>
        <h1 className="mt-2 text-ui-step-title font-extrabold leading-[34px] tracking-[-0.5px] text-ink-900">
          9월 12일 작업에<br />배정됐어요
        </h1>
        <p className="mt-2 text-lg leading-5 text-ink-600">한빛이사 · 김도윤 팀장 · 김철수 작업자</p>

        <Panel className="mt-6 border-primary-400 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ui-support font-bold text-ink-400">출발 예정</p>
              <h2 className="mt-1 text-ui-section font-extrabold text-ink-900">9월 12일 토요일 · 오전 8시</h2>
            </div>
            <Badge variant="primary">오늘</Badge>
          </div>
          <div className="my-4 h-px bg-line" />
          <div className="grid grid-cols-[72px_1fr] gap-y-3 text-base">
            <span className="text-ink-400">이동</span><b className="text-ink-900">마포구 성산동 → 성동구 행당동</b>
            <span className="text-ink-400">차량·인원</span><b className="text-ink-900">5톤 1대 · 작업자 4명</b>
            <span className="text-ink-400">예상 시간</span><b className="text-ink-900">약 6시간</b>
          </div>
        </Panel>

        <section className="mt-6">
          <h2 className="text-xl font-bold text-ink-900">내가 할 일</h2>
          <div className="mt-2 divide-y divide-line rounded-2xl border border-line bg-white px-4">
            {["승인된 작업범위 확인", "현장 조건이 다르면 바로 보고", "구역별 완료 사진 제출"].map((item) => (
              <div className="flex min-h-12 items-center gap-3 text-lg font-semibold text-ink-900" key={item}>
                <span className="grid size-6 place-items-center rounded-full bg-primary-50 text-primary-600"><Check size={15} strokeWidth={3} /></span>
                {item}
              </div>
            ))}
          </div>
          <p className="mt-3 text-base font-semibold text-danger-ink">금액 변경과 고객 승인 처리는 업체 담당자가 진행해요.</p>
        </section>
      </main>

      <Bottom>
        <Action disabled={starting} onClick={() => {
          if (starting) return;
          setStarting(true);
          window.setTimeout(next, 350);
        }}>
          {starting ? <><LoaderCircle className="demo-spin" size={18} /> 작업 내용 불러오는 중</> : "작업 내용 확인하기"}
        </Action>
        <button className="flex min-h-11 w-full items-center justify-center gap-2 text-lg font-bold text-ink-600" onClick={() => notify("김도윤 팀장에게 전화 연결을 요청했어요.")} type="button">
          <Phone size={18} /> 팀장에게 전화
        </button>
      </Bottom>
    </div>
  );
}

function CheckIn({ next, back }: { next: () => void; back: () => void }) {
  const [checks, setChecks] = useState([true, true, false]);
  const [checkingIn, setCheckingIn] = useState(false);
  const labels = ["안전화와 장갑을 착용했어요", "차량과 리프트를 점검했어요", "팀원에게 현장 조건을 공유했어요"];
  const ready = checks.every(Boolean);

  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]">
      <Header title="현장 도착" back={back} />
      <main className="px-5 pb-6 pt-3">
        <p className="text-base font-bold text-primary-600">작업 시작 전</p>
        <h2 className="mt-2 text-ui-title font-extrabold leading-[30px] tracking-[-0.5px] text-ink-900">3가지만 확인해 주세요</h2>
        <p className="mt-2 text-base text-ink-600">체크 기록은 오늘 작업 기록에 남아요.</p>

        <Panel className="mt-6 p-2">
          {labels.map((label, index) => (
            <button
              aria-pressed={checks[index]}
              className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left text-lg font-semibold text-ink-900 hover:bg-canvas"
              key={label}
              onClick={() => setChecks((current) => current.map((checked, item) => item === index ? !checked : checked))}
              type="button"
            >
              <span className={`grid size-6 shrink-0 place-items-center rounded-md border ${checks[index] ? "border-primary-600 bg-primary-600 text-white" : "border-ink-400 bg-white"}`}>
                {checks[index] && <Check size={15} strokeWidth={3} />}
              </span>
              {label}
            </button>
          ))}
        </Panel>

        <section className="mt-6 rounded-2xl border border-warning bg-white p-4">
          <div className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-warning-bg text-warning"><AlertTriangle size={20} /></span>
            <div>
              <p className="text-base font-bold text-warning-ink">도착지 엘리베이터 고장 확인</p>
              <p className="mt-1 text-base leading-5 text-ink-600">사다리차 사용 여부는 아직 미정이에요. 작업 시작 뒤 현장 보고로 알려주세요.</p>
            </div>
          </div>
        </section>
      </main>

      <Bottom>
        <Action disabled={!ready || checkingIn} onClick={() => {
          if (!ready || checkingIn) return;
          setCheckingIn(true);
          window.setTimeout(next, 400);
        }}>
          {checkingIn ? <><LoaderCircle className="demo-spin" size={18} /> 체크인 기록 중</> : "체크인하고 작업 시작"}
        </Action>
        {!ready && <p className="text-center text-xs text-ink-400">확인할 항목이 {3 - checks.filter(Boolean).length}개 남았어요.</p>}
      </Bottom>
    </div>
  );
}

const rooms = [
  {
    name: "거실",
    count: 7,
    summary: "3인 소파 · TV 65인치 · 대형 화분 2개",
    image: "/room-after-evidence.png",
    note: "TV는 보호 포장하고 화분은 세워서 운반해 주세요.",
  },
  {
    name: "침실",
    count: 6,
    summary: "퀸 침대 · 피아노 · 붙박이장 제외",
    image: "/upright-piano-evidence.png",
    note: "피아노는 전문 인력과 함께 운반해 주세요.",
  },
  {
    name: "주방·베란다",
    count: 8,
    summary: "냉장고 · 식탁 · 책장 · 러그",
    image: "/large-plant-evidence.png",
    note: "냉장고 문 분리 후 보호 포장해 주세요.",
  },
] as const;

function Scope({ next, back, demoState = "" }: { next: () => void; back: () => void; demoState?: string }) {
  const [selectedRoom, setSelectedRoom] = useState<(typeof rooms)[number] | null>(null);
  const latestApproved = demoState === "latest-v4";

  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]">
      <Header title="작업범위" back={back} badge={latestApproved ? "v4 양측 수락" : "v3 양측 수락"} />
      <main className="px-5 pb-6 pt-3">
        <h2 className="text-ui-title font-extrabold leading-[30px] tracking-[-0.5px] text-ink-900">오늘 할 작업을<br />확인해 주세요</h2>
        <p className="mt-2 text-base leading-5 text-ink-600">목록에 없는 작업은 시작하기 전에 보고해 주세요.</p>

        <Panel className="mt-5 p-4">
          <p className="flex items-start gap-2 text-lg font-bold text-ink-900"><Check className="mt-0.5 text-success-ink" size={17} />전체 포장·운반·정리 · 21개 품목</p>
          <p className="mt-3 flex items-start gap-2 text-base text-ink-600"><Check className="mt-0.5 text-success-ink" size={16} />냉장고 문 분리 · TV 보호 포장</p>
          <p className="mt-3 flex items-start gap-2 text-base text-ink-600"><Check className="mt-0.5 text-success-ink" size={16} />피아노 전문 운반 · 김도윤, 최민석</p>
          <div className="my-3 h-px bg-line" />
          <p className="flex items-start gap-2 text-base font-semibold text-danger-ink"><X className="mt-0.5" size={16} />폐기물 처리와 입주청소는 제외</p>
        </Panel>

        <section className="mt-6">
          <h3 className="text-xl font-bold text-ink-900">공간별 짐</h3>
          <div className="mt-2 space-y-2">
            {rooms.map((room) => (
              <button className="flex min-h-[68px] w-full items-center rounded-2xl border border-line bg-white px-4 text-left" key={room.name} onClick={() => setSelectedRoom(room)} type="button">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas text-base font-extrabold text-ink-900">{room.count}</span>
                <span className="ml-3 min-w-0 flex-1">
                  <b className="block text-lg text-ink-900">{room.name}</b>
                  <small className="mt-1 block truncate text-ui-support text-ink-400">{room.summary}</small>
                </span>
                <ChevronRight className="text-ink-400" size={19} />
              </button>
            ))}
          </div>
        </section>

        <p className="mt-5 text-base font-semibold text-warning-ink">주의 · 도착지 엘리베이터 상태를 다시 확인해 주세요.</p>
      </main>

      <Bottom>
        <Action onClick={next}>{latestApproved ? "완료 기록으로 이동" : "현장 변경·이슈 보고"}</Action>
      </Bottom>

      <Sheet open={Boolean(selectedRoom)} onOpenChange={(open) => !open && setSelectedRoom(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedRoom?.name} 짐 {selectedRoom?.count}개</SheetTitle>
            <SheetDescription>승인된 수량과 운반 주의사항이에요.</SheetDescription>
          </SheetHeader>
          {selectedRoom && (
            <div className="px-5">
              <div className="relative h-44 overflow-hidden rounded-2xl bg-canvas">
                <Image alt={`${selectedRoom.name} 근거 사진`} className="object-cover" fill sizes="350px" src={selectedRoom.image} />
              </div>
              <Panel className="mt-4">
                <p className="text-lg font-bold text-ink-900">{selectedRoom.summary}</p>
                <p className="mt-2 text-base leading-5 text-ink-600">{selectedRoom.note}</p>
              </Panel>
            </div>
          )}
          <SheetFooter><Button className="w-full" onClick={() => setSelectedRoom(null)} size="cta">확인했어요</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function IssueReport({ next, back, demoState = "" }: { next: () => void; back: () => void; demoState?: string }) {
  const [category, setCategory] = useState("현장 장애");
  const [details, setDetails] = useState("도착지 엘리베이터 고장으로 사다리차가 필요합니다.");
  const [hasEvidence, setHasEvidence] = useState(true);
  const [paused, setPaused] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(demoState === "upload-failed");
  const [retrying, setRetrying] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const notify = useDemoFeedback();

  const retryUpload = () => {
    if (retrying) return;
    setRetrying(true);
    window.setTimeout(() => {
      setRetrying(false);
      setUploadFailed(false);
      setHasEvidence(true);
      notify("현장 사진을 다시 업로드했어요.");
    }, 500);
  };

  if (submitted) {
    return (
      <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]">
        <Header title="보고 완료" close={back} badge="업체 전달됨" />
        <main className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-success-bg text-success-ink"><Check size={32} strokeWidth={3} /></span>
          <h2 className="mt-5 text-ui-title-lg font-extrabold text-ink-900">현장 이슈를 전달했어요</h2>
          <p className="mt-3 text-lg leading-6 text-ink-600">한빛이사가 내용을 검토한 뒤<br />고객에게 변경안을 보내요.</p>
          <Panel className="mt-6 w-full text-left">
            <p className="text-ui-support font-bold text-ink-400">보고 내용</p>
            <p className="mt-1 text-lg font-bold text-ink-900">{category} · 엘리베이터 고장</p>
            <p className="mt-1 text-base text-ink-600">현장 사진 1장 첨부</p>
          </Panel>
        </main>
        <Bottom><Action onClick={next}>작업 완료 기록하기</Action></Bottom>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]">
      <Header title="현장 이슈 보고" close={back} />
      <main className="px-5 pb-6 pt-3">
        <h2 className="text-ui-title font-extrabold leading-[30px] tracking-[-0.5px] text-ink-900">무슨 일이 생겼나요?</h2>
        <p className="mt-2 text-base text-ink-600">작업자는 상황만 보고해요. 금액은 업체가 검토합니다.</p>

        {paused && <p className="mt-4 rounded-xl bg-warning-bg px-4 py-3 text-base font-bold text-warning-ink">작업 일시 중지 상태로 기록했어요.</p>}

        <section className="mt-6">
          <h3 className="text-lg font-bold text-ink-900">이슈 유형</h3>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {["범위 밖 작업", "파손 위험", "현장 장애"].map((item) => (
              <Button aria-pressed={category === item} className="w-full px-2" key={item} onClick={() => setCategory(item)} size="chip" variant={category === item ? "default" : "outline"}>{item}</Button>
            ))}
          </div>
        </section>

        <label className="mt-6 block">
          <span className="text-lg font-bold text-ink-900">상세 내용</span>
          <Textarea name="fieldIssueDetail" className="mt-2 h-24 w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-lg leading-6 text-ink-900 outline-none focus:border-primary-600" onChange={(event) => setDetails(event.target.value)} value={details} />
        </label>

        <section className="mt-6">
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-ink-900">현장 증빙</h3><span className="text-xs text-ink-400">최소 1장</span></div>
          {hasEvidence ? (
            <div className={`relative mt-2 h-40 overflow-hidden rounded-2xl border ${uploadFailed ? "border-warning" : "border-line"}`}>
              <Image alt="고장 난 엘리베이터 현장 사진" className="object-cover" fill sizes="350px" src="/elevator-outage-evidence.png" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink-900/75 px-4 py-3 text-white">
                <span className="text-base font-bold">고장 안내문 · 10:55</span>
                <button className="min-h-11 px-2 text-base font-bold" onClick={() => uploadFailed ? retryUpload() : setHasEvidence(false)} type="button">
                  {uploadFailed ? retrying ? "재시도 중" : "업로드 재시도" : "삭제"}
                </button>
              </div>
            </div>
          ) : (
            <button className="mt-2 flex h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary-400 bg-primary-50 text-base font-bold text-primary-600" onClick={() => setHasEvidence(true)} type="button"><Camera size={24} />현장 사진 추가</button>
          )}
        </section>
      </main>

      <Bottom>
        <Action disabled={!category || !details.trim() || !hasEvidence || uploadFailed || sending} onClick={() => {
          if (sending) return;
          setSending(true);
          window.setTimeout(() => { setSending(false); setSubmitted(true); }, 450);
        }}>
          {sending ? <><LoaderCircle className="demo-spin" size={18} /> 보고하는 중</> : uploadFailed ? "사진 업로드를 다시 시도해 주세요" : "업체에 이슈 보고"}
        </Action>
        <button className="min-h-11 w-full text-lg font-bold text-ink-600" onClick={() => setPaused((value) => !value)} type="button">{paused ? "작업 다시 시작" : "작업 일시 중지"}</button>
      </Bottom>
    </div>
  );
}

const completionAreas = [
  { name: "거실", detail: "완료 사진 5장", image: "/room-after-evidence.png" },
  { name: "침실", detail: "완료 사진 6장", image: "/upright-piano-evidence.png" },
  { name: "주방·베란다", detail: "사진을 촬영해 주세요", image: "/large-plant-evidence.png" },
] as const;

function Progress({ current }: { current: number }) {
  return <div className="flex gap-1.5" aria-label={`완료 기록 ${current + 1}단계`}>
    {[0, 1, 2].map((step) => <span className={`h-1.5 rounded-full ${step <= current ? "w-7 bg-primary-600" : "w-2 bg-line"}`} key={step} />)}
  </div>;
}

function Completion({ back, demoState = "" }: { back: () => void; demoState?: string }) {
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState([true, true, false]);
  const [checks, setChecks] = useState([true, false, false]);
  const [endConfirmed, setEndConfirmed] = useState(false);
  const [customerConfirmed, setCustomerConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadRecovered, setUploadRecovered] = useState(demoState !== "completion-upload-failed");
  const [online, setOnline] = useState(demoState !== "completion-offline");
  const notify = useDemoFeedback();

  const completePhoto = (index: number) => {
    if (index === 2 && !uploadRecovered) {
      setUploadRecovered(true);
      notify("주방·베란다 사진을 다시 업로드했어요.");
    }
    setDone((current) => current.map((item, area) => area === index ? true : item));
  };

  if (stage === 3) {
    return (
      <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]">
        <Header title="작업 완료" badge="제출 완료" />
        <main className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-success-bg text-success-ink"><ShieldCheck size={32} /></span>
          <h2 className="mt-5 text-ui-title-lg font-extrabold text-ink-900">오늘 작업을 마무리했어요</h2>
          <p className="mt-3 text-lg leading-6 text-ink-600">완료 사진과 체크 기록이<br />한빛이사에 전달됐어요.</p>
          <Panel className="mt-6 w-full text-left">
            <div className="flex justify-between text-base"><span className="text-ink-400">작업 시간</span><b>07:46–14:20</b></div>
            <div className="mt-3 flex justify-between text-base"><span className="text-ink-400">완료 사진</span><b>12장</b></div>
            <div className="mt-3 flex justify-between text-base"><span className="text-ink-400">승인된 변경</span><b>사다리차 1대</b></div>
          </Panel>
        </main>
      </div>
    );
  }

  const titles = ["구역별 완료 사진", "마지막 확인", "작업 종료 확인"];
  const subtitles = ["남은 구역 사진만 촬영해 주세요.", "작업 도구와 공간 상태를 확인해 주세요.", "기록을 확인하고 작업을 종료해 주세요."];

  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[832px]">
      <Header title="작업 완료 기록" back={back} badge={`${stage + 1}/3`} />
      <main className="px-5 pb-6 pt-3">
        <Progress current={stage} />
        <h2 className="mt-5 text-ui-title font-extrabold leading-[30px] tracking-[-0.5px] text-ink-900">{titles[stage]}</h2>
        <p className="mt-2 text-base text-ink-600">{subtitles[stage]}</p>

        {!online && (
          <div className="mt-5 rounded-2xl border border-warning bg-warning-bg p-4">
            <p className="text-base font-bold text-warning-ink">인터넷 연결을 확인해 주세요</p>
            <p className="mt-1 text-xs text-ink-600">입력한 내용은 이 화면에 그대로 남아 있어요.</p>
            <button className="mt-2 min-h-11 text-base font-bold text-primary-600" onClick={() => setOnline(true)} type="button">연결 다시 확인</button>
          </div>
        )}

        {stage === 0 && (
          <div className="mt-6 space-y-3">
            {completionAreas.map((area, index) => (
              <button className={`flex min-h-[84px] w-full items-center rounded-2xl border p-3 text-left ${done[index] ? "border-line bg-white" : "border-primary-400 bg-primary-50"}`} key={area.name} onClick={() => completePhoto(index)} type="button">
                <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-canvas"><Image alt={`${area.name} 완료 사진`} className="object-cover" fill sizes="80px" src={area.image} /></span>
                <span className="ml-3 min-w-0 flex-1"><b className="block text-lg text-ink-900">{area.name}</b><small className={`mt-1 block text-ui-support ${done[index] ? "text-ink-400" : "font-bold text-primary-600"}`}>{index === 2 && !uploadRecovered ? "업로드 실패 · 눌러서 재시도" : area.detail}</small></span>
                <span className={`grid size-8 place-items-center rounded-full ${done[index] ? "bg-success-bg text-success-ink" : "bg-primary-600 text-white"}`}>{done[index] ? <Check size={18} strokeWidth={3} /> : <Camera size={18} />}</span>
              </button>
            ))}
          </div>
        )}

        {stage === 1 && (
          <Panel className="mt-6 p-2">
            {["승인된 짐을 모두 하차했어요", "포장재와 작업 도구를 회수했어요", "고객과 공간별 완료 상태를 확인했어요"].map((label, index) => (
              <button aria-pressed={checks[index]} className="flex min-h-16 w-full items-center gap-3 rounded-xl px-3 text-left text-lg font-semibold text-ink-900 hover:bg-canvas" key={label} onClick={() => setChecks((current) => current.map((checked, item) => item === index ? !checked : checked))} type="button">
                <span className={`grid size-6 shrink-0 place-items-center rounded-md border ${checks[index] ? "border-primary-600 bg-primary-600 text-white" : "border-ink-400 bg-white"}`}>{checks[index] && <Check size={15} strokeWidth={3} />}</span>{label}
              </button>
            ))}
          </Panel>
        )}

        {stage === 2 && (
          <div className="mt-6 space-y-3">
            <Panel>
              <div className="flex items-center justify-between"><div><p className="text-ui-support font-bold text-ink-400">현장 변경</p><h3 className="mt-1 text-lg font-bold text-ink-900">사다리차 1대 추가</h3></div><Badge variant="success">고객 승인</Badge></div>
            </Panel>
            <button className={`flex min-h-[72px] w-full items-center rounded-2xl border p-4 text-left ${endConfirmed ? "border-success bg-success-bg" : "border-line bg-white"}`} onClick={() => setEndConfirmed((value) => !value)} type="button">
              <span className={`grid size-8 place-items-center rounded-full ${endConfirmed ? "bg-success text-white" : "bg-canvas text-ink-400"}`}><Check size={18} /></span>
              <span className="ml-3"><b className="block text-lg text-ink-900">14:20 작업 종료</b><small className="mt-1 block text-xs text-ink-400">실제 작업 6시간 34분</small></span>
            </button>
            <button className={`flex min-h-[72px] w-full items-center rounded-2xl border p-4 text-left ${customerConfirmed ? "border-success bg-success-bg" : "border-line bg-white"}`} onClick={() => setCustomerConfirmed((value) => !value)} type="button">
              <span className={`grid size-8 place-items-center rounded-full ${customerConfirmed ? "bg-success text-white" : "bg-canvas text-ink-400"}`}><ShieldCheck size={18} /></span>
              <span className="ml-3"><b className="block text-lg text-ink-900">고객과 완료 상태 확인</b><small className="mt-1 block text-xs text-ink-400">완료 사실만 기록해요</small></span>
            </button>
            <p className="text-ui-support leading-5 text-ink-400">완료 기록은 사실 확인 자료이며 파손·책임을 자동 판단하지 않아요.</p>
          </div>
        )}
      </main>

      <Bottom>
        {stage === 0 && <Action disabled={!done.every(Boolean) || !online || !uploadRecovered} onClick={() => setStage(1)}>다음 · 마지막 확인</Action>}
        {stage === 1 && <Action disabled={!checks.every(Boolean)} onClick={() => setStage(2)}>다음 · 작업 종료 확인</Action>}
        {stage === 2 && <Action disabled={!endConfirmed || !customerConfirmed || !online || submitting} onClick={() => {
          if (submitting) return;
          setSubmitting(true);
          window.setTimeout(() => { setSubmitting(false); setStage(3); }, 450);
        }}>{submitting ? <><LoaderCircle className="demo-spin" size={18} /> 제출하는 중</> : "작업 완료 기록 제출"}</Action>}
      </Bottom>
    </div>
  );
}

export function CrewScopeFlow() {
  const [screen, setScreen] = useState(0);
  const requestedScreen = useDemoQuery("screen");
  const demoState = useDemoQuery("state");

  useEffect(() => {
    const parsed = Number(requestedScreen);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 4) return;
    const timer = window.setTimeout(() => setScreen(parsed), 0);
    return () => window.clearTimeout(timer);
  }, [requestedScreen]);

  const linkState = demoState === "link-expired" || demoState === "link-revoked" || demoState === "link-invalid" ? demoState : null;

  return (
    <DemoFeedbackProvider>
      <MobileFrame>
        <StatusBar />
        {linkState ? <DemoLinkState roleLabel="작업자" state={linkState} /> : (
          <div className="demo-screen-enter" key={screen}>
            {screen === 0 && <Assignment next={() => setScreen(1)} />}
            {screen === 1 && <CheckIn back={() => setScreen(0)} next={() => setScreen(2)} />}
            {screen === 2 && <Scope back={() => setScreen(1)} demoState={demoState} next={() => setScreen(demoState === "latest-v4" ? 4 : 3)} />}
            {screen === 3 && <IssueReport back={() => setScreen(2)} demoState={demoState} next={() => setScreen(4)} />}
            {screen === 4 && <Completion back={() => setScreen(3)} demoState={demoState} />}
          </div>
        )}
      </MobileFrame>
    </DemoFeedbackProvider>
  );
}

export default CrewScopeFlow;
