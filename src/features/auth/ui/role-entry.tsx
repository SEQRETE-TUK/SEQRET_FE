import { useState, type FormEvent } from "react";
import { Building2, Check, HardHat, LoaderCircle, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { MobileFrame, StatusBar } from "@/components/layout/mobile-frame";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, rolePath } from "@/features/auth/model/auth-context";
import { apiErrorMessage, type ParticipantRole } from "@/features/workflow/api/workflow-api";

const roles = [
  { id: "customer", label: "사용자", description: "내 이사와 견적 확인", icon: UserRound },
  { id: "company_manager", label: "업체", description: "견적 제안과 배차 관리", icon: Building2 },
  { id: "field_worker", label: "작업자", description: "오늘 작업범위와 현장 기록", icon: HardHat },
] as const;

function roomZones(value: string) {
  const names = value.split(",").map((name) => name.trim()).filter(Boolean);
  return (names.length ? names : ["전체 공간"]).map((name, sort_order) => ({ name, sort_order }));
}

export function RoleEntry() {
  const navigate = useNavigate();
  const { connect, onboard } = useAuth();
  const [selected, setSelected] = useState<ParticipantRole>("customer");
  const [secret, setSecret] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [title, setTitle] = useState("우리 집 이사");
  const [scheduledAt, setScheduledAt] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [zones, setZones] = useState("거실, 침실, 주방");

  const submitSecret = async (event: FormEvent) => {
    event.preventDefault();
    if (!secret.trim() || connecting) return;
    setConnecting(true);
    setError(null);
    try {
      const session = await connect(secret, selected);
      setSecret("");
      navigate(rolePath(session.actor.role));
    } catch (caught) {
      setError(caught instanceof Error && !("status" in caught) ? caught.message : apiErrorMessage(caught));
    } finally {
      setConnecting(false);
    }
  };

  const submitOnboarding = async (event: FormEvent) => {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      await onboard({
        title: title.trim(),
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        customer_display_name: customerName.trim(),
        locations: [
          { kind: "origin", label: origin.trim(), room_zones: roomZones(zones) },
          { kind: "destination", label: destination.trim(), room_zones: roomZones(zones) },
        ],
      });
      navigate("/consumer");
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setCreating(false);
    }
  };

  return (
    <MobileFrame className="flex min-h-dvh flex-col bg-canvas">
      <StatusBar />
      <main className="flex-1 px-6 pb-8 pt-7">
        <p className="text-lg font-extrabold tracking-[-0.4px] text-ink-900">SEQRET</p>
        <h1 className="mt-6 text-ui-title leading-[30px] font-extrabold tracking-[-0.5px]">
          어떤 역할로 연결할까요?
        </h1>
        <p className="mt-2 text-base leading-6 text-ink-600">역할은 보안코드의 서버 권한과 일치해야 해요.</p>

        <div aria-label="연결 역할" className="mt-6 grid grid-cols-3 gap-2" role="group">
          {roles.map((item) => {
            const active = item.id === selected;
            const Icon = item.icon;
            return (
              <button
                aria-pressed={active}
                className={`min-h-28 rounded-2xl border px-2 py-4 text-center ${active ? "border-primary-400 bg-primary-50" : "border-line bg-white"}`}
                key={item.id}
                onClick={() => { setSelected(item.id); setError(null); }}
                type="button"
              >
                <span className={`mx-auto grid size-10 place-items-center rounded-xl ${active ? "bg-white text-primary-700" : "bg-canvas text-ink-600"}`}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="mt-2 block font-bold">{item.label}</span>
                {active ? <Check aria-hidden="true" className="mx-auto mt-1 size-4 text-primary-700" /> : null}
              </button>
            );
          })}
        </div>

        {error ? <p aria-live="polite" className="mt-4 rounded-xl bg-danger-bg p-3 text-sm font-bold text-danger-ink">{error}</p> : null}

        {selected === "customer" ? (
          <Card className="mt-5 p-5">
            <h2 className="text-lg font-bold">새 이사 시작</h2>
            <p className="mt-1 text-sm text-ink-600">고객 전용 접근 정보는 이 탭의 메모리에만 유지됩니다.</p>
            <form className="mt-4 space-y-3" onSubmit={submitOnboarding}>
              <Label htmlFor="customer-name">이름</Label>
              <Input id="customer-name" maxLength={100} onChange={(event) => setCustomerName(event.target.value)} required value={customerName} />
              <Label htmlFor="job-title">작업 이름</Label>
              <Input id="job-title" maxLength={200} onChange={(event) => setTitle(event.target.value)} required value={title} />
              <Label htmlFor="scheduled-at">예정 일시</Label>
              <Input id="scheduled-at" onChange={(event) => setScheduledAt(event.target.value)} required type="datetime-local" value={scheduledAt} />
              <Label htmlFor="origin">출발지 표시명</Label>
              <Input id="origin" maxLength={100} onChange={(event) => setOrigin(event.target.value)} placeholder="예: 성수동 아파트" required value={origin} />
              <Label htmlFor="destination">도착지 표시명</Label>
              <Input id="destination" maxLength={100} onChange={(event) => setDestination(event.target.value)} placeholder="예: 합정동 오피스텔" required value={destination} />
              <Label htmlFor="zones">공간 이름</Label>
              <Input id="zones" onChange={(event) => setZones(event.target.value)} value={zones} />
              <Button className="w-full" disabled={creating} size="cta" type="submit">
                {creating ? <><LoaderCircle className="animate-spin" /> 생성 중...</> : "새 이사 만들기"}
              </Button>
            </form>
          </Card>
        ) : null}

        <Card className="mt-5 p-5">
          <h2 className="text-lg font-bold">발급된 보안코드로 연결</h2>
          <p className="mt-1 text-sm text-ink-600">초대 또는 기존 작업에서 받은 코드를 입력하세요.</p>
          <form className="mt-4 space-y-3" onSubmit={submitSecret}>
            <Label htmlFor="access-secret">Bearer 보안코드</Label>
            <Input autoComplete="off" id="access-secret" minLength={40} onChange={(event) => setSecret(event.target.value)} required spellCheck={false} type="password" value={secret} />
            <Button className="w-full" disabled={connecting} size="cta" type="submit">
              {connecting ? <><LoaderCircle className="animate-spin" /> 확인 중...</> : `${roles.find((role) => role.id === selected)?.label}로 연결`}
            </Button>
          </form>
        </Card>
      </main>
      <div className="home-indicator" />
    </MobileFrame>
  );
}
