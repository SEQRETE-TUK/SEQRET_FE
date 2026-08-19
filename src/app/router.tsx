import { createBrowserRouter } from "react-router-dom";

import { RouteLoading } from "@/components/layout/route-loading";

export const router = createBrowserRouter([
  {
    HydrateFallback: RouteLoading,
    path: "/",
    lazy: async () => {
      const { RoleEntryPage } = await import("@/pages/role-entry/role-entry-page");
      return { Component: RoleEntryPage };
    },
  },
  {
    HydrateFallback: RouteLoading,
    path: "/consumer",
    lazy: async () => {
      const { ConsumerPage } = await import("@/pages/consumer/consumer-page");
      return { Component: ConsumerPage };
    },
  },
  {
    HydrateFallback: RouteLoading,
    path: "/consumer/capture",
    lazy: async () => {
      const { CapturePage } = await import("@/pages/consumer/capture-page");
      return { Component: CapturePage };
    },
  },
  {
    HydrateFallback: RouteLoading,
    path: "/consumer/quote",
    lazy: async () => {
      const { ConsumerQuotePage } = await import("@/pages/consumer/consumer-detail-page");
      return { Component: ConsumerQuotePage };
    },
  },
  {
    HydrateFallback: RouteLoading,
    path: "/consumer/completion",
    lazy: async () => {
      const { ConsumerCompletionPage } = await import("@/pages/consumer/consumer-detail-page");
      return { Component: ConsumerCompletionPage };
    },
  },
  {
    HydrateFallback: RouteLoading,
    path: "/provider",
    lazy: async () => {
      const { ProviderPage } = await import("@/pages/provider/provider-page");
      return { Component: ProviderPage };
    },
  },
  {
    HydrateFallback: RouteLoading,
    path: "/provider/web",
    lazy: async () => {
      const { ProviderWebPage } = await import("@/pages/provider/provider-web-page");
      return { Component: ProviderWebPage };
    },
  },
  {
    HydrateFallback: RouteLoading,
    path: "/crew",
    lazy: async () => {
      const { CrewPage } = await import("@/pages/crew/crew-page");
      return { Component: CrewPage };
    },
  },
  {
    HydrateFallback: RouteLoading,
    path: "/design-system",
    lazy: async () => {
      const { DesignSystemPage } = await import("@/pages/design-system/design-system-page");
      return { Component: DesignSystemPage };
    },
  },
  {
    HydrateFallback: RouteLoading,
    path: "*",
    lazy: async () => {
      const { NotFoundPage } = await import("@/pages/not-found/not-found-page");
      return { Component: NotFoundPage };
    },
  },
]);
