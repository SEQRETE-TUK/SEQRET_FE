import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { MobileFrame } from "@/components/layout/mobile-frame";
import { RouteLoading } from "@/components/layout/route-loading";
import { useAuth } from "@/features/auth/model/auth-context";
import { CompletionDecisionPage, QuoteDecisionPage } from "@/features/consumer/ui/consumer-app";
import { getCompletionSummary, getScopeReview, listFieldIssues, workflowKeys, type Connection } from "@/features/workflow/api/workflow-api";

type ConsumerDetailKind = "quote" | "completion";

export function ConsumerQuotePage() {
  return <ConsumerDetailPage kind="quote" />;
}

export function ConsumerCompletionPage() {
  return <ConsumerDetailPage kind="completion" />;
}

function ConsumerDetailPage({ kind }: { kind: ConsumerDetailKind }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const jobId = params.get("job") ?? session?.actor.job_id ?? "";
  const connection: Connection | null = session && jobId ? { accessToken: session.accessToken, jobId } : null;
  const scopeQuery = useQuery({
    enabled: kind === "quote" && Boolean(connection),
    queryKey: workflowKeys.scope(jobId),
    queryFn: () => getScopeReview(connection!),
  });
  const completionQuery = useQuery({
    enabled: kind === "completion" && Boolean(connection),
    queryKey: workflowKeys.completion(jobId),
    queryFn: () => getCompletionSummary(connection!),
  });
  const issuesQuery = useQuery({
    enabled: kind === "completion" && Boolean(connection),
    queryKey: workflowKeys.fieldIssues(jobId),
    queryFn: () => listFieldIssues(connection!),
  });

  if (session?.actor.role !== "customer") return <Navigate replace to="/consumer" />;
  if (!connection || (kind === "quote" ? scopeQuery.isLoading : completionQuery.isLoading || issuesQuery.isLoading)) return <RouteLoading />;

  const backHref = `/consumer?tab=move&view=agreement&job=${encodeURIComponent(jobId)}`;
  const back = () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(backHref, { replace: true });
  };
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: workflowKeys.root(jobId) });
    await queryClient.invalidateQueries({ queryKey: workflowKeys.moves(session.accessToken) });
  };

  return <div className="mobile-stage" id="main-content"><MobileFrame>{kind === "quote" && scopeQuery.data ? <QuoteDecisionPage connection={connection} fallbackLocationConditions={[]} onBack={back} onResolved={refresh} scope={scopeQuery.data} /> : kind === "completion" && completionQuery.data ? <CompletionDecisionPage completion={completionQuery.data} connection={connection} fieldIssues={issuesQuery.data ?? []} fieldIssuesError={Boolean(issuesQuery.error)} onBack={back} onResolved={refresh} /> : <div className="grid min-h-dvh place-items-center px-5 text-sm text-ink-600">상세 내용을 불러오지 못했어요.</div>}</MobileFrame></div>;
}
