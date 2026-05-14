const http = require('http');
const {
  addComment,
  createChatMessage,
  createError,
  createPost,
  createSession,
  createVerificationCode,
  deleteVerificationCode,
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
  getNotifications,
  getPostCoverImage,
  getPostDetail,
  getPostImage,
  getSchemaMetadata,
  getUserBySessionToken,
  getUserProfileImage,
  loginUser,
  markNotificationsRead,
  openChatRoom,
  registerUser,
  toUserSummary,
  toggleLike,
  updatePost,
  updateProfile,
  verifyCode,
} = require('./database');
const { getCorsHeaders, getUrl, parseCookies, readJson, sendEmpty, sendJson } = require('./http');
const { sendVerificationEmail } = require('./mailer');

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

function getRequestBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || `127.0.0.1:${PORT}`;
  return `${proto}://${host}`;
}

function compactPostImages(req, posts) {
  const baseUrl = getRequestBaseUrl(req);

  return posts.map((post) => ({
    ...post,
    coverImageUrl: post.coverImageUrl ? `${baseUrl}/api/posts/${post.id}/cover-image` : '',
    author: {
      ...post.author,
      profileImageUrl: post.author.profileImageUrl ? `${baseUrl}/api/users/${post.author.id}/profile-image` : '',
    },
  }));
}

function compactPostDetail(req, post) {
  const baseUrl = getRequestBaseUrl(req);

  return {
    ...post,
    coverImageUrl: post.coverImageUrl ? `${baseUrl}/api/posts/${post.id}/cover-image` : '',
    images: post.images.map((imageUrl, index) => (imageUrl ? `${baseUrl}/api/posts/${post.id}/images/${index}` : '')),
    author: {
      ...post.author,
      profileImageUrl: post.author.profileImageUrl ? `${baseUrl}/api/users/${post.author.id}/profile-image` : '',
    },
    comments: post.comments.map((comment) => ({
      ...comment,
      author: {
        ...comment.author,
        profileImageUrl: comment.author.profileImageUrl ? `${baseUrl}/api/users/${comment.author.id}/profile-image` : '',
      },
    })),
  };
}

function decodeDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^,]*),(.*)$/s);
  if (!match) {
    return null;
  }

  const metadata = match[1] || 'application/octet-stream';
  const encodedBody = match[2] || '';
  const mimeType = metadata.split(';')[0] || 'application/octet-stream';
  const isBase64 = metadata.split(';').includes('base64');

  return {
    mimeType,
    body: isBase64 ? Buffer.from(encodedBody, 'base64') : Buffer.from(decodeURIComponent(encodedBody), 'utf8'),
  };
}

function sendImage(req, res, imageUrl) {
  if (!imageUrl) {
    throw createError(404, 'Image not found.');
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    res.writeHead(302, {
      ...getCorsHeaders(req),
      Location: imageUrl,
      'Cache-Control': 'public, max-age=86400',
    });
    res.end();
    return;
  }

  const decoded = decodeDataUrl(imageUrl);
  if (!decoded) {
    throw createError(404, 'Image not found.');
  }

  res.writeHead(200, {
    ...getCorsHeaders(req),
    'Content-Type': decoded.mimeType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  });
  res.end(decoded.body);
}

async function requireUser(req) {
  const token = getSessionToken(req);
  const user = await getUserBySessionToken(token);

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
    sendJson(req, res, 200, await getHealth());
    return;
  }

  if (req.method === 'GET' && pathname === '/api/meta/schema') {
    sendJson(req, res, 200, await getSchemaMetadata());
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/session') {
    const token = getSessionToken(req);
    const user = await getUserBySessionToken(token);
    sendJson(req, res, 200, {
      user: user ? toUserSummary(user) : null,
      stats: user ? await getAccountStats(user.id) : null,
      token: token || null,
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/check/email') {
    sendJson(req, res, 200, { taken: Boolean(await findUserByEmail(url.searchParams.get('email') || '')) });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/check/username') {
    sendJson(req, res, 200, { taken: Boolean(await findUserByUsername(url.searchParams.get('username') || '')) });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/check/nickname') {
    sendJson(req, res, 200, { taken: Boolean(await findUserByNickname(url.searchParams.get('nickname') || '')) });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/send-code') {
    const body = await readJson(req);
    validateSchoolEmail(body.email);

    if (await findUserByEmail(body.email)) {
      throw createError(400, '이미 등록된 이메일입니다.');
    }

    const verificationCode = await createVerificationCode(body.email);
    try {
      await sendVerificationEmail(String(body.email).trim().toLowerCase(), verificationCode);
    } catch (error) {
      await deleteVerificationCode(body.email);
      throw createError(500, `인증번호 이메일 발송에 실패했습니다. ${error.message || '메일 설정을 확인해 주세요.'}`);
    }

    sendJson(req, res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/verify-code') {
    const body = await readJson(req);
    await verifyCode(body.email, body.code);
    sendJson(req, res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/register') {
    const body = await readJson(req);
    validateSchoolEmail(body.email);

    const user = await registerUser(body);
    const token = await createSession(user.id, true);

    sendJson(req, res, 201, { user: toUserSummary(user), token }, { 'Set-Cookie': buildSessionCookie(token) });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await readJson(req);
    const user = await loginUser(body.username, body.password);
    const keepLoggedIn = Boolean(body.keepLoggedIn);
    const token = await createSession(user.id, keepLoggedIn);

    sendJson(
      req,
      res,
      200,
      { user: toUserSummary(user), token },
      { 'Set-Cookie': buildSessionCookie(token, keepLoggedIn ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7) }
    );
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    await deleteSession(getSessionToken(req));
    sendJson(req, res, 200, { ok: true }, { 'Set-Cookie': buildExpiredCookie() });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/feed') {
    const viewer = await getUserBySessionToken(getSessionToken(req));
    const posts = await getFeed({
      viewerId: viewer?.id ?? null,
      board: url.searchParams.get('board') || 'main',
      type: url.searchParams.get('type') || null,
      subcategory: url.searchParams.get('subcategory') || null,
      query: url.searchParams.get('query') || null,
    });
    sendJson(req, res, 200, { posts: compactPostImages(req, posts) });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/account/liked') {
    const { user } = await requireUser(req);
    sendJson(req, res, 200, { posts: compactPostImages(req, await getLikedPosts(user.id)) });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/account/posts') {
    const { user } = await requireUser(req);
    sendJson(req, res, 200, { posts: compactPostImages(req, await getMyPosts(user.id)) });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/notifications') {
    const { user } = await requireUser(req);
    sendJson(req, res, 200, await getNotifications(user.id));
    return;
  }

  if (req.method === 'POST' && pathname === '/api/notifications/read') {
    const { user } = await requireUser(req);
    sendJson(req, res, 200, await markNotificationsRead(user.id));
    return;
  }

  if (req.method === 'PATCH' && pathname === '/api/account/profile') {
    const { user } = await requireUser(req);
    const body = await readJson(req);
    sendJson(req, res, 200, { user: await updateProfile(user.id, body) });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/posts') {
    const { user } = await requireUser(req);
    const body = await readJson(req);
    sendJson(req, res, 201, { post: compactPostDetail(req, await createPost(user.id, body)) });
    return;
  }

  const coverImageMatch = pathname.match(/^\/api\/posts\/(\d+)\/cover-image$/);
  if (coverImageMatch && req.method === 'GET') {
    sendImage(req, res, await getPostCoverImage(Number(coverImageMatch[1])));
    return;
  }

  const postImageMatch = pathname.match(/^\/api\/posts\/(\d+)\/images\/(\d+)$/);
  if (postImageMatch && req.method === 'GET') {
    sendImage(req, res, await getPostImage(Number(postImageMatch[1]), Number(postImageMatch[2])));
    return;
  }

  const profileImageMatch = pathname.match(/^\/api\/users\/(\d+)\/profile-image$/);
  if (profileImageMatch && req.method === 'GET') {
    sendImage(req, res, await getUserProfileImage(Number(profileImageMatch[1])));
    return;
  }

  const postMatch = pathname.match(/^\/api\/posts\/(\d+)$/);
  if (postMatch) {
    const postId = Number(postMatch[1]);

    if (req.method === 'GET') {
      const viewer = await getUserBySessionToken(getSessionToken(req));
      const post = await getPostDetail(postId, viewer?.id ?? null);
      sendJson(req, res, 200, {
        post: url.searchParams.get('includeImageData') === '1' ? post : compactPostDetail(req, post),
      });
      return;
    }

    if (req.method === 'PATCH') {
      const { user } = await requireUser(req);
      const body = await readJson(req);
      sendJson(req, res, 200, { post: compactPostDetail(req, await updatePost(user.id, postId, body)) });
      return;
    }

    if (req.method === 'DELETE') {
      const { user } = await requireUser(req);
      await deletePost(user.id, postId);
      sendJson(req, res, 200, { ok: true });
      return;
    }
  }

  const likeMatch = pathname.match(/^\/api\/posts\/(\d+)\/like$/);
  if (likeMatch && req.method === 'POST') {
    const { user } = await requireUser(req);
    sendJson(req, res, 200, { post: compactPostDetail(req, await toggleLike(user.id, Number(likeMatch[1]))) });
    return;
  }

  const commentMatch = pathname.match(/^\/api\/posts\/(\d+)\/comments$/);
  if (commentMatch && req.method === 'POST') {
    const { user } = await requireUser(req);
    const body = await readJson(req);
    sendJson(req, res, 201, {
      post: compactPostDetail(req, await addComment(user.id, Number(commentMatch[1]), body.content)),
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/chats/open') {
    const { user } = await requireUser(req);
    const body = await readJson(req);
    sendJson(req, res, 200, { roomId: await openChatRoom(user.id, body.postId) });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/chats') {
    const { user } = await requireUser(req);
    sendJson(req, res, 200, { rooms: await getChatRooms(user.id) });
    return;
  }

  const chatMatch = pathname.match(/^\/api\/chats\/(\d+)$/);
  if (chatMatch && req.method === 'GET') {
    const { user } = await requireUser(req);
    sendJson(req, res, 200, { room: await getChatRoomDetail(user.id, Number(chatMatch[1])) });
    return;
  }

  const messageMatch = pathname.match(/^\/api\/chats\/(\d+)\/messages$/);
  if (messageMatch && req.method === 'GET') {
    const { user } = await requireUser(req);
    sendJson(req, res, 200, {
      messages: await getChatMessagesAfter(user.id, Number(messageMatch[1]), url.searchParams.get('afterId')),
    });
    return;
  }

  if (messageMatch && req.method === 'POST') {
    const { user } = await requireUser(req);
    const body = await readJson(req);
    sendJson(req, res, 201, { message: await createChatMessage(user.id, Number(messageMatch[1]), body) });
    return;
  }

  throw createError(404, '요청한 경로를 찾을 수 없습니다.');
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    sendJson(req, res, error.statusCode || 500, {
      message: error.message || '서버 오류가 발생했습니다.',
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Horang Market API listening on http://127.0.0.1:${PORT}`);
});

module.exports = {
  server,
};
