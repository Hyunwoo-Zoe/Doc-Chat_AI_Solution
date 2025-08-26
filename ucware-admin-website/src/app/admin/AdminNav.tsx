
// 📁 src/app/admin/AdminNav.tsx
// 관리자 페이지 전용 사이드바 네비게이션 컴포넌트.
//
// 설계 포인트
// ===========
// 1) 'use client'를 사용하여 `usePathname` 훅으로 현재 URL 경로를 감지.
// 2) styled-components를 사용해 사이드바의 각 요소(컨테이너, 헤더, 메뉴 아이템 등)를 스타일링.
// 3) 네비게이션 메뉴를 `MENU` 상수로 정의하여 유지보수 용이성 확보.
// 4) 현재 경로(path)와 메뉴의 href를 비교하여 활성(active) 상태를 결정.
// 5) 활성 상태는 `MenuItemLink` styled-component에 `$active` prop으로 전달되어 조건부 스타일 적용.
//
// 주의
// ----
// - 이 컴포넌트는 아이콘을 포함하지 않는 텍스트 기반 네비게이션입니다.

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components'; // styled-components import

// ───────────────────────────── 스타일 컴포넌트 ─────────────────────────────

/** 사이드바 전체를 감싸는 메인 컨테이너 */
const SidebarContainer = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  background-color: #181818;
  padding: 1rem; /* p-4 */
`;

/** 사이드바 상단의 헤더 영역 (타이틀 포함) */
const SidebarHeader = styled.div`
  margin-bottom: 1.5rem; /* mb-6 */
  padding-left: 0.5rem; /* px-2 */
  padding-right: 0.5rem;
`;

/** 'Admin Panel' 제목 텍스트 */
const Title = styled.span`
  font-size: 1.25rem; /* text-xl */
  font-weight: 600; /* font-semibold */
  color: #f4f4f5; /* text-zinc-100 */
`;

/** 메뉴 아이템 목록을 감싸는 nav 요소 */
const NavList = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* space-y-2 */
`;

/** 개별 메뉴 아이템을 위한 Link 컴포넌트. `$active` prop으로 활성 상태 스타일 제어. */
const MenuItemLink = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  border-radius: 0.5rem; /* rounded-lg */
  padding: 0.5rem 0.75rem; /* px-3 py-2 */
  color: #a1a1aa; /* text-zinc-400 */
  transition: color 0.2s, background-color 0.2s;
  text-decoration: none;

  &:hover {
    background-color: #27272a; /* hover:bg-zinc-800 */
    color: #e4e4e7; /* hover:text-zinc-200 */
  }

  /* 활성화 상태일 때의 스타일 */
  ${({ $active }) => $active && `
    background-color: rgba(39, 39, 42, 0.5); /* bg-zinc-800/50 */
    color: #fafafa; /* text-zinc-50 */
  `}
`;

/** 메뉴 아이템 내부의 텍스트 레이블 */
const MenuLabel = styled.span`
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */
`;


// ───────────────────────────── 컴포넌트 및 메뉴 정의 ─────────────────────────────

/** 사이드바에 표시될 메뉴 항목 배열 */
const MENU = [
  { href: '/admin',              label: '대시보드' },
  { href: '/admin/vector',         label: '벡터 관리' },
  { href: '/admin/cache',          label: '캐시 관리' },
  { href: '/admin/logs',           label: '로그 관리' },
  { href: '/admin/test-summary',   label: '요약 테스트' },
  { href: '/admin/system',         label: '시스템 초기화' },
];

/**
 * MenuItem
 * 단일 네비게이션 링크 아이템을 렌더링하는 컴포넌트.
 *
 * @param {{ href: string, label: string, active: boolean }} props - 메뉴 정보
 * @returns {JSX.Element} 스타일링된 Link 컴포넌트
 */
function MenuItem({
  href, label, active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <MenuItemLink href={href} $active={active}>
      <MenuLabel>{label}</MenuLabel>
    </MenuItemLink>
  );
}

/**
 * AdminNav
 * 전체 사이드바 네비게이션을 구성하고 렌더링하는 메인 컴포넌트.
 * 현재 경로를 감지하여 활성 메뉴를 표시합니다.
 *
 * @returns {JSX.Element} 사이드바 UI
 */
export function AdminNav() {
  const path = usePathname();

  return (
    <SidebarContainer>
      <SidebarHeader>
        <Title>Admin Panel</Title>
      </SidebarHeader>

      <NavList>
        {MENU.map(({ href, label }) => (
          <MenuItem
            key={href}
            href={href}
            label={label}
            active={path === href}
          />
        ))}
      </NavList>
    </SidebarContainer>
  );
}