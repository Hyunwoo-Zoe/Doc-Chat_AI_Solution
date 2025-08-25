// 📁 src/app/admin/layout.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminNav } from './AdminNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserNav } from '@/components/UserNav';
import styled from 'styled-components';

/* ------------------------------------------------------------------ */
/* ───────── styled elements ────────── */

const DRAWER_W = 240; // 15rem (줄임)

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: hsl(var(--muted) / 0.4);
`;

const MobileOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 40;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  transition: opacity 0.3s;
  opacity: ${({ $isOpen }) => ($isOpen ? '1' : '0')};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};

  @media (min-width: 1024px) {
    display: none;
  }
`;

const SidebarPanel = styled.aside<{ $mobileOpen: boolean; $desktopOpen: boolean }>`
  position: fixed;
  left: 0;
  top: 0;
  z-index: 50;
  height: 100%;
  width: ${DRAWER_W}px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid hsl(var(--border) / 0.4);
  background-color: hsl(var(--card) / 0.9);
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;

  /* Mobile */
  transform: ${({ $mobileOpen }) => $mobileOpen ? 'translateX(0)' : 'translateX(-100%)'};

  /* Desktop */
  @media (min-width: 1024px) {
    transform: ${({ $desktopOpen }) => $desktopOpen ? 'translateX(0)' : 'translateX(-100%)'};
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  
  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

const MainContent = styled.div<{ $desktopOpen: boolean }>`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: padding-left 0.3s ease-in-out;

  @media (min-width: 1024px) {
    padding-left: ${({ $desktopOpen }) => ($desktopOpen ? `${DRAWER_W}px` : '0px')};
  }
`;

const DesktopSidebarHandle = styled.button<{ $isOpen: boolean }>`
  display: none; /* hidden */
  @media (min-width: 1024px) {
    display: flex; /* lg:flex */
  }
  position: absolute;
  top: 50%;
  left: ${({ $isOpen }) => ($isOpen ? `${DRAWER_W}px` : '0px')};
  transform: translate(-50%, -50%);
  z-index: 51;
  align-items: center;
  justify-content: center;
  height: 3.5rem;
  width: 1.5rem;
  border-radius: 9999px;
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: 3px solid hsl(var(--background));
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease-in-out, background-color 0.2s;
  cursor: pointer;

  &:hover {
    background-color: hsl(var(--primary) / 0.9);
  }
`;

const MobileIconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: transparent;
  border: none;
  cursor: pointer;
  color: hsl(var(--foreground));
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: hsl(var(--accent));
  }

  @media (min-width: 1024px) {
    display: none;
  }
`;

/* ------------------------------------------------------------------ */
/* ───────── Component ────────── */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pinned, setPinned] = useState(true);
  const pathname = usePathname();

  // 로그인/회원가입 페이지인지 확인
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/signup';

  // 인증 페이지인 경우 사이드바 없이 렌더링
  if (isAuthPage) {
    return (
      <LayoutContainer>
        <MainContent $desktopOpen={false}>
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur px-4 lg:px-6">
            <div className="flex items-center gap-4 ml-auto">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </MainContent>
      </LayoutContainer>
    );
  }

  // 일반 관리자 페이지 렌더링
  return (
    <LayoutContainer>
      <MobileOverlay $isOpen={mobileOpen} onClick={() => setMobileOpen(false)} />

      <SidebarPanel $mobileOpen={mobileOpen} $desktopOpen={pinned}>
        <div className="flex h-16 items-center justify-end border-b border-zinc-700/40 px-6">
          <MobileIconButton onClick={() => setMobileOpen(false)}>
            <X className="h-6 w-6" />
          </MobileIconButton>
        </div>
        <SidebarContent>
          <AdminNav />
        </SidebarContent>
      </SidebarPanel>

      <MainContent $desktopOpen={pinned}>
        <DesktopSidebarHandle $isOpen={pinned} onClick={() => setPinned(!pinned)}>
          {pinned ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </DesktopSidebarHandle>

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur px-4 lg:px-6">
          <MobileIconButton onClick={() => setMobileOpen(true)}>
            <Menu className="h-6 w-6" />
          </MobileIconButton>
          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />
            <UserNav />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </MainContent>
    </LayoutContainer>
  );
}