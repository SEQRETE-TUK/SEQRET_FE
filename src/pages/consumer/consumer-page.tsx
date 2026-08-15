import { useAuth } from "@/features/auth/model/auth-context";
import { ConsumerApp } from "@/features/consumer/ui/consumer-app";
import { SessionRequired } from "@/features/workflow/ui/workflow-shell";

export function ConsumerPage() {
  const { session } = useAuth();
  if (session?.actor.role !== "customer") return <SessionRequired role="customer" />;
  return <ConsumerApp />;
}
