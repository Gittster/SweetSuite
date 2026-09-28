import crypto from 'node:crypto';
import { corsHeaders } from '../lib/cors.js';
import { isAuthenticated } from '../lib/session.js';
import { store } from '../lib/store.js';

const KEY = 'todos';

const DEFAULT_STATE = {
  sections: [
    { id: 'this-week', name: 'This Week', order: 0 },
    { id: 'someday', name: 'Someday', order: 1 },
  ],
  items: [],
};

async function loadState() {
  const state = await store().get(KEY, { type: 'json' });
  if (!state || !Array.isArray(state.sections) || !Array.isArray(state.items)) return DEFAULT_STATE;
  return state;
}

function saveState(state) {
  return store().setJSON(KEY, state);
}

export const handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (!isAuthenticated(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Not authenticated.' }) };
  }

  const params = event.queryStringParameters || {};
  const type = params.type === 'section' ? 'section' : 'item';
  const id = params.id;

  if (event.httpMethod === 'GET') {
    const state = await loadState();
    return { statusCode: 200, headers, body: JSON.stringify(state) };
  }

  let body = {};
  if (event.httpMethod === 'POST' || event.httpMethod === 'PATCH') {
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
    }
  }

  if (event.httpMethod === 'POST') {
    const state = await loadState();

    if (type === 'section') {
      if (!body.name || !String(body.name).trim()) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required "name".' }) };
      }
      const maxOrder = state.sections.reduce((m, s) => Math.max(m, s.order), -1);
      const section = { id: crypto.randomUUID(), name: String(body.name).trim(), order: maxOrder + 1 };
      state.sections.push(section);
      await saveState(state);
      return { statusCode: 201, headers, body: JSON.stringify({ section }) };
    }

    if (!body.title || !String(body.title).trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required "title".' }) };
    }
    if (!body.sectionId || !state.sections.some((s) => s.id === body.sectionId)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing or invalid "sectionId".' }) };
    }
    const maxOrder = state.items
      .filter((i) => i.sectionId === body.sectionId)
      .reduce((m, i) => Math.max(m, i.order), -1);
    const item = {
      id: crypto.randomUUID(),
      sectionId: body.sectionId,
      title: String(body.title).trim(),
      note: body.note ? String(body.note) : undefined,
      dueDate: body.dueDate ? String(body.dueDate) : undefined,
      done: false,
      order: maxOrder + 1,
      subtasks: [],
    };
    state.items.push(item);
    await saveState(state);
    return { statusCode: 201, headers, body: JSON.stringify({ item }) };
  }

  if (event.httpMethod === 'PATCH') {
    if (!id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing "id" query parameter.' }) };
    }
    const state = await loadState();

    if (type === 'section') {
      const section = state.sections.find((s) => s.id === id);
      if (!section) return { statusCode: 404, headers, body: JSON.stringify({ error: 'not found' }) };
      if (body.name !== undefined) section.name = String(body.name).trim() || section.name;
      if (body.order !== undefined) section.order = Number(body.order);
      await saveState(state);
      return { statusCode: 200, headers, body: JSON.stringify({ section }) };
    }

    const item = state.items.find((i) => i.id === id);
    if (!item) return { statusCode: 404, headers, body: JSON.stringify({ error: 'not found' }) };
    if (body.title !== undefined) item.title = String(body.title).trim() || item.title;
    if (body.note !== undefined) item.note = body.note ? String(body.note) : undefined;
    if (body.dueDate !== undefined) item.dueDate = body.dueDate ? String(body.dueDate) : undefined;
    if (body.done !== undefined) item.done = !!body.done;
    if (body.order !== undefined) item.order = Number(body.order);
    if (body.sectionId !== undefined) item.sectionId = String(body.sectionId);
    if (body.subtasks !== undefined && Array.isArray(body.subtasks)) {
      item.subtasks = body.subtasks.map((st) => ({
        id: st.id || crypto.randomUUID(),
        title: String(st.title || ''),
        done: !!st.done,
      }));
    }
    await saveState(state);
    return { statusCode: 200, headers, body: JSON.stringify({ item }) };
  }

  if (event.httpMethod === 'DELETE') {
    if (!id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing "id" query parameter.' }) };
    }
    const state = await loadState();

    if (type === 'section') {
      state.sections = state.sections.filter((s) => s.id !== id);
      state.items = state.items.filter((i) => i.sectionId !== id);
      await saveState(state);
      return { statusCode: 200, headers, body: JSON.stringify({ deleted: id }) };
    }

    state.items = state.items.filter((i) => i.id !== id);
    await saveState(state);
    return { statusCode: 200, headers, body: JSON.stringify({ deleted: id }) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed.' }) };
};
