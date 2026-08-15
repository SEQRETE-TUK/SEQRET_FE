import { useAuth } from "@/features/auth/model/auth-context";
import { ProviderApp } from "@/features/provider/ui/provider-app";
import { SessionRequired } from "@/features/workflow/ui/workflow-shell";

export function ProviderPage() {
  const { session } = useAuth();
  if (session?.actor.role !== "company_manager") return <SessionRequired role="company_manager" />;
  return <ProviderApp />;
}
