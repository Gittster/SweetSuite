import { corsHeaders } from '../lib/cors.js';
import { clearSessionCookieHeader } from '../lib/session.js';

export const handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed. Please use POST.' }) };
  }

  return {
    statusCode: 200,
    headers: { ...headers, 'Set-Cookie': clearSessionCookieHeader() },
    body: JSON.stringify({ authenticated: false }),
  };
};
