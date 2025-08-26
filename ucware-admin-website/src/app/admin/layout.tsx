
// 📁 src/app/admin/layout.tsx
// 관리자 페이지의 공통 레이아웃 컴포넌트.
//
// 설계 포인트
// ===========
// 1) 반응형 사이드바(Drawer) 구현: 모바일에서는 오버레이, 데스크탑에서는 고정/숨김 토글.
// 2) `usePathname` 훅을 사용해 현재 경로를 감지.
// 3) 로그인/회원가입 페이지(`/admin/login`, `/admin/signup`)에서는 사이드바를 숨기는 조건부 렌더링.
// 4) styled-components를 활용하여 모바일 오버레이, 사이드바 패널, 메인 콘텐츠 영역 등을 스타일링.
// 5) 사이드바의 열림/닫힘 상태(`mobileOpen`, `pinned`)를 `useState`로 관리.
// 6) 데스크탑용 사이드바 토글 버튼(`DesktopSidebarHandle`)을 별도 컴포넌트로 구현하여 UI/UX 개선.
//
// 컴포넌트 구성
// -------------
// - AdminNav: 실제 네비게이션 링크를 담고 있는 컴포넌트.
// - ThemeToggle: 다크/라이트 모드 토글 컴포넌트.
// - UserNav: 사용자 프로필 및 로그아웃 드롭다운 컴포넌트.

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminNav } from './AdminNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserNav } from '@/components/UserNav';
import styled from 'styled-components';

// ───────────────────────────── 스타일 컴포넌트 ─────────────────────────────

/** 사이드바 너비 변수 (240px) */

const DRAWER_W = 240;

/** 전체 레이아웃을 감싸는 최상위 컨테이너 */
const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: hsl(var(--muted) / 0.4);
`;

/** 모바일 화면에서 사이드바가 열렸을 때 배경을 어둡게 처리하는 오버레이 */
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

/** 사이드바 패널. 모바일/데스크탑 상태에 따라 transform으로 위치 제어 */
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

/** 사이드바 내부에서 스크롤이 필요한 콘텐츠 영역 */
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

/** 페이지의 메인 콘텐츠 영역. 데스크탑 사이드바 상태에 따라 padding-left 조절 */
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

/** 데스크탑에서 사이드바를 열고 닫는 핸들 버튼 */
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

/** 모바일에서 사이드바를 열고 닫기 위한 아이콘 버튼 */
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

// ───────────────────────────── 레이아웃 컴포넌트 ─────────────────────────────
/**
 * AdminLayout
 * 관리자 페이지의 전체적인 구조(사이드바, 헤더, 메인 콘텐츠)를 정의하는 레이아웃.
 *
 * @param {{ children: React.ReactNode }} props - 페이지 콘텐츠
 * @returns {JSX.Element} 관리자 페이지 레이아웃
 */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pinned, setPinned] = useState(true);
  const pathname = usePathname();

  // ───────────────────────────── 조건부 렌더링 ─────────────────────────────

  // 현재 경로가 로그인 또는 회원가입 페이지인지 확인
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/signup';

  
  // 인증 페이지인 경우, 사이드바 없이 메인 콘텐츠만 렌더링
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

  // ───────────────────────────── 기본 렌더링 로직 ─────────────────────────────

  // 일반 관리자 페이지 (사이드바 포함)
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