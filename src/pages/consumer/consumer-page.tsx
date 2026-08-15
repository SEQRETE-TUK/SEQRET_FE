import { useAuth } from "@/features/auth/model/auth-context";
import { LiveConsumerWorkflow } from "@/features/workflow/ui/live-consumer-workflow";
import { SessionRequired } from "@/features/workflow/ui/workflow-shell";

export function ConsumerPage() {
  const { session } = useAuth();
  if (session?.actor.role !== "customer") return <SessionRequired role="customer" />;
  return <LiveConsumerWorkflow />;
}
