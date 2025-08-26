# Admin Control Center

AI 요약 서비스의 백엔드 시스템(벡터 DB, 캐시, 로그 등)을 관리하고 모니터링하기 위한 웹 애플리케이션입니다.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| **📊 대시보드** | 시스템의 핵심 지표(벡터/캐시 수, DB 사용량)를 시각화하여 제공 |
| **💾 벡터 관리** | ChromaDB에 저장된 벡터 데이터를 조회, 검색, 삭제하고 미사용 벡터 정리 |
| **⚡ 캐시 관리** | Redis에 저장된 요약 캐시 데이터를 조회하고 관리 |
| **📝 로그 관리** | 주요 작업(삭제, 요약 등)에 대한 로그를 날짜별로 조회하고 관리 |
| **🧪 요약 테스트** | PDF URL과 질문을 직접 입력하여 AI 요약 API의 동작 테스트 |
| **⚠️ 시스템 초기화** | DB의 모든 데이터를 초기화하는 위험 작업을 안전한 절차를 통해 실행 |

---

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript |
| **Styling** | styled-components |
| **UI Components** | Radix UI (기반), Lucide React (아이콘) |
| **Data Visualization** | Recharts |
| **Notifications** | Sonner (Toast) |
| **State Management** | React Hooks (useState, useEffect) |
| **Linting/Formatting** | ESLint, Prettier |

---

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── admin/
│   │   ├── (pages)/             # 로그인/회원가입을 제외한 모든 관리 페이지
│   │   │   ├── page.tsx         # 대시보드 페이지
│   │   │   ├── cache/           # 캐시 관리 페이지
│   │   │   ├── logs/            # 로그 관리 페이지
│   │   │   ├── system/          # 시스템 초기화 페이지
│   │   │   ├── test-summarize/  # 요약 테스트 페이지
│   │   │   └── vector/          # 벡터 관리 페이지
│   │   ├── login/               # 로그인 페이지
│   │   ├── signup/              # 회원가입 페이지
│   │   ├── AdminNav.tsx         # 관리자용 사이드바 네비게이션
│   │   └── layout.tsx           # 관리자 페이지 공통 레이아웃 (반응형 사이드바 포함)
│   └── page.tsx                 # 메인 랜딩 페이지
├── components/
│   ├── ui/                      # 버튼, 카드 등 재사용 가능한 기본 UI 컴포넌트
│   ├── ThemeToggle.tsx          # 다크/라이트 모드 토글 버튼
│   └── UserNav.tsx              # 사용자 프로필 및 로그아웃 드롭다운
├── services/
│   └── adminApi.ts              # 모든 백엔드 API 요청 함수 모듈
└── lib/
    └── utils.ts                 # 공통 유틸리티 함수 (cn 등)
```

---

## ⚙️ 시작하기

### 1. 사전 요구사항
- Node.js (v18.17.0 이상 권장)
- npm, yarn, or pnpm

### 2. 프로젝트 설치

저장소를 클론하고 의존성을 설치합니다.

```bash
git clone [저장소 URL]
cd [프로젝트 디렉토리]
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고, 아래 내용을 복사하여 자신의 환경에 맞게 수정합니다.

```env
# .env.local

# 관리자 API 서버 주소
NEXT_PUBLIC_ADMIN_API_URL=http://127.0.0.1:8001

# 서비스 API 서버 주소 (요약 테스트용)
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

# [개발용] 백엔드 인증을 우회하기 위한 임시 토큰
# adminApi.ts에서 approxy_permit 쿠키가 없을 경우 이 값을 사용합니다.
NEXT_PUBLIC_APPROXY_PERMIT="your-temporary-auth-token"
```

### 4. 개발 서버 실행

아래 명령어를 실행하여 개발 서버를 시작합니다.

```bash
npm run dev
```

서버가 시작되면 브라우저에서 http://localhost:3000으로 접속하여 결과를 확인합니다.

---

## 📜 주요 설계 결정

### 1. Styling 방식
- **styled-components** 채택: Tailwind CSS 대신 CSS-in-JS 방식으로 컴포넌트 단위 스타일링 구현
- CSS 변수 활용: `hsl(var(--...))` 형태로 `src/app/globals.css`에 정의된 값을 공유하여 일관성 유지

### 2. Conditional Layout
- `src/app/admin/layout.tsx`에서 `usePathname`을 사용하여 현재 경로 확인
- 로그인/회원가입 페이지: 사이드바가 없는 별도 레이아웃
- 그 외 관리자 페이지: 반응형 사이드바가 포함된 공통 레이아웃

### 3. API Abstraction
- 모든 백엔드 통신은 `src/services/adminApi.ts` 파일에 중앙 집중화
- 인증 헤더 추가 등의 공통 작업을 일관되게 처리

### 4. State Management
- 전역 상태 관리 라이브러리(Redux, Zustand 등) 대신 React 기본 훅 사용
- 각 페이지의 상태를 지역적으로 관리하여 더 가볍고 직관적인 접근

---

## 🔄 Admin API와의 연동

Admin Control Center는 UCWARE Admin API(FastAPI:8001)와 통신하여 모든 기능을 구현합니다.

### 주요 연동 기능

| 페이지 | API 엔드포인트 | 기능 |
|--------|---------------|------|
| 대시보드 | `/vector/statistics`, `/cache/statistics` | 실시간 통계 표시 |
| 벡터 관리 | `/vector/*` | 벡터 조회/삭제/정리 |
| 캐시 관리 | `/cache/*` | 캐시 데이터 관리 |
| 로그 관리 | `/*/deletion-log`, `/cache/request-log` | 작업 로그 조회 |
| 요약 테스트 | 서비스 API `/summarize` | PDF 요약 기능 테스트 |
| 시스템 초기화 | `/system/all` | 전체 데이터 초기화 |

---

## 📊 페이지별 기능 상세

### 대시보드 (`/admin`)
- 총 벡터 수, 캐시 항목 수 표시
- 디스크 사용량 시각화 (차트)
- 최근 활동 로그 요약

### 벡터 관리 (`/admin/vector`)
- 벡터 ID로 검색 및 조회
- 날짜별 벡터 필터링
- 미사용 벡터 일괄 정리
- 개별/전체 벡터 삭제

### 캐시 관리 (`/admin/cache`)
- 캐시된 요약 내용 조회
- 메타데이터 확인
- TTL 기반 자동 정리
- 캐시 항목 개별 삭제

### 로그 관리 (`/admin/logs`)
- 날짜별 로그 조회
- 삭제 작업 로그
- 요약 요청 로그
- 로그 데이터 내보내기

### 시스템 초기화 (`/admin/system`)
- 2단계 확인 절차
- 안전 잠금 기능
- 초기화 진행 상태 표시
- 롤백 불가능 경고

---

## 🌐 배포

### Vercel 배포 (권장)
이 Next.js 앱을 가장 쉽게 배포하는 방법은 Vercel 플랫폼을 사용하는 것입니다.

1. Vercel 계정 생성 및 로그인
2. GitHub 저장소 연결
3. 환경 변수 설정 (`.env.local` 내용을 Vercel 대시보드에 입력)
4. Deploy 버튼 클릭

자세한 내용은 [Next.js deployment documentation](https://nextjs.org/docs/deployment)을 참고하세요.

### 자체 서버 배포
```bash
# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm run start
```

---

## 🔒 보안 고려사항

1. **인증/인가**: 모든 관리자 기능은 적절한 인증을 거쳐야 합니다
2. **API 키 관리**: 환경 변수는 절대 코드에 하드코딩하지 않습니다
3. **CORS 설정**: Admin API와의 통신을 위해 적절한 CORS 설정이 필요합니다
4. **시스템 초기화**: 위험한 작업은 다단계 확인 절차를 거칩니다

---

## 🤝 인수인계 체크리스트

### 필수 확인사항
- [ ] Node.js 버전 확인 (v18.17.0+)
- [ ] `.env.local` 파일 생성 및 설정
- [ ] Admin API 서버 실행 상태 확인
- [ ] 개발 서버 정상 작동 확인
- [ ] 각 페이지 접근 및 기능 테스트

### 권장사항
- [ ] styled-components 사용법 숙지
- [ ] Next.js App Router 구조 이해
- [ ] adminApi.ts 함수 구조 파악
- [ ] 반응형 디자인 테스트

---

## 📚 추가 리소스

- [Next.js Documentation](https://nextjs.org/docs)
- [styled-components Documentation](https://styled-components.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [Recharts Documentation](https://recharts.org/en-US/)

---

## 🐛 문제 해결

### 일반적인 문제들

**API 연결 실패**
- Admin API 서버 실행 상태 확인
- `.env.local`의 API URL 설정 확인
- CORS 설정 확인

**스타일 깨짐**
- `globals.css`의 CSS 변수 정의 확인
- styled-components 설치 확인

**빌드 오류**
- Node.js 버전 확인
- `node_modules` 삭제 후 재설치
- TypeScript 타입 오류 확인