# Admin Control Center
AI 요약 서비스의 백엔드 시스템(벡터 DB, 캐시, 로그 등)을 관리하고 모니터링하기 위한 웹 애플리케이션입니다.

✨ 주요 기능 (Key Features)
📊 대시보드: 시스템의 핵심 지표(벡터/캐시 수, DB 사용량)를 시각화하여 제공합니다.

💾 벡터 관리: ChromaDB에 저장된 벡터 데이터를 조회, 검색, 삭제하고 미사용 벡터를 정리합니다.

⚡ 캐시 관리: Redis에 저장된 요약 캐시 데이터를 조회하고 관리합니다.

📝 로그 관리: 주요 작업(삭제, 요약 등)에 대한 로그를 날짜별로 조회하고 관리합니다.

🧪 요약 테스트: PDF URL과 질문을 직접 입력하여 AI 요약 API의 동작을 테스트합니다.

⚠️ 시스템 초기화: DB의 모든 데이터를 초기화하는 위험 작업을 안전한 절차를 통해 실행합니다.

🛠️ 기술 스택 (Tech Stack)
구분	기술
Framework	Next.js 14+ (App Router)
Language	TypeScript
Styling	styled-components
UI Components	Radix UI (기반), Lucide React (아이콘)
Data Visualization	Recharts
Notifications	Sonner (Toast)
State Management	React Hooks (useState, useEffect)
Linting/Formatting	ESLint, Prettier
📁 프로젝트 구조 (Project Structure)
src
├── app
│   ├── admin
│   │   ├── (pages)         # 로그인/회원가입을 제외한 모든 관리 페이지
│   │   │   ├── page.tsx    # 대시보드 페이지
│   │   │   ├── cache       # 캐시 관리 페이지
│   │   │   ├── logs        # 로그 관리 페이지
│   │   │   ├── system      # 시스템 초기화 페이지
│   │   │   ├── test-summarize # 요약 테스트 페이지
│   │   │   └── vector      # 벡터 관리 페이지
│   │   ├── login           # 로그인 페이지
│   │   ├── signup          # 회원가입 페이지
│   │   ├── AdminNav.tsx    # 관리자용 사이드바 네비게이션
│   │   └── layout.tsx      # 관리자 페이지 공통 레이아웃 (반응형 사이드바 포함)
│   └── page.tsx            # 메인 랜딩 페이지
├── components
│   ├── ui                  # 버튼, 카드 등 재사용 가능한 기본 UI 컴포넌트
│   ├── ThemeToggle.tsx     # 다크/라이트 모드 토글 버튼
│   └── UserNav.tsx         # 사용자 프로필 및 로그아웃 드롭다운
├── services
│   └── adminApi.ts         # 모든 백엔드 API 요청 함수 모듈
└── lib
    └── utils.ts            # 공통 유틸리티 함수 (cn 등)
    
⚙️ 시작하기 (Getting Started)
1. 사전 요구사항
Node.js (v18.17.0 이상 권장)

npm, yarn, or pnpm

2. 프로젝트 설치
저장소를 클론하고 의존성을 설치합니다.

Bash

git clone [저장소 URL]
cd [프로젝트 디렉토리]
npm install
3. 환경 변수 설정
프로젝트 루트에 .env.local 파일을 생성하고, 아래 내용을 복사하여 자신의 환경에 맞게 수정합니다.

코드 스니펫

# .env.local

# 관리자 API 서버 주소
NEXT_PUBLIC_ADMIN_API_URL=http://127.0.0.1:8001

# 서비스 API 서버 주소 (요약 테스트용)
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

# [개발용] 백엔드 인증을 우회하기 위한 임시 토큰
# adminApi.ts에서 approxy_permit 쿠키가 없을 경우 이 값을 사용합니다.
NEXT_PUBLIC_APPROXY_PERMIT="your-temporary-auth-token"
4. 개발 서버 실행
아래 명령어를 실행하여 개발 서버를 시작합니다.

Bash

npm run dev
서버가 시작되면 브라우저에서 http://localhost:3000으로 접속하여 결과를 확인합니다.

📜 주요 설계 결정 (Key Design Decisions)
Styling: Tailwind CSS 대신 styled-components를 주 스타일링 방식으로 채택하여 컴포넌트 단위의 CSS-in-JS 스타일링을 구현했습니다. CSS 변수(hsl(var(--...)))는 src/app/globals.css에 정의된 값을 공유하여 일관성을 유지합니다.

Conditional Layout: src/app/admin/layout.tsx에서 usePathname을 사용하여 현재 경로를 확인합니다. 로그인/회원가입 페이지에서는 사이드바가 없는 별도의 레이아웃을, 그 외 모든 관리자 페이지에서는 반응형 사이드바가 포함된 공통 레이아웃을 렌더링합니다.

API Abstraction: 모든 백엔드 통신은 src/services/adminApi.ts 파일에 정의된 함수를 통해 이루어집니다. 이를 통해 API 요청 로직을 중앙에서 관리하고, 인증 헤더 추가 등의 공통 작업을 일관되게 처리합니다.

State Management: 전역 상태 관리 라이브러리(Redux, Zustand 등) 대신 React 기본 훅(useState, useEffect)을 사용하여 각 페이지의 상태를 지역적으로 관리합니다. 이는 애플리케이션의 복잡도가 높지 않아 더 가볍고 직관적인 접근 방식이라 판단했기 때문입니다.

🌐 배포 (Deploy on Vercel)
이 Next.js 앱을 가장 쉽게 배포하는 방법은 Vercel 플랫폼을 사용하는 것입니다.
자세한 내용은 Next.js deployment documentation을 참고하세요.