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

  const params = event.queryStringParameters || {};
  const query = new URLSearchParams();
  if (params.start) query.set('start', params.start);
  if (params.end) query.set('end', params.end);
  const qs = query.toString();

  try {
    const data = await fetchErinsList(`/get-meal-plan${qs ? `?${qs}` : ''}`);
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    console.error('meal-plan.js: Failed to fetch from ErinsList:', err);
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to fetch meal plan.' }) };
  }
};
