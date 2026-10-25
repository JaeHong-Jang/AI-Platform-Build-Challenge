import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "이사 지킴이",
  description: "계약금 보내기 전에, 받은 이사 견적과 내 짐·현장 조건을 대조해 아직 확인 안 된 것을 찾아 업체에 묻게 돕는 대시보드",
};

// 저장된 테마를 그리기 전에 적용한다 (TTA-Service data-theme + localStorage 방식)
const THEME_INIT = `try{var t=localStorage.getItem("isa-theme");if(t==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 맛대패스 frontend/index.html과 같은 Pretendard 배포본 */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
