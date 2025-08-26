
// 📁 src/app/admin/logs/page.tsx
// 관리자 UI - 로그 관리 페이지
//
// 설계 포인트
// ===========
// 1) 날짜 선택 후 요약 요청 로그, 캐시 삭제 로그, 벡터 삭제 로그를 조회.
// 2) fetchCacheSummaryLog / fetchCacheDeletionLog / fetchVectorDeletionLog 호출.
// 3) Promise.allSettled으로 병렬 요청, 실패 시 안전하게 빈 배열 처리.
// 4) 데이터는 최신순으로 정렬 후 상태에 저장.
// 5) 탭 전환으로 세 가지 로그 종류를 표시.
//
// 주의
// ----
// - API 응답 데이터는 백엔드 포맷에 의존하므로 타입 지정 필수.
// - 대규모 데이터 대비를 위해 테이블/리스트는 overflow 처리.

'use client'

import { useState, useEffect } from 'react'
import styled from 'styled-components'
import {
  CalendarDays, Search, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  fetchCacheSummaryLog,
  fetchCacheDeletionLog,
  fetchVectorDeletionLog,
} from '@/services/adminApi'

/* ───── styled elements ───── */
// Wrapper / Panel / PageHead / Card → 페이지 전체 레이아웃
// Tabs / TabBtn → 탭 전환 버튼
// FormLine / Field / Btn → 조회 날짜 입력 및 버튼
// TableWrap / STable → 요약 로그 테이블
// LogRow → 캐시/벡터 로그 리스트

const Wrapper = styled.main`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
`

const Panel = styled.section`
  width: 100%;
  max-width: 64rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

const PageHead = styled.header`
  h2{
    display: flex; align-items: center; gap:.5rem;
    font-size:1.75rem; font-weight:700;
  }
  p{ color:hsl(var(--muted-foreground)); }
`

const Card = styled.div`
  border:1px solid hsl(var(--border));
  background:hsl(var(--card));
  color:hsl(var(--card-foreground));
  border-radius:.75rem;
  padding:2rem;
  display:flex; flex-direction:column; gap:2rem;
`

/* Tabs ---------------------------------------------------------------- */

const Tabs = styled.div`display:flex; gap:.5rem;`

const TabBtn = styled.button<{$active?:boolean}>`
  padding:.5rem 1.25rem; border-radius:9999px;
  font-size:.875rem; font-weight:500; backdrop-filter:blur(4px);
  ${({$active})=> $active
    ?'background:hsl(var(--primary));color:hsl(var(--primary-foreground));'
    :'background:hsl(var(--muted));color:hsl(var(--muted-foreground));'}
`

/* Form line ----------------------------------------------------------- */

const FormLine = styled.div`
  display:flex; flex-wrap:wrap; gap:.75rem; align-items:flex-end;
`

const Field = styled.div`
  flex:1 1 220px; display:flex; flex-direction:column; gap:.25rem;
  label{font-size:.875rem;font-weight:500;}
  input{
    height:2.75rem; padding:0 .75rem; border-radius:.375rem;
    border:1px solid hsl(var(--input)); background:transparent;
    font-size:.875rem; font-family:inherit;
    &[type='date']{font-family:inherit;}
  }
`

const Btn = styled.button<{variant?:'primary'|'secondary'}>`
  height:2.75rem; padding:0 1rem; display:inline-flex;
  align-items:center; gap:.35rem; font-size:.875rem; font-weight:500;
  border-radius:.375rem; border:1px solid transparent;
  svg{width:1rem;height:1rem;}
  ${({variant})=> variant==='secondary'
    ?`background:hsl(var(--secondary));
       color:hsl(var(--secondary-foreground));`
    :`background:hsl(var(--primary));
       color:hsl(var(--primary-foreground));`}
  &:disabled{opacity:.6;cursor:not-allowed;}
`

/* Table + List -------------------------------------------------------- */

const TableWrap = styled.div`
  overflow-x:auto; border:1px solid hsl(var(--border)); border-radius:.5rem;
`

const STable = styled.table`
  width:100%; border-collapse:separate; border-spacing:0;
  th,td{padding:.5rem .75rem; font-size:.875rem;}
  th{background:hsl(var(--muted)); text-align:left; font-weight:600;}
  tbody tr:nth-child(odd) td{background:hsl(var(--muted)/.3);}
  code{font-family:monospace;}
`

const LogRow = styled.div`
  display:flex; justify-content:space-between; align-items:center;
  padding:.75rem 1rem; border:1px solid hsl(var(--border));
  border-radius:.5rem; font-size:.875rem;
  &:nth-child(odd){background:hsl(var(--muted)/.3);}
  span:first-child{font-family:monospace; word-break:break-all;}
  span:last-child{color:hsl(var(--muted-foreground)); white-space:nowrap;}
`

/* ───── helper ───── */
/**
 * 오늘 날짜를 YYYY-MM-DD 포맷 문자열로 반환
 */

const todayStr = () => new Date().toISOString().split('T')[0]

/* ───── types ───── */
// 요약 요청 로그 타입
type SummaryLog = { file_id:string; query:string; lang:string; timestamp:string }

// 캐시/벡터 삭제 로그 타입 (file_id|timestamp 문자열)
type DeletionLog = string

/* ───── component ───── */
/**
 * LogsPage
 *
 * State:
 *   date     : 조회할 날짜
 *   active   : 현재 탭 (summary | cacheDel | vecDel)
 *   summary  : 요약 요청 로그
 *   cacheDel : 캐시 삭제 로그
 *   vecDel   : 벡터 삭제 로그
 *   busy     : 로딩 상태
 *
 * Functions:
 *   fetchLogs : 날짜 기준으로 세 가지 로그를 병렬 요청 후 상태 갱신
 *   DeletionList : 삭제 로그 렌더링 헬퍼
 */
export default function LogsPage() {
  const [date, setDate] = useState(todayStr())
  const [active, setActive] = useState<'summary' | 'cacheDel' | 'vecDel'>('summary')

  const [summary, setSummary] = useState<SummaryLog[]>([])
  const [cacheDel, setCacheDel] = useState<DeletionLog[]>([])
  const [vecDel, setVecDel] = useState<DeletionLog[]>([])
  const [busy, setBusy] = useState(false)

  // ───────── 로그 조회 ─────────
  const fetchLogs = async () => {
    if (!date) {
      toast.warning('날짜를 선택해주세요');
      return;
    }
    setBusy(true);

    const logPromise = Promise.allSettled([
      fetchCacheSummaryLog(date),
      fetchCacheDeletionLog(date),
      fetchVectorDeletionLog(date),
    ]).then(([s, c, v]) => {
      // 1. 요약 요청 로그 정렬
      if (s.status === 'fulfilled' && s.value.logs) {
        // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 타입 지정 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
        const sorted = s.value.logs.sort((a: SummaryLog, b: SummaryLog) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setSummary(sorted);
      } else {
        setSummary([]);
      }

      // 2. 캐시 삭제 로그 정렬
      if (c.status === 'fulfilled' && c.value.raw_entries) {
        // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 타입 지정 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
        const sorted = c.value.raw_entries.sort((a: DeletionLog, b: DeletionLog) => {
          const timeA = a.split('|')[1];
          const timeB = b.split('|')[1];
          return new Date(timeB).getTime() - new Date(timeA).getTime();
        });
        setCacheDel(sorted);
      } else {
        setCacheDel([]);
      }

      // 3. 벡터 삭제 로그 정렬
      if (v.status === 'fulfilled' && v.value.raw_entries) {
        // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 타입 지정 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
        const sorted = v.value.raw_entries.sort((a: DeletionLog, b: DeletionLog) => {
          const timeA = a.split('|')[1];
          const timeB = b.split('|')[1];
          return new Date(timeB).getTime() - new Date(timeA).getTime();
        });
        setVecDel(sorted);
      } else {
        setVecDel([]);
      }
    });

    toast.promise(logPromise, {
      loading: '조회 중…',
      success: '완료',
      error: '실패',
    });

    logPromise.finally(() => {
      setBusy(false);
    });
  };

  // 페이지 로드 시 자동 조회
  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* render helpers */
  // 삭제 로그 렌더링 (없으면 안내 메시지 출력)
  const DeletionList = ({data}:{data:DeletionLog[]})=>(
    data.length===0
      ? <p className="text-sm text-muted-foreground p-4">해당 날짜의 로그가 없습니다.</p>
      : <div className="space-y-2">
          {data.map((entry,i)=>{
            const [fid,ts]=entry.split('|')
            return(
              <LogRow key={i}>
                <span>{fid}</span>
                <span>{ts ? new Date(ts).toLocaleString('ko-KR') : '시간 정보 없음'}</span>
              </LogRow>
            )
          })}
        </div>
  )

  // ───────── UI 렌더링 ─────────
  return(
    <Wrapper>
      <Panel>
        <PageHead>
          <h2>📜 로그 관리</h2>
          <p>날짜를 선택하여 시스템 활동 기록을 조회합니다.</p>
        </PageHead>

        <Card>
          <FormLine>
            <Field>
              <label htmlFor="d">조회 날짜</label>
              <input id="d" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
            </Field>
            <Btn onClick={fetchLogs} disabled={busy}>
              <Search/>조회
            </Btn>
            <Btn variant="secondary" onClick={fetchLogs} disabled={busy}>
              <RefreshCw/>새로고침
            </Btn>
          </FormLine>
        </Card>

        {/* 탭 버튼 */}
        <Tabs>
          <TabBtn $active={active==='summary'}   onClick={()=>setActive('summary')}>요약 요청 로그</TabBtn>
          <TabBtn $active={active==='cacheDel'}  onClick={()=>setActive('cacheDel')}>캐시 삭제 로그</TabBtn>
          <TabBtn $active={active==='vecDel'}    onClick={()=>setActive('vecDel')}>벡터 삭제 로그</TabBtn>
        </Tabs>

        {/* 요약 요청 로그 ------------------------------------------------ */}
        {active==='summary' && (
          <Card>
            <h3 className="font-semibold">요약 요청 로그</h3>
            {summary.length===0
              ? <p className="text-sm text-muted-foreground p-4">해당 날짜의 로그가 없습니다.</p>
              : (
                <TableWrap>
                  <STable>
                    <thead>
                      <tr>
                        <th>Timestamp</th><th>File&nbsp;ID</th><th>Query</th><th>Lang</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((log,i)=>(
                        <tr key={i}>
                          <td>{new Date(log.timestamp).toLocaleString('ko-KR')}</td>
                          <td><code>{log.file_id}</code></td>
                          <td>{log.query}</td>
                          <td>{log.lang}</td>
                        </tr>
                      ))}
                    </tbody>
                  </STable>
                </TableWrap>
              )}
          </Card>
        )}

        {/* 캐시 삭제 로그 ----------------------------------------------- */}
        {active==='cacheDel' && (
          <Card>
            <h3 className="font-semibold">캐시 삭제 로그</h3>
            <DeletionList data={cacheDel}/>
          </Card>
        )}

        {/* 벡터 삭제 로그 ---------------------------------------------- */}
        {active==='vecDel' && (
          <Card>
            <h3 className="font-semibold">벡터 삭제 로그</h3>
            <DeletionList data={vecDel}/>
          </Card>
        )}
      </Panel>
    </Wrapper>
  )
}