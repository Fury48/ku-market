# Horang Market MVP Overview

## Concept

`호랭마켓`은 고려대학교 학생만 사용할 수 있는 학교 기반 로컬 커뮤니티 앱입니다.

- 중고거래
- 팀플 / 공모전 / 스터디 / 과외 모집
- 동아리 / 행사 홍보
- 자유 커뮤니티
- 게시글 기반 1:1 채팅

지역 기반 중고거래 앱을 학교 생활권 중심 커뮤니티로 변형한 MVP입니다.

## What Is Implemented

### Authentication

- 고려대 이메일 `@korea.ac.kr` 형식 검증
- 이메일 중복 체크
- 4자리 인증번호 발급 및 검증
- 아이디 / 닉네임 중복 체크
- 비밀번호 확인 일치 검증
- 로그인 상태 유지
- 마스터 계정 즉시 로그인 지원

### Boards

- 메인 게시판
- 중고거래 게시판
- 구인글 게시판
- 홍보 게시판
- 채팅 탭
- 계정 탭

### Post Experience

- 카드형 피드
- 검색
- 카테고리 / 세부 카테고리 필터
- 게시글 상세
- 이미지 슬라이드
- 댓글 작성
- 찜 토글
- 게시글 기반 채팅 진입
- 본인 글 수정 / 삭제

### Chat

- 당근마켓 스타일 채팅 목록
- 마지막 메시지 / 시간 / 안읽은 개수
- 이미지 메시지 전송
- 채팅방 상단 안전 거래 경고 배너

### Account

- 프로필 조회
- 프로필 수정
- 찜한 게시글
- 내가 작성한 게시글
- 기본 활동 통계

## Backend Tables Reflected In Data Model

- `users`
- `posts`
- `post_images`
- `post_likes`
- `comments`
- `chat_rooms`
- `messages`
- `sessions`
- `verification_codes`

스키마 정의 파일:

- [backend/schema.js](/c:/vscode/ku-market/backend/schema.js:1)
- [backend/schema.sql](/c:/vscode/ku-market/backend/schema.sql:1)
- [backend/database.js](/c:/vscode/ku-market/backend/database.js:1)

## Master Account

- Username: `horangmaster`
- Password: `Horang2026!`
- Email: `master@korea.ac.kr`

## Demo Data

- 13개 시드 게시글
- 중고거래, 모집글, 홍보글, 자유글 포함
- 초기 채팅방 2개 포함
- 상대 유저 인사 메시지 포함

## Entry Points

- Frontend root: [app/_layout.tsx](/c:/vscode/ku-market/app/_layout.tsx:1)
- Tabs: [app/(tabs)/_layout.tsx](/c:/vscode/ku-market/app/(tabs)/_layout.tsx:1)
- Backend server: [backend/server.js](/c:/vscode/ku-market/backend/server.js:1)
- Database layer: [backend/database.js](/c:/vscode/ku-market/backend/database.js:1)
- Seed data: [backend/seed-data.js](/c:/vscode/ku-market/backend/seed-data.js:1)
