// 📁 src/app/admin/signup/page.tsx (styled-components 최종본)
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from 'styled-components';
import { toast } from 'sonner';
import { Mail, Lock, UserPlus } from 'lucide-react';

// --- Styled Components (로그인 페이지와 동일한 스타일 재사용) ---

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

const Header = styled.div`
  text-align: center;
  padding: 1.5rem;
  padding-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.5rem; /* 24px */
  font-weight: 700;
`;

const Description = styled.p`
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem; /* 14px */
  margin-top: 0.25rem;
`;

const Content = styled.div`
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
`;

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

const Footer = styled.div`
  padding: 1.5rem;
  padding-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

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

const ErrorText = styled.div`
  background-color: hsl(var(--destructive) / 0.1);
  color: hsl(var(--destructive));
  font-size: 0.875rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
`;

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

export default function AdminSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      const errorMsg = 'Passwords do not match.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    setLoading(true);

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

      toast.success('Account created!', { description: 'Redirecting to login page...' });
      router.push('/admin/login');

    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast.error('Signup failed', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

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

            {error && <ErrorText>{error}</ErrorText>}
          </Content>
          
          <Footer>
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