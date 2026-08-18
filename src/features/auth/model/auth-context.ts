import { createContext, useContext } from "react";

import type {
  ActorSelf,
  CustomerOnboardingInput,
  ParticipantRole,
} from "@/features/workflow/api/workflow-api";

export interface AuthSession {
  accessToken: string;
  actor: ActorSelf;
}

export interface AuthContextValue {
  session: AuthSession | null;
  clearSession: () => void;
  connect: (secret: string, expectedRole?: ParticipantRole) => Promise<AuthSession>;
  switchSession: (next: AuthSession) => void;
  onboard: (input: CustomerOnboardingInput) => Promise<AuthSession>;
  refreshActor: () => Promise<ActorSelf | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}

export function rolePath(role: ParticipantRole): string {
  if (role === "customer") return "/consumer";
  if (role === "company_manager") return "/provider/web";
  return "/crew";
}
