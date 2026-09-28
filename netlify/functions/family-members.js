import crypto from 'node:crypto';
import { corsHeaders } from '../lib/cors.js';
import { isAuthenticated } from '../lib/session.js';
import { store } from '../lib/store.js';

const KEY = 'family-members';

const DEFAULT_MEMBERS = [
  { id: 'mom', name: 'Mom', color: '#c34a72' },
  { id: 'dad', name: 'Dad', color: '#3a6d8c' },
  { id: 'kiddo', name: 'Kiddo', color: '#d99a2b' },
  { id: 'family', name: 'Family', color: '#4c7a5e' },
];

async function loadMembers() {
  const members = await store().get(KEY, { type: 'json' });
  return Array.isArray(members) ? members : DEFAULT_MEMBERS;
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
    const members = await loadMembers();
    return { statusCode: 200, headers, body: JSON.stringify({ members }) };
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
    }
    if (!body.name || !String(body.name).trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required "name".' }) };
    }

    const newMember = {
      id: crypto.randomUUID(),
      name: String(body.name).trim(),
      color: body.color ? String(body.color) : '#999999',
    };

    const members = await loadMembers();
    members.push(newMember);
    await store().setJSON(KEY, members);

    return { statusCode: 201, headers, body: JSON.stringify({ member: newMember }) };
  }

  if (event.httpMethod === 'PATCH') {
    const id = (event.queryStringParameters || {}).id;
    if (!id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing "id" query parameter.' }) };
    }
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
    }

    const members = await loadMembers();
    const member = members.find((m) => m.id === id);
    if (!member) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'not found' }) };
    }
    if (body.name !== undefined) member.name = String(body.name).trim() || member.name;
    if (body.color !== undefined) member.color = String(body.color);
    await store().setJSON(KEY, members);

    return { statusCode: 200, headers, body: JSON.stringify({ member }) };
  }

  if (event.httpMethod === 'DELETE') {
    const id = (event.queryStringParameters || {}).id;
    if (!id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing "id" query parameter.' }) };
    }
    const members = await loadMembers();
    const filtered = members.filter((m) => m.id !== id);
    await store().setJSON(KEY, filtered);
    return { statusCode: 200, headers, body: JSON.stringify({ deleted: id }) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed.' }) };
};
