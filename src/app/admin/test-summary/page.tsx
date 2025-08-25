// 📁 src/app/admin/test-summarize/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import styled from 'styled-components';
import { toast } from 'sonner';
import { requestSummary } from '@/services/adminApi';
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem,
} from '@/components/ui/select';
import { FileText, Globe, Sparkles, Loader2, ClipboardList } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* ───────── styled elements ────────── */

const Wrapper = styled.main`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
  background: radial-gradient(ellipse at top, hsl(var(--primary) / 0.05), transparent 50%);
`;

const Panel = styled.section`
  width: 100%;
  max-width: 72rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const PageHead = styled.header`
  text-align: center;
  margin-bottom: 1rem;
  
  h2 {
    display: inline-flex;
    align-items: center;
    gap: .75rem;
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: hsl(var(--muted-foreground));
    font-size: 1rem;
  }
`;

const MainCard = styled.div`
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const CardHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.3);
  
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: hsl(var(--foreground));
  }
`;

const CardContent = styled.div`
  padding: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 2fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: .5rem;
  
  label {
    font-size: .875rem;
    font-weight: 500;
    color: hsl(var(--muted-foreground));
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const Input = styled.input`
  height: 3rem;
  padding: 0 1rem;
  border-radius: .5rem;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  font-size: .875rem;
  width: 100%;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: hsl(var(--primary));
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
  }
  
  &:hover:not(:focus) {
    border-color: hsl(var(--muted-foreground) / 0.5);
  }
`;

const Textarea = styled.textarea`
  min-height: 10rem;
  padding: 1rem;
  border-radius: .5rem;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  font-size: .875rem;
  width: 100%;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.2s ease;
  font-family: inherit; /* ❗ [수정] 이 줄을 추가하여 글꼴을 통일합니다. */
  
  &:focus {
    outline: none;
    border-color: hsl(var(--primary));
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
  }
  
  &:hover:not(:focus) {
    border-color: hsl(var(--muted-foreground) / 0.5);
  }
`;

const FormFooter = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid hsl(var(--border));
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const LanguageSelect = styled.div`
  flex: 1;
  max-width: 200px;
  
  @media (max-width: 640px) {
    max-width: 100%;
  }
`;

const StyledSelectTrigger = styled(SelectTrigger)`
  border: 1px solid hsl(var(--border));
  height: 3rem;
  background: hsl(var(--background));
  
  &:hover {
    border-color: hsl(var(--muted-foreground) / 0.5);
  }
  
  &:focus {
    border-color: hsl(var(--primary));
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
  }
`;

const SubmitButton = styled.button`
  height: 3rem;
  padding: 0 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  font-size: .9rem;
  font-weight: 500;
  border-radius: .5rem;
  border: none;
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9));
  color: hsl(var(--primary-foreground));
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
  }
  
  &:not(:disabled):active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: .7;
    cursor: not-allowed;
  }
`;

const ResultSection = styled.div`
  margin-top: 2rem;
`;

const ResultCard = styled.div`
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &.loading {
    border-color: hsl(var(--primary) / 0.3);
    box-shadow: 0 0 20px hsl(var(--primary) / 0.1);
  }
`;

const ResultContent = styled.div`
  min-height: 20rem;
  padding: 2rem;
  line-height: 1.8;
  white-space: pre-wrap;
  color: hsl(var(--card-foreground));
  background: hsl(var(--background) / 0.5);
  
  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 20rem;
    gap: 1rem;
    color: hsl(var(--muted-foreground));
    
    svg {
      opacity: 0.5;
    }
    
    p {
      font-size: 0.9rem;
    }
  }
  
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 20rem;
    gap: 1.5rem;
    
    svg {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    p {
      color: hsl(var(--primary));
      font-weight: 500;
    }
  }
`;

const ErrorMessage = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: hsl(var(--destructive) / 0.1);
  border: 1px solid hsl(var(--destructive) / 0.2);
  border-radius: 0.5rem;
  color: hsl(var(--destructive));
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// 언어 타입
type Language = 'KO' | 'EN' | 'JP' | 'CN';

/* ------------------------------------------------------------------ */

export default function TestSummaryPage() {
  const [fileId, setFileId] = useState('paper_2023_01');
  const [pdfUrl, setPdfUrl] = useState('https://arxiv.org/pdf/2305.12489.pdf');
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState<Language>('KO');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setResult(''); setError('');
    try {
      const { summary } = await requestSummary({
        file_id: fileId,
        pdf_url: pdfUrl,
        query: query || 'xxx가 뭐야?',
        lang,
      });
      const { answer } = await requestSummary({
        file_id: fileId,
        pdf_url: pdfUrl,
        query: query || 'xxx가 뭐야?',
        lang,
      });
      setResult(summary ?? answer ?? '결과 없음');
    } catch (err) {
      const msg = (err as Error).message;
      toast.error('요약 요청 실패', { description: msg });
      setError(msg);
    } finally { setBusy(false); }
  };

  return (
    <Wrapper>
      <Panel>
        <PageHead>
          <h2>
            <Sparkles size={32} />
            요약 기능 테스트
          </h2>
          <p>PDF 문서를 AI가 분석하여 원하는 형태로 요약해드립니다</p>
        </PageHead>

        <MainCard>
          <CardHeader>
            <h3>
              <FileText size={20} />
              문서 정보 입력
            </h3>
          </CardHeader>
          <CardContent>
            <Form onSubmit={onSubmit}>
              <InputGrid>
                <Field>
                  <label htmlFor="fid">
                    File ID
                  </label>
                  <Input 
                    id="fid" 
                    value={fileId} 
                    onChange={e => setFileId(e.target.value)}
                    placeholder="예: paper_2023_01"
                  />
                </Field>

                <Field>
                  <label htmlFor="url">
                    PDF URL
                  </label>
                  <Input 
                    id="url" 
                    value={pdfUrl} 
                    onChange={e => setPdfUrl(e.target.value)}
                    placeholder="https://example.com/document.pdf"
                  />
                </Field>
              </InputGrid>

              <Field>
                <label htmlFor="q">
                  질문 (Query)
                </label>
                <Textarea
                  id="q"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="예: 이 문서의 핵심 내용을 3줄로 요약해주세요.&#10;또는 특정 주제에 대해 질문하실 수 있습니다."
                />
              </Field>

              <FormFooter>
                <LanguageSelect>
                  <Field>
                    <label>
                      <Globe size={16} />
                      언어 선택
                    </label>
                    <Select value={lang} onValueChange={v => setLang(v as Language)}>
                      <StyledSelectTrigger>
                        <SelectValue placeholder="언어 선택" />
                      </StyledSelectTrigger>
                      <SelectContent position="popper" side="bottom">
                        <SelectItem value="KO">한국어</SelectItem>
                        <SelectItem value="EN">English</SelectItem>
                        <SelectItem value="JP">日本語</SelectItem>
                        <SelectItem value="CN">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </LanguageSelect>
                <SubmitButton type="submit" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 size={18} />
                      요약 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      요약 요청
                    </>
                  )}
                </SubmitButton>
              </FormFooter>

              {error && (
                <ErrorMessage>
                  ⚠️ {error}
                </ErrorMessage>
              )}
            </Form>
          </CardContent>
        </MainCard>

        <ResultSection>
          <ResultCard className={busy ? 'loading' : ''}>
            <CardHeader>
              <h3>
                <FileText size={20} />
                요약 결과
              </h3>
            </CardHeader>
            <ResultContent>
              {busy ? (
                <div className="loading">
                  <Loader2 size={48} />
                  <p>AI가 문서를 분석하고 있습니다...</p>
                </div>
              ) : result ? (
                result
              ) : (
                <div className="placeholder">
                  <FileText size={48} />
                  <p>요약 결과가 여기에 표시됩니다</p>
                </div>
              )}
            </ResultContent>
          </ResultCard>
        </ResultSection>
      </Panel>
    </Wrapper>
  );
}