import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokemon Champions Calc",
  description: "개인용 Pokemon Champions 메타 계산기"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
