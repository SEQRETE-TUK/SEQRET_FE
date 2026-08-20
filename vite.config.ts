import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { signedUploadProxy } from "./dev/signed-upload-proxy.ts";

export default defineConfig(({ mode }) => {
  const apiProxyTarget = loadEnv("development", process.cwd(), "VITE_").VITE_API_BASE_URL;
  if (mode === "api" && !apiProxyTarget) throw new Error("VITE_API_BASE_URL is required for API mode");

  return {
    plugins: [
      ...(mode === "api" ? [signedUploadProxy()] : []),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: false,
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
        },
        includeAssets: ["icon-192.png", "icon-512.png", "icon-android-192.png", "icon-android-512.png", "icon-maskable-192.png", "icon-maskable-512.png"],
        manifest: {
          name: "\u200B",
          short_name: "짐로그",
          description: "고객, 이사업체, 현장기사가 같은 작업범위와 현장 상태를 확인하는 서비스",
          start_url: "/",
          display: "standalone",
          background_color: "#FFFFFF",
          theme_color: "#F4F5F9",
          icons: [
            { src: "/icon-android-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icon-android-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
            { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: mode === "api" ? {
      proxy: {
        "/api": {
          changeOrigin: true,
          target: apiProxyTarget,
        },
      },
    } : undefined,
  };
});
