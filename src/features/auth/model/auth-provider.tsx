import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { setWorkspaceCsrfToken } from "@/api/client";
import { mockApiEnabled } from "@/api/mock-api";
import {
  createWorkspaceSession,
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
    const accessToken = secret.trim();
    const actor = await getActorSelf(accessToken);
    if (expectedRole && actor.role !== expectedRole) {
      throw new Error("선택한 역할과 초대 코드의 역할이 달라요.");
    }
    const proven = { accessToken, actor };
    if (mockApiEnabled || actor.invitation?.status === "pending") {
      replaceSession(proven);
      return proven;
    }
    const workspace = await createWorkspaceSession(accessToken);
    return applyWorkspace(workspace, actor.job_id, proven) ?? proven;
  }, [applyWorkspace, replaceSession]);

  const onboard = useCallback(async (input: CustomerOnboardingInput) => {
    const result = await onboardCustomer(input);
    const accessToken = result.customer_access_link.secret;
    const actor = await getActorSelf(accessToken);
    const proven = { accessToken, actor };
    if (mockApiEnabled) {
      replaceSession(proven);
      return proven;
    }
    const workspace = await createWorkspaceSession(accessToken);
    return applyWorkspace(workspace, actor.job_id, proven) ?? proven;
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
    if (!mockApiEnabled && actor.invitation?.status !== "pending") {
      const workspace = await createWorkspaceSession(session.accessToken);
      return applyWorkspace(workspace, actor.job_id, { ...session, actor })?.actor ?? actor;
    }
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
