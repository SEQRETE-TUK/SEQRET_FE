import { useAuth } from "@/features/auth/model/auth-context";
import { CrewApp } from "@/features/crew/ui/crew-app";
import { SessionRequired } from "@/features/workflow/ui/workflow-shell";

export function CrewPage() {
  const { session } = useAuth();
  if (session?.actor.role !== "field_worker") return <SessionRequired role="field_worker" />;
  return <CrewApp />;
}
