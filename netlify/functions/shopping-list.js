import { corsHeaders } from '../lib/cors.js';
import { isAuthenticated } from '../lib/session.js';
import { fetchErinsList } from '../lib/erinsList.js';

export const handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed. Please use GET.' }) };
  }
  if (!isAuthenticated(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Not authenticated.' }) };
  }

  try {
    const data = await fetchErinsList('/get-shopping-list');
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    console.error('shopping-list.js: Failed to fetch from ErinsList:', err);
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to fetch shopping list.' }) };
  }
};
