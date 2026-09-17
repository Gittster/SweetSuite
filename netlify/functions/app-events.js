import crypto from 'node:crypto';
import { corsHeaders } from '../lib/cors.js';
import { isAuthenticated } from '../lib/session.js';
import { store } from '../lib/store.js';

const KEY = 'app-events';

async function loadEvents() {
  const events = await store().get(KEY, { type: 'json' });
  return Array.isArray(events) ? events : [];
}

export const handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (!isAuthenticated(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Not authenticated.' }) };
  }

  if (event.httpMethod === 'GET') {
    const events = await loadEvents();
    return { statusCode: 200, headers, body: JSON.stringify({ events }) };
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
    }
    if (!body.title || !body.start || !body.end) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required "title", "start", or "end".' }) };
    }

    const newEvent = {
      id: crypto.randomUUID(),
      title: String(body.title),
      start: String(body.start),
      end: String(body.end),
      personId: body.personId ? String(body.personId) : null,
      location: body.location ? String(body.location) : null,
      source: 'app',
    };

    const events = await loadEvents();
    events.push(newEvent);
    await store().setJSON(KEY, events);

    return { statusCode: 201, headers, body: JSON.stringify({ event: newEvent }) };
  }

  if (event.httpMethod === 'DELETE') {
    const id = (event.queryStringParameters || {}).id;
    if (!id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing "id" query parameter.' }) };
    }
    const events = await loadEvents();
    const filtered = events.filter((e) => e.id !== id);
    await store().setJSON(KEY, filtered);
    return { statusCode: 200, headers, body: JSON.stringify({ deleted: id }) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed.' }) };
};
