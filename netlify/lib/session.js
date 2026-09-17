import { createToken, verifyToken } from './token.js';

const COOKIE_NAME = 'sweetsuite_session';
const SESSION_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 days — this is a kiosk, sign in once

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

export function getSession(event) {
  const cookies = parseCookies(event);
  const claims = verifyToken(cookies[COOKIE_NAME], secret());
  if (!claims || typeof claims.exp !== 'number' || claims.exp <= Date.now()) return null;
  return claims;
}

export function isAuthenticated(event) {
  return !!getSession(event);
}

export function setSessionCookieHeader(email) {
  const token = createToken({ email, exp: Date.now() + SESSION_TTL_MS }, secret());
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
