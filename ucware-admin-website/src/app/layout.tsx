
// 📁 src/app/layout.tsx
// Next.js 앱의 전역 Root Layout 컴포넌트.
//
// 설계 포인트
// ===========
// 1) 전역 스타일(globals.css) 적용.
// 2) Metadata(title/description) 설정.
// 3) StyledComponentsRegistry로 SSR 시 styled-components 지원.
// 4) ThemeProvider를 통해 다크/라이트 모드 관리.
// 5) 전역 Toaster(알림 UI) 추가.
//
// 주의
// ----
// - suppressHydrationWarning: 클라이언트/서버 테마 불일치 시 경고 억제.
// - Pretendard 웹폰트는 CDN에서 직접 로드.

import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/sonner";
import StyledComponentsRegistry from '@/lib/registry'; // styled-components 레지스트리 import

// ───────────────────────────── 메타데이터 ─────────────────────────────
export const metadata: Metadata = {
  title: '관리자 시스템',
  description: 'PDF 요약 관리자 전용 시스템',
};

// ───────────────────────────── RootLayout ─────────────────────────────
/**
 * RootLayout
 *
 * Args:
 *   children (ReactNode): 각 라우트 페이지 컴포넌트
 *
 * Returns:
 *   HTML 구조: <html> + <body> 래퍼
 *   - 글로벌 폰트 Pretendard 로드
 *   - StyledComponentsRegistry로 SSR 호환
 *   - ThemeProvider로 테마 관리
 *   - Toaster(sonner) 알림 추가
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Pretendard 웹폰트 CDN */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        {/* StyledComponentsRegistry: styled-components SSR 지원 */}
        <StyledComponentsRegistry>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            {/* 전역 알림 Toaster */}
            <Toaster />
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
