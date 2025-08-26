
// 📁 src/app/admin/page.tsx
// 관리자 대시보드 메인 페이지.
//
// 설계 포인트
// ===========
// 1) 페이지 마운트 시 `useEffect`와 `Promise.all`을 사용해 벡터 및 캐시 통계 API를 병렬로 호출하여 성능 최적화.
// 2) `recharts` 라이브러리를 활용하여 시스템 현황(벡터 수, 캐시 사용량 등)을 원형 게이지 차트로 시각화.
// 3) styled-components를 사용해 반응형 그리드 레이아웃과 커스텀 차트/카드 UI 구현.
// 4) API 응답 데이터를 `Stats` 인터페이스 형태로 정제하여 상태로 관리.
// 5) 데이터 로딩 중이거나 실패했을 경우를 대비한 UI 상태 처리 (로딩 인디케이터, 에러 처리).
//
// 의존성
// -------
// - recharts: 데이터 시각화 차트 라이브러리
// - @/services/adminApi: 통계 데이터 API 호출 함수

'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import { fetchVectorStats, fetchCacheStats } from '@/services/adminApi';

// ───────────────────────────── 스타일 컴포넌트 ─────────────────────────────

/** 페이지 콘텐츠를 감싸는 메인 컨테이너 */
const Container  = styled.div`max-width:72rem;margin:0 auto;padding:2rem;display:flex;flex-direction:column;gap:3.5rem;`;

/** flex-box 가로 정렬 유틸리티 */
const HStack     = styled.div`display:flex;align-items:center;justify-content:space-between;`;

/** 페이지 주 제목 */
const Title      = styled.h1`font-size:2rem;font-weight:700;`;

/** 부제 텍스트 */
const Sub        = styled.p`color:hsl(var(--muted-foreground));`;

/** 'Last updated' 시간 표시 배지 */
const Badge      = styled.span`border:1px solid hsl(var(--border));border-radius:9999px;padding:.25rem .75rem;font-size:.75rem;`;

/** 반응형 그리드 레이아웃 */
const Grid       = styled.div<{ cols?:number }>`
  display:grid;gap:1rem;
  grid-template-columns:repeat(${p=>p.cols??12},minmax(0,1fr));
  @media(max-width:1023px){grid-template-columns:repeat(6,minmax(0,1fr));}
  @media(max-width:639px){grid-template-columns:repeat(1,minmax(0,1fr));}
`;

/** 공용 카드 UI */
const Card = styled.div`
  background:hsl(var(--card));border:1px solid hsl(var(--border));border-radius:1rem;padding:1.5rem;
  box-shadow:0 1px 3px rgb(0 0 0 / .15);
`;

/** 통계 카드 제목 */
const StatTitle = styled.p`
  font-size:.875rem;
  color:hsl(var(--muted-foreground));
  margin-bottom:.5rem;
`;

/** 통계 카드 값 */
const StatValue = styled.span`
  font-size:clamp(1.25rem,3vw,1.5rem);
  font-weight:700;
  display:inline-block;
  word-break:break-all;
  text-align:center;
`;

/** 통계 값 단위 (e.g., 'items', 'MB') */
const StatUnit = styled.span`
  font-size:.75rem;
  color:hsl(var(--muted-foreground));
  margin-left:.25rem;
  white-space:nowrap;
`;

/** Recharts 게이지 차트를 감싸는 래퍼 */
const GaugeWrap = styled.div`
  position:relative;width:170px;height:170px;margin:0 auto;
  .chart-bg rect{fill:transparent;}
`;

/** 게이지 차트 중앙에 표시될 퍼센트 텍스트 */
const GaugeCenter=styled.div`
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;
`;

/** 게이지 차트 하단의 레이블 (제목, 현재값/최대값) */
const GaugeLabel=styled.div`
  text-align:center;margin-top:.75rem;
  p:first-child{font-size:.875rem;font-weight:500;}
  p:last-child{font-size:.75rem;color:hsl(var(--muted-foreground));}
`;

/** 막대 그래프의 한 행 (정보 + 막대) */
const BarRow=styled.div`display:flex;flex-direction:column;gap:.5rem;`;

/** 막대 그래프의 정보 영역 (레이블, 값) */
const BarInfo=styled.div`display:flex;justify-content:space-between;font-size:.875rem;`;

/** 막대 그래프의 배경 트랙 */
const Track=styled.div`
  position: relative;
  width: 100%;
  height: .625rem;
  border-radius: 9999px;
  background-color: #333; /* 배경색을 더 어둡게 변경 */
  overflow: hidden;
`;

/** 막대 그래프의 채워지는 부분 (값에 따라 너비 변경) */
const Fill = styled.div<{pct: number}>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${p => Math.min(100, Math.max(0, p.pct))}%;
  background-color: white; /* ❗ 바 색상을 흰색으로 변경 */
  border-radius: inherit;
  transition: width 0.5s ease-in-out;
`;

// ───────────────────────────── 데이터 타입 정의 ─────────────────────────────

/** 대시보드에서 사용할 통계 데이터의 구조를 정의하는 인터페이스 */
interface Stats {
  vectorCount: number;  // 총 벡터 수
  vectorSize: number;   // 벡터 DB 디스크 사용량 (MB)
  cacheCount: number;   // 총 캐시 수
  cacheSize: number;    // 캐시 메모리 사용량 (MB)
  cacheMaxSize: number; // 캐시 최대 메모리 (MB)
}

// ───────────────────────────── 페이지 컴포넌트 ─────────────────────────────
/**
 * AdminPage (Dashboard)
 * 시스템의 주요 지표(벡터, 캐시)를 시각화하여 보여주는 관리자 대시보드.
 *
 * @returns {JSX.Element} 대시보드 UI
 */
export default function AdminPage() {
  // ───────────────────────────── 상태 관리 ─────────────────────────────
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // ───────────────────────────── 데이터 로딩 ─────────────────────────────
  useEffect(() => {
    // 페이지 마운트 시 벡터와 캐시 통계를 동시에 비동기적으로 가져옴
    (async () => {
      try {
        const [v, c] = await Promise.all([fetchVectorStats(), fetchCacheStats()]);

        // API 응답을 내부 Stats 형태로 가공하여 상태 업데이트
        setStats({
          vectorCount: v.count ?? 0,
          vectorSize: v.disk_estimate?.disk_usage_mb ?? -1, // -1은 '알 수 없음'을 의미
          cacheCount: c.total_summaries ?? 0,
          cacheSize: c.used_memory_mb ?? 0,
          cacheMaxSize: c.max_memory_mb ?? 0,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        // 에러 발생 시 기본값으로 설정
        setStats({ vectorCount: 0, vectorSize: -1, cacheCount: 0, cacheSize: 0, cacheMaxSize: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []); // 의존성 배열이 비어있어 최초 1회만 실행

  // ───────────────────────────── 렌더링 로직 ─────────────────────────────

  // 로딩 중이거나 stats 데이터가 없으면 로딩 메시지 표시
  if (loading || !stats) return <Container>Loading…</Container>;

  // 차트 계산을 위한 임의의 최대값 설정 (향후 설정 파일 등으로 분리 가능)
  const MAX = { vec: 300, disk: 5000, cache: 300 };
  
  // 게이지 차트 데이터 배열
  const gauges = [
    { label: 'Vectors', val: stats.vectorCount, max: MAX.vec, color: '#4f46e5' },
    { label: 'Caches', val: stats.cacheCount, max: MAX.cache, color: '#22c55e' },
    { label: 'Vector DB (MB)', val: stats.vectorSize, max: MAX.disk, color: '#f59e0b' },
    { label: 'Cache Mem (MB)', val: stats.cacheSize, max: stats.cacheMaxSize, color: '#ef4444' },
  ];

  /**
   * Gauge
   * 단일 원형 게이지 차트를 렌더링하는 재사용 컴포넌트.
   */
  const Gauge = ({ val, max, label, color }: { val: number; max: number; label: string; color: string }) => {
    const isUnknown = val < 0; // 값이 -1이면 'N/A'로 처리
    const pct = isUnknown || max === 0 ? 0 : Math.min(100, Math.max(0, (val / max) * 100));
    const data = [{ value: 100, fill: '#2c2c2c' }, { value: pct, fill: color }];
    
    return (
      <Card style={{ textAlign: 'center' }}>
        {/* ... Gauge JSX ... */}
      </Card>
    );
  };

  return (
    <Container>
      {/* --- 페이지 헤더 --- */}
      <HStack>
        <div>
          <Title>Dashboard</Title>
          <Sub>Overview of key system metrics.</Sub>
        </div>
        <Badge>{new Date().toLocaleTimeString('en-US')}</Badge>
      </HStack>

      {/* --- 주요 통계 카드 --- */}
      <Grid>
        {/* ... 4개의 Stat Card ... */}
      </Grid>

      {/* --- 게이지 차트 --- */}
      <Grid cols={12} style={{ gap: '1.5rem' }}>
        {gauges.map((g, i) => <div key={i} style={{ gridColumn: 'span 3 / span 3', minWidth: 0 }}><Gauge {...g} /></div>)}
      </Grid>

      {/* --- 저장소 사용량 막대 그래프 --- */}
      <Card>
        {/* ... BarRow 컴포넌트 2개 ... */}
      </Card>
    </Container>
  );
}