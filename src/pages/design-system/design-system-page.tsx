import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Circle,
  ExternalLink,
  ImagePlus,
  MapPin,
  Play,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const colors = [
  { name: "Primary 600", value: "accent", role: "결정 CTA · 선택 · 진행", className: "bg-primary-600" },
  { name: "Primary 700", value: "accent-hover", role: "CTA hover · 강조", className: "bg-primary-700" },
  { name: "Primary 50", value: "accent-50", role: "정보 · 선택 배경", className: "bg-primary-50" },
  { name: "Canvas", value: "paper", role: "화면 배경", className: "bg-canvas" },
  { name: "Surface", value: "paper-2", role: "콘텐츠 표면", className: "bg-white" },
  { name: "Ink 900", value: "ink", role: "주요 텍스트", className: "bg-ink-900" },
  { name: "Ink 600", value: "ink-2", role: "보조 텍스트", className: "bg-ink-600" },
  { name: "Line", value: "rule", role: "구분선 · 테두리", className: "bg-line" },
  { name: "Success", value: "success", role: "완료 · 통과", className: "bg-success" },
  { name: "Warning", value: "warning", role: "모름 · 대기", className: "bg-warning" },
  { name: "Danger", value: "danger", role: "증가 · 거절 · 삭제", className: "bg-danger" },
];

const patterns = [
  ["역할 진입", "역할 1개 선택 + 단일 로그인 CTA"],
  ["작업/상태 홈", "상태 히어로 + 다음 행동 목록"],
  ["이사 조건", "경로/조건 행 · 카드 3개 요약 금지"],
  ["촬영/완료", "미디어 작업 영역 + 미디어 레일"],
  ["AI/작업 범위", "그룹 목록 + 구분선 + 상세 시트"],
  ["버전/이벤트", "타임라인"],
  ["변경 승인", "금액 비교 + 증거 + 변경점"],
  ["업체 데스크톱", "테이블 · 분할 패널 · 타임라인"],
  ["현장 작업자", "경로 스트립 + 체크리스트 + 증거 우선 폼"],
];

const sections = [
  ["governance", "Operating model"],
  ["foundations", "Foundations"],
  ["typography", "Typography"],
  ["components", "Components"],
  ["patterns", "Patterns"],
  ["quality", "Quality bar"],
  ["rules", "Usage rules"],
];

export function DesignSystemPage() {
  return (
    <main className="h-dvh overflow-y-auto overscroll-y-contain bg-canvas text-ink-900" id="main-content">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-7">
          <Link className="flex min-h-11 items-center gap-2 text-[13px] font-bold text-ink-600" to="/">
            <ArrowLeft aria-hidden="true" className="size-4" />
            서비스로 돌아가기
          </Link>
          <Badge variant="primary">Product UI v0.3</Badge>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden border-r border-line bg-white px-7 py-10 lg:block">
          <nav aria-label="디자인 시스템 목차" className="sticky top-8 space-y-1">
            <p className="mb-3 text-[11px] font-bold tracking-[0.12em] text-ink-400 uppercase">Contents</p>
            {sections.map(([href, label]) => (
              <a
                className="flex min-h-11 items-center rounded-xl px-3 text-[13px] font-semibold text-ink-600 hover:bg-primary-50 hover:text-primary-700"
                href={`#${href}`}
                key={href}
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 px-5 py-10 lg:px-12 lg:py-14">
          <section className="max-w-3xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary-600 text-[15px] font-extrabold text-white">SQ</span>
              <p className="text-[12px] font-bold tracking-[0.14em] text-primary-700 uppercase">SEQRET Design System</p>
            </div>
            <h1 className="text-[32px] leading-[42px] font-extrabold tracking-[-0.6px] sm:text-[40px] sm:leading-[52px]">
              한 화면에는 하나의 결정만.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-6 text-ink-600">
              공통 기준을 찾고, 재사용하고, 검증하기 위한 작은 팀의 단일 기준서입니다. 색은 상태를,
              레이아웃은 역할과 맥락을 설명합니다.
            </p>
          </section>

          <section className="scroll-mt-8 pt-16" id="governance">
            <SectionHeading
              eyebrow="01"
              title="Operating model"
              description="별도 패키지나 Storybook 없이, 이 페이지와 실제 코드만 함께 관리합니다."
            />

            <div className="mt-7 grid gap-4 lg:grid-cols-2">
              <RuleCard
                title="시스템에 포함"
                items={[
                  "여러 화면에서 재사용하는 토큰과 UI",
                  "역할별 흐름에서 반복되는 제품 패턴",
                  "접근성·문구·상태 표현의 최소 기준",
                  "실제 화면에서 검증된 사용 예시",
                ]}
              />
              <RuleCard
                title="화면에 남겨두기"
                items={[
                  "한 화면에서만 쓰는 일회성 구성",
                  "API·권한·업무 규칙 같은 제품 명세",
                  "아직 사용처가 없는 추측성 variant",
                  "다크 모드·패키지 배포 같은 미래 확장",
                ]}
              />
            </div>

            <h3 className="mt-9 text-[17px] leading-6 font-bold tracking-[-0.3px]">Source of truth</h3>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
              {[
                ["Tokens", "tokens.css", "색·공간·타이포 값의 단일 원본"],
                ["UI primitives", "src/components/ui", "Button · Badge · Card · Sheet"],
                ["Product patterns", "Figma Product UI v0.2", "역할별 정보 구조와 패턴"],
                ["Usage proof", "실제 서비스 화면", "소비자 · 업체 · PWA · 작업자"],
              ].map(([type, source, role]) => (
                <div
                  className="grid gap-1 border-b border-line px-5 py-4 last:border-b-0 sm:grid-cols-[140px_240px_1fr] sm:items-center"
                  key={type}
                >
                  <span className="text-[12px] font-bold">{type}</span>
                  <code className="text-[11px] text-primary-700">{source}</code>
                  <span className="text-[12px] leading-5 text-ink-600">{role}</span>
                </div>
              ))}
            </div>

            <h3 className="mt-9 text-[17px] leading-6 font-bold tracking-[-0.3px]">Change workflow</h3>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["1", "근거 확인", "실제 화면 또는 사용자 문제에서 시작"],
                ["2", "범위 결정", "공통이면 시스템, 한 번이면 화면에 유지"],
                ["3", "같이 수정", "코드·Figma·이 문서를 같은 변경으로 반영"],
                ["4", "검증", "모바일·데스크톱·키보드·주요 상태 확인"],
              ].map(([step, title, description]) => (
                <li className="rounded-2xl border border-line bg-white p-4" key={step}>
                  <span className="text-[11px] font-bold text-primary-600">{step.padStart(2, "0")}</span>
                  <p className="mt-2 text-[13px] font-bold">{title}</p>
                  <p className="mt-1 text-[11px] leading-4 text-ink-400">{description}</p>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-2xl bg-primary-50 p-5">
              <p className="text-[13px] font-bold text-primary-800">현재 운영 기준</p>
              <p className="mt-2 text-[12px] leading-5 text-ink-600">
                작업한 사람이 문서까지 갱신하고, 다른 한 명이 실제 화면과 접근성 기준을 확인합니다. 새 항목은
                사용 가능성·기존 규칙과의 일관성·다른 화면에서의 재사용성을 충족할 때만 공통화합니다.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                ["USWDS · 점진적 도입", "https://designsystem.digital.gov/maturity-model/"],
                ["GOV.UK · 기여 기준", "https://design-system.service.gov.uk/community/contribution-criteria/"],
                ["WCAG 2.2", "https://www.w3.org/TR/WCAG22/"],
              ].map(([label, href]) => (
                <a
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-[12px] font-bold text-ink-600 hover:border-primary-400 hover:bg-primary-50"
                  href={href}
                  key={href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {label}
                  <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              ))}
            </div>
          </section>

          <section className="scroll-mt-8 pt-16" id="foundations">
            <SectionHeading eyebrow="02" title="Foundations" description="코드에서 실제 사용 중인 색과 공간 규칙입니다." />

            <h3 className="mt-9 text-[17px] leading-6 font-bold tracking-[-0.3px]">Color roles</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {colors.map((color) => (
                <Card className="flex items-center gap-4 rounded-2xl p-4" key={color.name}>
                  <span aria-hidden="true" className={`size-12 shrink-0 rounded-xl border border-black/5 ${color.className}`} />
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] leading-5 font-bold">{color.name}</p>
                      <code className="text-[11px] text-ink-400">{color.value}</code>
                    </div>
                    <p className="mt-1 text-[12px] leading-4 text-ink-400">{color.role}</p>
                  </div>
                </Card>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-4 text-ink-400">
              Semantic 원색은 아이콘·경계에 사용하고, 작은 텍스트는 대비를 확보한 success / warning / danger ink 토큰을 사용합니다.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <RuleCard title="Mobile" items={["24px screen · 20px card padding", "44px minimum touch target", "56px sticky primary action"]} />
              <RuleCard title="Desktop" items={["28px content padding", "table / split pane 우선", "bounded object에만 card 사용"]} />
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
              <div className="grid grid-cols-3 border-b border-line bg-canvas px-5 py-3 text-[11px] font-bold text-ink-400">
                <span>Category</span><span>Value</span><span>Usage</span>
              </div>
              {[
                ["Spacing", "4pt semantic scale", "12 related · 16 row · 20 card · 32 section"],
                ["Radius", "12 / 16 / 24", "control · surface · sheet/modal"],
                ["Stroke", "1px", "hairline border only"],
                ["Icon", "24px · 2px stroke", "44px touch target 안에 배치"],
                ["Elevation", "L0 / L1 / L2", "base · sticky · overlay"],
              ].map((row) => (
                <div className="grid grid-cols-3 gap-3 border-b border-line px-5 py-4 text-[12px] leading-5 last:border-b-0" key={row[0]}>
                  <span className="font-bold">{row[0]}</span><span className="text-ink-600">{row[1]}</span><span className="text-ink-400">{row[2]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="scroll-mt-8 pt-16" id="typography">
            <SectionHeading eyebrow="03" title="Typography" description="Pretendard를 기본으로 사용하고 숫자와 시스템 대체 글꼴은 Inter가 보완합니다." />
            <div className="mt-7 overflow-hidden rounded-2xl border border-line bg-white px-5 sm:px-7">
              <TypeRow name="Display" spec="28 / 36 · 800" className="text-[28px] leading-9 font-extrabold tracking-[-0.5px]" text="128,000원" />
              <TypeRow name="Desktop title" spec="26 / 34 · 800" className="text-[26px] leading-[34px] font-extrabold tracking-[-0.5px]" text="이사 건 관리" />
              <TypeRow name="Mobile title" spec="22 / 30 · 800" className="text-[22px] leading-[30px] font-extrabold tracking-[-0.5px]" text="어떤 작업을 요청할까요?" />
              <TypeRow name="Heading" spec="17 / 24 · 700" className="text-[17px] leading-6 font-bold tracking-[-0.3px]" text="확인이 필요한 항목" />
              <TypeRow name="Body" spec="15 / 22 · 500" className="text-[15px] leading-[22px] font-medium" text="영상에서 분석한 작업 범위를 확인해 주세요." />
              <TypeRow name="Sub" spec="13 / 19 · 500" className="text-[13px] leading-[19px] font-medium" text="수정하면 새 버전으로 저장됩니다." />
              <TypeRow name="Caption" spec="12 / 16 · 600" className="text-[12px] leading-4 font-semibold" text="분석 완료 · 방금 전" />
            </div>
          </section>

          <section className="scroll-mt-8 pt-16" id="components">
            <SectionHeading eyebrow="04" title="Components" description="현재 서비스가 공통으로 사용하는 shadcn 기반 UI입니다." />

            <div className="mt-7 overflow-hidden rounded-2xl border border-line bg-white">
              {[
                ["Primitive", "Button · Badge · Card · Sheet", "components/ui에서 공통 관리"],
                ["Form", "Label · Input · Select · Textarea", "label·focus·invalid·disabled 상태 통일"],
                ["Product pattern", "List · Route · Step · Media", "반복되는 업무 맥락에만 사용"],
              ].map(([level, inventory, rule]) => (
                <div
                  className="grid gap-1 border-b border-line px-5 py-4 last:border-b-0 sm:grid-cols-[140px_260px_1fr] sm:items-center"
                  key={level}
                >
                  <span className="text-[12px] font-bold">{level}</span>
                  <span className="text-[12px] text-ink-600">{inventory}</span>
                  <span className="text-[11px] leading-4 text-ink-400">{rule}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <Showcase title="Buttons" description="화면당 Primary CTA는 하나만 사용합니다.">
                <div className="flex flex-wrap gap-3">
                  <Button>확인하고 계속</Button>
                  <Button variant="outline">나중에</Button>
                  <Button variant="destructive">삭제</Button>
                  <Button disabled>비활성</Button>
                </div>
              </Showcase>

              <Showcase title="Status chips" description="상태색은 장식이 아니라 의미만 전달합니다.">
                <div className="flex flex-wrap gap-2">
                  <Badge>기본</Badge><Badge variant="primary">확인 필요</Badge><Badge variant="warning">대기</Badge>
                  <Badge variant="success">완료</Badge><Badge variant="danger">오류</Badge>
                </div>
              </Showcase>

              <Showcase title="Form controls" description="입력 목적과 오류 상태를 같은 규칙으로 전달합니다.">
                <div className="grid gap-4">
                  <Label htmlFor="system-name">고객 이름</Label>
                  <Input autoComplete="name" id="system-name" name="customerName" placeholder="예: 박민서…" />
                  <Label htmlFor="system-room">공간</Label>
                  <Select defaultValue="living" id="system-room" name="room">
                    <option value="living">거실</option><option value="bedroom">침실</option>
                  </Select>
                  <Label htmlFor="system-note">변경 사유</Label>
                  <Textarea id="system-note" name="note" placeholder="고객에게 보일 변경 사유…" />
                </div>
              </Showcase>

              <Showcase title="List row" description="관련 정보는 카드 대신 행과 구분선으로 묶습니다.">
                <div className="divide-y divide-line">
                  {["작업 범위 v2", "변경 요청 내역"].map((label, index) => (
                    <div className="flex min-h-16 items-center gap-3" key={label}>
                      <div className="min-w-0 flex-1"><p className="text-[13px] font-bold">{label}</p><p className="mt-1 text-[11px] text-ink-400">{index ? "업체 확인 대기" : "오늘 14:32 · 최신 버전"}</p></div>
                      <ChevronRight aria-hidden="true" className="size-5 text-ink-400" />
                    </div>
                  ))}
                </div>
              </Showcase>

              <Showcase title="Route stops" description="출발지와 도착지는 하나의 경로로 읽히게 합니다.">
                <div className="relative space-y-1 before:absolute before:top-8 before:bottom-8 before:left-[13px] before:w-px before:bg-line">
                  <RouteStop label="출발지" value="08:00 · 마포구 · 5층" active />
                  <RouteStop label="도착지" value="성동구 · 8층" />
                </div>
              </Showcase>

              <Showcase title="Step item" description="완료, 현재, 예정 상태를 순서대로 표현합니다.">
                <div className="grid gap-2 sm:grid-cols-3">
                  <StepItem state="done" label="영상 촬영" /><StepItem state="current" label="범위 확인" /><StepItem state="upcoming" label="업체 확인" />
                </div>
              </Showcase>

              <Showcase title="Media tile" description="촬영 자료는 준비 상태와 오류를 직접 표시합니다.">
                <div className="grid grid-cols-3 gap-2">
                  <MediaTile label="추가" /><MediaTile label="영상 23초" state="ready" /><MediaTile label="재시도" state="error" />
                </div>
              </Showcase>
            </div>
          </section>

          <section className="scroll-mt-8 pt-16" id="patterns">
            <SectionHeading eyebrow="05" title="Pattern selection" description="정보 성격에 맞는 한 가지 구조를 선택합니다." />
            <div className="mt-7 overflow-hidden rounded-2xl border border-line bg-white">
              {patterns.map(([context, pattern], index) => (
                <div className="grid gap-1 border-b border-line px-5 py-4 last:border-b-0 sm:grid-cols-[40px_180px_1fr] sm:items-center" key={context}>
                  <span className="text-[11px] font-bold text-primary-600">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-[13px] font-bold">{context}</span>
                  <span className="text-[13px] leading-5 text-ink-600">{pattern}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="scroll-mt-8 pt-16" id="quality">
            <SectionHeading
              eyebrow="06"
              title="Quality bar"
              description="컴포넌트가 예쁘게 보이는 것보다, 모든 상태에서 이해하고 조작할 수 있는지가 우선입니다."
            />

            <div className="mt-7 grid gap-4 lg:grid-cols-2">
              <RuleCard
                title="Accessibility"
                items={[
                  "본문 텍스트 4.5:1, UI 경계와 상태 3:1 이상",
                  "프로젝트 터치 목표 44×44px, 키보드 focus 항상 표시",
                  "색만으로 상태를 구분하지 않고 텍스트·아이콘 병행",
                  "200% 확대와 320px 폭에서 정보·기능 손실 없음",
                  "동작 감소 설정과 비동기 상태 안내 지원",
                ]}
              />
              <RuleCard
                title="Content"
                items={[
                  "결정이 필요한 화면만 질문형 제목 사용",
                  "CTA는 ‘확인하고 계속’처럼 행동과 결과를 명시",
                  "상태는 주체와 시점을 포함해 대기 이유를 설명",
                  "금액 변경은 이전·변경·최종 값을 함께 표시",
                  "오류는 원인보다 사용자가 할 다음 행동을 우선 안내",
                ]}
              />
            </div>

            <h3 className="mt-9 text-[17px] leading-6 font-bold tracking-[-0.3px]">Required states</h3>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
              {[
                ["Action", "default · hover · focus · disabled · destructive"],
                ["Input", "empty · focus · filled · error · disabled"],
                ["Async", "queued · processing · success · error · retry"],
                ["Overlay", "open · close · scroll · focus return"],
              ].map(([kind, states]) => (
                <div className="grid gap-1 border-b border-line px-5 py-4 last:border-b-0 sm:grid-cols-[140px_1fr]" key={kind}>
                  <span className="text-[12px] font-bold">{kind}</span>
                  <span className="text-[12px] leading-5 text-ink-600">{states}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="scroll-mt-8 pt-16" id="rules">
            <SectionHeading eyebrow="07" title="Usage rules" description="디자인 선택을 빠르게 검토하는 최소 체크리스트입니다." />
            <div className="mt-7 grid gap-4 lg:grid-cols-2">
              <RuleChecklist title="Do" tone="success" items={["핵심 문구와 상태는 가능한 한 한 줄", "작은 본문도 15px 이상, 핵심 질문은 24px 이상", "한 화면의 핵심 결정과 Primary CTA는 1개", "버튼처럼 보이면 반드시 실제 상태가 바뀜", "단계 완료 후 탭·뒤로가기에서도 완료 상태와 다음 행동 유지"]} />
              <RuleChecklist title="Avoid" tone="danger" items={["문장을 억지로 나눠 만든 여백", "가시성 낮은 텍스트 링크와 토스트만 뜨는 가짜 버튼", "모호한 내부 용어: 승인본·지난 버전·잠김", "화면 문구에 제작자 관점의 내부 작업 용어 사용", "장식용 상태색과 placeholder 이미지"]} />
            </div>

            <div className="mt-8 rounded-3xl bg-ink-900 p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6">
              <div><p className="text-[17px] leading-6 font-bold">실제 화면에서 확인하기</p><p className="mt-1 text-[13px] leading-5 text-white/65">역할별 화면에 같은 규칙이 어떻게 적용됐는지 비교할 수 있습니다.</p></div>
              <div className="mt-5 flex flex-wrap gap-2 sm:mt-0">
                {[['소비자','/?role=consumer'],['업체','/provider'],['업체 PWA','/provider/web'],['작업자','/crew']].map(([label, href]) => (
                  <Link className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-white px-4 text-[12px] font-bold text-ink-900 hover:bg-primary-50" to={href} key={href}>{label}<ArrowRight aria-hidden="true" className="size-4" /></Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="border-b border-line pb-5"><p className="text-[11px] font-bold tracking-[0.12em] text-primary-600">{eyebrow}</p><h2 className="mt-2 text-[26px] leading-[34px] font-extrabold tracking-[-0.5px]">{title}</h2><p className="mt-2 text-[13px] leading-5 text-ink-600">{description}</p></div>;
}

function RuleCard({ title, items }: { title: string; items: string[] }) {
  return <Card className="rounded-2xl p-5"><p className="text-[15px] font-bold">{title}</p><ul className="mt-4 space-y-3">{items.map((item) => <li className="flex items-start gap-2 text-[13px] leading-5 text-ink-600" key={item}><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary-600" />{item}</li>)}</ul></Card>;
}

function TypeRow({ name, spec, className, text }: { name: string; spec: string; className: string; text: string }) {
  return <div className="grid gap-4 border-b border-line py-6 last:border-b-0 md:grid-cols-[130px_1fr] md:items-center"><div><p className="text-[12px] font-bold">{name}</p><p className="mt-1 text-[11px] text-ink-400">{spec}</p></div><p className={className}>{text}</p></div>;
}

function Showcase({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <Card className="rounded-2xl p-5"><p className="text-[17px] leading-6 font-bold">{title}</p><p className="mt-1 text-[12px] leading-4 text-ink-400">{description}</p><div className="mt-5">{children}</div></Card>;
}

function RouteStop({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return <div className="relative flex min-h-[62px] items-center gap-3"><span className={`z-10 grid size-7 shrink-0 place-items-center rounded-full ${active ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700"}`}><MapPin aria-hidden="true" className="size-4" /></span><div><p className="text-[12px] font-bold">{label}</p><p className="mt-1 text-[13px] text-ink-600">{value}</p></div></div>;
}

function StepItem({ state, label }: { state: "done" | "current" | "upcoming"; label: string }) {
  const styles = state === "done" ? "bg-success-bg" : state === "current" ? "bg-primary-50" : "border border-line bg-white";
  return <div className={`flex min-h-[68px] items-center gap-2 rounded-xl p-3 ${styles}`}><span className={`grid size-6 shrink-0 place-items-center rounded-full ${state === "done" ? "bg-success text-white" : state === "current" ? "bg-primary-600 text-white" : "bg-canvas text-ink-400"}`}>{state === "done" ? <Check className="size-3.5" /> : state === "current" ? <Circle className="size-2 fill-current" /> : <Circle className="size-2" />}</span><div><p className="text-[12px] font-bold">{label}</p><p className="mt-0.5 text-[11px] text-ink-400">{state === "done" ? "완료" : state === "current" ? "현재 단계" : "다음 단계"}</p></div></div>;
}

function MediaTile({ label, state = "empty" }: { label: string; state?: "empty" | "ready" | "error" }) {
  const styles = state === "error" ? "bg-danger-bg text-danger" : state === "ready" ? "bg-primary-50 text-primary-700" : "bg-canvas text-ink-400";
  return <div className={`grid min-h-[104px] place-items-center rounded-xl p-3 text-center ${styles}`}><div><span className="mx-auto grid h-[34px] w-[42px] place-items-center rounded-lg border border-current bg-white/70">{state === "ready" ? <Play className="size-4 fill-current" /> : state === "error" ? <AlertCircle className="size-4" /> : <ImagePlus className="size-4" />}</span><p className="mt-2 text-[11px] font-bold">{label}</p></div></div>;
}

function RuleChecklist({ title, tone, items }: { title: string; tone: "success" | "danger"; items: string[] }) {
  return <Card className="rounded-2xl p-5"><Badge variant={tone}>{title}</Badge><ul className="mt-5 space-y-3">{items.map((item) => <li className="flex items-start gap-2 text-[13px] leading-5 text-ink-600" key={item}>{tone === "success" ? <Check className="mt-0.5 size-4 shrink-0 text-success" /> : <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />}{item}</li>)}</ul></Card>;
}
