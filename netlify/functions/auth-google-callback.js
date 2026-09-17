import { verifyToken } from '../lib/token.js';
import { setSessionCookieHeader } from '../lib/session.js';
import { isEmailAllowed } from '../lib/allowedEmails.js';

function redirectTo(path, extraHeaders = {}) {
  const base = (process.env.FRONTEND_ORIGIN || '').replace(/\/$/, '');
  return { statusCode: 302, headers: { Location: `${base}${path}`, ...extraHeaders }, body: '' };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed. Please use GET.' };
  }

  const { code, state, error: googleError } = event.queryStringParameters || {};
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_AUTH_REDIRECT_URI, SESSION_SECRET } = process.env;

  if (googleError) {
    console.error('auth-google-callback.js: Google returned an error:', googleError);
    return redirectTo('/?auth=error');
  }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_AUTH_REDIRECT_URI || !SESSION_SECRET) {
    console.error('auth-google-callback.js: Missing required environment variables.');
    return redirectTo('/?auth=error');
  }
  if (!code || !verifyToken(state, SESSION_SECRET)) {
    console.error('auth-google-callback.js: Missing code or invalid/expired state.');
    return redirectTo('/?auth=error');
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_AUTH_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('auth-google-callback.js: Token exchange failed:', tokenData);
      return redirectTo('/?auth=error');
    }

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userInfoRes.json();
    if (!userInfoRes.ok || !userInfo.email) {
      console.error('auth-google-callback.js: Failed to fetch userinfo:', userInfo);
      return redirectTo('/?auth=error');
    }

    if (!userInfo.email_verified || !isEmailAllowed(userInfo.email)) {
      return redirectTo('/?auth=denied');
    }

    return redirectTo('/?auth=success', { 'Set-Cookie': setSessionCookieHeader(userInfo.email) });
  } catch (err) {
    console.error('auth-google-callback.js: Sign-in flow threw:', err);
    return redirectTo('/?auth=error');
  }
};
