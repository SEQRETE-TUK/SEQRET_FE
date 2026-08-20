import { registerSW } from "virtual:pwa-register";

export function registerServiceWorker() {
  if (!import.meta.env.PROD) {
    return;
  }

  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  registerSW({
    immediate: true,
    onRegisteredSW: (_url, registration) => {
      void registration?.update();
    },
  });
}
