import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/model/auth-context";
import { LiveCaptureFlow } from "@/features/capture/ui/live-capture-flow";
import { workflowKeys } from "@/features/workflow/api/workflow-api";

export function CapturePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  if (session?.actor.role !== "customer") return <Navigate replace to="/consumer" />;
  const captureJobId = params.get("job") ?? session.actor.job_id;
  const inventoryHref = `/consumer?tab=move&view=items&job=${encodeURIComponent(captureJobId)}`;
  const back = () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(inventoryHref, { replace: true });
  };
  return (
    <div className="mobile-stage" id="main-content">
      <LiveCaptureFlow
        initialConnection={{
          accessToken: session.accessToken,
          cacheScope: `${captureJobId}:customer`,
          jobId: captureJobId,
        }}
        initialManual={params.get("mode") === "manual"}
        initialVideo={params.get("mode") === "video"}
        onComplete={async () => {
          await queryClient.invalidateQueries({ queryKey: workflowKeys.scope(captureJobId) });
          navigate(inventoryHref, { replace: true });
        }}
        onExit={back}
      />
    </div>
  );
}
