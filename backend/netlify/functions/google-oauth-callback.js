const { verifyToken } = require('../../lib/token');
const { store } = require('../../lib/store');

function redirectTo(path) {
  const base = (process.env.FRONTEND_ORIGIN || '').replace(/\/$/, '');
  return { statusCode: 302, headers: { Location: `${base}${path}` }, body: '' };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed. Please use GET.' };
  }

  const { code, state, error: googleError } = event.queryStringParameters || {};
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, SESSION_SECRET } = process.env;

  if (googleError) {
    console.error('google-oauth-callback.js: Google returned an error:', googleError);
    return redirectTo('/?setup=error');
  }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI || !SESSION_SECRET) {
    console.error('google-oauth-callback.js: Missing required environment variables.');
    return redirectTo('/?setup=error');
  }
  if (!code || !verifyToken(state, SESSION_SECRET)) {
    console.error('google-oauth-callback.js: Missing code or invalid/expired state.');
    return redirectTo('/?setup=error');
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.refresh_token) {
      console.error('google-oauth-callback.js: Token exchange failed or no refresh_token returned:', tokenData);
      return redirectTo('/?setup=error');
    }

    await store().set('google-refresh-token', tokenData.refresh_token);
    return redirectTo('/?setup=connected');
  } catch (err) {
    console.error('google-oauth-callback.js: Token exchange threw:', err);
    return redirectTo('/?setup=error');
  }
};
