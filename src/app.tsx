import { lazy, Suspense, type ReactNode } from "react";

const DesignSystemPage = lazy(() => import("@/app/design-system/page"));
const ConsumerDemo = lazy(() =>
  import("@/components/demos/consumer-demo").then((module) => ({
    default: module.ConsumerDemo,
  })),
);
const CrewDemo = lazy(() =>
  import("@/components/demos/crew-demo").then((module) => ({
    default: module.CrewDemo,
  })),
);
const LiveCaptureFlow = lazy(() =>
  import("@/components/demos/live-capture-flow").then((module) => ({
    default: module.LiveCaptureFlow,
  })),
);
const loadProviderDemo = () => import("@/components/demos/provider-demo");
const ProviderMobileDemo = lazy(() =>
  loadProviderDemo().then((module) => ({ default: module.ProviderMobileDemo })),
);
const ProviderWebDemo = lazy(() =>
  loadProviderDemo().then((module) => ({ default: module.ProviderWebDemo })),
);
const RoleEntry = lazy(() =>
  import("@/components/demos/role-entry").then((module) => ({
    default: module.RoleEntry,
  })),
);

function RouteLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid min-h-dvh place-items-center bg-canvas px-6 text-center text-ink-900"
      role="status"
    >
      <div>
        <span
          aria-hidden="true"
          className="mx-auto block size-9 animate-spin rounded-full border-4 border-primary-100 border-t-primary-700"
        />
        <p className="mt-4 text-[14px] font-bold">화면을 준비하고 있어요</p>
      </div>
    </div>
  );
}

function Route({
  children,
  mobile = false,
}: {
  children: ReactNode;
  mobile?: boolean;
}) {
  const content = <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
  return mobile ? <div className="mobile-stage">{content}</div> : content;
}

export function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const query = new URLSearchParams(window.location.search);

  if (path === "/design-system") {
    return (
      <Route>
        <DesignSystemPage />
      </Route>
    );
  }
  if (path === "/consumer/capture") {
    return (
      <Route mobile>
        <LiveCaptureFlow />
      </Route>
    );
  }
  if (path === "/provider/web") {
    return (
      <Route>
        <ProviderWebDemo />
      </Route>
    );
  }
  if (path === "/provider") {
    return (
      <Route mobile>
        <ProviderMobileDemo />
      </Route>
    );
  }
  if (path === "/crew") {
    return (
      <Route mobile>
        <CrewDemo />
      </Route>
    );
  }

  const showConsumer =
    query.get("role") === "consumer" || query.has("screen") || query.has("state");
  return <Route mobile>{showConsumer ? <ConsumerDemo /> : <RoleEntry />}</Route>;
}
