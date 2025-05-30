import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI 문서 요약 서비스",
  description: "AI가 당신의 문서를 분석하고 완벽한 요약을 제공합니다. PDF, Word, 텍스트 파일을 업로드하여 3가지 요약안을 받아보세요.",
  keywords: "AI, 문서요약, 요약서비스, PDF요약, Word요약, OpenAI, GPT",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
