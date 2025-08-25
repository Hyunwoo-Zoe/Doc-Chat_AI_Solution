'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components'; // styled-components import

/* ------------------------------------------------------------------ */
/* ───────── styled elements ────────── */

const SidebarContainer = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  background-color: #181818;
  padding: 1rem; /* p-4 */
`;

const SidebarHeader = styled.div`
  margin-bottom: 1.5rem; /* mb-6 */
  padding-left: 0.5rem; /* px-2 */
  padding-right: 0.5rem;
`;

const Title = styled.span`
  font-size: 1.25rem; /* text-xl */
  font-weight: 600; /* font-semibold */
  color: #f4f4f5; /* text-zinc-100 */
`;

const NavList = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* space-y-2 */
`;

// Link 컴포넌트에 스타일을 적용하고, active 상태를 props로 받습니다.
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

const MenuLabel = styled.span`
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */
`;


/* ------------------------------------------------------------------ */
/* ───────── Component ────────── */

/* 메뉴 정의 (아이콘 제거) */
const MENU = [
  { href: '/admin',              label: '대시보드' },
  { href: '/admin/vector',         label: '벡터 관리' },
  { href: '/admin/cache',          label: '캐시 관리' },
  { href: '/admin/logs',           label: '로그 관리' },
  { href: '/admin/test-summary',   label: '요약 테스트' },
  { href: '/admin/system',         label: '시스템 초기화' },
];

// 개별 메뉴 아이템 컴포넌트
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

// 전체 네비게이션 컴포넌트
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