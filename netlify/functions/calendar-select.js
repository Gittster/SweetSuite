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

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
  }
  if (!body.calendarId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing "calendarId".' }) };
  }

  await store().set('selected-calendar-id', body.calendarId);
  return { statusCode: 200, headers, body: JSON.stringify({ calendarId: body.calendarId }) };
};
