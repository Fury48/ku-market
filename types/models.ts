export type PostCategory = 'market' | 'recruit' | 'promo' | 'community';
export type BoardType = 'main' | 'market' | 'recruit' | 'promo';
export type TradeType = 'direct' | 'online' | 'either';

export interface UserSummary {
  id: number;
  email: string;
  username: string;
  nickname: string;
  department: string;
  studentYear: number;
  bio: string;
  profileImageUrl: string;
  mannerScore: number;
  createdAt: string;
}

export interface AppStats {
  myPostCount: number;
  likedPostCount: number;
  chatRoomCount: number;
}

export interface PostAuthorSummary {
  id: number;
  nickname: string;
  department: string;
  studentYear: number;
  profileImageUrl: string;
  mannerScore: number;
}

export interface PostSummary {
  id: number;
  postName: string;
  title: string;
  content: string;
  category: PostCategory;
  subcategory: string;
  price: number | null;
  status: string;
  tradeType: TradeType | null;
  location: string | null;
  isPriceOfferAllowed: boolean;
  recruitmentTarget: number | null;
  recruitmentCurrent: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  coverImageUrl: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  author: PostAuthorSummary;
}

export interface CommentItem {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    nickname: string;
    profileImageUrl: string;
  };
}

export interface PostDetail extends PostSummary {
  images: string[];
  comments: CommentItem[];
  isMine: boolean;
}

export interface ChatRoomSummary {
  id: number;
  postId: number;
  postTitle: string;
  otherUser: {
    id: number;
    nickname: string;
    profileImageUrl: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  isMine: boolean;
  sender: {
    id: number;
    nickname: string;
    profileImageUrl: string;
  };
}

export interface ChatRoomDetail {
  id: number;
  postId: number;
  postTitle: string;
  otherUser: {
    id: number;
    nickname: string;
    profileImageUrl: string;
  };
  messages: ChatMessage[];
}

export interface FeedResponse {
  posts: PostSummary[];
}

export interface AuthSessionResponse {
  user: UserSummary | null;
  stats?: AppStats;
  token?: string | null;
}

export interface AuthResponse {
  user: UserSummary;
  token: string;
}

export interface PostUpsertPayload {
  title: string;
  content: string;
  category: PostCategory;
  subcategory: string;
  price?: number | null;
  status?: string;
  tradeType?: TradeType | null;
  location?: string | null;
  isPriceOfferAllowed?: boolean;
  recruitmentTarget?: number | null;
  recruitmentCurrent?: number | null;
  tags?: string[];
  images: string[];
}
