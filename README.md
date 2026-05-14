# Horang Market

고려대학교 학생 전용 생활형 로컬 커뮤니티 앱 `호랭마켓` MVP입니다.

당근마켓의 카드형 피드와 게시글 기반 채팅 UX를 참고하되, 고려대학교 학생 커뮤니티에 맞게 중고거래, 팀원 모집, 동아리/행사 홍보, 자유 커뮤니티를 하나의 앱에 통합했습니다.

## Master Account

- Username: `horangmaster`
- Password: `Horang2026!`
- Email: `master@korea.ac.kr`

## Project Structure

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
│  └─ register.tsx
├─ backend/
│  ├─ database.js
│  ├─ http.js
│  ├─ schema.sql
│  └─ server.js
├─ components/
│  ├─ ui/
│  │  ├─ avatar.tsx
│  │  ├─ floating-write-button.tsx
│  │  └─ pill.tsx
│  ├─ board-screen.tsx
│  ├─ chat-room-row.tsx
│  ├─ image-strip-picker.tsx
│  ├─ message-bubble.tsx
│  ├─ post-card.tsx
│  ├─ post-form.tsx
│  └─ search-header.tsx
├─ lib/
│  ├─ api.ts
│  ├─ constants.ts
│  ├─ format.ts
│  ├─ image-picker.ts
│  └─ theme.ts
├─ providers/
│  └─ auth-provider.tsx
├─ types/
│  └─ models.ts
├─ PROJECT_OVERVIEW.md
├─ app.json
├─ package.json
└─ tsconfig.json
```

## Frontend

- `Expo Router` 기반 모바일 앱 구조
- 6개 하단 탭: 메인, 중고거래, 구인글, 홍보, 채팅, 계정
- 카드형 피드, 검색, 카테고리 필터
- 게시글 상세, 댓글, 찜, 채팅 진입
- 글 작성/수정/삭제, 다중 이미지 업로드, 대표 이미지 지정
- 고려대 이메일 인증 회원가입, 로그인 상태 유지

## Backend

- 순수 `Node.js` HTTP 서버
- Supabase PostgreSQL 연결을 위한 `pg` 기반 DB 접근층
- `backend/schema.sql` 로 Postgres 테이블 구조 명시
- 인증, 피드, 게시글, 댓글, 찜, 채팅, 프로필 수정 API 제공

## Supabase Setup

1. Supabase 프로젝트를 만들고 SQL Editor에서 `backend/schema.sql` 전체를 실행합니다.
2. Project Settings > Database에서 Postgres connection string을 복사합니다.
3. `.env.example`을 참고해서 `DATABASE_URL`을 설정합니다.

## Run

```bash
npm install
npm run server
npm start
```

- Backend: `http://127.0.0.1:4000`
- Frontend: Expo dev server

## Notes

- `server/`가 아니라 `backend/`가 실제 서버 영역입니다.
- 실제 실행 엔트리는 `backend/server.js` 입니다.
- 웹, 모바일 시연 모두 가능한 형태로 구성되어 있습니다.
