import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Camera,
  Check,
  ChevronRight,
  ImagePlus,
  Phone,
  ShieldCheck,
  Truck,
  Video,
  X,
} from "lucide-react";
import { MobileFrame, StatusBar } from "@/components/layout/mobile-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    <header className="flex h-14 items-center gap-3 px-5">
      {(back || close) && (
        <button
          aria-label={close ? "닫기" : "이전 화면"}
          className="-ml-2 grid size-10 place-items-center rounded-full text-[#191927]"
          onClick={close ?? back}
          type="button"
        >
          {close ? <X size={24} strokeWidth={2} /> : <ArrowLeft size={24} strokeWidth={2} />}
        </button>
      )}
      <h1 className="text-[18px] font-bold leading-6 tracking-[-0.3px] text-[#191927]">{title}</h1>
      {badge && (
        <Badge className="ml-auto" variant="success">{badge}</Badge>
      )}
    </header>
  );
}

function Action({
  children,
  onClick,
  disabled,
  secondary,
}: {
  children: React.ReactNode;
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

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`rounded-2xl p-4 ${className}`}>{children}</Card>
  );
}

function Bottom({ children }: { children: React.ReactNode }) {
  return <footer className="mt-auto space-y-3 bg-white px-5 pb-6 pt-4">{children}</footer>;
}

function Assignment({ next }: { next: () => void }) {
  const [notice, setNotice] = useState(false);

  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[796px]">
      <div className="px-5 pt-4">
        <div className="flex items-center gap-4">
          <strong className="text-2xl font-black tracking-[-1px] text-[#4F46E5]">짐싸</strong>
          <Badge variant="neutral">작업자용</Badge>
        </div>

        <h1 className="mt-7 text-[22px] font-extrabold leading-[30px] tracking-[-0.5px] text-[#191927]">
          김철수님, 오늘 작업<br />링크로 초대됐어요
        </h1>
        <p className="mt-1 text-[13px] font-medium text-[#8E90A0]">한빛이사 · 김도윤 팀장이 배정 · 가입 없이 바로 시작</p>

        <Panel className="mt-5 border-[#818CF8] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#191927]">9월 12일 (토) 08:00 출발</h2>
            <Badge variant="primary">D-DAY</Badge>
          </div>
          <p className="mt-2 text-[13px] text-[#4B4B5C]">마포 월드컵북로 ** → 성동 왕십리로 **</p>
          <p className="mt-3 rounded-lg bg-[#F4F5F9] px-3 py-2 text-xs text-[#8E90A0]">
            동·호수는 현장 도착 후 팀장이 안내해요
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[13px] text-[#8E90A0]">5톤 12가3456 · 작업자 4명 · 예상 6시간</span>
            <Badge variant="warning">피아노</Badge>
          </div>
        </Panel>

        <div className="mt-4 rounded-2xl bg-[#F4F5F9] p-4">
          <h2 className="text-[13px] font-bold text-[#191927]">내 역할과 권한</h2>
          <p className="mt-2 text-[13px] text-[#4B4B5C]">승인된 작업범위 확인 · 현장 변경 보고 · 완료 사진 제출</p>
          <p className="mt-1 text-[13px] font-medium text-[#E5484D]">금액 확정과 고객 승인 대행은 할 수 없어요</p>
        </div>

        <div className="mt-4 rounded-xl bg-[#EEF2FF] px-4 py-3.5 text-[12px] font-bold text-[#4F46E5]">
          이 링크는 본인 전용이에요 · 작업 종료 후 자동 만료
        </div>
        {notice && <p className="mt-3 text-center text-xs font-semibold text-[#4B4B5C]">팀장에게 전화 연결을 요청했어요.</p>}
      </div>

      <Bottom>
        <Action onClick={next}>오늘 작업 시작하기</Action>
        <Action secondary onClick={() => setNotice(true)}>
          <span className="inline-flex items-center gap-2"><Phone size={18} /> 팀장에게 전화</span>
        </Action>
      </Bottom>
    </div>
  );
}

function CheckIn({ next, back }: { next: () => void; back: () => void }) {
  const [checks, setChecks] = useState([true, true, false]);
  const labels = ["보호장비 착용 (안전화·장갑)", "차량·리프트 점검", "작업 통로·엘리베이터 확인"];
  const ready = checks.every(Boolean);

  const toggle = (index: number) =>
    setChecks((current) => current.map((checked, item) => (item === index ? !checked : checked)));

  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[796px]">
      <Header title="현장 도착 · 체크인" back={back} />
      <main className="space-y-6 px-5 pt-2">
        <div className="rounded-2xl bg-[#EEF2FF] p-4">
          <p className="text-[13px] font-bold text-[#4F46E5]">고객이 확정한 범위 v3 기준으로 작업해요</p>
          <p className="mt-1 text-xs text-[#4B4B5C]">범위 미확정이면 체크인이 막혀요 (SCOPE_NOT_LOCKED)</p>
        </div>

        <section>
          <h2 className="mb-2 text-[15px] font-bold text-[#191927]">출발 전 안전 확인 (필수 3종)</h2>
          <Panel className="space-y-1 p-4">
            {labels.map((label, index) => (
              <button
                aria-pressed={checks[index]}
                className="flex min-h-12 w-full items-center gap-3 text-left text-[14px] font-semibold text-[#191927]"
                key={label}
                onClick={() => toggle(index)}
                type="button"
              >
                <span className={`grid size-5 shrink-0 place-items-center rounded-md border ${checks[index] ? "border-[#4F46E5] bg-[#4F46E5] text-white" : "border-[#8E90A0] bg-white"}`}>
                  {checks[index] && <Check size={14} strokeWidth={3} />}
                </span>
                {label}
              </button>
            ))}
            <p className="pt-2 text-xs text-[#8E90A0]">3종 모두 체크해야 시작할 수 있어요 · 체크 기록이 남아요</p>
          </Panel>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-bold text-[#191927]">현장 조건 확인</h2>
          <Panel className="space-y-3 text-[13px]">
            <div className="flex justify-between"><span className="text-[#8E90A0]">도착지 3층 · 엘리베이터</span><b className="text-[#E5484D]">고장 확인됨</b></div>
            <div className="flex justify-between"><span className="text-[#8E90A0]">사다리차</span><b className="text-[#F5A623]">미정 → 보고 필요</b></div>
            <div className="flex justify-between"><span className="text-[#8E90A0]">주차·상하차</span><b className="text-[#17A46B]">건물 앞 가능</b></div>
            <Badge variant="warning">달라진 조건은 현장 보고로 올려주세요</Badge>
          </Panel>
        </section>
      </main>

      <Bottom>
        <Action disabled={!ready} onClick={next}>체크인 · 작업 시작</Action>
        <p className="text-center text-xs text-[#8E90A0]">
          {ready ? "안전 확인을 완료했어요" : `안전 확인 ${checks.filter(Boolean).length === 2 ? "1건" : `${3 - checks.filter(Boolean).length}건`}이 남았어요`}
        </p>
      </Bottom>
    </div>
  );
}

function Scope({ next, back }: { next: () => void; back: () => void }) {
  const [videoSeen, setVideoSeen] = useState(false);
  const rooms = [
    ["거실 7", "소파 · TV · 화분 · 책장…"],
    ["침실 6", "피아노 · 붙박이장 제외 확정…"],
    ["주방 5 · 베란다 3", "냉장고 문 분리 · 잔짐 포장…"],
  ];

  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[796px]">
      <Header title="승인 범위 확인" back={back} badge="v3 · 양측 확정" />
      <main className="space-y-6 px-5 pt-2">
        <div className="rounded-xl bg-[#F4F5F9] p-4 text-[13px] font-semibold text-[#4B4B5C]">
          읽기 전용 · 이 목록에 없는 작업은 하기 전에 보고해 주세요
        </div>

        <section>
          <h2 className="mb-2 text-[15px] font-bold text-[#191927]">오늘 할 작업</h2>
          <Panel className="space-y-2 text-[13px] font-semibold text-[#191927]">
            {["전체 포장·운반·정리 (21개 품목)", "냉장고 문 분리 · TV 보호 포장", "피아노 전문 운반 (김도윤·최민석)"].map((item) => (
              <p className="flex items-start gap-1.5" key={item}><Check className="mt-0.5 shrink-0" size={14} strokeWidth={2.5} />{item}</p>
            ))}
            <p className="flex items-start gap-1.5 text-[#E5484D]"><X className="mt-0.5 shrink-0" size={14} />제외: 폐기물 처리 · 입주청소</p>
          </Panel>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-bold text-[#191927]">공간별 짐 (근거 영상 연결)</h2>
          <div className="space-y-2">
            {rooms.map(([room, detail]) => (
              <button className="flex h-14 w-full items-center rounded-2xl border border-[#E9EAF2] bg-white px-4 text-left" key={room} type="button">
                <b className="w-[84px] text-[13px] text-[#191927]">{room}</b>
                <span className="truncate text-xs text-[#8E90A0]">{detail}</span>
                <ChevronRight className="ml-auto text-[#8E90A0]" size={18} />
              </button>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-[#F5A623] bg-[#FFF6E5] p-4">
          <h2 className="text-[13px] font-bold text-[#4B4B5C]">특이사항 · 주의</h2>
          <p className="mt-1 text-[12px] text-[#4B4B5C]">피아노 이동 전 바닥 보강 · 도착지 엘리베이터 상태 확인</p>
        </div>
        {videoSeen && <p className="text-center text-xs font-semibold text-[#17A46B]">근거 영상 3개를 확인했어요.</p>}
      </main>

      <Bottom>
        <div className="grid grid-cols-2 gap-3">
          <Action secondary onClick={() => setVideoSeen(true)}><span className="inline-flex items-center gap-2"><Video size={18} /> 근거 영상 보기</span></Action>
          <Action onClick={next}>변경·이슈 보고</Action>
        </div>
      </Bottom>
    </div>
  );
}

function IssueReport({ next, back }: { next: () => void; back: () => void }) {
  const [category, setCategory] = useState("현장 장애");
  const [details, setDetails] = useState("도착지 엘리베이터 고장으로 사다리차가 필요합니다.\n5층 창측 진입 가능 확인했습니다.");
  const [photos, setPhotos] = useState(2);
  const [amount, setAmount] = useState("150000");
  const total = 1_280_000 + Number(amount || 0);

  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[796px]">
      <Header title="변경 · 이슈 보고" close={back} />
      <main className="space-y-5 px-5 pt-2">
        <div className="rounded-2xl bg-[#EEF2FF] p-4">
          <p className="text-[13px] font-bold text-[#4F46E5]">작업자는 금액을 확정할 수 없어요</p>
          <p className="mt-1 text-xs text-[#4B4B5C]">보고만 올리면 승인은 고객이 앱에서 직접 해요</p>
        </div>

        <section>
          <h2 className="mb-2 text-[15px] font-bold text-[#191927]">무슨 일인가요?</h2>
          <div className="grid grid-cols-3 gap-2">
            {["범위 밖 작업", "파손 위험", "현장 장애"].map((item) => (
              <Button
                aria-pressed={category === item}
                className="w-full px-2"
                key={item}
                onClick={() => setCategory(item)}
                size="chip"
                type="button"
                variant={category === item ? "default" : "ghost"}
              >
                {item}
              </Button>
            ))}
          </div>
        </section>

        <label className="block">
          <span className="mb-2 block text-[15px] font-bold text-[#191927]">상세 내용</span>
          <textarea
            className="h-[74px] w-full resize-none rounded-xl border border-[#E9EAF2] bg-white px-4 py-3 text-[13px] leading-6 text-[#4B4B5C] outline-none focus:border-[#4F46E5]"
            onChange={(event) => setDetails(event.target.value)}
            value={details}
          />
        </label>

        <section>
          <h2 className="mb-2 text-[15px] font-bold text-[#191927]">현장 증빙 (최소 1건 필수)</h2>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: photos }, (_, index) => (
              <button
                aria-label={`증빙 사진 ${index + 1} 삭제`}
                className="grid h-20 place-items-center rounded-xl border border-dashed border-[#E9EAF2] bg-[#F4F5F9] text-[#8E90A0]"
                key={index}
                onClick={() => setPhotos((value) => Math.max(0, value - 1))}
                type="button"
              >
                {index === 0 ? <Camera size={24} /> : <Building2 size={24} />}
                <span className="-mt-3 text-[11px]">{index === 0 ? "현장 사진" : "고장 안내문"}</span>
              </button>
            ))}
            {photos < 3 && (
              <button
                className="grid h-20 place-items-center rounded-xl border border-dashed border-[#E9EAF2] bg-[#F4F5F9] text-[#8E90A0]"
                onClick={() => setPhotos((value) => value + 1)}
                type="button"
              >
                <ImagePlus size={24} />
                <span className="-mt-3 text-[11px]">추가</span>
              </button>
            )}
          </div>
        </section>

        <label className="block">
          <span className="mb-2 block text-[15px] font-bold text-[#191927]">필요한 금액 (예상)</span>
          <span className="flex h-[52px] items-center rounded-xl border border-[#E9EAF2] bg-white px-4">
            <input
              aria-label="예상 추가 금액"
              className="min-w-0 flex-1 bg-transparent text-[17px] font-bold text-[#191927] outline-none"
              min="0"
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              value={amount}
            />
            <span className="text-xs text-[#8E90A0]">원</span>
          </span>
        </label>

        <div className="rounded-xl bg-[#F4F5F9] p-4 text-xs text-[#8E90A0]">
          <b className="block pb-1 text-[#191927]">고객에게 이렇게 보여요</b>
          기존 1,280,000원 + {Number(amount || 0).toLocaleString("ko-KR")}원 → 승인 시 {total.toLocaleString("ko-KR")}원
        </div>
      </main>

      <Bottom>
        <Action disabled={!category || !details.trim() || photos < 1} onClick={next}>고객 승인 요청 보내기</Action>
        <Action secondary onClick={back}>작업 일시 중지</Action>
      </Bottom>
    </div>
  );
}

function Completion({ back }: { back: () => void }) {
  const [done, setDone] = useState([true, true, false]);
  const [truckPhoto, setTruckPhoto] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const areas = [
    ["거실", "완료 5장 · 14:02 업로드"],
    ["침실 (피아노 포함)", "완료 6장 · 14:08 업로드"],
    ["주방 · 베란다", "지금 촬영해 주세요"],
  ];

  const capture = (index: number) => setDone((current) => current.map((item, area) => (area === index ? true : item)));

  return (
    <div className="flex min-h-[calc(100dvh-48px)] flex-col md:min-h-[796px]">
      <Header title="완료 사진 제출" back={back} badge="작업 마무리" />
      <main className="space-y-5 px-5 pt-2">
        <div className="rounded-xl bg-[#F4F5F9] p-4 text-[13px] font-semibold text-[#4B4B5C]">
          구역을 직접 선택해서 올려주세요 · 자동 분류하지 않아요
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#191927]">구역별 완료 사진</h2>
            <Badge variant={done.every(Boolean) ? "success" : "warning"}>
              {done.every(Boolean) ? "모든 구역 완료" : `${done.filter((item) => !item).length}개 구역 남음`}
            </Badge>
          </div>
          <div className="space-y-2">
            {areas.map(([area, detail], index) => (
              <div className={`flex min-h-[76px] items-center rounded-2xl border px-4 ${done[index] ? "border-[#E9EAF2] bg-white" : "border-[#818CF8] bg-[#EEF2FF]"}`} key={area}>
                <span className={`grid size-8 place-items-center rounded-full text-white ${done[index] ? "bg-[#17A46B]" : "bg-[#4F46E5]"}`}>
                  {done[index] ? <Check size={18} strokeWidth={3} /> : <Camera size={18} />}
                </span>
                <span className="ml-3 min-w-0 flex-1">
                  <b className="block text-[13px] text-[#191927]">{area}</b>
                  <small className={`block text-xs ${done[index] ? "text-[#8E90A0]" : "font-semibold text-[#4F46E5]"}`}>{detail}</small>
                </span>
                <button
                  className={`h-8 rounded-full px-4 text-xs font-bold ${done[index] ? "bg-[#F4F5F9] text-[#4B4B5C]" : "bg-[#4F46E5] text-white"}`}
                  onClick={() => capture(index)}
                  type="button"
                >
                  {done[index] ? "보기" : "촬영"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <button
          className="flex min-h-[76px] w-full items-center rounded-2xl border border-[#E9EAF2] bg-white px-4 text-left"
          onClick={() => setTruckPhoto(true)}
          type="button"
        >
          <Truck className="text-[#4B4B5C]" size={24} />
          <span className="ml-3 flex-1">
            <b className="block text-[13px] text-[#191927]">차량 적재 상태 (권장)</b>
            <small className="text-xs text-[#8E90A0]">분쟁 예방에 도움돼요 · 상차 완료 시점 1장</small>
          </span>
          <Badge variant={truckPhoto ? "success" : "neutral"}>
            {truckPhoto ? "추가됨" : "추가"}
          </Badge>
        </button>

        <div className="rounded-2xl bg-[#F4F5F9] p-4">
          <h2 className="text-[13px] font-bold text-[#191927]">내 근무 기록</h2>
          <p className="mt-2 text-xs text-[#4B4B5C]">07:46 체크인 → 진행 중 · 예상 종료 14:20</p>
          <p className="mt-1 text-xs text-[#8E90A0]">제출하면 팀장·업체에 공유되고 완료 기록에 포함돼요</p>
        </div>

        {submitted && (
          <div className="flex items-center gap-3 rounded-2xl bg-[#E6F7EF] p-4 text-[13px] font-bold text-[#17A46B]">
            <ShieldCheck size={22} /> 완료 사진을 제출했고 작업이 종료됐어요.
          </div>
        )}
      </main>

      <Bottom>
        <Action disabled={!done.every(Boolean) || submitted} onClick={() => setSubmitted(true)}>
          {submitted ? "제출 완료" : "제출하고 작업 종료"}
        </Action>
        {!done.every(Boolean) && <p className="text-center text-xs text-[#8E90A0]">남은 구역 1개를 완료하면 제출할 수 있어요</p>}
      </Bottom>
    </div>
  );
}

export function CrewScopeFlow() {
  const [screen, setScreen] = useState(0);

  return (
    <MobileFrame>
      <StatusBar />
      {screen === 0 && <Assignment next={() => setScreen(1)} />}
      {screen === 1 && <CheckIn back={() => setScreen(0)} next={() => setScreen(2)} />}
      {screen === 2 && <Scope back={() => setScreen(1)} next={() => setScreen(3)} />}
      {screen === 3 && <IssueReport back={() => setScreen(2)} next={() => setScreen(4)} />}
      {screen === 4 && <Completion back={() => setScreen(3)} />}
    </MobileFrame>
  );
}

