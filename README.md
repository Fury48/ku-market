# Horang Market

고려대학교 학생 전용 생활형 로컬 커뮤니티 앱 `호랭마켓` MVP입니다.

중고거래, 팀원 모집, 동아리/행사 홍보, 자유 커뮤니티, 게시글 기반 1:1 채팅을 하나의 앱 안에서 사용할 수 있도록 구성했습니다. 프런트엔드는 Expo Router 기반 React Native 앱이고, 백엔드는 순수 Node.js HTTP 서버가 Supabase PostgreSQL과 SMTP 메일 서비스를 연결합니다.

## 주요 기능

### 인증

- 고려대학교 이메일(`@korea.ac.kr`) 형식 검증
- 이메일 중복 확인
- 4자리 이메일 인증번호 발급, 발송, 검증
- 아이디/닉네임 중복 확인
- 회원가입 및 로그인
- 세션 토큰 기반 로그인 유지
- 로그아웃

### 게시판

- 메인 홈 피드
- 중고거래 게시판
- 구인/모집 게시판
- 홍보 게시판
- 게시글 검색
- 게시판별 세부 카테고리 필터
- 인기/최근 게시글 표시

### 게시글

- 카드형 게시글 목록
- 게시글 상세 화면
- 다중 이미지 업로드 및 이미지 슬라이드
- 글 작성, 수정, 삭제
- 댓글 작성
- 찜 토글
- 찜/댓글 알림 생성
- 게시글 기반 채팅방 열기

### 채팅

- 게시글 기반 1:1 채팅방 생성
- 채팅 목록
- 마지막 메시지, 마지막 시간, 안 읽은 메시지 수 표시
- 텍스트 메시지 전송
- 이미지 메시지 전송
- 3초 주기 폴링으로 채팅방/메시지 갱신
- 메시지 읽음 처리

### 계정

- 내 프로필 조회
- 프로필 수정
- 찜한 게시글 목록
- 내가 작성한 게시글 목록
- 내가 쓴 글, 찜한 글, 채팅방 수 통계

### 알림

- 내 게시글에 달린 찜/댓글 알림
- 알림 목록 조회
- 읽지 않은 알림 개수 표시
- 전체 읽음 처리
- 3초 주기 폴링으로 알림 갱신

## 기술 스택

### Frontend

- Expo
- Expo Router
- React Native
- React Native Web
- TypeScript
- React Navigation
- Expo Image Picker
- Expo Image
- Expo Haptics
- Expo Vector Icons

### Backend

- Node.js 기본 `http` 서버
- `pg` 기반 PostgreSQL 연결
- `dotenv` 환경변수 로드
- `nodemailer` 기반 SMTP 이메일 발송

### Database / Infra

- Supabase PostgreSQL
- SMTP 메일 서비스: SendGrid, Gmail SMTP 등 사용 가능
- 배포 환경 예시
  - Backend: Render
  - Frontend Web: Netlify 또는 Expo Web 정적 빌드 호스팅

## 프로젝트 구조

```text
ku-market/
├─ app/
│  ├─ (tabs)/
│  │  ├─ _layout.tsx
│  │  ├─ account.tsx
│  │  ├─ chats.tsx
│  │  ├─ index.tsx
│  │  ├─ market.tsx
│  │  ├─ promo.tsx
│  │  └─ recruit.tsx
│  ├─ account/
│  │  ├─ edit.tsx
│  │  ├─ liked.tsx
│  │  └─ mine.tsx
│  ├─ chat/
│  │  └─ [id].tsx
│  ├─ post/
│  │  ├─ [id].tsx
│  │  └─ compose.tsx
│  ├─ _layout.tsx
│  ├─ index.tsx
│  ├─ login.tsx
│  ├─ notifications.tsx
│  └─ register.tsx
├─ assets/
│  └─ images/
├─ backend/
│  ├─ database.js
│  ├─ http.js
│  ├─ mailer.js
│  ├─ schema.sql
│  └─ server.js
├─ components/
│  ├─ ui/
│  │  ├─ avatar.tsx
│  │  ├─ collapsible.tsx
│  │  ├─ floating-write-button.tsx
│  │  ├─ icon-symbol.ios.tsx
│  │  ├─ icon-symbol.tsx
│  │  └─ pill.tsx
│  ├─ board-screen.tsx
│  ├─ chat-room-row.tsx
│  ├─ haptic-tab.tsx
│  ├─ image-strip-picker.tsx
│  ├─ message-bubble.tsx
│  ├─ notification-bell.tsx
│  ├─ post-card.tsx
│  ├─ post-form.tsx
│  └─ search-header.tsx
├─ constants/
│  └─ theme.ts
├─ hooks/
│  ├─ use-color-scheme.ts
│  ├─ use-color-scheme.web.ts
│  ├─ use-keyboard-offset.ts
│  └─ use-theme-color.ts
├─ lib/
│  ├─ api.ts
│  ├─ constants.ts
│  ├─ format.ts
│  ├─ image-picker.ts
│  ├─ theme.ts
│  └─ web-alert.ts
├─ providers/
│  ├─ auth-provider.tsx
│  ├─ chat-rooms-provider.tsx
│  └─ notifications-provider.tsx
├─ scripts/
│  └─ reset-project.js
├─ types/
│  └─ models.ts
├─ .env.example
├─ PROJECT_OVERVIEW.md
├─ app.json
├─ eslint.config.js
├─ package.json
└─ tsconfig.json
```

## 동작 구조

```text
사용자
  |
  v
Expo / React Native Frontend
  |
  |  lib/api.ts의 apiFetch()로 HTTP 요청
  |  x-session-token 헤더 또는 horang_session 쿠키 사용
  v
Node.js Backend
  |
  |  backend/server.js에서 /api 라우팅 처리
  |  backend/database.js에서 SQL 실행
  v
Supabase PostgreSQL
```

이메일 인증번호 발송은 별도 흐름으로 동작합니다.

```text
회원가입 화면
  |
  v
POST /api/auth/send-code
  |
  v
verification_codes 테이블에 인증번호 저장
  |
  v
backend/mailer.js
  |
  v
nodemailer SMTP 연결
  |
  v
SendGrid 또는 Gmail SMTP 같은 메일 발송 서비스
```

## 주요 엔트리 포인트

- 프런트 루트 레이아웃: `app/_layout.tsx`
- 앱 진입/스플래시/로그인 분기: `app/index.tsx`
- 하단 탭 레이아웃: `app/(tabs)/_layout.tsx`
- 메인 홈: `app/(tabs)/index.tsx`
- 공통 게시판 화면: `components/board-screen.tsx`
- 게시글 상세: `app/post/[id].tsx`
- 게시글 작성/수정: `app/post/compose.tsx`
- 채팅 상세: `app/chat/[id].tsx`
- 인증 상태 관리: `providers/auth-provider.tsx`
- 채팅방 상태 관리: `providers/chat-rooms-provider.tsx`
- 알림 상태 관리: `providers/notifications-provider.tsx`
- API 클라이언트: `lib/api.ts`
- 백엔드 서버: `backend/server.js`
- DB 접근층: `backend/database.js`
- 메일 발송: `backend/mailer.js`
- DB 스키마: `backend/schema.sql`

## API 요약

### 인증

- `GET /api/auth/session`
- `GET /api/auth/check/email`
- `GET /api/auth/check/username`
- `GET /api/auth/check/nickname`
- `POST /api/auth/send-code`
- `POST /api/auth/verify-code`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### 게시글/피드

- `GET /api/feed`
- `POST /api/posts`
- `GET /api/posts/:id`
- `PATCH /api/posts/:id`
- `DELETE /api/posts/:id`
- `POST /api/posts/:id/like`
- `POST /api/posts/:id/comments`
- `GET /api/posts/:id/cover-image`
- `GET /api/posts/:id/images/:index`

### 채팅

- `POST /api/chats/open`
- `GET /api/chats`
- `GET /api/chats/:id`
- `GET /api/chats/:id/messages`
- `POST /api/chats/:id/messages`

### 계정/알림

- `GET /api/account/liked`
- `GET /api/account/posts`
- `PATCH /api/account/profile`
- `GET /api/notifications`
- `POST /api/notifications/read`
- `GET /api/users/:id/profile-image`

### 기타

- `GET /api/health`
- `GET /api/meta/schema`

## 데이터베이스

`backend/schema.sql`에 PostgreSQL 테이블 구조가 정의되어 있습니다.

사용 테이블:

- `users`: 사용자 계정, 프로필, 매너 점수
- `posts`: 게시글 본문 및 카테고리별 정보
- `post_images`: 게시글 이미지 목록
- `post_likes`: 게시글 찜
- `comments`: 댓글
- `notifications`: 찜/댓글 알림
- `chat_rooms`: 게시글 기반 1:1 채팅방
- `messages`: 채팅 메시지
- `sessions`: 로그인 세션 토큰
- `verification_codes`: 이메일 인증번호

## 환경변수

`.env.example`을 참고해 프로젝트 루트에 `.env` 파일을 만듭니다.

```env
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
PGSSLMODE=require
PORT=4000
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:4000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_USER=
EMAIL_PASS=
MAIL_FROM=
```

### Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. Supabase SQL Editor에서 `backend/schema.sql` 전체를 실행합니다.
3. Project Settings > Database에서 PostgreSQL connection string을 복사합니다.
4. `.env`의 `DATABASE_URL`에 붙여 넣습니다.

### SMTP / SendGrid 설정

메일 발송은 `nodemailer`가 SMTP 서버에 접속하는 방식입니다. SendGrid를 사용할 경우 일반적으로 다음처럼 설정합니다.

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=<SendGrid API Key>
MAIL_FROM=Horang Market <verified-sender@example.com>
```

Gmail SMTP를 사용할 경우 `.env.example`의 기본값처럼 `smtp.gmail.com`을 사용할 수 있습니다.

## 실행 방법

의존성 설치:

```bash
npm install
```

백엔드 서버 실행:

```bash
npm run server
```

프런트엔드 실행:

```bash
npm start
```

웹으로 실행:

```bash
npm run web
```

Android/iOS 실행:

```bash
npm run android
npm run ios
```

기본 로컬 주소:

- Backend API: `http://127.0.0.1:4000/api`
- Expo dev server: Expo CLI 출력 주소 사용

## 프런트엔드 API 주소 결정 방식

`lib/api.ts`는 실행 환경에 따라 API 주소를 결정합니다.

- `EXPO_PUBLIC_API_BASE_URL`이 있으면 해당 값을 우선 사용
- 배포된 웹 환경에서 로컬 API 주소가 설정되어 있으면 프로덕션 API 주소 사용
- 로컬 웹/iOS 환경은 기본적으로 `127.0.0.1:4000`
- Android 에뮬레이터는 `10.0.2.2:4000`

## 참고 사항

- 실제 백엔드 폴더는 `backend/`입니다.
- 실제 백엔드 실행 파일은 `backend/server.js`입니다.
- 백엔드는 Express 없이 Node.js 기본 `http` 모듈로 구현되어 있습니다.
- 채팅과 알림은 WebSocket이 아니라 3초 주기 폴링으로 갱신됩니다.
- 이미지는 현재 별도 스토리지 업로드가 아니라 URL 또는 `data:` URL 문자열로 DB에 저장됩니다.
- 웹 배포 시 `app.json`의 `web.output` 설정에 따라 정적 빌드 형태로 사용할 수 있습니다.
- 본 repository는 프런트엔드 호스트인 Netlify와 백엔드 호스트인 Render와 연동 되어있습니다.