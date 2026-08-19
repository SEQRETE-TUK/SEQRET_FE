import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon as Check,
  CopyIcon as Copy,
  SignOutIcon as LogOut,
  ArrowClockwiseIcon as RefreshCw,
  PaperPlaneTiltIcon as Send,
  ShareNetworkIcon as ShareNetwork,
  UserPlusIcon as UserPlus,
  XIcon as X,
} from "@phosphor-icons/react";
import { InfoStatusIcon as Info } from "@/components/icons";
import { useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkflowTask } from "@/components/workflow/workflow-task";
import { useAuth } from "@/features/auth/model/auth-context";
import {
  apiErrorMessage,
  createInvitation,
  listInvitations,
  manageInvitation,
  respondToInvitation,
  shouldRecoverState,
  workflowKeys,
  type Connection,
  type InvitationIssued,
  type ParticipantRole,
} from "@/features/workflow/api/workflow-api";
import { useAuthFailure } from "@/features/workflow/model/use-auth-failure";
import { useRetryAfter } from "@/features/workflow/model/use-retry-after";
import { cn } from "@/lib/utils";

const roleLabel: Record<ParticipantRole, string> = {
  customer: "고객",
  company_manager: "업체",
  field_worker: "현장기사",
};

export function WorkflowShell({
  children,
  context,
  currentStep = 1,
  embedded = false,
  retryAfter = 0,
  stepLabels = ["연결", "범위 확인", "배차", "현장 진행", "완료 확인"],
  summary,
  title,
  wide = false,
}: {
  children: ReactNode;
  context?: ReactNode;
  currentStep?: number;
  embedded?: boolean;
  retryAfter?: number;
  stepLabels?: string[];
  summary?: string;
  title: string;
  wide?: boolean;
}) {
  const { session, clearSession } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  if (!session) return null;
  const content = (
    <>
      {retryAfter > 0 ? <p aria-live="polite" className="rounded-xl bg-warning-bg p-3 text-sm font-bold text-warning-ink">요청 제한으로 {retryAfter}초 동안 다시 제출할 수 없습니다.</p> : null}
      <section className={cn(embedded ? "ui-card ui-card-outlined overflow-hidden" : "ui-card p-5 shadow-[var(--shadow-card)]")}>
        <div className={cn(embedded && "px-5 py-4 sm:px-6")}>
          <h2 className={cn("text-ui-section leading-8 font-extrabold tracking-[var(--tracking-display)]", !embedded && "mt-2")}>{embedded ? title : "처리할 작업"}</h2>
          <p className="mt-2 text-sm leading-5 text-ink-600">{summary ?? "각 단계의 최신 상태를 확인하고 필요한 작업만 열어 처리할 수 있습니다."}</p>
        </div>
        {embedded && context ? <div className="[&>section]:m-0 [&>section]:border-b-0 [&>section]:px-5 sm:[&>section]:px-6">{context}</div> : null}
        <div className={cn("flex min-h-12 items-center justify-between border-line py-3 text-sm", embedded ? "border-t px-5 sm:px-6" : "mt-5 border-y")}>
          <span className="font-bold">현재 처리 단계</span>
          <span className="font-extrabold text-primary-700">{stepLabels[Math.min(currentStep, stepLabels.length - 1)]}</span>
        </div>
      </section>
      {embedded ? null : context}
      <fieldset className="min-w-0" disabled={retryAfter > 0}>{children}</fieldset>
    </>
  );
  if (embedded) return <section aria-label={title} className="min-w-0 space-y-5">{content}</section>;
  return (
    <div className={cn("min-h-dvh bg-canvas", wide ? "px-0" : "mobile-stage")}>
      <div className={cn("mx-auto min-h-dvh bg-canvas", wide ? "max-w-[var(--shell-wide)]" : "mobile-frame")}>
        <header className="app-safe-header sticky top-0 z-[var(--z-sticky)] flex items-center justify-between border-b border-line bg-surface/95 px-5 pb-3 backdrop-blur">
          <div className="min-w-0">
            <p className="truncate text-ui-control text-primary-700">{roleLabel[session.actor.role]} · {session.actor.display_name}</p>
            <h1 className="mt-1 truncate text-xl font-extrabold">{title}</h1>
          </div>
          <div className="flex gap-1">
            <Button aria-label="최신 상태 불러오기" onClick={() => queryClient.invalidateQueries({ queryKey: workflowKeys.root(session.actor.job_id) })} size="icon" variant="ghost"><RefreshCw /></Button>
            <Button aria-label="연결 종료" onClick={() => { clearSession(); navigate("/"); }} size="icon" variant="ghost"><LogOut /></Button>
          </div>
        </header>
        <main className={cn("pb-10", wide ? "px-5 pt-6 md:px-8" : "px-4 pt-5")} id="main-content">
          {content}
        </main>
      </div>
    </div>
  );
}

export function ApiNotice({ error, title = "현재 상태를 불러오지 못했어요" }: { error: unknown; title?: string }) {
  if (!error) return null;
  return (
    <div aria-live="polite" className="rounded-xl border border-warning bg-warning-bg p-4">
      <p className="font-bold text-warning-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-600">{apiErrorMessage(error)}</p>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="mt-4 flex items-start gap-2 rounded-xl bg-canvas p-4 text-sm leading-5 text-ink-600"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{children}</p>;
}

export function InvitationPanel({ presentation = "page" }: { presentation?: "page" | "dialog" }) {
  const { session, refreshActor } = useAuth();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [issued, setIssued] = useState<InvitationIssued | null>(null);
  const [copied, setCopied] = useState(false);
  const issuingLink = useRef<Promise<InvitationIssued> | null>(null);
  const connection: Connection | null = session ? { accessToken: session.accessToken, jobId: session.actor.job_id } : null;
  const canIssue = session?.actor.role === "customer" || session?.actor.role === "company_manager";
  const invitationQuery = useQuery({
    enabled: Boolean(connection && canIssue && session?.actor.invitation?.status !== "pending"),
    queryKey: workflowKeys.invitations(session?.actor.job_id ?? ""),
    queryFn: () => listInvitations(connection!),
  });

  const refresh = async () => {
    await refreshActor();
    if (session) await queryClient.invalidateQueries({ queryKey: workflowKeys.invitations(session.actor.job_id) });
  };
  const refreshOnConflict = async (error: unknown) => {
    if (shouldRecoverState(error)) await refresh();
  };
  const inviteMutation = useMutation({
    mutationFn: () => createInvitation(
      connection!,
      session!.actor.role === "customer" ? "company_manager" : "field_worker",
      displayName.trim(),
    ),
    onError: refreshOnConflict,
    onSuccess: async (result) => { setIssued(result); setDisplayName(""); await refresh(); },
  });
  const linkMutation = useMutation({
    mutationFn: () => createInvitation(connection!, session!.actor.role === "customer" ? "company_manager" : "field_worker"),
    onError: refreshOnConflict,
    onSuccess: async (result) => { setIssued(result); await refresh(); },
  });
  const responseMutation = useMutation({
    mutationFn: (action: "accept" | "decline") => respondToInvitation(connection!, session!.actor.invitation!.id, action),
    onError: refreshOnConflict,
    onSuccess: refresh,
  });
  const manageMutation = useMutation({
    mutationFn: ({ invitationId, action }: { invitationId: string; action: "revoke" | "reissue" }) => manageInvitation(connection!, invitationId, action),
    onError: refreshOnConflict,
    onSuccess: async (result) => {
      if ("access_link" in result) setIssued(result);
      await refresh();
    },
  });

  const error = invitationQuery.error ?? inviteMutation.error ?? linkMutation.error ?? responseMutation.error ?? manageMutation.error;
  const retryAfter = useRetryAfter(error);
  useAuthFailure(error);
  if (!session || !connection) return null;

  if (session.actor.invitation?.status === "pending") {
    return (
      <fieldset className="contents" disabled={retryAfter > 0}><Card className="border-primary-400 p-5">
        <p className="text-sm font-bold text-primary-700">{roleLabel[session.actor.role]} 초대</p>
        <h2 className="mt-2 text-xl font-extrabold">작업 초대를 수락할까요?</h2>
        <p className="mt-2 text-sm text-ink-600">수락하기 전에는 다른 업무 API를 사용할 수 없습니다.</p>
        <ApiNotice error={responseMutation.error} title="초대를 처리하지 못했어요" />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button disabled={responseMutation.isPending} onClick={() => responseMutation.mutate("accept")}><Check /> 수락</Button>
          <Button disabled={responseMutation.isPending} onClick={() => responseMutation.mutate("decline")} variant="outline"><X /> 거절</Button>
        </div>
      </Card></fieldset>
    );
  }

  if (!canIssue) return null;
  const targetRole = session.actor.role === "customer" ? "업체" : "현장기사";
  const pendingInvitationCount = invitationQuery.data?.invitations.filter((invitation) => invitation.status === "pending").length ?? 0;
  const ensureIssued = () => {
    if (issued) return Promise.resolve(issued);
    if (!issuingLink.current) issuingLink.current = linkMutation.mutateAsync().finally(() => { issuingLink.current = null; });
    return issuingLink.current;
  };
  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permissions are handled by the browser.
    }
  };
  const shareInvite = async () => {
    try {
      const result = await ensureIssued();
      const text = `짐확정 현장기사 초대 링크\n${result.access_link.secret}`;
      if (navigator.share) {
        try {
          await navigator.share({ text, title: "짐확정 현장기사 초대" });
          return;
        } catch (caught) {
          if (caught instanceof DOMException && caught.name === "AbortError") return;
        }
      }
      await copyText(text);
    } catch {
      // The mutation error is rendered below.
    }
  };
  const copyInvite = async () => {
    try {
      const result = await ensureIssued();
      await copyText(`짐확정 현장기사 초대 링크\n${result.access_link.secret}`);
    } catch {
      // The mutation error is rendered below.
    }
  };
  return (
    <fieldset className="contents" disabled={retryAfter > 0}><WorkflowTask
      description="일회성 초대 코드는 저장하지 않고 필요한 상대에게만 전달해요"
      leading={<UserPlus aria-hidden="true" className="size-4" />}
      presentation={presentation}
      status={issued ? "전달 필요" : pendingInvitationCount > 0 ? `${pendingInvitationCount}명 대기` : "초대하기"}
      title={`${targetRole} 초대`}
      tone={issued ? "warning" : pendingInvitationCount > 0 ? "primary" : "neutral"}
    >
      <ApiNotice error={error} title="초대 상태를 처리하지 못했어요" />
      {presentation === "dialog" ? <>
        <p className="mt-4 rounded-xl bg-primary-50 p-4 text-sm leading-5 text-ink-600">현장기사에게 전달할 일회성 초대 링크를 만들어 공유하세요.</p>
        <div className="mt-4 grid gap-2">
          <Button disabled={retryAfter > 0} onClick={() => void shareInvite()} size="cta"><ShareNetwork /> 현장기사 초대 링크 공유</Button>
          <Button disabled={retryAfter > 0} onClick={() => void copyInvite()} size="cta" variant="outline">{copied ? <Check /> : <Copy />} 링크 복사</Button>
        </div>
      </> : null}
      {presentation === "page" ? <>
      {issued ? (
        <div className="mt-4 rounded-xl bg-primary-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-primary-800">지금 전달할 초대 코드</p>
            <Button onClick={() => void copyText(issued.access_link.secret)} size="chip" variant="outline">{copied ? <Check /> : <Copy />} 복사</Button>
          </div>
          <p className="mt-3 rounded-lg bg-surface p-3 text-sm text-ink-600">초대 코드는 화면·URL·로그에 표시하지 않고 복사 동작에만 사용합니다.</p>
          <Button className="mt-3 w-full" onClick={() => setIssued(null)} variant="ghost">표시 닫기</Button>
        </div>
      ) : null}
      <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (displayName.trim()) inviteMutation.mutate(); }}>
        <div className="min-w-0 flex-1">
          <Label className="sr-only" htmlFor="invite-name">초대 대상 이름</Label>
          <Input autoComplete="off" id="invite-name" maxLength={100} name="inviteeName" onChange={(event) => setDisplayName(event.target.value)} placeholder={`예: ${targetRole} 담당자 이름…`} value={displayName} />
        </div>
        <Button disabled={!displayName.trim() || inviteMutation.isPending} type="submit"><Send /> 초대</Button>
      </form>
      <div className="mt-4 space-y-2">
        {invitationQuery.data?.invitations.map((invitation) => (
          <div className="flex items-center gap-2 rounded-xl bg-canvas p-3" key={invitation.id}>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{invitation.display_name}</p>
              <p className="text-xs text-ink-600">{invitation.status}</p>
            </div>
            {invitation.status === "pending" ? <Button onClick={() => manageMutation.mutate({ invitationId: invitation.id, action: "revoke" })} size="chip" variant="destructive">철회</Button> : null}
            {invitation.status !== "pending" && invitation.status !== "accepted" ? <Button onClick={() => manageMutation.mutate({ invitationId: invitation.id, action: "reissue" })} size="chip" variant="outline">재발급</Button> : null}
          </div>
        ))}
      </div>
      </> : null}
    </WorkflowTask></fieldset>
  );
}
