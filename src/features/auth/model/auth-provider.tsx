import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import {
  getActorSelf,
  onboardCustomer,
  type CustomerOnboardingInput,
  type ParticipantRole,
} from "@/features/workflow/api/workflow-api";
import { AuthContext, type AuthSession } from "@/features/auth/model/auth-context";

const sessionStorageKey = "seqret-auth-session";

function storedSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(sessionStorageKey);
    return value ? JSON.parse(value) as AuthSession : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(storedSession);

  const replaceSession = useCallback((next: AuthSession | null) => {
    queryClient.clear();
    if (next) window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(next));
    else window.sessionStorage.removeItem(sessionStorageKey);
    setSession(next);
  }, [queryClient]);

  const connect = useCallback(async (secret: string, expectedRole?: ParticipantRole) => {
    const accessToken = secret.trim();
    const actor = await getActorSelf(accessToken);
    if (expectedRole && actor.role !== expectedRole) {
      throw new Error("선택한 역할과 보안코드의 역할이 달라요.");
    }
    const next = { accessToken, actor };
    replaceSession(next);
    return next;
  }, [replaceSession]);

  const onboard = useCallback(async (input: CustomerOnboardingInput) => {
    const result = await onboardCustomer(input);
    const accessToken = result.customer_access_link.secret;
    const actor = await getActorSelf(accessToken);
    const next = { accessToken, actor };
    replaceSession(next);
    return next;
  }, [replaceSession]);

  const clearSession = useCallback(() => replaceSession(null), [replaceSession]);

  const refreshActor = useCallback(async () => {
    if (!session) return null;
    const actor = await getActorSelf(session.accessToken);
    setSession((current) => current ? { ...current, actor } : null);
    return actor;
  }, [session]);

  const value = useMemo(() => ({ session, clearSession, connect, onboard, refreshActor }), [
    clearSession,
    connect,
    onboard,
    refreshActor,
    session,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
