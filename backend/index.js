const http = require('http');
const {
  createError,
  createSession,
  createVerificationCode,
  deletePost,
  deleteSession,
  findUserByEmail,
  findUserByNickname,
  findUserByUsername,
  getAccountStats,
  getChatRoomDetail,
  getChatMessagesAfter,
  getChatRooms,
  getFeed,
  getHealth,
  getLikedPosts,
  getMyPosts,
  getPostDetail,
  getUserBySessionToken,
  loginUser,
  openChatRoom,
  registerUser,
  toUserSummary,
  toggleLike,
  updatePost,
  updateProfile,
  verifyCode,
  addComment,
  createChatMessage,
  createPost,
} = require('./db');
const { getUrl, parseCookies, readJson, sendEmpty, sendJson } = require('./http');

const PORT = Number(process.env.PORT || 4000);

function getSessionToken(req) {
  const headerToken = req.headers['x-session-token'];
  if (headerToken) {
    return String(headerToken);
  }

  const cookies = parseCookies(req);
  return cookies.horang_session || null;
}

function buildSessionCookie(token, maxAgeSeconds = 60 * 60 * 24 * 30) {
  return `horang_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function buildExpiredCookie() {
  return 'horang_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}

function requireUser(req) {
  const token = getSessionToken(req);
  const user = getUserBySessionToken(token);

  if (!user) {
    throw createError(401, '로그인이 필요합니다.');
  }

  return { user, token };
}

function validateSchoolEmail(email) {
  if (!/@korea\.ac\.kr$/i.test(String(email || '').trim())) {
    throw createError(400, '@korea.ac.kr 이메일만 가입할 수 있습니다.');
  }
}

async function handleRequest(req, res) {
  const url = getUrl(req);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    sendEmpty(req, res);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(req, res, 200, getHealth());
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/session') {
    const token = getSessionToken(req);
    const user = getUserBySessionToken(token);
    sendJson(req, res, 200, {
      user: user ? toUserSummary(user) : null,
      stats: user ? getAccountStats(user.id) : null,
      token: token || null,
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/check/email') {
    const email = url.searchParams.get('email') || '';
    sendJson(req, res, 200, { taken: Boolean(findUserByEmail(email)) });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/check/username') {
    const username = url.searchParams.get('username') || '';
    sendJson(req, res, 200, { taken: Boolean(findUserByUsername(username)) });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/check/nickname') {
    const nickname = url.searchParams.get('nickname') || '';
    sendJson(req, res, 200, { taken: Boolean(findUserByNickname(nickname)) });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/send-code') {
    const body = await readJson(req);
    validateSchoolEmail(body.email);

    if (findUserByEmail(body.email)) {
      throw createError(400, '이미 등록된 이메일입니다.');
    }

    const devCode = createVerificationCode(body.email);
    sendJson(req, res, 200, { ok: true, devCode });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/verify-code') {
    const body = await readJson(req);
    verifyCode(body.email, body.code);
    sendJson(req, res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/register') {
    const body = await readJson(req);
    validateSchoolEmail(body.email);
    const user = registerUser(body);
    const token = createSession(user.id, true);

    sendJson(
      req,
      res,
      201,
      {
        user: toUserSummary(user),
        token,
      },
      {
        'Set-Cookie': buildSessionCookie(token),
      }
    );
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await readJson(req);
    const user = loginUser(body.username, body.password);
    const keepLoggedIn = Boolean(body.keepLoggedIn);
    const token = createSession(user.id, keepLoggedIn);

    sendJson(
      req,
      res,
      200,
      {
        user: toUserSummary(user),
        token,
      },
      {
        'Set-Cookie': buildSessionCookie(token, keepLoggedIn ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7),
      }
    );
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    const token = getSessionToken(req);
    deleteSession(token);
    sendJson(req, res, 200, { ok: true }, { 'Set-Cookie': buildExpiredCookie() });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/feed') {
    const token = getSessionToken(req);
    const viewer = getUserBySessionToken(token);
    const posts = getFeed({
      viewerId: viewer?.id ?? null,
      board: url.searchParams.get('board') || 'main',
      type: url.searchParams.get('type') || null,
      subcategory: url.searchParams.get('subcategory') || null,
      query: url.searchParams.get('query') || null,
    });
    sendJson(req, res, 200, { posts });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/account/liked') {
    const { user } = requireUser(req);
    sendJson(req, res, 200, { posts: getLikedPosts(user.id) });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/account/posts') {
    const { user } = requireUser(req);
    sendJson(req, res, 200, { posts: getMyPosts(user.id) });
    return;
  }

  if (req.method === 'PATCH' && pathname === '/api/account/profile') {
    const { user } = requireUser(req);
    const body = await readJson(req);
    sendJson(req, res, 200, { user: updateProfile(user.id, body) });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/posts') {
    const { user } = requireUser(req);
    const body = await readJson(req);
    sendJson(req, res, 201, { post: createPost(user.id, body) });
    return;
  }

  const postMatch = pathname.match(/^\/api\/posts\/(\d+)$/);
  if (postMatch) {
    const postId = Number(postMatch[1]);

    if (req.method === 'GET') {
      const token = getSessionToken(req);
      const viewer = getUserBySessionToken(token);
      sendJson(req, res, 200, { post: getPostDetail(postId, viewer?.id ?? null) });
      return;
    }

    if (req.method === 'PATCH') {
      const { user } = requireUser(req);
      const body = await readJson(req);
      sendJson(req, res, 200, { post: updatePost(user.id, postId, body) });
      return;
    }

    if (req.method === 'DELETE') {
      const { user } = requireUser(req);
      deletePost(user.id, postId);
      sendJson(req, res, 200, { ok: true });
      return;
    }
  }

  const postLikeMatch = pathname.match(/^\/api\/posts\/(\d+)\/like$/);
  if (postLikeMatch && req.method === 'POST') {
    const { user } = requireUser(req);
    sendJson(req, res, 200, { post: toggleLike(user.id, Number(postLikeMatch[1])) });
    return;
  }

  const postCommentMatch = pathname.match(/^\/api\/posts\/(\d+)\/comments$/);
  if (postCommentMatch && req.method === 'POST') {
    const { user } = requireUser(req);
    const body = await readJson(req);
    sendJson(req, res, 201, { post: addComment(user.id, Number(postCommentMatch[1]), body.content) });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/chats/open') {
    const { user } = requireUser(req);
    const body = await readJson(req);
    sendJson(req, res, 200, { roomId: openChatRoom(user.id, body.postId) });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/chats') {
    const { user } = requireUser(req);
    sendJson(req, res, 200, { rooms: getChatRooms(user.id) });
    return;
  }

  const chatMatch = pathname.match(/^\/api\/chats\/(\d+)$/);
  if (chatMatch && req.method === 'GET') {
    const { user } = requireUser(req);
    sendJson(req, res, 200, { room: getChatRoomDetail(user.id, Number(chatMatch[1])) });
    return;
  }

  const messageMatch = pathname.match(/^\/api\/chats\/(\d+)\/messages$/);
  if (messageMatch && req.method === 'GET') {
    const { user } = requireUser(req);
    sendJson(req, res, 200, { messages: getChatMessagesAfter(user.id, Number(messageMatch[1]), url.searchParams.get('afterId')) });
    return;
  }

  if (messageMatch && req.method === 'POST') {
    const { user } = requireUser(req);
    const body = await readJson(req);
    sendJson(req, res, 201, { message: createChatMessage(user.id, Number(messageMatch[1]), body) });
    return;
  }

  throw createError(404, '요청한 경로를 찾을 수 없습니다.');
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    const statusCode = error.statusCode || 500;
    sendJson(req, res, statusCode, {
      message: error.message || '서버 오류가 발생했습니다.',
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Horang Market API listening on http://127.0.0.1:${PORT}`);
});
