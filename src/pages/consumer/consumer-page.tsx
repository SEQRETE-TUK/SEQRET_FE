import { useEffect, useRef, useState } from "react";

import { mockAccessSecrets, mockApiEnabled } from "@/api/mock-api";
import { RouteLoading } from "@/components/layout/route-loading";
import { customerNewMoveStorageKey, useAuth } from "@/features/auth/model/auth-context";
import { ConsumerApp, ConsumerGuestApp } from "@/features/consumer/ui/consumer-app";

export function ConsumerPage() {
  const { connect, session } = useAuth();
  const attempted = useRef(false);
  const [mockConnectionFailed, setMockConnectionFailed] = useState(false);
  const [newCustomerStart] = useState(() => mockApiEnabled && window.sessionStorage.getItem(customerNewMoveStorageKey) === "true");

  useEffect(() => {
    if (newCustomerStart) {
      attempted.current = true;
      window.sessionStorage.removeItem(customerNewMoveStorageKey);
      return;
    }
    if (!mockApiEnabled || session?.actor.role === "customer" || attempted.current) return;
    attempted.current = true;
    connect(mockAccessSecrets.customer, "customer").catch(() => setMockConnectionFailed(true));
  }, [connect, newCustomerStart, session?.actor.role]);

  if (session?.actor.role !== "customer") return mockApiEnabled && !mockConnectionFailed && !newCustomerStart ? <RouteLoading /> : <ConsumerGuestApp />;
  return <ConsumerApp />;
}
