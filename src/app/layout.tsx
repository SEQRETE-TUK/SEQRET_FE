import type { Metadata, Viewport } from "next";
import "@fontsource/pretendard/500.css";
import "@fontsource/pretendard/600.css";
import "@fontsource/pretendard/700.css";
import "@fontsource/pretendard/800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEQRET · 이사 작업범위 공동확인",
  description: "고객, 이사업체, 작업자가 같은 작업범위를 확인하는 해커톤 데모",
  applicationName: "SEQRET",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4F46E5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
