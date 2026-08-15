import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: async () => {
      const { ConsumerPage } = await import("@/pages/consumer/consumer-page");
      return { Component: ConsumerPage };
    },
  },
  {
    path: "/provider",
    lazy: async () => {
      const { ProviderPage } = await import("@/pages/provider/provider-page");
      return { Component: ProviderPage };
    },
  },
  {
    path: "/provider/web",
    lazy: async () => {
      const { ProviderWebPage } = await import("@/pages/provider/provider-web-page");
      return { Component: ProviderWebPage };
    },
  },
  {
    path: "/crew",
    lazy: async () => {
      const { CrewPage } = await import("@/pages/crew/crew-page");
      return { Component: CrewPage };
    },
  },
  {
    path: "*",
    lazy: async () => {
      const { NotFoundPage } = await import("@/pages/not-found/not-found-page");
      return { Component: NotFoundPage };
    },
  },
]);
