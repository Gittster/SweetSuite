const { createToken } = require('../lib/token');

const SCOPE = 'openid email';
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes — just long enough for the account chooser

exports.handler = async (event) => {
  // No CORS headers: this responds with a 302 that the browser navigates to
  // directly, not a fetch() call.
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed. Please use GET.' };
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_AUTH_REDIRECT_URI, SESSION_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_AUTH_REDIRECT_URI || !SESSION_SECRET) {
    console.error('auth-google-start.js: Missing GOOGLE_CLIENT_ID, GOOGLE_AUTH_REDIRECT_URI, or SESSION_SECRET.');
    return { statusCode: 500, body: 'Sign-in is not configured.' };
  }

  const state = createToken({ exp: Date.now() + STATE_TTL_MS }, SESSION_SECRET);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_AUTH_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    state,
  });

  return {
    statusCode: 302,
    headers: { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` },
    body: '',
  };
};
