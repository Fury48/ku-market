const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createSeedState } = require('./seed');

const DATA_PATH = path.join(__dirname, 'data.json');
let state = null;

function createError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function ensureState() {
  if (state) {
    cleanupExpiredSessions();
    return state;
  }

  if (!fs.existsSync(DATA_PATH)) {
    state = createSeedState();
    persist();
    return state;
  }

  state = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  cleanupExpiredSessions();
  persist();
  return state;
}

function persist() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(state, null, 2));
}

function cleanupExpiredSessions() {
  if (!state) {
    return;
  }

  const now = Date.now();
  state.sessions = state.sessions.filter((session) => !session.expires_at || new Date(session.expires_at).getTime() > now);
}

function nextId(key) {
  ensureState();
  const id = state.nextIds[key];
  state.nextIds[key] += 1;
  return id;
}

function nowIso() {
  return new Date().toISOString();
}

function getUserById(userId) {
  ensureState();
  return state.users.find((user) => user.id === Number(userId)) || null;
}

function findUserByEmail(email) {
  ensureState();
  return state.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function findUserByUsername(username) {
  ensureState();
  return state.users.find((user) => user.username.toLowerCase() === String(username).toLowerCase()) || null;
}

function findUserByNickname(nickname) {
  ensureState();
  return state.users.find((user) => user.nickname.toLowerCase() === String(nickname).toLowerCase()) || null;
}

function toUserSummary(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    nickname: user.nickname,
    department: user.department,
    studentYear: user.student_year,
    bio: user.bio,
    profileImageUrl: user.profile_image_url,
    mannerScore: user.manner_score,
    createdAt: user.created_at,
  };
}

function getAuthorSummary(user) {
  return {
    id: user.id,
    nickname: user.nickname,
    department: user.department,
    studentYear: user.student_year,
    profileImageUrl: user.profile_image_url,
    mannerScore: user.manner_score,
  };
}

function getPostImages(postId) {
  ensureState();
  return state.post_images
    .filter((image) => image.post_id === Number(postId))
    .sort((a, b) => a.sort_order - b.sort_order);
}

function getPostLikeCount(postId) {
  ensureState();
  return state.post_likes.filter((like) => like.post_id === Number(postId)).length;
}

function getPostCommentCount(postId) {
  ensureState();
  return state.comments.filter((comment) => comment.post_id === Number(postId)).length;
}

function isPostLikedByUser(postId, userId) {
  ensureState();
  if (!userId) {
    return false;
  }

  return state.post_likes.some((like) => like.post_id === Number(postId) && like.user_id === Number(userId));
}

function toPostSummary(post, viewerId) {
  const author = getUserById(post.author_id);
  const images = getPostImages(post.id);
  const coverImageUrl = images[0]?.image_url || '';

  return {
    id: post.id,
    postName: post.post_name,
    title: post.title,
    content: post.content,
    category: post.category,
    subcategory: post.subcategory,
    price: post.price,
    status: post.status,
    tradeType: post.trade_type,
    location: post.location,
    isPriceOfferAllowed: post.is_price_offer_allowed,
    recruitmentTarget: post.recruitment_target,
    recruitmentCurrent: post.recruitment_current,
    tags: post.tags || [],
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    coverImageUrl,
    likeCount: getPostLikeCount(post.id),
    commentCount: getPostCommentCount(post.id),
    isLiked: isPostLikedByUser(post.id, viewerId),
    author: getAuthorSummary(author),
  };
}

function toPostDetail(post, viewerId) {
  const summary = toPostSummary(post, viewerId);
  const comments = ensureState().comments
    .filter((comment) => comment.post_id === post.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((comment) => {
      const author = getUserById(comment.user_id);
      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        author: {
          id: author.id,
          nickname: author.nickname,
          profileImageUrl: author.profile_image_url,
        },
      };
    });

  return {
    ...summary,
    images: getPostImages(post.id).map((image) => image.image_url),
    comments,
    isMine: Number(viewerId) === post.author_id,
  };
}

function getPostById(postId) {
  ensureState();
  const post = state.posts.find((item) => item.id === Number(postId));
  if (!post) {
    throw createError(404, '게시글을 찾을 수 없습니다.');
  }

  return post;
}

function getAccountStats(userId) {
  ensureState();
  return {
    myPostCount: state.posts.filter((post) => post.author_id === Number(userId)).length,
    likedPostCount: state.post_likes.filter((like) => like.user_id === Number(userId)).length,
    chatRoomCount: state.chat_rooms.filter((room) => room.seller_id === Number(userId) || room.buyer_id === Number(userId)).length,
  };
}

function createVerificationCode(email) {
  ensureState();
  const normalizedEmail = String(email).trim().toLowerCase();
  const code = String(Math.floor(1000 + Math.random() * 9000));

  state.verification_codes = state.verification_codes.filter((item) => item.email !== normalizedEmail);
  state.verification_codes.push({
    email: normalizedEmail,
    code,
    verified: false,
    created_at: nowIso(),
  });
  persist();

  return code;
}

function verifyCode(email, code) {
  ensureState();
  const target = state.verification_codes.find(
    (item) => item.email === String(email).trim().toLowerCase() && item.code === String(code).trim()
  );

  if (!target) {
    throw createError(400, '인증번호가 일치하지 않습니다.');
  }

  target.verified = true;
  persist();
}

function ensureVerifiedEmail(email) {
  ensureState();
  const target = state.verification_codes.find(
    (item) => item.email === String(email).trim().toLowerCase() && item.verified
  );

  if (!target) {
    throw createError(400, '이메일 인증이 필요합니다.');
  }
}

function createSession(userId, persisted) {
  ensureState();
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + (persisted ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24 * 7)).toISOString();

  state.sessions.push({
    token,
    user_id: Number(userId),
    persisted: Boolean(persisted),
    expires_at: expiresAt,
  });
  persist();

  return token;
}

function getUserBySessionToken(token) {
  ensureState();
  if (!token) {
    return null;
  }

  const session = state.sessions.find((item) => item.token === token);
  if (!session) {
    return null;
  }

  return getUserById(session.user_id);
}

function deleteSession(token) {
  ensureState();
  if (!token) {
    return;
  }

  state.sessions = state.sessions.filter((item) => item.token !== token);
  persist();
}

function matchText(post, query) {
  if (!query) {
    return true;
  }

  const needle = String(query).trim().toLowerCase();
  return post.title.toLowerCase().includes(needle) || post.content.toLowerCase().includes(needle);
}

function getFeed({ viewerId, board = 'main', type, subcategory, query }) {
  ensureState();
  let posts = [...state.posts];

  if (board !== 'main') {
    posts = posts.filter((post) => post.category === board);
  } else if (type) {
    posts = posts.filter((post) => post.category === type);
  }

  if (subcategory) {
    posts = posts.filter((post) => post.subcategory === subcategory);
  }

  if (query) {
    posts = posts.filter((post) => matchText(post, query));
  }

  return posts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((post) => toPostSummary(post, viewerId));
}

function getPostDetail(postId, viewerId) {
  return toPostDetail(getPostById(postId), viewerId);
}

function getLikedPosts(userId) {
  ensureState();
  const postIds = state.post_likes.filter((like) => like.user_id === Number(userId)).map((like) => like.post_id);
  return state.posts
    .filter((post) => postIds.includes(post.id))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .map((post) => toPostSummary(post, userId));
}

function getMyPosts(userId) {
  ensureState();
  return state.posts
    .filter((post) => post.author_id === Number(userId))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .map((post) => toPostSummary(post, userId));
}

function validatePostPayload(payload) {
  if (!payload || !payload.title || !payload.content || !payload.category || !payload.subcategory) {
    throw createError(400, '필수 입력값이 누락되었습니다.');
  }

  if (!Array.isArray(payload.images) || payload.images.length === 0) {
    throw createError(400, '사진은 최소 1장 이상 필요합니다.');
  }

  if (payload.images.length > 10) {
    throw createError(400, '사진은 최대 10장까지 등록할 수 있습니다.');
  }

  if (payload.category === 'market' && (payload.price === null || payload.price === undefined)) {
    throw createError(400, '중고거래 글에는 가격이 필요합니다.');
  }
}

function replacePostImages(postId, images) {
  ensureState();
  state.post_images = state.post_images.filter((image) => image.post_id !== Number(postId));
  images.forEach((imageUrl, index) => {
    state.post_images.push({
      id: nextId('postImages'),
      post_id: Number(postId),
      image_url: imageUrl,
      sort_order: index,
    });
  });
}

function createPost(userId, payload) {
  ensureState();
  validatePostPayload(payload);
  const timestamp = nowIso();

  const post = {
    id: nextId('posts'),
    post_name: `post-${Date.now()}`,
    author_id: Number(userId),
    title: String(payload.title).trim(),
    content: String(payload.content).trim(),
    category: payload.category,
    subcategory: payload.subcategory,
    price: payload.category === 'market' ? Number(payload.price) || 0 : null,
    status: payload.status || (payload.category === 'market' ? '판매중' : payload.category === 'recruit' ? '모집중' : payload.category === 'promo' ? '진행중' : '일반'),
    trade_type: payload.category === 'market' ? payload.tradeType || 'direct' : null,
    location: payload.location || null,
    is_price_offer_allowed: Boolean(payload.isPriceOfferAllowed),
    recruitment_target: payload.category === 'recruit' ? Number(payload.recruitmentTarget) || null : null,
    recruitment_current: payload.category === 'recruit' ? Number(payload.recruitmentCurrent) || 0 : null,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    created_at: timestamp,
    updated_at: timestamp,
  };

  state.posts.push(post);
  replacePostImages(post.id, payload.images);
  persist();

  return toPostDetail(post, userId);
}

function updatePost(userId, postId, payload) {
  ensureState();
  validatePostPayload(payload);
  const post = getPostById(postId);

  if (post.author_id !== Number(userId)) {
    throw createError(403, '본인이 작성한 게시글만 수정할 수 있습니다.');
  }

  post.title = String(payload.title).trim();
  post.content = String(payload.content).trim();
  post.category = payload.category;
  post.subcategory = payload.subcategory;
  post.price = payload.category === 'market' ? Number(payload.price) || 0 : null;
  post.status = payload.status || post.status;
  post.trade_type = payload.category === 'market' ? payload.tradeType || 'direct' : null;
  post.location = payload.location || null;
  post.is_price_offer_allowed = Boolean(payload.isPriceOfferAllowed);
  post.recruitment_target = payload.category === 'recruit' ? Number(payload.recruitmentTarget) || null : null;
  post.recruitment_current = payload.category === 'recruit' ? Number(payload.recruitmentCurrent) || 0 : null;
  post.tags = Array.isArray(payload.tags) ? payload.tags : [];
  post.updated_at = nowIso();

  replacePostImages(post.id, payload.images);
  persist();

  return toPostDetail(post, userId);
}

function deletePost(userId, postId) {
  ensureState();
  const post = getPostById(postId);

  if (post.author_id !== Number(userId)) {
    throw createError(403, '본인이 작성한 게시글만 삭제할 수 있습니다.');
  }

  const roomIds = state.chat_rooms.filter((room) => room.post_id === post.id).map((room) => room.id);

  state.posts = state.posts.filter((item) => item.id !== post.id);
  state.post_images = state.post_images.filter((item) => item.post_id !== post.id);
  state.post_likes = state.post_likes.filter((item) => item.post_id !== post.id);
  state.comments = state.comments.filter((item) => item.post_id !== post.id);
  state.chat_rooms = state.chat_rooms.filter((item) => item.post_id !== post.id);
  state.messages = state.messages.filter((item) => !roomIds.includes(item.room_id));
  persist();
}

function toggleLike(userId, postId) {
  ensureState();
  getPostById(postId);
  const existing = state.post_likes.find((item) => item.post_id === Number(postId) && item.user_id === Number(userId));

  if (existing) {
    state.post_likes = state.post_likes.filter((item) => item.id !== existing.id);
  } else {
    state.post_likes.push({
      id: nextId('postLikes'),
      post_id: Number(postId),
      user_id: Number(userId),
      created_at: nowIso(),
    });
  }

  persist();
  return getPostDetail(postId, userId);
}

function addComment(userId, postId, content) {
  ensureState();
  const post = getPostById(postId);

  if (!String(content || '').trim()) {
    throw createError(400, '댓글 내용을 입력해 주세요.');
  }

  state.comments.push({
    id: nextId('comments'),
    post_id: post.id,
    user_id: Number(userId),
    content: String(content).trim(),
    created_at: nowIso(),
  });
  post.updated_at = nowIso();
  persist();

  return getPostDetail(postId, userId);
}

function ensureRoomParticipant(room, userId) {
  if (room.seller_id !== Number(userId) && room.buyer_id !== Number(userId)) {
    throw createError(403, '채팅방에 접근할 수 없습니다.');
  }
}

function getRoomOtherUser(room, userId) {
  return room.seller_id === Number(userId) ? getUserById(room.buyer_id) : getUserById(room.seller_id);
}

function getChatRooms(userId) {
  ensureState();
  return state.chat_rooms
    .filter((room) => room.seller_id === Number(userId) || room.buyer_id === Number(userId))
    .map((room) => {
      const otherUser = getRoomOtherUser(room, userId);
      const post = getPostById(room.post_id);
      const messages = state.messages
        .filter((message) => message.room_id === room.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const lastMessage = messages[messages.length - 1];
      const unreadCount = messages.filter(
        (message) => message.sender_id !== Number(userId) && !(message.read_by || []).includes(Number(userId))
      ).length;

      return {
        id: room.id,
        postId: post.id,
        postTitle: post.title,
        otherUser: {
          id: otherUser.id,
          nickname: otherUser.nickname,
          profileImageUrl: otherUser.profile_image_url,
        },
        lastMessage: lastMessage?.content || (lastMessage?.image_url ? '이미지를 보냈어요.' : ''),
        lastMessageAt: lastMessage?.created_at || room.created_at,
        unreadCount,
      };
    })
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

function openChatRoom(userId, postId) {
  ensureState();
  const post = getPostById(postId);

  if (post.author_id === Number(userId)) {
    throw createError(400, '내 게시글에는 채팅방을 열 수 없습니다.');
  }

  let room = state.chat_rooms.find(
    (item) => item.post_id === post.id && item.seller_id === post.author_id && item.buyer_id === Number(userId)
  );

  if (!room) {
    room = {
      id: nextId('chatRooms'),
      post_id: post.id,
      seller_id: post.author_id,
      buyer_id: Number(userId),
      created_at: nowIso(),
    };
    state.chat_rooms.push(room);
    persist();
  }

  return room.id;
}

function getChatRoomDetail(userId, roomId) {
  ensureState();
  const room = state.chat_rooms.find((item) => item.id === Number(roomId));

  if (!room) {
    throw createError(404, '채팅방을 찾을 수 없습니다.');
  }

  ensureRoomParticipant(room, userId);

  let changed = false;
  state.messages.forEach((message) => {
    if (message.room_id === room.id && message.sender_id !== Number(userId) && !(message.read_by || []).includes(Number(userId))) {
      message.read_by = [...(message.read_by || []), Number(userId)];
      changed = true;
    }
  });

  if (changed) {
    persist();
  }

  const otherUser = getRoomOtherUser(room, userId);
  const post = getPostById(room.post_id);
  const messages = state.messages
    .filter((item) => item.room_id === room.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((message) => {
      const sender = getUserById(message.sender_id);
      return {
        id: message.id,
        content: message.content,
        imageUrl: message.image_url,
        createdAt: message.created_at,
        isMine: sender.id === Number(userId),
        sender: {
          id: sender.id,
          nickname: sender.nickname,
          profileImageUrl: sender.profile_image_url,
        },
      };
    });

  return {
    id: room.id,
    postId: post.id,
    postTitle: post.title,
    otherUser: {
      id: otherUser.id,
      nickname: otherUser.nickname,
      profileImageUrl: otherUser.profile_image_url,
    },
    messages,
  };
}

function createChatMessage(userId, roomId, payload) {
  ensureState();
  const room = state.chat_rooms.find((item) => item.id === Number(roomId));

  if (!room) {
    throw createError(404, '채팅방을 찾을 수 없습니다.');
  }

  ensureRoomParticipant(room, userId);

  if (!String(payload.content || '').trim() && !payload.imageUrl) {
    throw createError(400, '메시지 또는 이미지를 입력해 주세요.');
  }

  state.messages.push({
    id: nextId('messages'),
    room_id: room.id,
    sender_id: Number(userId),
    content: String(payload.content || '').trim(),
    image_url: payload.imageUrl || null,
    created_at: nowIso(),
    read_by: [Number(userId)],
  });
  persist();

  return getChatRoomDetail(userId, roomId);
}

function updateProfile(userId, payload) {
  ensureState();
  const user = getUserById(userId);
  if (!user) {
    throw createError(404, '사용자를 찾을 수 없습니다.');
  }

  if (payload.nickname && payload.nickname !== user.nickname && findUserByNickname(payload.nickname)) {
    throw createError(400, '이미 사용 중인 닉네임입니다.');
  }

  user.nickname = String(payload.nickname || user.nickname).trim();
  user.department = String(payload.department || user.department).trim();
  user.student_year = Number(payload.studentYear) || user.student_year;
  user.bio = String(payload.bio || '').trim();
  user.profile_image_url = payload.profileImageUrl || user.profile_image_url;
  persist();

  return toUserSummary(user);
}

function registerUser(payload) {
  ensureState();
  ensureVerifiedEmail(payload.email);

  if (findUserByEmail(payload.email)) {
    throw createError(400, '이미 등록된 이메일입니다.');
  }
  if (findUserByUsername(payload.username)) {
    throw createError(400, '이미 사용 중인 아이디입니다.');
  }
  if (findUserByNickname(payload.nickname)) {
    throw createError(400, '이미 사용 중인 닉네임입니다.');
  }

  const user = {
    id: nextId('users'),
    email: String(payload.email).trim().toLowerCase(),
    username: String(payload.username).trim(),
    password: String(payload.password),
    nickname: String(payload.nickname).trim(),
    department: String(payload.department || '자유전공학부').trim(),
    student_year: Number(payload.studentYear) || 1,
    bio: '호랭마켓에 새로 합류했어요.',
    profile_image_url: payload.profileImageUrl || '',
    manner_score: 36.5,
    created_at: nowIso(),
  };

  state.users.push(user);
  state.verification_codes = state.verification_codes.filter((item) => item.email !== user.email);
  persist();

  return user;
}

function loginUser(username, password) {
  ensureState();
  const user = findUserByUsername(username);

  if (!user || user.password !== password) {
    throw createError(401, '아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  return user;
}

function getHealth() {
  ensureState();
  const master = findUserByUsername('horangmaster');
  return {
    ok: true,
    name: 'horang-market-api',
    masterAccount: {
      username: master.username,
      email: master.email,
    },
    postCount: state.posts.length,
    userCount: state.users.length,
  };
}

module.exports = {
  createError,
  ensureState,
  findUserByEmail,
  findUserByUsername,
  findUserByNickname,
  toUserSummary,
  getAccountStats,
  createVerificationCode,
  verifyCode,
  createSession,
  getUserBySessionToken,
  deleteSession,
  getFeed,
  getPostDetail,
  getLikedPosts,
  getMyPosts,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  openChatRoom,
  getChatRooms,
  getChatRoomDetail,
  createChatMessage,
  updateProfile,
  registerUser,
  loginUser,
  getHealth,
};
