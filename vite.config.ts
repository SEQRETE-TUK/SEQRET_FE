import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const apiProxyTarget = loadEnv("development", process.cwd(), "VITE_").VITE_API_BASE_URL;
  if (mode === "api" && !apiProxyTarget) throw new Error("VITE_API_BASE_URL is required for API mode");

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: false,
        includeAssets: ["icon-192.png", "icon-512.png"],
        manifest: {
          name: "SEQRET · 이사 작업범위 공동확인",
          short_name: "SEQRET",
          description: "고객, 이사업체, 현장기사가 같은 작업범위와 현장 상태를 확인하는 서비스",
          start_url: "/",
          display: "standalone",
          background_color: "#F4F5F9",
          theme_color: "#F4F5F9",
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
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
