import { createToken } from '../lib/token.js';
import { isAuthenticated } from '../lib/session.js';

const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes — just long enough for the consent screen

export const handler = async (event) => {
  // No CORS headers here: this responds with a 302 redirect that the browser
  // navigates to directly (not a fetch() call), so CORS doesn't apply.
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed. Please use GET.' };
  }
  if (!isAuthenticated(event)) {
    return { statusCode: 401, body: 'Not authenticated. Sign in first.' };
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CALENDAR_REDIRECT_URI, SESSION_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CALENDAR_REDIRECT_URI || !SESSION_SECRET) {
    console.error('google-oauth-start.js: Missing GOOGLE_CLIENT_ID, GOOGLE_CALENDAR_REDIRECT_URI, or SESSION_SECRET.');
    return { statusCode: 500, body: 'Google Calendar connection is not configured.' };
  }

  const state = createToken({ exp: Date.now() + STATE_TTL_MS }, SESSION_SECRET);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_CALENDAR_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return {
    statusCode: 302,
    headers: { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` },
    body: '',
  };
};
