// 📁 src/app/admin/cache/page.tsx
'use client'

import { useState } from 'react'
import styled from 'styled-components'
import {
  Search,
  RefreshCw,
  Zap,
  Trash2,
  ClipboardCopy,
  Database,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import * as Alert from '@radix-ui/react-alert-dialog'
import { toast } from 'sonner'

import {
  fetchCacheSummariesByDate,
  fetchCacheMetadata,
  deleteCacheById,
  cleanupUnusedCache,
  deleteAllCache,
} from '@/services/adminApi'

/* ------------------------------------------------------------------ */
/* ───────── styled elements ───────── */

const Wrapper = styled.main`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
  background: radial-gradient(ellipse at top left, hsl(var(--primary) / 0.05), transparent 50%);
`

const Panel = styled.section`
  width: 100%;
  max-width: 72rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

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
`

const TabsContainer = styled.div`
  display: flex;
  gap: .5rem;
  padding: .5rem;
  background: hsl(var(--muted) / 0.5);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  width: fit-content;
  margin: 0 auto;
`

const TabBtn = styled.button<{$active?:boolean; $danger?:boolean}>`
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
`

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
`

const CardHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.3);
`

const CardContent = styled.div`
  padding: 2rem;
`

const SearchSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
`

const DateInputWrapper = styled.div`
  position: relative;
  flex: 1;
  max-width: 300px;
  
  svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.25rem;
    height: 1.25rem;
    color: hsl(var(--muted-foreground));
    pointer-events: none;
  }
`

const DateInput = styled.input`
  width: 100%;
  height: 3rem;
  padding: 0 1rem 0 3rem;
  border-radius: .75rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: hsl(var(--background));
  font-size: .875rem;
  font-family: inherit;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: hsl(var(--primary));
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
  }
  
  &:hover:not(:focus) {
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  /* 날짜 선택기 스타일 */
  &::-webkit-calendar-picker-indicator {
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
`

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
`

const CacheGrid = styled.div`
  display: grid;
  gap: .75rem;
`

const CacheRow = styled.div<{ $expanded?: boolean }>`
  background: hsl(var(--background));
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: .75rem;
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transform: translateX(4px);
  }
`

const CacheRowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  gap: 1rem;
  
  .id {
    font-family: monospace;
    font-size: .875rem;
    color: hsl(var(--foreground));
    word-break: break-all;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .actions {
    display: flex;
    gap: .5rem;
    flex-shrink: 0;
  }
`

const MetadataPanel = styled.div`
  padding: 1.25rem;
  background: hsl(var(--muted) / 0.3);
  border-top: 1px solid hsl(var(--border));
  
  pre {
    font-size: .75rem;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-all;
    color: hsl(var(--muted-foreground));
    max-height: 300px;
    overflow-y: auto;
    padding: 1rem;
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    border-radius: .5rem;
    
    /* 스크롤바 스타일 */
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: hsl(var(--muted) / 0.3);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: hsl(var(--muted-foreground) / 0.5);
      border-radius: 4px;
    }
  }
`

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
`

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
`

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
`

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
`

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
`

/* ------------------------------------------------------------------ */
/* ───────── util ───────── */

const todayISO = () => new Date().toISOString().split('T')[0]

/* ------------------------------------------------------------------ */
/* ───────── Component ───────── */

export default function CachePage() {
  type CacheId = string

  const [tab,setTab]           = useState<'list'|'clean'|'all'>('list')
  const [date,setDate]         = useState(todayISO())
  const [ids,setIds]           = useState<CacheId[]>([])
  const [meta,setMeta]         = useState<Record<CacheId,any>>({})
  const [expandedId,setExpandedId] = useState<CacheId | null>(null)
  const [busy,setBusy]         = useState(false)

  /* fetch list */
  const load = async () => {
    if(!date) return toast.warning('날짜를 선택하세요.')
    setBusy(true);setIds([]);setMeta({});setExpandedId(null)
    try{
      const res = await fetchCacheSummariesByDate(date)
      console.log(res)
      setIds(res.file_ids||[])
      toast.success(`${date} 캐시 ${res.file_ids?.length||0}건`)
    }catch{ toast.error('조회 실패') }
    finally{ setBusy(false) }
  }

  const toggleMeta = (id: CacheId) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    
    setExpandedId(id)
    
    if (!meta[id]) {
      toast.promise(
        fetchCacheMetadata(id).then(d => {
          setMeta(p => ({...p, [id]: d}))
          return '메타데이터 로드'
        }),
        {loading: '조회 중…', success: v => v, error: '실패'}
      )
    }
  }

  const delOne = (id:CacheId) =>
    toast.promise(
      deleteCacheById(id).then(()=>{
        setIds(p=>p.filter(x=>x!==id))
        if (expandedId === id) setExpandedId(null)
        return'삭제 완료'
      }),
      {loading:'삭제 중…',success:v=>v,error:'삭제 실패'}
    )

  const cleanup = () =>
  toast.promise(
    cleanupUnusedCache().then(r=>`미사용 ${r.deleted_count || 0}건 정리`),
    {loading:'정리 중…',success:v=>v,error:'실패'}
  )

  const deleteAll = () =>
    toast.promise(
      deleteAllCache().then(r=>{
        setIds([]);setMeta({});setExpandedId(null)
        return`${r.deleted_count}건 삭제`;
      }),
      {loading:'전체 삭제…',success:v=>v,error:'실패'}
    )

  const copyId = (id:CacheId) =>
    navigator.clipboard.writeText(id).then(()=>toast.success('ID가 클립보드에 복사되었습니다'))

  /* ------------------------------------------------------------------ */

  return (
    <Wrapper>
      <Panel>
        <PageHead>
          <h2>
            <Zap size={32} />
            캐시 관리
          </h2>
          <p>Redis에 저장된 요약본과 메타데이터를 관리합니다</p>
        </PageHead>

        {/* Tabs */}
        <TabsContainer>
          <TabBtn $active={tab==='list'} onClick={()=>setTab('list')}>
            날짜별 조회
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
              <h3 className="text-lg font-semibold">캐시 목록</h3>
            </CardHeader>
            <CardContent>
              <SearchSection>
                <DateInputWrapper>
                  <Calendar />
                  <DateInput 
                    type="date" 
                    value={date} 
                    onChange={e=>setDate(e.target.value)}
                    max={todayISO()}
                  />
                </DateInputWrapper>
                <Btn onClick={load} disabled={busy}>
                  <Search size={18} />
                  조회
                </Btn>
                <Btn variant="secondary" onClick={load} disabled={busy}>
                  <RefreshCw size={18} />
                  새로고침
                </Btn>
              </SearchSection>

              <StatsBar>
                <span className="label">
                  선택한 날짜<span className="count">{date}</span>
                </span>
                <span className="label">
                  캐시 개수<span className="count">{ids.length}</span>개
                </span>
              </StatsBar>

              <CacheGrid>
                {busy ? (
                  <EmptyState>
                    <RefreshCw className="animate-spin" />
                    <p>캐시 목록을 불러오는 중...</p>
                  </EmptyState>
                ) : ids.length === 0 ? (
                  <EmptyState>
                    <Database />
                    <p>선택한 날짜에 캐시가 없습니다</p>
                  </EmptyState>
                ) : (
                  ids.map(id => (
                    <CacheRow key={id} $expanded={expandedId === id}>
                      <CacheRowHeader>
                        <span className="id">
                          <FileText size={16} />
                          {id}
                        </span>
                        <div className="actions">
                          <Btn variant="secondary" size="sm" onClick={() => copyId(id)}>
                            <ClipboardCopy />
                            복사
                          </Btn>
                          <Btn variant="secondary" size="sm" onClick={() => toggleMeta(id)}>
                            {expandedId === id ? <ChevronUp /> : <ChevronDown />}
                            메타
                          </Btn>
                          {/* 삭제 알림 */}
                          <Alert.Root>
                            <Alert.Trigger asChild>
                              <Btn variant="danger" size="sm">
                                <Trash2 />
                                삭제
                              </Btn>
                            </Alert.Trigger>
                            <Alert.Portal>
                              <AlertOverlay/>
                              <AlertContent>
                                <Alert.Title asChild>
                                  <h2>
                                    <AlertCircle />
                                    캐시 삭제 확인
                                  </h2>
                                </Alert.Title>
                                <Alert.Description asChild>
                                  <p>
                                    <strong>{id}</strong> 캐시를 삭제합니다.<br />
                                    이 작업은 되돌릴 수 없습니다.
                                  </p>
                                </Alert.Description>
                                <footer>
                                  <Alert.Cancel asChild>
                                    <Btn variant="secondary">취소</Btn>
                                  </Alert.Cancel>
                                  <Alert.Action asChild>
                                    <Btn variant="danger" onClick={()=>delOne(id)}>확인</Btn>
                                  </Alert.Action>
                                </footer>
                              </AlertContent>
                            </Alert.Portal>
                          </Alert.Root>
                        </div>
                      </CacheRowHeader>

                      {/* 메타 패널 */}
                      {expandedId === id && meta[id] && (
                        <MetadataPanel>
                          <pre>{JSON.stringify(meta[id].metadata, null, 2)}</pre>
                        </MetadataPanel>
                      )}
                    </CacheRow>
                  ))
                )}
              </CacheGrid>
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
                <h3>미사용 캐시 정리</h3>
                <p>
                  Redis에는 존재하지만 실제로 사용되지 않는 캐시 항목을 자동으로 찾아서 삭제합니다.<br />
                  이를 통해 저장 공간을 효율적으로 관리할 수 있습니다.
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
                <h3>전체 캐시 삭제</h3>
                <p>
                  Redis에 저장된 모든 캐시 데이터가 영구적으로 삭제됩니다.<br />
                  <strong>이 작업은 되돌릴 수 없으니 신중하게 결정해주세요.</strong>
                </p>

                <Alert.Root>
                  <Alert.Trigger asChild>
                    <Btn variant="danger">
                      <Trash2 />
                      모든 캐시 삭제
                    </Btn>
                  </Alert.Trigger>
                  <Alert.Portal>
                    <AlertOverlay/>
                    <AlertContent>
                      <Alert.Title asChild>
                        <h2>
                          <AlertCircle />
                          정말로 모든 캐시를 삭제하시겠습니까?
                        </h2>
                      </Alert.Title>
                      <Alert.Description asChild>
                        <p>
                          Redis에 저장된 <strong>모든 캐시 데이터</strong>가 영구적으로 삭제됩니다.<br />
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
  )
}