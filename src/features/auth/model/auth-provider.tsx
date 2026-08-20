import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { setWorkspaceCsrfToken } from "@/api/client";
import { mockApiEnabled } from "@/api/mock-api";
import {
  connectMove,
  deleteWorkspaceSession,
  getActorSelf,
  getWorkspaceSession,
  onboardCustomer,
  type CustomerOnboardingInput,
  type ParticipantRole,
  type WorkspaceSession,
} from "@/features/workflow/api/workflow-api";
import { AuthContext, type AuthSession } from "@/features/auth/model/auth-context";

function sessionFromWorkspace(workspace: WorkspaceSession, preferredJobId?: string, proven?: AuthSession): AuthSession | null {
  const member = workspace.members.find((item) => item.job_id === preferredJobId) ?? workspace.members[0];
  if (!member) return null;
  return {
    accessToken: workspace.access_token,
    actor: {
      ...member,
      permissions: proven?.actor.job_id === member.job_id ? proven.actor.permissions : [],
      expires_at: workspace.expires_at,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(mockApiEnabled);
  const workspaceActive = useRef(false);

  const replaceSession = useCallback((next: AuthSession | null) => {
    queryClient.clear();
    setSession(next);
  }, [queryClient]);

  const applyWorkspace = useCallback((workspace: WorkspaceSession, preferredJobId?: string, proven?: AuthSession) => {
    workspaceActive.current = true;
    setWorkspaceCsrfToken(workspace.csrf_token);
    const next = sessionFromWorkspace(workspace, preferredJobId, proven);
    replaceSession(next);
    return next;
  }, [replaceSession]);

  useEffect(() => {
    if (mockApiEnabled) return;
    let active = true;
    void getWorkspaceSession()
      .then((workspace) => { if (active) applyWorkspace(workspace); })
      .catch(() => undefined)
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [applyWorkspace]);

  const connect = useCallback(async (secret: string, expectedRole?: ParticipantRole) => {
    const role = expectedRole ?? "customer";
    if (!mockApiEnabled && workspaceActive.current && session && session.actor.role !== role) {
      await deleteWorkspaceSession();
      workspaceActive.current = false;
      setWorkspaceCsrfToken(null);
      replaceSession(null);
    }
    const workspace = await connectMove(secret, role);
    const next = applyWorkspace(workspace);
    if (!next) throw new Error("이사 연결 정보를 확인해 주세요.");
    return next;
  }, [applyWorkspace, replaceSession, session]);

  const onboard = useCallback(async (input: CustomerOnboardingInput) => {
    if (!mockApiEnabled && workspaceActive.current) {
      await deleteWorkspaceSession().catch(() => undefined);
      workspaceActive.current = false;
      setWorkspaceCsrfToken(null);
      replaceSession(null);
    }
    const result = await onboardCustomer(input);
    const workspace = await connectMove(result.connection_code, "customer");
    const next = applyWorkspace(workspace, result.job.id);
    if (!next) throw new Error("새 이사 연결 정보를 확인해 주세요.");
    return next;
  }, [applyWorkspace, replaceSession]);

  const clearSession = useCallback(() => {
    if (workspaceActive.current) void deleteWorkspaceSession().catch(() => undefined);
    workspaceActive.current = false;
    setWorkspaceCsrfToken(null);
    replaceSession(null);
  }, [replaceSession]);
  const switchSession = useCallback((next: AuthSession) => setSession(next), []);

  const refreshActor = useCallback(async () => {
    if (!session) return null;
    if (!session.accessToken) {
      const workspace = await getWorkspaceSession();
      const next = applyWorkspace(workspace, session.actor.job_id);
      return next?.actor ?? null;
    }
    const actor = await getActorSelf(session.accessToken);
    setSession((current) => current ? { ...current, actor } : null);
    return actor;
  }, [applyWorkspace, session]);

  const value = useMemo(() => ({ ready, session, clearSession, connect, switchSession, onboard, refreshActor }), [
    clearSession,
    connect,
    onboard,
    ready,
    refreshActor,
    session,
    switchSession,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
