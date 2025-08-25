// 📁 src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import { fetchVectorStats, fetchCacheStats } from '@/services/adminApi';

/* ───────── 공통 styled ───────── */
const Container  = styled.div`max-width:72rem;margin:0 auto;padding:2rem;display:flex;flex-direction:column;gap:3.5rem;`;
const HStack     = styled.div`display:flex;align-items:center;justify-content:space-between;`;
const Title      = styled.h1`font-size:2rem;font-weight:700;`;
const Sub        = styled.p`color:hsl(var(--muted-foreground));`;
const Badge      = styled.span`border:1px solid hsl(var(--border));border-radius:9999px;padding:.25rem .75rem;font-size:.75rem;`;
const Grid       = styled.div<{ cols?:number }>`
  display:grid;gap:1rem;
  grid-template-columns:repeat(${p=>p.cols??12},minmax(0,1fr));
  @media(max-width:1023px){grid-template-columns:repeat(6,minmax(0,1fr));}
  @media(max-width:639px){grid-template-columns:repeat(1,minmax(0,1fr));}
`;
const Card = styled.div`
  background:hsl(var(--card));border:1px solid hsl(var(--border));border-radius:1rem;padding:1.5rem;
  box-shadow:0 1px 3px rgb(0 0 0 / .15);
`;
const StatTitle = styled.p`
  font-size:.875rem;
  color:hsl(var(--muted-foreground));
  margin-bottom:.5rem;
`;
const StatValue = styled.span`
  font-size:clamp(1.25rem,3vw,1.5rem);
  font-weight:700;
  display:inline-block;
  word-break:break-all;
  text-align:center;
`;
const StatUnit = styled.span`
  font-size:.75rem;
  color:hsl(var(--muted-foreground));
  margin-left:.25rem;
  white-space:nowrap;
`;
const GaugeWrap = styled.div`
  position:relative;width:170px;height:170px;margin:0 auto;
  .chart-bg rect{fill:transparent;}
`;
const GaugeCenter=styled.div`
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;
`;
const GaugeLabel=styled.div`
  text-align:center;margin-top:.75rem;
  p:first-child{font-size:.875rem;font-weight:500;}
  p:last-child{font-size:.75rem;color:hsl(var(--muted-foreground));}
`;
const BarRow=styled.div`display:flex;flex-direction:column;gap:.5rem;`;
const BarInfo=styled.div`display:flex;justify-content:space-between;font-size:.875rem;`;

// ❗ [수정] 바(Bar) 컴포넌트 스타일 수정
const Track=styled.div`
  position: relative;
  width: 100%;
  height: .625rem;
  border-radius: 9999px;
  background-color: #333; /* 배경색을 더 어둡게 변경 */
  overflow: hidden;
`;

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

/* ───────── 데이터 타입 ───────── */
interface Stats {
  vectorCount: number;
  vectorSize: number;
  cacheCount: number;
  cacheSize: number;
  cacheMaxSize: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [v, c] = await Promise.all([fetchVectorStats(), fetchCacheStats()]);

        setStats({
          vectorCount: v.count ?? 0,
          vectorSize: v.disk_estimate?.disk_usage_mb ?? -1,
          cacheCount: c.total_summaries ?? 0,
          cacheSize: c.used_memory_mb ?? 0,
          cacheMaxSize: c.max_memory_mb ?? 0,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setStats({ vectorCount: 0, vectorSize: -1, cacheCount: 0, cacheSize: 0, cacheMaxSize: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) return <Container>Loading…</Container>;

  const MAX = { vec: 300, disk: 5000, cache: 300 };
  
  const gauges = [
    { label: 'Vectors', val: stats.vectorCount, max: MAX.vec, color: '#4f46e5' },
    { label: 'Caches', val: stats.cacheCount, max: MAX.cache, color: '#22c55e' },
    { label: 'Vector DB (MB)', val: stats.vectorSize, max: MAX.disk, color: '#f59e0b' },
    { label: 'Cache Mem (MB)', val: stats.cacheSize, max: stats.cacheMaxSize, color: '#ef4444' },
  ];

  const Gauge = ({ val, max, label, color }: { val: number; max: number; label: string; color: string }) => {
    const isUnknown = val < 0;
    const pct = isUnknown || max === 0 ? 0 : Math.min(100, Math.max(0, (val / max) * 100));
    const data = [{ value: 100, fill: '#2c2c2c' }, { value: pct, fill: color }];
    
    return (
      <Card style={{ textAlign: 'center' }}>
        <GaugeWrap>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart data={data} innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={50} />
            </RadialBarChart>
          </ResponsiveContainer>
          <GaugeCenter>{isUnknown ? 'N/A' : `${Math.round(pct)}%`}</GaugeCenter>
        </GaugeWrap>
        <GaugeLabel>
          <p>{label}</p>
          <p>
            {isUnknown ? 'N/A' : val.toLocaleString(undefined, { maximumFractionDigits: 2 })} / 
            {max > 0 ? max.toLocaleString() : '∞'}
          </p>
        </GaugeLabel>
      </Card>
    );
  };

  return (
    <Container>
      <HStack>
        <div>
          <Title>Dashboard</Title>
          <Sub>Overview of key system metrics.</Sub>
        </div>
        <Badge>{new Date().toLocaleTimeString('en-US')}</Badge>
      </HStack>

      <Grid>
        <Card style={{ gridColumn: 'span 3 / span 3' }}>
            <StatTitle>Total Vectors</StatTitle>
            <StatValue>{stats.vectorCount.toLocaleString()}</StatValue>
            <StatUnit>items</StatUnit>
        </Card>
        <Card style={{ gridColumn: 'span 3 / span 3' }}>
            <StatTitle>Vector DB Size</StatTitle>
            {stats.vectorSize < 0 ? (
                <StatValue>N/A</StatValue>
            ) : (
                <>
                <StatValue>{stats.vectorSize.toFixed(2)}</StatValue>
                <StatUnit>MB</StatUnit>
                </>
            )}
        </Card>
        <Card style={{ gridColumn: 'span 3 / span 3' }}>
            <StatTitle>Total Caches</StatTitle>
            <StatValue>{stats.cacheCount.toLocaleString()}</StatValue>
            <StatUnit>items</StatUnit>
        </Card>
        <Card style={{ gridColumn: 'span 3 / span 3' }}>
            <StatTitle>Cache Memory</StatTitle>
            <StatValue>{stats.cacheSize.toFixed(2)}</StatValue>
            <StatUnit>MB</StatUnit>
        </Card>
      </Grid>

      <Grid cols={12} style={{ gap: '1.5rem' }}>
        {gauges.map((g, i) => <div key={i} style={{ gridColumn: 'span 3 / span 3', minWidth: 0 }}><Gauge {...g} /></div>)}
      </Grid>

      <Card>
        <StatTitle style={{ marginBottom: '.5rem' }}>Storage Usage</StatTitle>
        <Sub>Disk / memory utilisation details.</Sub>
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <BarRow>
            <BarInfo>
              <span>Vector DB</span>
              <span>
                {stats.vectorSize < 0 ? 'N/A' : `${stats.vectorSize.toFixed(1)} / ${MAX.disk} MB`}
              </span>
            </BarInfo>
            <Track>
              <Fill pct={stats.vectorSize < 0 ? 0 : (stats.vectorSize / MAX.disk) * 100} />
            </Track>
          </BarRow>
          <BarRow>
            <BarInfo>
              <span>Cache Memory</span>
              <span>
                {stats.cacheSize.toFixed(1)} / {stats.cacheMaxSize > 0 ? `${stats.cacheMaxSize} MB` : '∞'}
              </span>
            </BarInfo>
            <Track>
              <Fill pct={stats.cacheMaxSize > 0 ? (stats.cacheSize / stats.cacheMaxSize) * 100 : 0} />
            </Track>
          </BarRow>
        </div>
      </Card>
    </Container>
  );
}
