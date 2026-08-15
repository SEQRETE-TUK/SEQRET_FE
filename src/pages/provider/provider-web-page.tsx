import { useAuth } from "@/features/auth/model/auth-context";
import { LiveProviderWorkflow } from "@/features/workflow/ui/live-provider-workflow";
import { SessionRequired } from "@/features/workflow/ui/workflow-shell";

export function ProviderWebPage() {
  const { session } = useAuth();
  if (session?.actor.role !== "company_manager") return <SessionRequired role="company_manager" />;
  return <LiveProviderWorkflow wide />;
}
