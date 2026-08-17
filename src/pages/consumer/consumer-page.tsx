import { useEffect, useRef, useState } from "react";

import { mockAccessSecrets, mockApiEnabled } from "@/api/mock-api";
import { RouteLoading } from "@/components/layout/route-loading";
import { useAuth } from "@/features/auth/model/auth-context";
import { ConsumerApp, ConsumerGuestApp } from "@/features/consumer/ui/consumer-app";

export function ConsumerPage() {
  const { connect, session } = useAuth();
  const attempted = useRef(false);
  const [mockConnectionFailed, setMockConnectionFailed] = useState(false);

  useEffect(() => {
    if (!mockApiEnabled || session?.actor.role === "customer" || attempted.current) return;
    attempted.current = true;
    connect(mockAccessSecrets.customer, "customer").catch(() => setMockConnectionFailed(true));
  }, [connect, session?.actor.role]);

  if (session?.actor.role !== "customer") return mockApiEnabled && !mockConnectionFailed ? <RouteLoading /> : <ConsumerGuestApp />;
  return <ConsumerApp />;
}
