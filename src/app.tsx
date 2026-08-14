import DesignSystemPage from "@/app/design-system/page";
import { ConsumerDemo } from "@/components/demos/consumer-demo";
import { CrewDemo } from "@/components/demos/crew-demo";
import { ProviderMobileDemo, ProviderWebDemo } from "@/components/demos/provider-demo";
import { RoleEntry } from "@/components/demos/role-entry";

export function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const query = new URLSearchParams(window.location.search);

  if (path === "/design-system") return <DesignSystemPage />;
  if (path === "/provider/web") return <ProviderWebDemo />;
  if (path === "/provider") return <div className="mobile-stage"><ProviderMobileDemo /></div>;
  if (path === "/crew") return <div className="mobile-stage"><CrewDemo /></div>;

  const showConsumer = query.get("role") === "consumer" || query.has("screen") || query.has("state");
  return <div className="mobile-stage">{showConsumer ? <ConsumerDemo /> : <RoleEntry />}</div>;
}
