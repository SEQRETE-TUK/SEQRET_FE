import { useAuth } from "@/features/auth/model/auth-context";
import { LiveCrewWorkflow } from "@/features/workflow/ui/live-crew-workflow";
import { SessionRequired } from "@/features/workflow/ui/workflow-shell";

export function CrewPage() {
  const { session } = useAuth();
  if (session?.actor.role !== "field_worker") return <SessionRequired role="field_worker" />;
  return <LiveCrewWorkflow />;
}
