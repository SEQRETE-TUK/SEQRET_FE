import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "@/features/auth/model/auth-context";
import { LiveCaptureFlow } from "@/features/capture/ui/live-capture-flow";
import { SessionRequired } from "@/features/workflow/ui/workflow-shell";

export function CapturePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  if (session?.actor.role !== "customer") return <SessionRequired role="customer" />;
  return (
    <div className="mobile-stage" id="main-content">
      <LiveCaptureFlow
        initialConnection={{
          accessToken: session.accessToken,
          cacheScope: `${session.actor.job_id}:customer`,
          jobId: session.actor.job_id,
        }}
        initialManual={params.get("mode") === "manual"}
        initialVideo={params.get("mode") === "video"}
        onExit={() => navigate("/consumer")}
        returnHref="/consumer"
      />
    </div>
  );
}
