const { createToken, verifyToken } = require('./token');

const COOKIE_NAME = 'sweetsuite_setup';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not configured.');
  return s;
}

function parseCookies(event) {
  const header = event.headers.cookie || event.headers.Cookie || '';
  const cookies = {};
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key) cookies[key] = decodeURIComponent(rest.join('='));
  }
  return cookies;
}

function isAuthenticated(event) {
  const cookies = parseCookies(event);
  const claims = verifyToken(cookies[COOKIE_NAME], secret());
  return !!claims && typeof claims.exp === 'number' && claims.exp > Date.now();
}

function setSessionCookieHeader() {
  const token = createToken({ exp: Date.now() + SESSION_TTL_MS }, secret());
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`;
}

function clearSessionCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}

module.exports = {
  isAuthenticated,
  setSessionCookieHeader,
  clearSessionCookieHeader,
};
