import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "俠客行不行 — 找師傅、接委託，一鍵搞定",
  description: "台灣本地服務媒合平台。水電、冷氣、開鎖、油漆，或任何奇特委託，發案詢價、評價透明，找到你需要的遊俠。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
