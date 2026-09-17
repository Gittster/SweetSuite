import { corsHeaders } from '../lib/cors.js';
import { getSession } from '../lib/session.js';
import { store } from '../lib/store.js';

export const handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed. Please use GET.' }) };
  }

  const session = getSession(event);
  if (!session) {
    return { statusCode: 200, headers, body: JSON.stringify({ authenticated: false }) };
  }

  let googleConnected = false;
  try {
    const refreshToken = await store().get('google-refresh-token');
    googleConnected = !!refreshToken;
  } catch (err) {
    console.error('auth-status.js: Failed to read blob store:', err);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ authenticated: true, email: session.email, googleConnected }),
  };
};
