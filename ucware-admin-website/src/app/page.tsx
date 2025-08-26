
// 📁 src/app/page.tsx
// 메인 랜딩 페이지 (Welcome Page).
//
// 설계 포인트
// ===========
// 1) styled-components 기반 UI 구성 (Tailwind CSS 변수와 혼용).
// 2) 다크 모드 대비 색상 변수(GlobalStyle) 적용.
// 3) 메인 CTA 버튼(Sign In / Create Account) 제공.
// 4) 보안/관리자 전용 접근을 강조하는 Hero Section 디자인.
// 
// 주의
// ----
// - hsl(var(--...)) 형태의 색상 변수는 globals.css와 통일.
// - 반응형 레이아웃(@media)로 모바일/데스크탑 대응.

'use client';

import Link from "next/link";
import { ArrowRight, Shield, Lock } from "lucide-react";
import styled, { createGlobalStyle } from "styled-components";

// ───────────────────────────── 글로벌 스타일 ─────────────────────────────
/**
 * styled-components 전역 스타일 정의
 * - Tailwind CSS의 전역 변수와 연결
 * - 기본 색상 팔레트 (라이트/다크)
 */
const GlobalStyle = createGlobalStyle`
  :root {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --muted-foreground: 0 0% 63.9%;
  }
  .dark {
    /* 다크 모드 변수는 이미 root에 정의되어 있으므로 추가 필요 없음 */
  }
`;

// ───────────────────────────── 주요 레이아웃 컴포넌트 ─────────────────────────────
const Main = styled.main`
  /* 전체 화면 중앙 정렬 레이아웃 */
  position: relative;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  
  &::before {
    /* 배경에 은은한 radial-gradient 효과 */
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle at top left, hsla(var(--primary), 0.05), transparent),
                      radial-gradient(circle at bottom right, hsla(var(--primary), 0.05), transparent);
  }
`;

const ContentWrapper = styled.div`
  /* 메인 콘텐츠 중앙 배치 */
  position: relative;
  z-index: 10;
  margin: 0 auto;
  max-width: 42rem; /* 672px */
  padding: 0 1.5rem;
  text-align: center;
`;

// ───────────────────────────── UI 요소 ─────────────────────────────
const IconWrapper = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
  > div {
    border-radius: 9999px;
    background-color: hsla(var(--primary), 0.1);
    padding: 0.75rem;
  }
`;

const Title = styled.h1`
  margin-bottom: 1rem;
  font-size: 2.25rem; /* 36px */
  font-weight: 700;
  letter-spacing: -0.025em;
  @media (min-width: 640px) {
    font-size: 3rem; /* 48px */
  }
`;

const Subtitle = styled.p`
  margin-bottom: 2rem;
  font-size: 1.125rem; /* 18px */
  color: hsl(var(--muted-foreground));
  @media (min-width: 640px) {
    font-size: 1.25rem; /* 20px */
  }
`;

// ───────────────────────────── 버튼 그룹 ─────────────────────────────
const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const BaseButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
  height: 3rem; /* 48px */
  padding: 0 2rem;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  
  .icon {
    margin-left: 0.5rem;
    width: 1rem;
    height: 1rem;
    transition: transform 0.2s ease-in-out;
  }
  
  &:hover .icon {
    transform: translateX(4px);
  }
`;

const PrimaryButton = styled(BaseButton)`
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  &:hover {
    opacity: 0.9;
  }
`;

const OutlineButton = styled(BaseButton)`
  border: 1px solid hsl(var(--primary) / 0.2);
  background-color: transparent;
  color: hsl(var(--primary));
  &:hover {
    background-color: hsl(var(--primary) / 0.1);
  }
`;

const FooterText = styled.div`
  margin-top: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem; /* 14px */
  color: hsl(var(--muted-foreground));
`;

// ───────────────────────────── 페이지 컴포넌트 ─────────────────────────────
/**
 * WelcomePage
 * 
 * Returns:
 *   Admin Control Center 랜딩 화면
 *   - Shield 아이콘 Hero
 *   - 제목/부제목
 *   - Sign In / Create Account 버튼
 *   - 하단 보안 안내 텍스트
 */
export default function WelcomePage() {
  return (
    <>
      <GlobalStyle />
      <Main>
        <ContentWrapper>
          <IconWrapper>
            <div><Shield size={48} className="text-primary" /></div>
          </IconWrapper>
          
          <Title>Admin Control Center</Title>
          <Subtitle>
            Secure access to system management and monitoring tools
          </Subtitle>
          
          <ButtonGroup>
            <PrimaryButton href="/admin/login">
              Sign In <ArrowRight className="icon" />
            </PrimaryButton>
            <OutlineButton href="/admin/signup">
              Create Account
            </OutlineButton>
          </ButtonGroup>
          
          <FooterText>
            <Lock size={16} />
            <span>Protected by enterprise-grade security</span>
          </FooterText>
        </ContentWrapper>
      </Main>
    </>
  );
}
