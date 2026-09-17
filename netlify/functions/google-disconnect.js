import { corsHeaders } from '../lib/cors.js';
import { isAuthenticated } from '../lib/session.js';
import { store } from '../lib/store.js';

export const handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed. Please use POST.' }) };
  }
  if (!isAuthenticated(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Not authenticated.' }) };
  }

  try {
    await store().delete('google-refresh-token');
  } catch (err) {
    console.error('google-disconnect.js: Failed to delete blob:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to disconnect.' }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ googleConnected: false }) };
};
