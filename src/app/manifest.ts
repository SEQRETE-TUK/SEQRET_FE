import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SEQRET · 이사 작업범위 공동확인",
    short_name: "SEQRET",
    description: "고객, 이사업체, 작업자가 같은 작업범위를 확인하는 설치형 데모",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F5F9",
    theme_color: "#4F46E5",
    icons: [
      { src: "/seqret-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/seqret-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
