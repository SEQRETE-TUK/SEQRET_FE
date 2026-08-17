import { useEffect, useState, type ReactNode } from "react";
import {
  ClockIcon as Clock3,
  DownloadSimpleIcon as Download,
  FileTextIcon as FileText,
  HouseIcon as Home,
  CircleNotchIcon as LoaderCircle,
  PlayIcon as Play,
  PlusIcon as Plus,
  UsersIcon as Users,
  VideoCameraIcon as Video,
} from "@phosphor-icons/react";
import {
  WarningStatusIcon as AlertTriangle,
  SecurityStatusIcon as ShieldCheck,
} from "@/components/icons";
import { Link } from "react-router-dom";

import Image from "@/components/native-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDemoFeedback } from "@/features/scope/model/demo-feedback-context";
import { useDemoQuery } from "@/features/scope/model/use-demo-query";
import { DemoFeedbackProvider } from "@/features/scope/ui/demo-feedback";

const ink = "text-ink-900";
const muted = "text-ink-400";
const crew = [
  ["김도윤 · 팀장", "피아노 · 가구조립"],
  ["최민석", "피아노 · 중량물"],
  ["박진호", "가구조립"],
  ["이현수", "포장 · 운반"],
] as const;

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
      <header className="flex h-16 items-center border-b border-line bg-white px-7"><strong className="text-2xl font-black text-primary-800">SEQRET</strong><Badge className="ml-4" variant="primary">파트너 PWA</Badge><button onClick={() => notify("현재 링크 참여자: 한빛이사 · 이상담 관리자")} className={`ml-auto inline-flex min-h-11 items-center px-2 text-ui-data font-bold ${muted}`} type="button">한빛이사 · 이상담 관리자⌄</button></header>
      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="w-[220px] shrink-0 border-r border-line bg-white p-3 max-lg:hidden">{nav.map(([id,label,icon]) => <button className={`mb-1 flex h-11 w-full items-center gap-3 rounded-xl px-4 text-left text-ui-data font-bold ${view === id ? 'bg-primary-50 text-primary-800' : 'text-ink-600'}`} key={id} onClick={() => setView(id)} type="button">{icon}{label}</button>)}</aside>
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
  return <><div className="flex items-center"><h1 className="text-ui-section font-extrabold">이사 건 관리</h1><Button className="ml-auto" onClick={() => open('quote')}><Plus size={18} /> 새 매칭 건 검토</Button></div>
    <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">{[['검토 대기','3건','neutral'],['고객 확인 대기','2건','warning'],['오늘 작업','1건','primary'],['이번 주 완료','7건','success']].map(([label,value,tone]) => <Card className="p-5" key={label}><span className={`text-ui-data ${muted}`}>{label}</span><strong className={`mt-1 block text-2xl ${tone === 'warning' ? 'text-warning' : tone === 'success' ? 'text-success-ink' : tone === 'primary' ? 'text-primary-800' : ink}`}>{value}</strong></Card>)}</div>
    <Card className="mt-5 p-4"><div className="flex gap-2 overflow-x-auto">{['전체 12','검토 대기 3','확인 대기 2','진행 중 1'].map(label => <Button key={label} onClick={() => setFilter(label)} size="chip" variant={filter === label ? 'default' : 'ghost'}>{label}</Button>)}</div></Card>
    <Card className="mt-4 overflow-x-auto rounded-none border-0"><table className="w-full min-w-[760px] text-left text-ui-data"><thead className="bg-canvas text-ink-400"><tr>{['고객 · 이사일','구간','범위 버전','총액','상태','액션'].map(h => <th className="px-5 py-4" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i) => <tr className="border-t border-line" key={row[0]}>{row.map((cell,j) => <td className={`px-5 py-4 ${j === 0 || j === 3 ? 'font-bold' : ''}`} key={cell}>{j === 4 ? <Badge variant={i === 0 ? 'primary' : 'warning'}>{cell}</Badge> : cell}</td>)}<td className="px-5 py-4"><Button onClick={() => open(i === 0 ? 'operate' : 'quote')} size="chip" variant={i === 0 ? 'default' : 'outline'}>{i === 0 ? '운영 보기' : '검토 시작'}</Button></td></tr>)}</tbody></table></Card>
    <div className="mt-5 rounded-2xl bg-primary-50 p-5 text-ui-data text-primary-800"><b>처리할 알림 2건</b><p className={`mt-1 ${muted}`}>박민서 건 변경요청 CR-01 고객 응답 대기 · 이수진 건 새 짐 목록 도착</p></div></>;
}

function QuoteView({ next }: { next: () => void }) {
  const [extra, setExtra] = useState(true);
  const [sending, setSending] = useState(false);
  const notify = useDemoFeedback();
  return <><Badge variant="warning">고객 수락 대기 (v3)</Badge><h1 className="mt-4 text-ui-section font-extrabold">작업범위 검토 · 견적</h1><p className={`mt-1 text-ui-data ${muted}`}>고객 확정 짐 21개 · 영상 3구역 · AI 초안 v1 기반</p>
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]"><Card className="overflow-hidden"><div className="flex items-center border-b border-line p-4"><b>공간 · 품목</b><Button onClick={() => notify("원본 영상 3개를 새 미디어 뷰어에서 열었어요.")} className="ml-auto" size="chip" variant="secondary"><Video size={16} /> 원본 영상 열기</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-ui-data"><thead className="bg-canvas text-ink-400"><tr>{['품목','수량','작업','AI 신뢰도','상태'].map(h => <th className="px-5 py-3" key={h}>{h}</th>)}</tr></thead><tbody>{[['거실 · 3인 소파','1','일반 운반','93%','확인'],['침실 · 업라이트 피아노','1','전문 운반','95%','인력 추가'],['침실 · 붙박이장?','1','현장 확인','61%','검토 필요'],['주방 · 양문형 냉장고','1','문 분리','98%','확인']].map((r,i) => <tr className="border-t border-line" key={r[0]}>{r.map((c,j) => <td className={`px-5 py-4 ${j === 0 ? 'font-bold' : ''} ${j === 3 ? (i === 0 || i === 3 ? 'text-success-ink' : 'text-warning') : ''}`} key={c}>{j === 4 ? <Badge variant={i === 0 || i === 3 ? 'success' : 'warning'}>{c}</Badge> : c}</td>)}</tr>)}</tbody></table></div><div className="m-5"><b>근거 영상</b><button onClick={() => notify("침실 0:19 근거 영상을 재생했어요.")} className="demo-interactive-card relative mt-3 block h-40 w-full overflow-hidden rounded-xl text-left" type="button"><Image alt="업라이트 피아노 근거 영상" className="object-cover" fill sizes="760px" src="/upright-piano-evidence.png" /><span className="absolute inset-0 bg-ink-900/20" /><span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-lg bg-ink-900/80 px-3 py-2 text-xs font-bold text-white"><Play className="fill-current" size={16} /> 침실 0:19 · 피아노</span></button></div></Card>
      <div className="space-y-5"><Card className="border-primary-400 p-5"><h2 className="text-ui-component font-bold">견적 구성</h2><div className="mt-5 flex justify-between text-ui-data"><span>기본 견적</span><b>1,160,000</b></div><button className="mt-4 flex min-h-11 w-full items-center justify-between" onClick={() => setExtra((current) => !current)} type="button"><span className="text-ui-data">피아노 전문 인력 +1</span><b>{extra ? '120,000' : '제외'}</b></button><button onClick={() => notify("새 견적 라인아이템을 추가했어요.")} className="mt-4 inline-flex min-h-11 items-center text-ui-data font-bold text-primary-800" type="button"><Plus className="inline" size={15} /> 항목 추가</button><div className="my-4 h-px bg-line" /><div className="flex items-end justify-between"><b>제안 총액</b><strong className="text-2xl text-primary-800">{(extra ? 1280000 : 1160000).toLocaleString("ko-KR")}원</strong></div><Button className="mt-6 w-full" disabled={sending} onClick={() => { if (sending) return; setSending(true); window.setTimeout(next, 500); }} size="cta">{sending ? <><LoaderCircle className="demo-spin" size={18} /> 전송 중...</> : "견적 제안 보내기 (v3)"}</Button></Card><Card className="p-5"><h2 className="font-bold">제안 수락 상태</h2><div className="mt-4 flex justify-between text-ui-data"><b>박민서 (고객)</b><Badge>수락 대기</Badge></div><div className="mt-3 flex justify-between text-ui-data"><b>한빛이사</b><Badge variant="success">제안 완료</Badge></div></Card></div></div></>;
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
      <div><Badge variant={sent ? "success" : "warning"}>{sent ? "고객 전송 완료" : "입력 필요"}</Badge><h1 className="mt-3 text-ui-section font-extrabold">현장 이슈 견적</h1><p className={`mt-1 text-ui-data ${muted}`}>도착지 엘리베이터 고장 · 10:55 · 기준 승인범위 v3</p></div>
      <Link className="rounded-xl border border-line bg-white px-4 py-3 text-ui-data font-bold" to="/crew?screen=3">작업자 보고 보기</Link>
    </div>
    <div className={`mt-5 rounded-xl px-4 py-3 text-ui-data font-bold ${blocked ? "bg-warning-bg text-warning-ink" : sent ? "bg-success-bg text-success-ink" : "bg-primary-50 text-primary-800"}`}>{warning}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
      <div className="space-y-5">
        <Card className="p-5"><div className="flex items-center justify-between"><h2 className="text-ui-component font-bold">현장 증빙 · 기사 설명</h2><Badge variant="warning">FIELD-01</Badge></div><p className="mt-3 text-sm font-bold">엘리베이터 고장으로 사다리차 하차가 필요합니다.</p><p className={`mt-1 text-ui-data ${muted}`}>5층 창문 진입 가능 · 김도윤 기사 · 증빙 2건</p><div className="mt-4 grid grid-cols-2 gap-3"><button className="demo-interactive-card relative h-28 overflow-hidden rounded-xl" onClick={() => notify("고장 엘리베이터 사진을 열었어요.")} type="button"><Image alt="고장 엘리베이터" className="object-cover" fill sizes="320px" src="/elevator-outage-evidence.png" /><span className="absolute inset-x-0 bottom-0 bg-ink-900/75 px-3 py-2 text-left text-xs font-bold text-white">고장 엘리베이터</span></button><button className={`demo-interactive-card relative h-28 overflow-hidden rounded-xl text-ui-data font-bold ${evidenceFailed ? "bg-danger-bg text-danger-ink" : ""}`} onClick={() => { setEvidenceFailed(false); notify("안내문 증빙을 다시 불러왔어요."); }} type="button">{evidenceFailed ? <span className="absolute inset-0 grid place-items-center"><AlertTriangle size={22} />불러오기 실패 · 재시도</span> : <><Image alt="엘리베이터 고장 안내문" className="object-cover" fill sizes="320px" src="/elevator-outage-evidence.png" style={{ objectPosition: "49% 45%" }} /><span className="absolute inset-x-0 bottom-0 bg-ink-900/75 px-3 py-2 text-left text-xs text-white">고장 안내문</span></>}</button></div></Card>
        <Card className="overflow-hidden"><div className="border-b border-line p-5"><h2 className="text-ui-component font-bold">변경 작업</h2></div><div className="grid grid-cols-[1fr_80px_1fr_110px] gap-3 px-5 py-4 text-xs text-ink-400"><span>항목</span><span>수량</span><span>작업</span><span>상태</span></div><div className="grid grid-cols-[1fr_80px_1fr_110px] items-center gap-3 border-t border-line px-5 py-4 text-ui-data"><b>사다리차</b><span>1</span><span>하차 추가</span><Badge variant="warning">업체 확정</Badge></div><div className="grid grid-cols-[1fr_80px_1fr_110px] items-center gap-3 border-t border-line px-5 py-4 text-ui-data"><b>확정 범위</b><span>21개</span><span>기존 작업 유지</span><Badge variant="primary">v3 최신</Badge></div></Card>
      </div>
      <div className="space-y-5">
        <Card className="border-primary-400 p-5"><h2 className="text-ui-component font-bold">변경 편집</h2><div className="mt-5 flex justify-between text-ui-data"><span className={muted}>기존 금액</span><b>1,280,000원</b></div><label className="mt-4 block text-ui-data font-bold">증감 금액<Input name="amountDelta" className="mt-2 h-12 w-full rounded-xl bg-canvas px-4 text-right text-base font-bold outline-none" disabled={sent} min="0" onChange={(event) => setDelta(event.target.value)} type="number" value={delta} /></label><label className="mt-4 block text-ui-data font-bold">변경 사유<Textarea name="changeReason" className="mt-2 h-24 w-full resize-none rounded-xl bg-canvas p-4 text-ui-data outline-none" defaultValue="엘리베이터 고장으로 사다리차 하차 방법이 필요합니다." disabled={sent} /></label><div className="my-5 h-px bg-line" /><div className="flex items-end justify-between"><b>변경 후 총액</b><strong className="text-2xl text-primary-800">{total.toLocaleString("ko-KR")}원</strong></div><Button className="mt-6 w-full" disabled={blocked || sent || sending || !Number(delta)} onClick={() => { setSending(true); window.setTimeout(() => { setSending(false); setSent(true); notify("변경안 v4를 고객에게 보냈어요."); }, 500); }} size="cta">{sending ? <><LoaderCircle className="demo-spin" size={18} /> 전송 중...</> : sent ? "고객 전송 완료" : blocked ? "문제를 먼저 해결해 주세요" : "변경안 고객에게 보내기"}</Button></Card>
        <Card className="p-5"><h2 className="font-bold">추가 확인</h2><div className="mt-4 flex justify-between text-ui-data"><b>현장기사</b><Badge variant="success">전달 완료</Badge></div><div className="mt-3 flex justify-between text-ui-data"><b>고객</b><Badge variant={sent ? "warning" : "neutral"}>{sent ? "응답 대기" : "전송 전"}</Badge></div></Card>
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
  return <><Badge variant="warning">피아노 작업 포함</Badge><h1 className="mt-4 text-ui-section font-extrabold">배차 · 인력 배정</h1><p className={`mt-1 text-ui-data ${muted}`}>확정 범위 v3 · 5톤 1대 · 작업자 4명 · 예상 6시간</p><div className="mt-5 grid gap-5 xl:grid-cols-2"><div className="space-y-5"><Card className="p-5"><div className="flex justify-between"><b>차량 선택</b><Badge>후보 2대</Badge></div>{[['12가3456 · 5톤 리프트 · 적재함 28㎡','당일 일정 없음'],['34나7890 · 5톤 · 적재함 26㎡','09:30 다른 일정과 충돌']].map(([name,sub],i) => <button className={`demo-interactive-card mt-3 flex w-full items-center rounded-xl border p-4 text-left ${vehicle === i ? (i ? 'border-warning bg-warning-bg' : 'border-primary-400 bg-primary-50') : 'border-line'}`} key={name} onClick={() => setVehicle(i)} type="button"><span className={`mr-3 size-5 rounded-full border-2 ${vehicle === i ? `border-[6px] ${i ? 'border-warning' : 'border-primary-800'}` : 'border-[var(--color-rule-2)]'}`} /><div><b>{name}</b><p className={`text-xs ${i ? 'text-warning' : muted}`}>{sub}</p></div></button>)}</Card><Card className="p-5"><div className="flex justify-between"><b>작업자 배정</b><Badge variant={externalConflictLabel ? "warning" : "success"}>4 / 4명</Badge></div>{crew.map(([name,skill], index) => <div className="flex h-12 items-center border-b border-line text-ui-data last:border-0" key={name}><b className="w-52">{name}</b><span className={`flex-1 ${muted}`}>{skill}</span>{externalConflictLabel && index === 0 ? <Badge variant="warning">확인 필요</Badge> : <Button onClick={() => notify(`${name}의 일정·자격 상세를 확인했어요.`)} size="chip">배정됨</Button>}</div>)}</Card></div><div className="space-y-5"><Card className={`p-5 ${conflict ? 'border-warning bg-warning-bg' : 'border-success bg-success-bg'}`}><h2 className="font-bold">충돌 확인 (7종 자동 검사)</h2>{conflict ? <div className="mt-5 space-y-3 text-ui-data font-bold text-warning-ink"><p>! {conflictLabel}</p><p>✓ 차량 용량 · 필요 24㎡ / 후보 {vehicle === 1 ? "26" : "28"}㎡</p><p>✓ 인원 충족 · 4/4</p><p className="text-danger-ink">문제 항목을 해결하기 전에는 배정을 확정할 수 없어요.</p></div> : <div className="mt-5 grid grid-cols-2 gap-5 text-ui-data font-bold text-success-ink">{['차량 일정 · 충돌 없음','차량 용량 · 여유 4㎡','작업자 일정 · 충돌 없음','인원 충족 · 4/4','피아노 자격 · 2명 유효','근무시간 · 예상 7.5h'].map(x => <span key={x}>✓ {x}</span>)}</div>}</Card><Card className="p-5"><b>작업자 전달 메모</b><Textarea name="crewNote" className="mt-4 h-20 w-full resize-none rounded-xl border border-line bg-canvas p-4 text-ui-data outline-none" defaultValue="피아노 이동 전 바닥 보강 · 도착지 엘리베이터 상태 우선 확인\n고객 연락은 팀장만 · 동호수는 현장에서 안내" /></Card><Button disabled={conflict || assigning} className="w-full" onClick={() => { if (conflict || assigning) return; setAssigning(true); window.setTimeout(next, 500); }} size="cta">{conflict ? '충돌을 먼저 해결해 주세요' : assigning ? <><LoaderCircle className="demo-spin" size={18} /> 배정 확정 중...</> : '배정 확정 · 작업자 링크 발송'}</Button></div></div></>;
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
  return <><Badge variant="primary">작업 중</Badge><h1 className="mt-4 text-ui-section font-extrabold">당일 운영 · 완료</h1><div className="mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]"><div className="space-y-5"><Card className="p-5"><h2 className="text-ui-component font-bold">실시간 타임라인</h2><div className="mt-6 space-y-7">{[['08:02 · 팀 체크인 · 안전확인 3종 통과','done'],['09:40 · 출발지 상차 완료 · 사진 6장','done'],['10:55 · 변경요청 CR-01 (사다리차 +150,000원)','wait'],['11:02 · 고객 승인 → v4 확정 · 총액 1,430,000원','done'],['도착지 하차 · 진행 중','next'],['완료 기록 · 대기','next']].map(([label,state]) => <button onClick={() => notify(`${label} 이벤트 상세를 열었어요.`)} className="demo-interactive-card flex min-h-11 w-full items-center gap-4 rounded-xl px-2 text-left" key={label}><span className={`size-4 rounded-full ${state === 'done' ? 'bg-success' : state === 'wait' ? 'bg-warning' : 'bg-line'}`} /><b className={`text-ui-data ${state === 'next' ? muted : ink}`}>{label}</b>{state === 'wait' && <Badge className="ml-auto" variant="warning">처리 기록</Badge>}</button>)}</div></Card><Card className="p-5"><h2 className="font-bold">완료 증빙 수신 현황</h2><div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">{[['거실 전/후','완료'],['침실 전/후','완료'],['주방·베란다','대기'],['차량 적재','완료']].map(([label,state]) => <button onClick={() => notify(`${label}: ${state} 상태를 확인했어요.`)} className={`demo-interactive-card grid h-24 place-items-center rounded-xl ${state === '대기' ? 'bg-warning-bg text-warning-ink' : 'bg-canvas text-success-ink'}`} key={label}><ShieldCheck size={22} /><b className="text-ui-data">{label} · {state}</b></button>)}</div></Card></div><div className="space-y-5"><Card className="border-primary-400 p-5"><h2 className="font-bold">금액 요약</h2><div className="mt-5 flex justify-between text-ui-data"><span className={muted}>기본 합의 (v3)</span><b>1,280,000원</b></div><div className="mt-4 flex justify-between text-ui-data"><span className={muted}>승인 변경 CR-01</span><b>+150,000원</b></div><div className="my-5 h-px bg-line" /><div className="flex justify-between"><b>최종 확정액 (v4)</b><strong className="text-2xl text-primary-800">1,430,000원</strong></div></Card><Card className="p-5"><h2 className="font-bold">완료 확인</h2><div className="mt-4 flex justify-between text-ui-data"><b>한빛이사 (나)</b><Badge variant="success">확인함</Badge></div><div className="mt-3 flex justify-between text-ui-data"><b>박민서 (고객)</b><Badge variant={requested ? 'warning' : 'neutral'}>{requested ? '요청 보냄' : '대기'}</Badge></div><Button disabled={requested || requesting} className="mt-4 w-full" onClick={() => { if (requested || requesting) return; setRequesting(true); window.setTimeout(() => { setRequesting(false); setRequested(true); notify("고객 완료 확인 요청을 보냈어요."); }, 550); }}>{requesting ? <><LoaderCircle className="demo-spin" size={16} /> 요청 중...</> : requested ? "완료 확인 요청 보냄" : "완료 확인 요청 보내기"}</Button></Card><Card className={docState === "failed" ? "border-warning bg-warning-bg p-5" : "p-5"}><h2 className="font-bold">문서 패키지</h2><p className={`mt-3 text-ui-data ${docState === "failed" ? "text-warning-ink" : muted}`}>{docState === "failed" ? "문서 생성 실패 · 작업 및 감사 기록은 정상 보존됨" : docState === "preparing" ? "문서 패키지 준비 중..." : "견적서 v3 · 변경 승인 기록 CR-01 · 완료 확인 기록 · 근무기록"}</p><Button disabled={docState === "preparing"} onClick={() => docState === "ready" ? notify("현재 확정 상태 기준 문서 패키지를 열었어요.") : retryDocuments()} className="mt-4" variant="outline">{docState === "preparing" ? <><LoaderCircle className="demo-spin" size={16} /> 준비 중</> : docState === "failed" ? <><AlertTriangle size={16} /> 문서 재시도</> : <><Download size={16} /> PDF 일괄 내려받기</>}</Button></Card></div></div></>;
}

export function ProviderWebScopeFlow() {
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
