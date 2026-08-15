import "@fontsource/pretendard/500.css";
import "@fontsource/pretendard/600.css";
import "@fontsource/pretendard/700.css";
import "@fontsource/pretendard/800.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { AppProviders } from "@/app/providers";
import { router } from "@/app/router";
import "@/app/styles.css";
import { registerServiceWorker } from "@/pwa/register-service-worker";

registerServiceWorker();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
