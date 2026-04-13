const { URL } = require('url');

function getUrl(req) {
  return new URL(req.url || '/', 'http://127.0.0.1');
}

function getCorsHeaders(req) {
  const origin = req.headers.origin || '*';

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, x-session-token',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  };
}

function sendJson(req, res, statusCode, payload, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...getCorsHeaders(req),
    ...extraHeaders,
  };

  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(payload));
}

function sendEmpty(req, res, statusCode = 204, extraHeaders = {}) {
  res.writeHead(statusCode, {
    ...getCorsHeaders(req),
    ...extraHeaders,
  });
  res.end();
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
    });

    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(Object.assign(new Error('JSON 형식이 올바르지 않습니다.'), { statusCode: 400 }));
      }
    });

    req.on('error', reject);
  });
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) {
    return {};
  }

  return header.split(';').reduce((acc, item) => {
    const [key, ...rest] = item.trim().split('=');
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

module.exports = {
  getUrl,
  sendJson,
  sendEmpty,
  readJson,
  parseCookies,
};
