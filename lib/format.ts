import { PostCategory } from '@/types/models';
import { tradeTypeLabelMap } from '@/lib/constants';

export function formatPrice(price?: number | null) {
  if (price === null || price === undefined) {
    return '가격 미정';
  }

  return `${price.toLocaleString('ko-KR')}원`;
}

export function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 1000 / 60);

  if (minutes < 1) {
    return '방금 전';
  }

  if (minutes < 60) {
    return `${minutes}분 전`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}시간 전`;
  }

  const days = Math.floor(hours / 24);
  if (days < 8) {
    return `${days}일 전`;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(value));
}

export function formatHeadline(
  category: PostCategory,
  price?: number | null,
  current?: number | null,
  target?: number | null
) {
  if (category === 'market') {
    return formatPrice(price);
  }

  if (category === 'recruit') {
    if (current || target) {
      return `${current ?? 0}/${target ?? 0}명 모집`;
    }

    return '팀원 모집 중';
  }

  if (category === 'promo') {
    return '캠퍼스 홍보글';
  }

  return '고려대 커뮤니티';
}

export function formatTradeType(value?: 'direct' | 'online' | 'either' | null) {
  if (!value) {
    return '-';
  }

  return tradeTypeLabelMap[value];
}

export function clampTags(tags: string[]) {
  return tags.filter(Boolean).slice(0, 5);
}
