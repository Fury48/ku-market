import { BoardType, PostCategory, TradeType } from '@/types/models';

export const categoryLabels: Record<PostCategory, string> = {
  market: '중고거래',
  recruit: '구인/모집',
  promo: '홍보',
  community: '자유글',
};

export const boardTitles: Record<BoardType, string> = {
  main: '메인 게시판',
  market: '중고거래',
  recruit: '구인글',
  promo: '홍보 게시판',
};

export const boardDescriptions: Record<BoardType, string> = {
  main: '거래글, 모집글, 커뮤니티 글을 한 피드에서 자연스럽게 탐색해보세요.',
  market: '전공책, 전자기기, 생활용품을 믿을 수 있는 학생끼리 거래해요.',
  recruit: '팀플, 공모전, 스터디, 과외 모집을 빠르게 연결해요.',
  promo: '동아리와 학교 행사 소식을 카드 피드로 편하게 확인해요.',
};

export const categoryOptions: Array<{ label: string; value: PostCategory }> = [
  { label: '중고거래', value: 'market' },
  { label: '구인글', value: 'recruit' },
  { label: '홍보글', value: 'promo' },
  { label: '자유글', value: 'community' },
];

export const mainTypeChips: Array<{ label: string; value: 'all' | PostCategory }> = [
  { label: '전체', value: 'all' },
  { label: '중고거래', value: 'market' },
  { label: '구인글', value: 'recruit' },
  { label: '홍보글', value: 'promo' },
  { label: '자유글', value: 'community' },
];

export const subcategoryOptions: Record<PostCategory, string[]> = {
  market: ['교재', '전자제품', '가구/의류', '식료품', '기타'],
  recruit: ['취미/오락', '대회/공모전', '스터디', '과외', '기타'],
  promo: ['동아리', '행사', '모집', '공지'],
  community: ['질문', '정보', '자유'],
};

export const statusOptions: Record<PostCategory, string[]> = {
  market: ['판매중', '예약중', '거래완료'],
  recruit: ['모집중', '모집완료'],
  promo: ['진행중', '마감'],
  community: ['일반'],
};

export const tradeTypeOptions: Array<{ label: string; value: TradeType }> = [
  { label: '직거래', value: 'direct' },
  { label: '온라인거래', value: 'online' },
  { label: '상관없음', value: 'either' },
];

export const tradeTypeLabelMap: Record<TradeType, string> = {
  direct: '직거래',
  online: '온라인거래',
  either: '상관없음',
};

export const boardComposeDefaults: Record<BoardType, PostCategory> = {
  main: 'market',
  market: 'market',
  recruit: 'recruit',
  promo: 'promo',
};

export const masterAccount = {
  username: 'horangmaster',
  password: 'Horang2026!',
  email: 'master@korea.ac.kr',
  nickname: '호랭운영진',
};
