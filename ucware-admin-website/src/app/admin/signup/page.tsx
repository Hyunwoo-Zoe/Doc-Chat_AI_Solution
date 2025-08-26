// 관리자 계정 생성 페이지.
//
// 설계 포인트
// ===========
// 1) 'use client'를 사용하여 클라이언트 측 인터랙션(상태, 이벤트 핸들러) 처리.
// 2) styled-components를 활용해 컴포넌트 기반 스타일링 구현.
// 3) 로그인 페이지와 동일한 스타일 컴포넌트를 재사용하여 일관성 유지.
// 4) useState 훅을 사용해 폼 입력, 로딩, 에러 상태를 관리.
// 5) fetch API를 사용해 '/api/auth/signup' 엔드포인트로 회원가입 요청.
// 6) 'sonner' 라이브러리를 통해 사용자에게 성공/실패 토스트 메시지 피드백 제공.
//
// 의존성
// -------
// - sonner: 토스트 알림
// - lucide-react: 아이콘

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from 'styled-components';
import { toast } from 'sonner';
import { Mail, Lock, UserPlus } from 'lucide-react';

// ───────────────────────────── 스타일 컴포넌트 ─────────────────────────────
// 로그인 페이지와 동일한 UI/UX를 제공하기 위해 스타일 재사용

/** 전체 페이지의 배경과 레이아웃을 담당하는 최상위 컨테이너 */
const PageWrapper = styled.main`
  position: relative;
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  background-color: hsl(var(--background));
  padding: 1rem;

  &::before, &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &::before {
    background-image: radial-gradient(circle at top left, hsla(var(--primary), 0.05), transparent 40%),
                      radial-gradient(circle at bottom right, hsla(var(--primary), 0.05), transparent 40%);
  }
  
  &::after {
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="hsl(var(--foreground))" stroke-opacity="0.05"><path d="M0 .5H31.5V32"/></svg>');
    background-size: 50px 50px;
  }
`;

/** 회원가입 폼을 감싸는 카드 UI 컴포넌트 */
const FormCard = styled.div`
  position: relative;
  width: 100%;
  max-width: 26rem; /* 416px */
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border-radius: 0.75rem;
  border: 1px solid hsl(var(--border));
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
`;

/** FormCard의 헤더 영역 (제목, 설명) */
const Header = styled.div`
  text-align: center;
  padding: 1.5rem;
  padding-bottom: 1.5rem;
`;

/** 헤더에 표시되는 주 제목 */
const Title = styled.h1`
  font-size: 1.5rem; /* 24px */
  font-weight: 700;
`;

/** 제목 아래에 표시되는 부가 설명 */
const Description = styled.p`
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem; /* 14px */
  margin-top: 0.25rem;
`;

/** FormCard 내에서 입력 필드들을 감싸는 영역 */
const Content = styled.div`
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

/** Label과 InputWrapper를 그룹화하는 단위 */
const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

/** 입력 필드의 레이블 */
const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
`;

/** 아이콘과 Input을 함께 배치하기 위한 래퍼 */
const InputWrapper = styled.div`
  position: relative;
  .icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: hsl(var(--muted-foreground));
  }
`;

/** 실제 사용자 입력을 받는 텍스트/패스워드 필드 */
const Input = styled.input`
  height: 2.75rem; /* 44px */
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid hsl(var(--input));
  background-color: transparent;
  padding-left: 2.5rem;
  padding-right: 0.75rem;
  font-size: 0.875rem;
  &:focus {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }
`;

/** FormCard의 푸터 영역 (제출 버튼, 보조 텍스트) */
const Footer = styled.div`
  padding: 1.5rem;
  padding-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

/** 폼 제출을 위한 기본 버튼 */
const Button = styled.button`
  height: 2.75rem;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: opacity 0.2s;
  .icon {
    margin-left: 0.5rem;
    width: 1rem;
    height: 1rem;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/** 유효성 검사나 API 에러 메시지를 표시하는 컴포넌트 */
const ErrorText = styled.div`
  background-color: hsl(var(--destructive) / 0.1);
  color: hsl(var(--destructive));
  font-size: 0.875rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
`;

/** 푸터 하단에 '이미 계정이 있나요?' 같은 보조 텍스트 */
const SubText = styled.p`
  text-align: center;
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  padding-top: 0.5rem;
  a {
    color: hsl(var(--primary));
    font-weight: 500;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

// ───────────────────────────── 페이지 컴포넌트 ─────────────────────────────
/**
 * AdminSignupPage
 * 관리자 계정 생성을 위한 UI 및 비즈니스 로직을 처리하는 페이지 컴포넌트.
 *
 * @returns {JSX.Element} 이메일, 패스워드, 패스워드 확인 입력을 받는 회원가입 폼.
 */
export default function AdminSignupPage() {
  // ───────────────────────────── 상태 관리 ─────────────────────────────
  const router = useRouter();
  /** @type {{email: string, password: string, confirm: string}} form - 폼 입력 데이터 상태 */
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  /** @type {string} error - API 요청 실패 시 표시할 에러 메시지 */
  const [error, setError] = useState('');
  /** @type {boolean} loading - API 요청 진행 중 여부를 나타내는 로딩 상태 */
  const [loading, setLoading] = useState(false);

  // ───────────────────────────── 이벤트 핸들러 ─────────────────────────────
  /**
   * 입력 필드 변경 시 form 상태를 업데이트하는 핸들러.
   * @param {React.ChangeEvent<HTMLInputElement>} e - 입력 이벤트 객체
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /**
   * 폼 제출 시 실행되는 비동기 핸들러.
   * - 비밀번호 일치 여부 검증
   * - 서버에 회원가입 API 요청
   * - 결과에 따른 UI 피드백 (토스트 메시지, 에러 표시) 및 페이지 이동
   * @param {FormEvent} e - 폼 제출 이벤트 객체
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // --- 유효성 검사: 비밀번호와 비밀번호 확인이 일치하는지 확인
    if (form.password !== form.confirm) {
      const errorMsg = 'Passwords do not match.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    setLoading(true);

    // --- API 요청
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed.');
      }
      
      // --- 성공 처리
      toast.success('Account created!', { description: 'Redirecting to login page...' });
      router.push('/admin/login');

    } catch (err) {
      // --- 에러 처리
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast.error('Signup failed', { description: errorMessage });
    } finally {
      // --- 로딩 상태 종료
      setLoading(false);
    }
  };

  // ───────────────────────────── 렌더링 로직 ─────────────────────────────
  return (
    <PageWrapper>
      <FormCard>
        <form onSubmit={handleSubmit}>
          <Header>
            <Title>Create an Account</Title>
            <Description>
              Enter your details to create a new admin account
            </Description>
          </Header>
          
          <Content>
            {/* 이메일 입력 그룹 */}
            <InputGroup>
              <Label htmlFor="email">Email Address</Label>
              <InputWrapper>
                <Mail className="icon" />
                <Input
                  id="email" name="email" type="email" required
                  placeholder="admin@example.com" value={form.email}
                  onChange={handleChange}
                />
              </InputWrapper>
            </InputGroup>

            {/* 비밀번호 입력 그룹 */}
            <InputGroup>
              <Label htmlFor="password">Password</Label>
              <InputWrapper>
                <Lock className="icon" />
                <Input
                  id="password" name="password" type="password" required
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                />
              </InputWrapper>
            </InputGroup>

            {/* 비밀번호 확인 입력 그룹 */}
            <InputGroup>
              <Label htmlFor="confirm">Confirm Password</Label>
              <InputWrapper>
                <Lock className="icon" />
                <Input
                  id="confirm" name="confirm" type="password" required
                  value={form.confirm} onChange={handleChange}
                  placeholder="••••••••"
                />
              </InputWrapper>
            </InputGroup>

            {/* 에러 메시지 표시 */}
            {error && <ErrorText>{error}</ErrorText>}
          </Content>
          
          <Footer>
            {/* 제출 버튼 (로딩 상태에 따라 UI 변경) */}
            <Button type="submit" disabled={loading}>
              {loading ? (
                'Creating Account...'
              ) : (
                <>
                  Create Account
                  <UserPlus className="icon" />
                </>
              )}
            </Button>
            
            {/* 로그인 페이지로 이동 링크 */}
            <SubText>
              Already have an account?{' '}
              <Link href="/admin/login">Sign In</Link>
            </SubText>
          </Footer>
        </form>
      </FormCard>
    </PageWrapper>
  );
}