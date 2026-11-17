# 🎨 Mood Meter (무드 미터) - RULER 감정 진단 & 마음 케어

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

> **예일 감성지능센터(Yale Center for Emotional Intelligence)**의 정통 **RULER 접근법**에 기반하여 개발된 지능형 감정 인식 및 자기 조절 웰니스 웹 애플리케이션입니다.  
> 사용자의 웹캠 표정을 **Google Gemini 2.5 비전 AI(FACS 분석)**로 정밀 인식하여 감정 4분면에 실시간 매핑하고, 2D 인터랙티브 미세 조절과 맞춤형 정서 케어 액티비티를 제공합니다.

---

## ✨ 핵심 기능 (Features)

1. **📷 AI 표정 기반 감정 스캐닝 (FACS & RULER)**
   - 웹캠 또는 표정 프리셋(기쁨, 피로, 분노, 차분 등)을 통해 얼굴 캡처
   - Gemini 2.5 비전 모델이 입꼬리, 눈매, 미간, 턱 긴장도 등 미세 표정 요소를 분석하여 **쾌/불쾌(Pleasantness)** 및 **에너지(Energy)** 수치 계산
2. **🎯 2D 인터랙티브 무드 미터 그리드 (Mood Meter Grid)**
   - **4분면 매핑**: 🔴 RED(고에너지·불쾌), 🟡 YELLOW(고에너지·유쾌), 🔵 BLUE(저에너지·불쾌), 🟢 GREEN(저에너지·유쾌)
   - **터치/드래그**: 그리드 위 어디든 핀을 직접 끌어당겨 감정 위치를 자유롭게 보정
   - **4방향 D-Pad 미세 조절**: 에너지(↑/↓) 및 유쾌도(←/→) 5% 단위 정밀 조절
   - **AI 최초 위치 원클릭 복원**: 조절 후에도 처음 AI가 감지한 좌표로 언제든 복귀 가능
   - **실시간 하위 심리 구역(Sub-Zone) 진단**: 핀 이동에 따라 신경계 반응 및 대표 감정 어휘 실시간 제공
3. **🌿 맞춤형 마음 조절 액티비티 (Emotion Regulation)**
   - 4분면 감정 상태에 최적화된 4단계 케어 가이드 (4-7-8 심호흡, 바디스캔, 감사 일기, 에너지 방출 스트레칭 등)
   - 오디오 사운드 피드백과 함께 단계별 인터랙티브 실행
4. **📖 감정 일기 & 히스토리 (Journaling)**
   - 매일의 감정 좌표, 성찰 노트, 선택 어휘를 저장
   - 로컬 스토리지 및 Firebase Firestore 실시간 동기화 지원
5. **🏫 학교 및 학급용 다중 역할 모드 (Student & Teacher Portal)**
   - 학생 계정 간편 전환 (학년/반/번호)
   - 교사용 대시보드: 학급 감정 온도계, 분면별 학생 분포 현황 분석

---

## 🚀 빠른 시작 (Getting Started)

### 1. 사전 요구사항
* [Node.js](https://nodejs.org/) v18.0.0 이상
* [npm](https://www.npmjs.com/) 또는 yarn / pnpm

### 2. 저장소 복제 및 설치
```bash
# 1) 저장소 클론 (또는 다운로드한 ZIP 압축 해제)
git clone https://github.com/<your-username>/mood-meter.git
cd mood-meter

# 2) 의존성 패키지 설치
npm install
```

### 3. 환경 변수 설정
프로젝트 루트 경로에 `.env` 파일을 생성합니다. (`.env.example` 복사)
```bash
cp .env.example .env
```
`.env` 파일 내용:
```env
# Google AI Studio에서 무료로 발급받은 Gemini API 키 입력
# 발급: https://aistudio.google.com/app/apikey
GEMINI_API_KEY="AIzaSy..."

# 서버 포트 (기본값: 3000)
PORT=3000
```

### 4. 로컬 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`으로 접속합니다.

### 5. 프로덕션 빌드 & 실행
```bash
npm run build
npm start
```

---

## 📤 GitHub에 올리는 방법 (How to Push to GitHub)

다운로드한 압축 파일을 GitHub 새 저장소에 업로드하는 단계입니다.

### Step 1. GitHub에서 새 Repository 생성
1. [GitHub](https://github.com/) 로그인 후 우측 상단의 `+` 버튼 -> **New repository** 클릭
2. Repository name 입력 (예: `mood-meter`)
3. 공개 여부(Public 또는 Private) 선택
4. ⚠️ **"Initialize this repository with a README"는 체크 해제** (이미 프로젝트 내에 README가 포함되어 있습니다)
5. **Create repository** 클릭

### Step 2. 로컬 터미널에서 Git 초기화 및 커밋
압축을 푼 프로젝트 폴더 안에서 터미널(또는 명령 프롬프트)을 열고 실행합니다:

```bash
# Git 초기화
git init

# 모든 파일 스테이징
git add .

# 첫 커밋 작성
git commit -m "feat: Initial commit for Mood Meter RULER web app"

# 메인 브랜치 이름 설정
git branch -M main

# GitHub 원격 저장소 연결 (본인의 GitHub 아이디와 레포명으로 변경)
git remote add origin https://github.com/<본인-GitHub-아이디>/mood-meter.git

# GitHub에 푸시
git push -u origin main
```

---

## 📁 프로젝트 폴더 구조 (Project Structure)

```
mood-meter/
├── .env.example             # 환경 변수 템플릿
├── .gitignore               # Git 추적 제외 설정 (node_modules, .env 등)
├── index.html               # SPA 진입 HTML
├── metadata.json            # AI Studio 메타데이터
├── package.json             # 프로젝트 스크립트 및 의존성
├── server.ts                # Express 백엔드 & Gemini 비전 API 라우트
├── tsconfig.json            # TypeScript 설정
├── vite.config.ts           # Vite 번들러 설정
├── public/                  # 정적 에셋 및 소스 다운로드 ZIP
└── src/
    ├── App.tsx              # 메인 애플리케이션 진입점 & 상태 관리
    ├── main.tsx             # React 19 렌더링
    ├── index.css            # Tailwind CSS 테마 및 글로벌 스타일
    ├── types.ts             # 데이터 타입 및 인터페이스
    ├── firebase.ts          # Firebase Firestore 연동 모듈
    ├── components/
    │   ├── TopAppBar.tsx    # 상단 내비게이션 바 & 사용자 태그
    │   ├── BottomNavBar.tsx # 4분면 탭 이동 내비게이션
    │   ├── CameraView.tsx   # 웹캠 캡처 및 감정 프리셋 선택
    │   ├── ScanningView.tsx # AI 비전 실시간 스캐닝 분석 뷰
    │   ├── MoodMeterGrid.tsx# 2D RULER 격자 & 핀 드래그 & D-Pad 조절
    │   ├── ActionsView.tsx  # 감정 조절 케어 액티비티 & 감정 일기 저장
    │   ├── HistoryModal.tsx # 이전 감정 일기 기록 및 통계 모달
    │   ├── LoginPage.tsx    # 학생/교사/게스트 로그인 게이트
    │   ├── TeacherPortal.tsx# 교사용 학급 감정 온도계 & 통계 포털
    │   ├── StudentAuthModal.tsx # 학생 프로필 및 계정 설정 모달
    │   ├── RulerGuideModal.tsx # RULER 프레임워크 이론 가이드
    │   └── SettingsModal.tsx   # 카메라/음향/테마 설정 및 문의 모달
    ├── data/
    │   └── rulerData.ts     # 4분면 메타, 세부 영역(Sub-Zone) 진단 로직, 어휘
    └── utils/
        └── audio.ts         # 사운드 이펙트 유틸리티 (Web Audio API)
```

---

## 🛠️ 기술 스택 (Tech Stack)

* **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion
* **Backend**: Node.js, Express, tsx
* **AI Engine**: `@google/genai` (Gemini 2.5 Flash Multimodal Vision API)
* **Database**: Firebase Firestore & LocalStorage (Offline 지원)
* **Design Pattern**: Yale Center for Emotional Intelligence RULER 접근법

---

## 📬 문의 및 지원 (Contact)

프로젝트 관련 문의, 버그 제보, 기능 개선 제안 또는 교육용 라이선스 문의는 아래 이메일로 연락주세요:

* **이메일**: [riolavie0516@naver.com](mailto:riolavie0516@naver.com)

---

## 📄 라이선스 (License)

This project is licensed under the [MIT License](LICENSE).
Anyone is free to use, modify, and distribute this software for educational or personal wellness purposes.
