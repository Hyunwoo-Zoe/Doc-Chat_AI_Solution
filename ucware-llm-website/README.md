<!-- 📄 상단: PDF 요약 홈 화면 -->
<p align="center">
  <img src="https://github.com/CODEHakR1234/ucware-llm-website/raw/main/public/images/home_summary.jpeg" 
       alt="홈 요약 화면" 
       width="100%" />
</p>

<p align="center">
  <em>홈페이지에서 PDF 요약 입력 화면</em>
</p>

<br/>

<!-- 💬 하단: 질문/응답 + 평가 모달 -->
<p align="center">
  <img src="https://github.com/CODEHakR1234/ucware-llm-website/raw/main/public/images/followup_result.jpeg" 
       alt="질문 응답 화면" 
       width="49%" />
  <img src="https://github.com/CODEHakR1234/ucware-llm-website/raw/main/public/images/feedback_modal.jpeg" 
       alt="평가 모달 화면" 
       width="49%" />
</p>

<p align="center">
  <em>
    왼쪽: 요약 결과 및 질문/응답 화면 &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; 오른쪽: 사용자 별점 및 평가 모달
  </em>
</p>

# 📄 PDF Genie – 대용량 PDF 요약 및 질의응답 프론트엔드

**PDF Genie**는 긴 PDF 문서(예: 연구 논문, 기술 보고서 등)를 몇 초 만에 요약하고, 사용자가 해당 내용에 대해 **추가 질문**을 할 수 있도록 도와주는 웹 애플리케이션입니다. 이 앱은 백엔드에 구현된 **딥러닝 기반 RAG 파이프라인(Retrieval-Augmented Generation)**을 활용하여, 대화형 Q&A 인터페이스를 제공합니다.

이 프론트엔드는 **Next.js**로 구축되어 있으며, 현대적인 UI 컴포넌트를 통해 부드럽고 직관적인 사용자 경험을 제공합니다.

---

## ✨ 주요 기능

- **빠른 PDF 요약**: arXiv 논문 링크 등 PDF URL을 입력하면, 전체 문서를 짧고 간결하게 요약해줍니다. 시스템은 PDF를 여러 조각으로 분할하여 처리함으로써 일반적인 토큰 제한을 넘는 문서도 요약할 수 있습니다.
- **대화형 질의응답**: 요약을 읽은 후, 문서 내용에 대한 추가 질문을 할 수 있습니다. 앱은 백엔드 Q&A 엔진을 사용해 관련된 문서 조각을 검색하고, 질문에 대한 정확한 응답을 생성합니다.
- **다국어 지원**: 요약 및 답변 언어로 **한국어**와 **영어**를 선택할 수 있어, 이중 언어나 현지화 서비스에도 적합합니다.
- **사용자 피드백 수집**: 요약 결과에 대해 1~5점의 별점을 주고, 선택적으로 의견을 남길 수 있습니다. 이 피드백은 API를 통해 Redis 캐시에 저장되며, 향후 모델 성능 개선에 활용됩니다.
- **현대적인 UI/UX**: Tailwind CSS를 통한 반응형 디자인, 다크 모드 지원, Framer Motion 기반 애니메이션, Lucide 아이콘을 통해 깔끔하고 일관된 UI를 제공합니다.

---

## 🧱 아키텍처 및 기술 스택

### 프론트엔드

이 저장소는 **Next.js 13**을 기반으로 하며, React + TypeScript로 구성되어 있습니다. 구조는 `src/app` 디렉토리 중심의 App Router 방식으로, 기능별 컴포넌트로 모듈화되어 있습니다.

- **Next.js & React**: 서버 컴포넌트와 클라이언트 컴포넌트를 혼용하며(`'use client'`), 성능과 상호작용성 균형을 유지합니다.
- **Tailwind CSS**: `globals.css`에서 설정되며, 유틸리티 클래스 기반으로 빠른 UI 개발을 지원합니다. `dark:` 클래스로 다크 모드 구현도 용이합니다.
- **Lucide Icons**: `lucide-react` 패키지를 사용해, sparkles ✨, GitHub, 파일, 말풍선, 별 아이콘 등 다양한 요소를 시각적으로 표현합니다.
- **Framer Motion**: UI에 부드러운 애니메이션을 적용합니다. `AnimatePresence`와 `motion` 컴포넌트를 사용하여, Q&A 카드와 피드백 모달의 자연스러운 전환을 구현합니다.
- **상태 관리**: `useState`, `useRef`, `useCallback` 등의 React 훅을 활용하여 요약 단계, 질문 응답 상태, 오류 메시지, 입력값 등을 관리합니다.
- **환경 변수 설정**: 백엔드 API 호출 경로는 `NEXT_PUBLIC_API_URL` 환경 변수로 설정 가능하며, 기본값은 `http://localhost:8000`입니다.

### 백엔드 (별도 제공)

이 프론트엔드는 별도로 구축된 **요약 API**와 통신합니다. 해당 API는 다음과 같은 구조를 가집니다.

- **RAG 파이프라인 기반**: PDF를 텍스트로 추출하고 조각으로 나눈 뒤, 임베딩(embedding)을 통해 벡터 인덱스를 생성합니다. 이후 대형 언어 모델(LLM)을 사용해 요약 또는 질문에 응답합니다. 이를 통해 정확성을 높이고, LLM의 토큰 한계를 극복합니다.
- **현재 구현**: 내부 VM 서버에서 OpenAI의 GPT API를 활용 중입니다. 요청이 들어오면 캐시된 결과를 사용하거나, 새로운 요약을 생성하여 반환합니다. 추가 질문의 경우, 벡터 인덱스를 활용하여 관련 내용을 찾고 응답을 생성합니다.
- **향후 업그레이드 (vLLM)**: 오픈소스 고속 LLM 추론 엔진인 **vLLM**을 KT Cloud 서버에 도입할 예정입니다. 이는 OpenAI API와 호환되며, GPU 자원을 효율적으로 사용해 응답 속도를 높이고 비용을 줄일 수 있습니다.
- **캐싱 및 파일 ID 관리**: 프론트는 PDF URL 기반으로 고유한 `fid_{해시}_{파일명}` 형태의 ID를 생성합니다. 백엔드는 이 `file_id`를 사용하여 요약 결과 및 인덱스를 저장/재사용합니다.
- **피드백 엔드포인트**: `/api/feedback`으로 {file_id, pdf_url, lang, rating, comment, usage_log}를 전송하면, Redis 등에 저장됩니다. `usage_log`는 Q&A 히스토리를 포함할 수 있습니다.

---

## 🚀 시작하기

로컬에서 PDF Genie 프론트엔드를 실행하는 방법:

### ✅ 필수 조건

- Node.js 18 이상
- npm 또는 Yarn

### 📦 저장소 클론

```bash
git clone https://github.com/CODEHakR1234/ucware-llm-website.git
cd ucware-llm-website
```

### 📚 의존성 설치

```bash
npm install
# 또는
yarn install
```

### ⚙️ 환경 변수 설정

`.env.local` 파일 생성 후 다음 내용 추가:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### ▶️ 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하면 앱을 사용할 수 있습니다.

### 💡 사용법

1. PDF URL을 입력하고 ‘요약 만들기’ 클릭  
2. 요약이 출력되면 내용을 확인  
3. ‘추가 질문’을 입력하고 ‘질문하기’ 클릭  
4. Q&A 기록이 아래에 저장됨  
5. ‘서비스 평가하기 ⭐’를 통해 피드백 제출

### 🏗️ 프로덕션 빌드

```bash
npm run build
npm start
```

---

## 🌐 배포 안내

**Vercel** 플랫폼을 통해 쉽게 배포할 수 있습니다.

1. Vercel에서 GitHub 저장소를 가져옵니다.
2. `NEXT_PUBLIC_API_URL` 환경 변수를 등록합니다.
3. 배포 버튼을 누르면 `.vercel.app` 도메인에서 앱이 실행됩니다.

⚠️ 현재는 내부 데모용으로 운영되므로, 외부 사용자에게는 API 기능이 제한될 수 있습니다.

---

## 🔁 작동 방식 요약

1. 사용자가 PDF URL과 언어를 입력하고 요약 버튼 클릭
2. 프론트엔드는 다음 형식으로 API 호출:

```json
{
  "file_id": "fid_abc123_file",
  "pdf_url": "https://arxiv.org/pdf/2307.09288.pdf",
  "query": "SUMMARY_ALL",
  "lang": "KO"
}
```

3. 백엔드는 PDF를 파싱하고, 임베딩 및 LLM을 활용하여 요약 생성
4. 프론트는 요약을 출력하고, follow-up 질문을 입력하면 같은 방식으로 Q&A 요청 전송
5. 사용자는 피드백 모달을 통해 별점 및 의견 제출 가능

---

## 🔮 향후 계획

- [ ] KT Cloud 기반 vLLM 서버 연동
- [ ] PDF 업로드 기능 지원
- [ ] 답변 근거 하이라이팅
- [ ] 관리자용 피드백 분석 대시보드
- [ ] 섹션 기반 인터랙티브 요약 기능

---

## 🤝 기여 안내

현재 베타 단계로, 버그 제보 및 개선 제안 환영합니다.  
주요 기능 변경 시에는 먼저 이슈 또는 PR을 통해 논의해주세요.

---

## 📄 라이선스

MIT License (예정)  
© 2025 UCWORKS. 본 프로젝트는 UCWORKS의 공동 개발로, 이름과 UI는 정식 출시 시점에 변경될 수 있습니다. All rights reserved.

