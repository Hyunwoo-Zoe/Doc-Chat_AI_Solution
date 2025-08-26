
// 📁 src/app/admin/system/page.tsx
// 시스템 데이터 초기화 (Danger Zone) 페이지.
//
// 설계 포인트
// ===========
// 1) 되돌릴 수 없는 위험한 작업(DB 초기화 등)을 모아놓은 UI.
// 2) styled-components를 사용해 '위험' 테마에 맞는 시각적 요소(붉은색) 강조.
// 3) Radix UI의 Alert Dialog를 활용하여 사용자에게 2차 확인을 받음.
// 4) 각 삭제 기능은 재사용 가능한 `DangerAction` 컴포넌트로 분리.
// 5) API 요청 핸들러는 `toast.promise`를 사용해 로딩/성공/실패 상태를 사용자에게 명확히 피드백.
//
// 의존성
// -------
// - @radix-ui/react-alert-dialog: 확인/취소 모달
// - sonner: 토스트 알림
// - lucide-react: 아이콘
// - @/services/adminApi: 실제 API 호출 함수

'use client';

import styled from 'styled-components';
import * as Alert from '@radix-ui/react-alert-dialog';
import { toast } from 'sonner';
import { Trash2, Database, AlertTriangle } from 'lucide-react';
import {
  deleteAllVectors,
  deleteAllCache,
  deleteSystemAll,
} from '@/services/adminApi';

// ───────────────────────────── 스타일 컴포넌트 ─────────────────────────────

/** 페이지 전체를 감싸는 최상위 래퍼 */
const Wrapper = styled.main`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
`;

/** 페이지 콘텐츠를 담는 중앙 패널 */
const Panel = styled.section`
  width: 100%;
  max-width: 64rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

/** 페이지 상단의 제목과 설명을 담는 헤더 */
const PageHead = styled.header`
  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  p {
    color: hsl(var(--muted-foreground));
    margin-top: .5rem;
  }
`;

/** 위험 구역 전체를 시각적으로 구분하는 섹션 */
const DangerZoneSection = styled.section`
  border: 2px solid hsl(var(--destructive) / 0.2);
  border-radius: 1rem;
  padding: 2rem;
  background: hsl(var(--destructive) / 0.02);
`;

/** Danger Zone 내부의 헤더 (제목, 설명) */
const DangerZoneHeader = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid hsl(var(--destructive) / 0.1);
  
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: hsl(var(--destructive));
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 0.875rem;
    color: hsl(var(--muted-foreground));
  }
`;

/** 개별 위험 작업을 나열하는 그리드 레이아웃 */
const ActionsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

/** 각 위험 작업을 나타내는 카드 UI */
const ActionCard = styled.div`
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: hsl(var(--destructive) / 0.3);
    box-shadow: 0 4px 12px hsl(var(--destructive) / 0.1);
  }
`;

/** 작업 카드의 아이콘 래퍼 */
const ActionIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background: hsl(var(--destructive) / 0.1);
  color: hsl(var(--destructive));
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

/** 작업 카드의 제목과 설명을 담는 콘텐츠 영역 */
const ActionContent = styled.div`
  flex: 1;
  
  h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  p {
    font-size: 0.875rem;
    color: hsl(var(--muted-foreground));
    line-height: 1.5;
  }
`;

/** 작업을 트리거하는 버튼 */
const ActionButton = styled.button`
  width: 100%;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  border: none;
  background: hsl(var(--destructive) / 0.1);
  color: hsl(var(--destructive));
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: hsl(var(--destructive));
    color: hsl(var(--destructive-foreground));
    transform: translateY(-1px);
    box-shadow: 0 4px 12px hsl(var(--destructive) / 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// ───────────────────────────── Alert Dialog 스타일 ──────────────────────────

/** Radix Alert Dialog의 배경 오버레이 */
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

/** Radix Alert Dialog의 콘텐츠 영역 (모달창) */
const AlertContent = styled(Alert.Content)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: 28rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
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

/** Alert Dialog 내의 확인/취소 버튼 */
const DialogBtn = styled.button<{variant?: 'cancel' | 'danger'}>`
  height: 2.5rem;
  padding: 0 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ variant }) => {
    switch (variant) {
      case 'cancel': return `
        background: hsl(var(--muted));
        color: hsl(var(--muted-foreground));
        
        &:hover {
          background: hsl(var(--muted) / 0.8);
        }
      `;
      case 'danger': return `
        background: hsl(var(--destructive));
        color: hsl(var(--destructive-foreground));
        
        &:hover {
          background: hsl(var(--destructive) / 0.9);
          box-shadow: 0 4px 12px hsl(var(--destructive) / 0.3);
        }
      `;
      default: return '';
    }
  }}
`;

// ───────────────────────────── 하위 컴포넌트 ─────────────────────────────

interface DangerActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onConfirm: () => void;
}

/**
 * DangerAction
 * 위험한 작업을 수행하는 카드 UI와 확인 모달을 캡슐화한 재사용 컴포넌트.
 *
 * @param {DangerActionProps} props - 아이콘, 제목, 설명, 버튼 텍스트, 확인 시 실행할 콜백 함수
 * @returns {JSX.Element} 위험 작업 카드 UI
 */

function DangerAction({ icon, title, description, buttonText, onConfirm }: DangerActionProps) {
  return (
    <ActionCard>
      <ActionIcon>{icon}</ActionIcon>
      <ActionContent>
        <h4>{title}</h4>
        <p>{description}</p>
      </ActionContent>
      <Alert.Root>
        <Alert.Trigger asChild>
          <ActionButton>
            <Trash2 size={16} />
            {buttonText}
          </ActionButton>
        </Alert.Trigger>
        <Alert.Portal>
          <AlertOverlay />
          <AlertContent>
            <Alert.Title asChild>
              <h2>
                <AlertTriangle size={20} />
                정말로 실행하시겠습니까?
              </h2>
            </Alert.Title>
            <Alert.Description asChild>
              <p>
                <strong>{title}</strong>을(를) 진행합니다.<br />
                {description}<br />
                <strong>이 작업은 되돌릴 수 없습니다.</strong>
              </p>
            </Alert.Description>
            <footer>
              <Alert.Cancel asChild>
                <DialogBtn variant="cancel">취소</DialogBtn>
              </Alert.Cancel>
              <Alert.Action asChild>
                <DialogBtn variant="danger" onClick={onConfirm}>확인</DialogBtn>
              </Alert.Action>
            </footer>
          </AlertContent>
        </Alert.Portal>
      </Alert.Root>
    </ActionCard>
  );
}

// ───────────────────────────── 페이지 컴포넌트 ─────────────────────────────
/**
 * SystemDangerPage
 * 시스템의 모든 데이터를 초기화하는 위험 작업을 모아놓은 페이지.
 *
 * @returns {JSX.Element} 시스템 초기화 페이지 UI
 */

export default function SystemDangerPage() {
  const handleAllVectorDelete = () => {
    const promise = deleteAllVectors().then(res => `총 ${res.deleted_count}개의 벡터를 삭제했습니다.`);
    toast.promise(promise, {
      loading: '모든 벡터 삭제 중...',
      success: (message) => message,
      error: '벡터 전체 삭제에 실패했습니다.',
    });
  };

  /** 캐시 DB의 모든 데이터를 삭제하는 API를 호출하는 핸들러 */
  const handleAllCacheDelete = () => {
    const promise = deleteAllCache().then(res => `총 ${res.deleted_count}개의 캐시를 삭제했습니다.`);
    toast.promise(promise, {
      loading: '모든 캐시 삭제 중...',
      success: (message) => message,
      error: '캐시 전체 삭제에 실패했습니다.',
    });
  };

  /** 시스템의 모든 데이터(벡터, 캐시 등)를 삭제하는 API를 호출하는 핸들러 */
  const handleSystemReset = () => {
    const promise = deleteSystemAll().then(res => `시스템의 모든 데이터를 초기화했습니다.`);
    toast.promise(promise, {
      loading: '시스템 전체 초기화 중...',
      success: (message) => message,
      error: '시스템 초기화에 실패했습니다.',
    });
  };

  // ───────────────────────────── 렌더링 로직 ─────────────────────────────
  return (
    <Wrapper>
      <Panel>
        <PageHead>
          <h2>시스템 초기화</h2>
          <p>
            시스템 데이터를 영구적으로 삭제합니다. 각별한 주의가 필요합니다.
          </p>
        </PageHead>

        <DangerZoneSection>
          <DangerZoneHeader>
            <h3>
              <AlertTriangle size={24} />
              Danger Zone
            </h3>
            <p>
              아래 작업들은 복구가 불가능하며, 시스템에 심각한 영향을 줄 수 있습니다.
            </p>
          </DangerZoneHeader>

          <ActionsGrid>
            <DangerAction
              icon={<Database />}
              title="벡터 전체 삭제"
              description="ChromaDB에 저장된 모든 벡터 데이터를 영구적으로 삭제합니다."
              buttonText="벡터 삭제"
              onConfirm={handleAllVectorDelete}
            />
            <DangerAction
              icon={<Database />}
              title="캐시 전체 삭제"
              description="Redis에 저장된 모든 요약본과 메타데이터를 영구적으로 삭제합니다."
              buttonText="캐시 삭제"
              onConfirm={handleAllCacheDelete}
            />
            <DangerAction
              icon={<AlertTriangle />}
              title="시스템 전체 초기화"
              description="벡터와 캐시를 포함한 모든 데이터를 영구적으로 삭제합니다."
              buttonText="전체 초기화"
              onConfirm={handleSystemReset}
            />
          </ActionsGrid>
        </DangerZoneSection>
      </Panel>
    </Wrapper>
  );
}