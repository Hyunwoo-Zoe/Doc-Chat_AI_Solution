// 📁 src/app/layout.tsx (최종 수정본)
import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/sonner";
import StyledComponentsRegistry from '@/lib/registry'; // styled-components 레지스트리 import

export const metadata: Metadata = {
  title: '관리자 시스템',
  description: 'PDF 요약 관리자 전용 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        {/* 👇 StyledComponentsRegistry로 전체를 감싸줍니다. */}
        <StyledComponentsRegistry>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}