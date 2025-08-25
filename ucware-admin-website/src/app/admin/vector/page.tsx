// 📁 src/app/admin/vector/page.tsx
'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  Search, RefreshCw, Zap, Trash2, ClipboardCopy,
  Database, AlertCircle, CheckCircle2
} from 'lucide-react';
import * as Alert from '@radix-ui/react-alert-dialog';
import {
  fetchVectorStats,
  deleteVectorById,
  cleanupUnusedVectors,
  deleteAllVectors,
} from '@/services/adminApi';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/* ───────── styled elements ───────── */

const Wrapper = styled.main`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
  background: radial-gradient(ellipse at top right, hsl(var(--primary) / 0.05), transparent 50%);
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

const TabsContainer = styled.div`
  display: flex;
  gap: .5rem;
  padding: .5rem;
  background: hsl(var(--muted) / 0.5);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  width: fit-content;
  margin: 0 auto;
`;

const TabBtn = styled.button<{$active?: boolean; $danger?: boolean}>`
  padding: .75rem 1.5rem;
  border-radius: .75rem;
  font-size: .875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  
  ${({ $active }) => $active
    ? `
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `
    : `
      background: transparent;
      color: hsl(var(--muted-foreground));
      
      &:hover {
        color: hsl(var(--foreground));
      }
    `}
    
  ${({ $danger, $active }) =>
    $danger && !$active && `
      color: hsl(var(--destructive));
      
      &:hover {
        color: hsl(var(--destructive));
        background: hsl(var(--destructive) / 0.1);
      }
    `}
`;

const Card = styled.div`
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const CardHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.3);
`;

const CardContent = styled.div`
  padding: 2rem;
`;

const SearchSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  height: 3rem;
  padding: 0 1rem 0 3rem;
  border-radius: .75rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: hsl(var(--background));
  font-size: .875rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: hsl(var(--primary));
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
  }
  
  &:hover:not(:focus) {
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  
  svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.25rem;
    height: 1.25rem;
    color: hsl(var(--muted-foreground));
  }
`;

const Btn = styled.button<{variant?: 'primary' | 'secondary' | 'danger'; size?: 'sm' | 'md'}>`
  height: ${({ size }) => size === 'sm' ? '2.25rem' : '3rem'};
  padding: ${({ size }) => size === 'sm' ? '0 0.75rem' : '0 1.5rem'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  font-size: ${({ size }) => size === 'sm' ? '.8rem' : '.875rem'};
  font-weight: 500;
  border-radius: .5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  svg { 
    width: ${({ size }) => size === 'sm' ? '1rem' : '1.25rem'};
    height: ${({ size }) => size === 'sm' ? '1rem' : '1.25rem'};
  }

  ${({ variant }) => {
    switch (variant) {
      case 'secondary': return `
        background: hsl(var(--muted));
        color: hsl(var(--muted-foreground));
        
        &:hover:not(:disabled) {
          background: hsl(var(--muted) / 0.8);
          transform: translateY(-1px);
        }
      `;
      case 'danger': return `
        background: hsl(var(--destructive));
        color: hsl(var(--destructive-foreground));
        
        &:hover:not(:disabled) {
          background: hsl(var(--destructive) / 0.9);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px hsl(var(--destructive) / 0.3);
        }
      `;
      default: return `
        background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9));
        color: hsl(var(--primary-foreground));
        
        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
        }
      `;
    }
  }}
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled { 
    opacity: .6; 
    cursor: not-allowed; 
  }
`;

const VectorGrid = styled.div`
  display: grid;
  gap: .75rem;
`;

const VectorRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: hsl(var(--background));
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: .75rem;
  padding: 1rem 1.25rem;
  gap: 1rem;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transform: translateX(4px);
  }
  
  .id {
    font-family: monospace;
    font-size: .875rem;
    color: hsl(var(--foreground));
    word-break: break-all;
    flex: 1;
  }
  
  .actions {
    display: flex;
    gap: .5rem;
    flex-shrink: 0;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: hsl(var(--muted-foreground));
  
  svg {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 1rem;
    opacity: 0.5;
  }
  
  p {
    font-size: .9rem;
  }
`;

const StatsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .75rem 1rem;
  background: hsl(var(--muted) / 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: .5rem;
  margin-bottom: 1rem;
  
  .label {
    font-size: .875rem;
    color: hsl(var(--muted-foreground));
  }
  
  .count {
    font-weight: 600;
    color: hsl(var(--foreground));
    margin-left: .5rem;
  }
`;

const FeatureCard = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  
  .icon-wrapper {
    width: 4rem;
    height: 4rem;
    margin: 0 auto 1.5rem;
    background: hsl(var(--primary) / 0.1);
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      width: 2rem;
      height: 2rem;
      color: hsl(var(--primary));
    }
  }
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }
  
  p {
    color: hsl(var(--muted-foreground));
    margin-bottom: 2rem;
    line-height: 1.6;
  }
  
  &.danger {
    .icon-wrapper {
      background: hsl(var(--destructive) / 0.1);
      
      svg {
        color: hsl(var(--destructive));
      }
    }
  }
`;

// Alert Dialog 스타일
const AlertOverlay = styled(Alert.Overlay)`
  position: fixed;
  inset: 0;
  background: hsla(0 0% 0% / .5);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const AlertContent = styled(Alert.Content)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: 28rem;
  background: hsl(var(--card));
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.2s ease;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translate(-50%, -48%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: hsl(var(--destructive));
  }
  
  p {
    font-size: 0.875rem;
    color: hsl(var(--muted-foreground));
    line-height: 1.6;
  }
  
  footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }
`;

/* ------------------------------------------------------------------ */

export default function VectorPage() {
  type Vec = { id: string };

  const [tab,     setTab]   = useState<'list'|'clean'|'all'>('list');
  const [vectors, setVec]   = useState<Vec[]>([]);
  const [view,    setView]  = useState<Vec[]>([]);
  const [term,    setTerm]  = useState('');
  const [busy,    setBusy]  = useState(false);

  /* ───── fetch list ───── */
  const load = async () => {
    setBusy(true);
    try {
      const res  = await fetchVectorStats();
      const arr: Vec[] = res.file_ids.map((id:string)=>({id}));
      setVec(arr); setView(arr);
      toast.success(`${arr.length}개 벡터 불러옴`);
    } catch {
      toast.error('벡터 목록을 가져오지 못했습니다.');
    } finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);

  /* ───── helpers ───── */
  const search = () => {
    if (!term) return setView(vectors);
    const f = vectors.filter(v => v.id.toLowerCase().includes(term.toLowerCase()));
    setView(f);
    toast.success(`${f.length}개 결과`);
  };

  const deleteOne = (id: string) =>
    toast.promise(
      deleteVectorById(id).then(() => {
        setVec(p => p.filter(v => v.id !== id));
        setView(p => p.filter(v => v.id !== id));
        return '삭제 완료';
      }),
      { loading: '삭제 중…', success: v => v, error: '삭제 실패' },
    );

  // VectorPage 컴포넌트의 cleanup 함수 수정

// VectorPage 컴포넌트의 cleanup 함수 수정

// VectorPage 컴포넌트의 cleanup 함수 수정

const cleanup = async () => {
  setBusy(true);
  try {
    const result = await cleanupUnusedVectors();
    
    // 응답 검증
    if (result.error) {
      toast.error(result.message || '정리 중 오류가 발생했습니다.');
      return;
    }
    
    // 성공 처리
    if (result.deleted_count > 0) {
      toast.success(`${result.deleted_count}개의 미사용 벡터가 정리되었습니다.`);
      // 삭제된 항목이 있을 때만 목록 새로고침 (토스트 없이)
      await loadWithoutToast();
    } else {
      toast.info('정리할 미사용 벡터가 없습니다. 모든 벡터가 캐시에 존재합니다.');
    }
    
  } catch (error) {
    console.error('Cleanup error:', error);
    toast.error('벡터 정리 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
  } finally {
    setBusy(false);
  }
};

// 토스트 없이 목록만 새로고침하는 함수 추가
const loadWithoutToast = async () => {
  setBusy(true);
  try {
    const res = await fetchVectorStats();
    const arr: Vec[] = res.file_ids.map((id:string)=>({id}));
    setVec(arr); 
    setView(arr);
  } catch {
    // 에러는 무시 (이미 cleanup에서 처리)
  } finally { 
    setBusy(false); 
  }
};
  const deleteAll = () =>
    toast.promise(
      deleteAllVectors().then(r => {
        setVec([]); setView([]);
        return `${r.deleted_count}개 삭제`;
      }), { loading:'전체 삭제…', success:v=>v, error:'삭제 실패' });

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() =>
      toast.success('ID가 클립보드에 복사되었습니다.'));
  };

  /* ------------------------------------------------------------------ */
  return (
    <Wrapper>
      <Panel>
        <PageHead>
          <h2>
            <Database size={32} />
            벡터 관리
          </h2>
          <p>ChromaDB에 저장된 벡터 데이터를 관리하고 최적화합니다</p>
        </PageHead>

        {/* Tabs 버튼 */}
        <TabsContainer>
          <TabBtn $active={tab==='list'} onClick={()=>setTab('list')}>
            벡터 조회
          </TabBtn>
          <TabBtn $active={tab==='clean'} onClick={()=>setTab('clean')}>
            미사용 정리
          </TabBtn>
          <TabBtn $active={tab==='all'} $danger onClick={()=>setTab('all')}>
            전체 삭제
          </TabBtn>
        </TabsContainer>

        {/* ── Tab : list ── */}
        {tab==='list' && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">벡터 목록</h3>
            </CardHeader>
            <CardContent>
              <SearchSection>
                <SearchWrapper>
                  <Search />
                  <SearchInput
                    placeholder="File ID로 검색 (예: 20240101T102030.pdf)"
                    value={term}
                    onChange={e=>setTerm(e.target.value)}
                    onKeyDown={e=>e.key==='Enter' && search()}
                  />
                </SearchWrapper>
                <Btn onClick={search} disabled={busy}>
                  <Search size={18} />
                  검색
                </Btn>
                <Btn variant="secondary" onClick={load} disabled={busy}>
                  <RefreshCw size={18} />
                  새로고침
                </Btn>
              </SearchSection>

              <StatsBar>
                <span className="label">
                  전체 벡터<span className="count">{vectors.length}</span>개
                </span>
                <span className="label">
                  검색 결과<span className="count">{view.length}</span>개
                </span>
              </StatsBar>

              <VectorGrid>
                {busy ? (
                  <EmptyState>
                    <RefreshCw className="animate-spin" />
                    <p>벡터 목록을 불러오는 중...</p>
                  </EmptyState>
                ) : view.length === 0 ? (
                  <EmptyState>
                    <Database />
                    <p>검색 결과가 없습니다</p>
                  </EmptyState>
                ) : (
                  view.map(v => (
                    <VectorRow key={v.id}>
                      <span className="id">{v.id}</span>
                      <div className="actions">
                        <Btn variant="secondary" size="sm" onClick={() => copyId(v.id)}>
                          <ClipboardCopy />
                          복사
                        </Btn>
                        <Btn variant="danger" size="sm" onClick={() => deleteOne(v.id)}>
                          <Trash2 />
                          삭제
                        </Btn>
                      </div>
                    </VectorRow>
                  ))
                )}
              </VectorGrid>
            </CardContent>
          </Card>
        )}

        {/* ── Tab : clean ── */}
        {tab==='clean' && (
          <Card>
            <CardContent>
              <FeatureCard>
                <div className="icon-wrapper">
                  <Zap />
                </div>
                <h3>미사용 벡터 정리</h3>
                <p>
                  ChromaDB에는 존재하지만 Redis 캐시에 없는 벡터를 자동으로 찾아서 삭제합니다.<br />
                  이를 통해 데이터베이스를 깨끗하게 유지할 수 있습니다.
                </p>
                <Btn onClick={cleanup}>
                  <CheckCircle2 />
                  정리 실행
                </Btn>
              </FeatureCard>
            </CardContent>
          </Card>
        )}

        {/* ── Tab : all ── */}
        {tab==='all' && (
          <Card>
            <CardContent>
              <FeatureCard className="danger">
                <div className="icon-wrapper">
                  <AlertCircle />
                </div>
                <h3>전체 벡터 삭제</h3>
                <p>
                  ChromaDB에 저장된 모든 벡터 데이터가 영구적으로 삭제됩니다.<br />
                  <strong>이 작업은 되돌릴 수 없으니 신중하게 결정해주세요.</strong>
                </p>

                {/* 경고 다이얼로그 */}
                <Alert.Root>
                  <Alert.Trigger asChild>
                    <Btn variant="danger">
                      <Trash2 />
                      모든 벡터 삭제
                    </Btn>
                  </Alert.Trigger>

                  <Alert.Portal>
                    <AlertOverlay/>
                    <AlertContent>
                      <Alert.Title asChild>
                        <h2>
                          <AlertCircle />
                          정말로 모든 벡터를 삭제하시겠습니까?
                        </h2>
                      </Alert.Title>
                      <Alert.Description asChild>
                        <p>
                          ChromaDB에 저장된 <strong>모든 벡터 데이터</strong>가 영구적으로 삭제됩니다.<br />
                          이 작업은 되돌릴 수 없으며, 삭제 후에는 복구할 방법이 없습니다.
                        </p>
                      </Alert.Description>

                      <footer>
                        <Alert.Cancel asChild>
                          <Btn variant="secondary">취소</Btn>
                        </Alert.Cancel>
                        <Alert.Action asChild>
                          <Btn variant="danger" onClick={deleteAll}>확인</Btn>
                        </Alert.Action>
                      </footer>
                    </AlertContent>
                  </Alert.Portal>
                </Alert.Root>
              </FeatureCard>
            </CardContent>
          </Card>
        )}
      </Panel>
    </Wrapper>
  );
}