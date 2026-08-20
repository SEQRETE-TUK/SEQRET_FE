import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const SIGNED_UPLOAD_PROXY_PATH = "/__seqret_signed_upload";

function signedUploadProxy(): Plugin {
  return {
    name: "seqret-signed-upload-proxy",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (request.method !== "PUT" || request.url !== SIGNED_UPLOAD_PROXY_PATH) {
          next();
          return;
        }

        const uploadUrl = request.headers["x-seqret-upload-url"];
        if (typeof uploadUrl !== "string") {
          response.statusCode = 400;
          response.end("Missing signed upload URL");
          return;
        }

        try {
          const parsedUploadUrl = new URL(uploadUrl);
          if (parsedUploadUrl.protocol !== "https:") throw new Error("Signed upload URL must use HTTPS");

          const uploadHeaders = Object.fromEntries(
            Object.entries(request.headers).filter(([name]) => ![
              "accept",
              "accept-encoding",
              "connection",
              "content-length",
              "host",
              "origin",
              "referer",
              "transfer-encoding",
              "user-agent",
              "x-seqret-upload-url",
            ].includes(name)),
          ) as Record<string, string>;
          const upstream = await fetch(uploadUrl, {
            body: request as unknown as AsyncIterable<Uint8Array>,
            duplex: "half",
            headers: uploadHeaders,
            method: "PUT",
            redirect: "error",
          } as RequestInit & { duplex: "half" });

          response.statusCode = upstream.status;
          response.end();
        } catch {
          response.statusCode = 502;
          response.end("Signed upload proxy failed");
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const apiProxyTarget = loadEnv("development", process.cwd(), "VITE_").VITE_API_BASE_URL;
  if (mode === "api" && !apiProxyTarget) throw new Error("VITE_API_BASE_URL is required for API mode");

  return {
    plugins: [
      signedUploadProxy(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: false,
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
