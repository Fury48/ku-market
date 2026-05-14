const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const schemaVersion = 2;
const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString && process.env.PGSSLMODE !== 'disable' ? { rejectUnauthorized: false } : undefined,
});

function createError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode }); 
}

function ensureDatabaseUrl() {
  if (!connectionString) {
    throw createError(500, 'DATABASE_URL 또는 SUPABASE_DB_URL 환경변수가 필요합니다.');
  }
}

async function query(text, params = []) {
  ensureDatabaseUrl();
  return pool.query(text, params);
}

async function one(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

async function many(text, params = []) {
  const result = await query(text, params);
  return result.rows;
}

function nowIso() {
  return new Date().toISOString();
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function normalizePost(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    is_price_offer_allowed: Boolean(row.is_price_offer_allowed),
    tags: Array.isArray(row.tags) ? row.tags : [],
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

function normalizeUser(row) {
  return row
    ? {
        ...row,
        manner_score: Number(row.manner_score),
        created_at: toIso(row.created_at),
      }
    : null;
}

function normalizeMessage(row) {
  return row
    ? {
        ...row,
        read_by: Array.isArray(row.read_by) ? row.read_by : [],
        created_at: toIso(row.created_at),
      }
    : null;
}

async function getUserById(userId) {
  return normalizeUser(await one('select * from users where id = $1', [Number(userId)]));
}

async function findUserByEmail(email) {
  return normalizeUser(await one('select * from users where lower(email) = lower($1)', [String(email || '')]));
}

async function findUserByUsername(username) {
  return normalizeUser(await one('select * from users where lower(username) = lower($1)', [String(username || '')]));
}

async function findUserByNickname(nickname) {
  return normalizeUser(await one('select * from users where lower(nickname) = lower($1)', [String(nickname || '')]));
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
    mannerScore: Number(user.manner_score),
    createdAt: toIso(user.created_at),
  };
}

function toAuthorSummary(user) {
  return {
    id: user.id,
    nickname: user.nickname,
    department: user.department,
    studentYear: user.student_year,
    profileImageUrl: user.profile_image_url,
    mannerScore: Number(user.manner_score),
  };
}

async function getUserProfileImage(userId) {
  return (await getUserById(userId))?.profile_image_url || '';
}

async function getPostImages(postId) {
  return many('select * from post_images where post_id = $1 order by sort_order asc, id asc', [Number(postId)]);
}

async function getPostCoverImage(postId) {
  return (await getPostImages(postId))[0]?.image_url || '';
}

async function getPostImage(postId, index) {
  return (await getPostImages(postId))[Number(index) || 0]?.image_url || '';
}

async function getPostLikeCount(postId) {
  return Number((await one('select count(*)::int as count from post_likes where post_id = $1', [Number(postId)])).count);
}

async function getPostCommentCount(postId) {
  return Number((await one('select count(*)::int as count from comments where post_id = $1', [Number(postId)])).count);
}

async function isPostLikedByUser(postId, userId) {
  if (!userId) {
    return false;
  }

  return Boolean(await one('select 1 from post_likes where post_id = $1 and user_id = $2', [Number(postId), Number(userId)]));
}

async function toPostSummary(post, viewerId) {
  const normalizedPost = normalizePost(post);
  const author = await getUserById(normalizedPost.author_id);
  const images = await getPostImages(normalizedPost.id);

  return {
    id: normalizedPost.id,
    postName: normalizedPost.post_name,
    title: normalizedPost.title,
    content: normalizedPost.content,
    category: normalizedPost.category,
    subcategory: normalizedPost.subcategory,
    price: normalizedPost.price,
    status: normalizedPost.status,
    tradeType: normalizedPost.trade_type,
    location: normalizedPost.location,
    isPriceOfferAllowed: normalizedPost.is_price_offer_allowed,
    recruitmentTarget: normalizedPost.recruitment_target,
    recruitmentCurrent: normalizedPost.recruitment_current,
    tags: normalizedPost.tags,
    createdAt: normalizedPost.created_at,
    updatedAt: normalizedPost.updated_at,
    coverImageUrl: images[0]?.image_url || '',
    likeCount: await getPostLikeCount(normalizedPost.id),
    commentCount: await getPostCommentCount(normalizedPost.id),
    isLiked: await isPostLikedByUser(normalizedPost.id, viewerId),
    author: toAuthorSummary(author),
  };
}

async function toPostDetail(post, viewerId) {
  const normalizedPost = normalizePost(post);
  const images = await getPostImages(normalizedPost.id);
  const comments = await many(
    `select c.*, u.id as author_id, u.nickname, u.profile_image_url
       from comments c
       join users u on u.id = c.user_id
      where c.post_id = $1
      order by c.created_at asc, c.id asc`,
    [normalizedPost.id]
  );

  return {
    ...(await toPostSummary(normalizedPost, viewerId)),
    images: images.map((image) => image.image_url),
    comments: comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: toIso(comment.created_at),
      author: {
        id: comment.author_id,
        nickname: comment.nickname,
        profileImageUrl: comment.profile_image_url,
      },
    })),
    isMine: Number(viewerId) === normalizedPost.author_id,
  };
}

async function getPostById(postId) {
  const post = normalizePost(await one('select * from posts where id = $1', [Number(postId)]));
  if (!post) {
    throw createError(404, '게시글을 찾을 수 없습니다.');
  }

  return post;
}

async function getAccountStats(userId) {
  const id = Number(userId);
  const stats = await one(
    `select
       (select count(*)::int from posts where author_id = $1) as my_post_count,
       (select count(*)::int from post_likes where user_id = $1) as liked_post_count,
       (select count(*)::int from chat_rooms where seller_id = $1 or buyer_id = $1) as chat_room_count`,
    [id]
  );

  return {
    myPostCount: Number(stats.my_post_count),
    likedPostCount: Number(stats.liked_post_count),
    chatRoomCount: Number(stats.chat_room_count),
  };
}

async function createVerificationCode(email) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const ttlMinutes = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 10);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  await query(
    `insert into verification_codes (email, code, verified, created_at, expires_at)
     values ($1, $2, false, $3, $4)
     on conflict (email) do update set code = excluded.code, verified = false, created_at = excluded.created_at, expires_at = excluded.expires_at`,
    [normalizedEmail, code, nowIso(), expiresAt]
  );

  return code;
}

async function deleteVerificationCode(email) {
  await query('delete from verification_codes where email = $1', [String(email || '').trim().toLowerCase()]);
}

async function verifyCode(email, code) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const target = await one('select * from verification_codes where email = $1 and code = $2', [
    normalizedEmail,
    String(code).trim(),
  ]);

  if (!target) {
    throw createError(400, '인증번호가 일치하지 않습니다.');
  }

  if (new Date(target.expires_at).getTime() < Date.now()) {
    await deleteVerificationCode(normalizedEmail);
    throw createError(400, '인증번호가 만료되었습니다. 다시 전송해 주세요.');
  }

  await query('update verification_codes set verified = true where email = $1', [normalizedEmail]);
}

async function ensureVerifiedEmail(email) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const target = await one('select * from verification_codes where email = $1 and verified = true', [normalizedEmail]);

  if (!target) {
    throw createError(400, '이메일 인증이 필요합니다.');
  }

  if (new Date(target.expires_at).getTime() < Date.now()) {
    await deleteVerificationCode(normalizedEmail);
    throw createError(400, '이메일 인증이 만료되었습니다. 다시 인증해 주세요.');
  }
}

async function createSession(userId, persisted) {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(
    Date.now() + (persisted ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24 * 7)
  ).toISOString();

  await query('insert into sessions (token, user_id, persisted, expires_at) values ($1, $2, $3, $4)', [
    token,
    Number(userId),
    Boolean(persisted),
    expiresAt,
  ]);

  return token;
}

async function getUserBySessionToken(token) {
  if (!token) {
    return null;
  }

  const session = await one('select * from sessions where token = $1', [token]);
  if (!session) {
    return null;
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await deleteSession(token);
    return null;
  }

  return getUserById(session.user_id);
}

async function deleteSession(token) {
  if (token) {
    await query('delete from sessions where token = $1', [token]);
  }
}

function defaultStatusForCategory(category) {
  if (category === 'market') return '판매중';
  if (category === 'recruit') return '모집중';
  if (category === 'promo') return '진행중';
  return '일반';
}

function validatePostPayload(payload) {
  if (!payload || !payload.title || !payload.content || !payload.category || !payload.subcategory) {
    throw createError(400, '필수 입력값이 누락되었습니다.');
  }
  if (!Array.isArray(payload.images) || payload.images.length === 0) {
    throw createError(400, '사진은 최소 1개 이상 필요합니다.');
  }
  if (payload.images.length > 10) {
    throw createError(400, '사진은 최대 10개까지 등록할 수 있습니다.');
  }
  if (payload.category === 'market' && (payload.price === null || payload.price === undefined || payload.price === '')) {
    throw createError(400, '중고거래 글에는 가격이 필요합니다.');
  }
}

function matchesQuerySql(queryValue, params) {
  if (!queryValue) {
    return null;
  }

  params.push(`%${String(queryValue).trim()}%`);
  return `(title ilike $${params.length} or content ilike $${params.length})`;
}

async function getFeed({ viewerId, board = 'main', type, subcategory, query: search }) {
  const params = [];
  const where = [];

  if (board && board !== 'main') {
    params.push(board);
    where.push(`category = $${params.length}`);
  } else if (type) {
    params.push(type);
    where.push(`category = $${params.length}`);
  }
  if (subcategory) {
    params.push(subcategory);
    where.push(`subcategory = $${params.length}`);
  }

  const textSearch = matchesQuerySql(search, params);
  if (textSearch) {
    where.push(textSearch);
  }

  let sql = 'select * from posts';
  if (where.length > 0) {
    sql += ` where ${where.join(' and ')}`;
  }
  sql += ' order by created_at desc, id desc';

  const posts = await many(sql, params);
  return Promise.all(posts.map((post) => toPostSummary(post, viewerId)));
}

async function getPostDetail(postId, viewerId) {
  return toPostDetail(await getPostById(postId), viewerId);
}

async function getLikedPosts(userId) {
  const posts = await many(
    `select p.*
       from post_likes l
       join posts p on p.id = l.post_id
      where l.user_id = $1
      order by p.updated_at desc, p.id desc`,
    [Number(userId)]
  );
  return Promise.all(posts.map((post) => toPostSummary(post, userId)));
}

async function getMyPosts(userId) {
  const posts = await many('select * from posts where author_id = $1 order by updated_at desc, id desc', [Number(userId)]);
  return Promise.all(posts.map((post) => toPostSummary(post, userId)));
}

async function replacePostImages(client, postId, images) {
  await client.query('delete from post_images where post_id = $1', [Number(postId)]);

  for (const [index, imageUrl] of images.entries()) {
    await client.query('insert into post_images (post_id, image_url, sort_order) values ($1, $2, $3)', [
      Number(postId),
      imageUrl,
      index,
    ]);
  }
}

async function createPost(userId, payload) {
  validatePostPayload(payload);
  ensureDatabaseUrl();
  const client = await pool.connect();

  try {
    await client.query('begin');
    const timestamp = nowIso();
    const result = await client.query(
      `insert into posts
       (post_name, author_id, title, content, category, subcategory, price, status, trade_type, location,
        is_price_offer_allowed, recruitment_target, recruitment_current, tags, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15, $16)
       returning *`,
      [
        `post-${Date.now()}`,
        Number(userId),
        String(payload.title).trim(),
        String(payload.content).trim(),
        payload.category,
        payload.subcategory,
        payload.category === 'market' ? Number(payload.price) || 0 : null,
        payload.status || defaultStatusForCategory(payload.category),
        payload.category === 'market' ? payload.tradeType || 'direct' : null,
        payload.location || null,
        Boolean(payload.isPriceOfferAllowed),
        payload.category === 'recruit' ? Number(payload.recruitmentTarget) || null : null,
        payload.category === 'recruit' ? Number(payload.recruitmentCurrent) || 0 : null,
        JSON.stringify(Array.isArray(payload.tags) ? payload.tags : []),
        timestamp,
        timestamp,
      ]
    );
    await replacePostImages(client, result.rows[0].id, payload.images);
    await client.query('commit');
    return getPostDetail(result.rows[0].id, userId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function updatePost(userId, postId, payload) {
  validatePostPayload(payload);
  const post = await getPostById(postId);

  if (post.author_id !== Number(userId)) {
    throw createError(403, '본인이 작성한 게시글만 수정할 수 있습니다.');
  }

  ensureDatabaseUrl();
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query(
      `update posts
          set title = $1, content = $2, category = $3, subcategory = $4, price = $5, status = $6,
              trade_type = $7, location = $8, is_price_offer_allowed = $9, recruitment_target = $10,
              recruitment_current = $11, tags = $12::jsonb, updated_at = $13
        where id = $14`,
      [
        String(payload.title).trim(),
        String(payload.content).trim(),
        payload.category,
        payload.subcategory,
        payload.category === 'market' ? Number(payload.price) || 0 : null,
        payload.status || post.status,
        payload.category === 'market' ? payload.tradeType || 'direct' : null,
        payload.location || null,
        Boolean(payload.isPriceOfferAllowed),
        payload.category === 'recruit' ? Number(payload.recruitmentTarget) || null : null,
        payload.category === 'recruit' ? Number(payload.recruitmentCurrent) || 0 : null,
        JSON.stringify(Array.isArray(payload.tags) ? payload.tags : []),
        nowIso(),
        post.id,
      ]
    );
    await replacePostImages(client, post.id, payload.images);
    await client.query('commit');
    return getPostDetail(post.id, userId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function deletePost(userId, postId) {
  const post = await getPostById(postId);
  if (post.author_id !== Number(userId)) {
    throw createError(403, '본인이 작성한 게시글만 삭제할 수 있습니다.');
  }

  await query('delete from posts where id = $1', [post.id]);
}

async function createPostNotification({ recipientId, actorId, post, type, message }) {
  if (Number(recipientId) === Number(actorId)) {
    return;
  }

  await query(
    'insert into notifications (recipient_id, actor_id, post_id, type, message, created_at) values ($1, $2, $3, $4, $5, $6)',
    [Number(recipientId), Number(actorId), post.id, type, message, nowIso()]
  );
}

async function toggleLike(userId, postId) {
  const post = await getPostById(postId);
  const existing = await one('select id from post_likes where post_id = $1 and user_id = $2', [post.id, Number(userId)]);

  if (existing) {
    await query('delete from post_likes where id = $1', [existing.id]);
  } else {
    await query('insert into post_likes (post_id, user_id, created_at) values ($1, $2, $3)', [post.id, Number(userId), nowIso()]);
    const actor = await getUserById(userId);
    await createPostNotification({
      recipientId: post.author_id,
      actorId: userId,
      post,
      type: 'like',
      message: `${actor.nickname}님이 내 게시글을 찜했어요.`,
    });
  }

  return getPostDetail(postId, userId);
}

async function addComment(userId, postId, content) {
  const post = await getPostById(postId);
  if (!String(content || '').trim()) {
    throw createError(400, '댓글 내용을 입력해 주세요.');
  }

  await query('insert into comments (post_id, user_id, content, created_at) values ($1, $2, $3, $4)', [
    post.id,
    Number(userId),
    String(content).trim(),
    nowIso(),
  ]);
  await query('update posts set updated_at = $1 where id = $2', [nowIso(), post.id]);

  const actor = await getUserById(userId);
  await createPostNotification({
    recipientId: post.author_id,
    actorId: userId,
    post,
    type: 'comment',
    message: `${actor.nickname}님이 내 게시글에 댓글을 남겼어요.`,
  });

  return getPostDetail(postId, userId);
}

async function getNotifications(userId) {
  const notifications = await many(
    `select n.*, p.title as post_title, u.nickname, u.profile_image_url
       from notifications n
       join posts p on p.id = n.post_id
       join users u on u.id = n.actor_id
      where n.recipient_id = $1
      order by n.created_at desc, n.id desc`,
    [Number(userId)]
  );

  const mapped = notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    message: notification.message,
    postId: notification.post_id,
    postTitle: notification.post_title,
    createdAt: toIso(notification.created_at),
    readAt: notification.read_at ? toIso(notification.read_at) : null,
    actor: {
      id: notification.actor_id,
      nickname: notification.nickname,
      profileImageUrl: notification.profile_image_url,
    },
  }));

  return {
    notifications: mapped,
    unreadCount: mapped.filter((notification) => !notification.readAt).length,
  };
}

async function markNotificationsRead(userId) {
  await query('update notifications set read_at = coalesce(read_at, now()) where recipient_id = $1', [Number(userId)]);
  return getNotifications(userId);
}

function ensureRoomParticipant(room, userId) {
  if (room.seller_id !== Number(userId) && room.buyer_id !== Number(userId)) {
    throw createError(403, '채팅방에 접근할 수 없습니다.');
  }
}

async function getChatRooms(userId) {
  const rooms = await many(
    `select r.*, p.title as post_title,
            other_user.id as other_user_id, other_user.nickname, other_user.profile_image_url
       from chat_rooms r
       join posts p on p.id = r.post_id
       join users other_user on other_user.id = case when r.seller_id = $1 then r.buyer_id else r.seller_id end
      where r.seller_id = $1 or r.buyer_id = $1`,
    [Number(userId)]
  );

  const summaries = await Promise.all(
    rooms.map(async (room) => {
      const messages = (await many('select * from messages where room_id = $1 order by created_at asc, id asc', [room.id])).map(normalizeMessage);
      const lastMessage = messages[messages.length - 1];
      const unreadCount = messages.filter(
        (message) => message.sender_id !== Number(userId) && !(message.read_by || []).includes(Number(userId))
      ).length;

      return {
        id: room.id,
        postId: room.post_id,
        postTitle: room.post_title,
        otherUser: {
          id: room.other_user_id,
          nickname: room.nickname,
          profileImageUrl: room.profile_image_url,
        },
        lastMessage: lastMessage?.content || (lastMessage?.image_url ? '이미지를 보냈어요.' : ''),
        lastMessageAt: lastMessage?.created_at || toIso(room.created_at),
        unreadCount,
      };
    })
  );

  return summaries.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

async function openChatRoom(userId, postId) {
  const post = await getPostById(postId);
  if (post.author_id === Number(userId)) {
    throw createError(400, '내 게시글에는 채팅방을 열 수 없습니다.');
  }

  const room = await one(
    `insert into chat_rooms (post_id, seller_id, buyer_id, created_at)
     values ($1, $2, $3, $4)
     on conflict (post_id, seller_id, buyer_id) do update set post_id = excluded.post_id
     returning id`,
    [post.id, post.author_id, Number(userId), nowIso()]
  );

  return room.id;
}

async function getChatRoom(roomId) {
  const room = await one('select * from chat_rooms where id = $1', [Number(roomId)]);
  if (!room) {
    throw createError(404, '채팅방을 찾을 수 없습니다.');
  }
  return room;
}

async function markRoomMessagesRead(roomId, userId) {
  await query(
    `update messages
        set read_by = array_append(read_by, $2)
      where room_id = $1 and sender_id <> $2 and not ($2 = any(read_by))`,
    [Number(roomId), Number(userId)]
  );
}

async function getChatRoomDetail(userId, roomId) {
  const room = await getChatRoom(roomId);
  ensureRoomParticipant(room, userId);
  await markRoomMessagesRead(room.id, userId);

  const otherUser = await getUserById(room.seller_id === Number(userId) ? room.buyer_id : room.seller_id);
  const post = await getPostById(room.post_id);
  const messages = await many(
    `select m.*, u.nickname, u.profile_image_url
       from messages m
       join users u on u.id = m.sender_id
      where m.room_id = $1
      order by m.created_at asc, m.id asc`,
    [room.id]
  );

  return {
    id: room.id,
    postId: post.id,
    postTitle: post.title,
    otherUser: {
      id: otherUser.id,
      nickname: otherUser.nickname,
      profileImageUrl: otherUser.profile_image_url,
    },
    messages: messages.map((message) => ({
      id: message.id,
      clientId: message.client_id || null,
      content: message.content,
      imageUrl: message.image_url,
      createdAt: toIso(message.created_at),
      isMine: message.sender_id === Number(userId),
      sender: {
        id: message.sender_id,
        nickname: message.nickname,
        profileImageUrl: message.profile_image_url,
      },
    })),
  };
}

async function getChatMessagesAfter(userId, roomId, afterId) {
  const room = await getChatRoom(roomId);
  ensureRoomParticipant(room, userId);
  await markRoomMessagesRead(room.id, userId);

  const messages = await many(
    `select m.*, u.nickname, u.profile_image_url
       from messages m
       join users u on u.id = m.sender_id
      where m.room_id = $1 and m.id > $2
      order by m.id asc`,
    [room.id, Number(afterId) || 0]
  );

  return messages.map((message) => ({
    id: message.id,
    clientId: message.client_id || null,
    content: message.content,
    imageUrl: message.image_url,
    createdAt: toIso(message.created_at),
    isMine: message.sender_id === Number(userId),
    sender: {
      id: message.sender_id,
      nickname: message.nickname,
      profileImageUrl: message.profile_image_url,
    },
  }));
}

async function createChatMessage(userId, roomId, payload) {
  const room = await getChatRoom(roomId);
  ensureRoomParticipant(room, userId);
  if (!String(payload.content || '').trim() && !payload.imageUrl) {
    throw createError(400, '메시지 또는 이미지를 입력해 주세요.');
  }

  const message = normalizeMessage(
    await one(
      `insert into messages (room_id, sender_id, client_id, content, image_url, read_by, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [
        room.id,
        Number(userId),
        payload.clientId || null,
        String(payload.content || '').trim(),
        payload.imageUrl || null,
        [Number(userId)],
        nowIso(),
      ]
    )
  );
  const sender = await getUserById(message.sender_id);

  return {
    id: message.id,
    clientId: message.client_id || null,
    content: message.content,
    imageUrl: message.image_url,
    createdAt: message.created_at,
    isMine: true,
    sender: {
      id: sender.id,
      nickname: sender.nickname,
      profileImageUrl: sender.profile_image_url,
    },
  };
}

async function updateProfile(userId, payload) {
  const user = await getUserById(userId);
  if (!user) {
    throw createError(404, '사용자를 찾을 수 없습니다.');
  }

  if (payload.nickname && payload.nickname !== user.nickname && (await findUserByNickname(payload.nickname))) {
    throw createError(400, '이미 사용 중인 닉네임입니다.');
  }

  const updated = await one(
    `update users
        set nickname = $1, department = $2, student_year = $3, bio = $4, profile_image_url = $5
      where id = $6
      returning *`,
    [
      String(payload.nickname || user.nickname).trim(),
      String(payload.department || user.department).trim(),
      Number(payload.studentYear) || user.student_year,
      String(payload.bio || '').trim(),
      payload.profileImageUrl || user.profile_image_url,
      Number(userId),
    ]
  );

  return toUserSummary(normalizeUser(updated));
}

async function registerUser(payload) {
  await ensureVerifiedEmail(payload.email);

  if (await findUserByEmail(payload.email)) throw createError(400, '이미 등록된 이메일입니다.');
  if (await findUserByUsername(payload.username)) throw createError(400, '이미 사용 중인 아이디입니다.');
  if (await findUserByNickname(payload.nickname)) throw createError(400, '이미 사용 중인 닉네임입니다.');

  const user = normalizeUser(
    await one(
      `insert into users
       (email, username, password, nickname, department, student_year, bio, profile_image_url, manner_score, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, 36.5, $9)
       returning *`,
      [
        String(payload.email).trim().toLowerCase(),
        String(payload.username).trim(),
        String(payload.password),
        String(payload.nickname).trim(),
        String(payload.department || '자유전공학부').trim(),
        Number(payload.studentYear) || 1,
        '호랭마켓에 새로 합류했어요.',
        payload.profileImageUrl || '',
        nowIso(),
      ]
    )
  );

  await deleteVerificationCode(user.email);
  return user;
}

async function loginUser(username, password) {
  const user = await findUserByUsername(username);
  if (!user || user.password !== password) {
    throw createError(401, '아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  return user;
}

async function getSchemaMetadata() {
  const counts = {};
  for (const table of [
    'users',
    'posts',
    'post_images',
    'post_likes',
    'comments',
    'notifications',
    'chat_rooms',
    'messages',
    'sessions',
    'verification_codes',
  ]) {
    counts[table] = Number((await one(`select count(*)::int as count from ${table}`)).count);
  }

  return {
    version: schemaVersion,
    sql: schemaSql,
    storageType: 'supabase-postgres',
    counts,
  };
}

async function getHealth() {
  const stats = await one(
    `select
      (select count(*)::int from posts) as post_count,
      (select count(*)::int from users) as user_count`
  );
  const master = await findUserByUsername('horangmaster');

  return {
    ok: true,
    name: 'horang-market-api',
    storageType: 'supabase-postgres',
    schemaVersion,
    masterAccount: master
      ? {
          username: master.username,
          email: master.email,
        }
      : null,
    postCount: Number(stats.post_count),
    userCount: Number(stats.user_count),
  };
}

module.exports = {
  createError,
  findUserByEmail,
  findUserByUsername,
  findUserByNickname,
  toUserSummary,
  getAccountStats,
  createVerificationCode,
  deleteVerificationCode,
  verifyCode,
  createSession,
  getUserBySessionToken,
  getUserProfileImage,
  deleteSession,
  getFeed,
  getPostDetail,
  getPostCoverImage,
  getPostImage,
  getLikedPosts,
  getMyPosts,
  getNotifications,
  markNotificationsRead,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  openChatRoom,
  getChatRooms,
  getChatRoomDetail,
  getChatMessagesAfter,
  createChatMessage,
  updateProfile,
  registerUser,
  loginUser,
  getSchemaMetadata,
  getHealth,
};
