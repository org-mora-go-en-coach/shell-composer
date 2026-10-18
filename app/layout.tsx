import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "모라 영어",
  description: "영어 학습 공간",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

