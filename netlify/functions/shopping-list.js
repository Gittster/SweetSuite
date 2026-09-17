import crypto from 'node:crypto';
import { corsHeaders } from '../lib/cors.js';
import { getSession } from '../lib/session.js';
import { fetchErinsList, postErinsList } from '../lib/erinsList.js';
import { store } from '../lib/store.js';

// Local items you add from SweetSuite that don't exist in ErinsList's own
// shopping list. Merged with ErinsList's ingredients at read time and tagged
// with `source` so the UI can show where each one came from.
const EXTRA_ITEMS_KEY = 'shopping-extra-items';

async function loadExtraItems() {
  const items = await store().get(EXTRA_ITEMS_KEY, { type: 'json' });
  return Array.isArray(items) ? items : [];
}

function saveExtraItems(items) {
  return store().setJSON(EXTRA_ITEMS_KEY, items);
}

export const handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const session = getSession(event);
  if (!session) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Not authenticated.' }) };
  }

  if (event.httpMethod === 'GET') {
    try {
      const { ingredients } = await fetchErinsList('/get-shopping-list', session.email);
      const extraItems = await loadExtraItems();
      const items = [
        ...ingredients.map((ing, i) => ({
          id: `el-${i}`,
          name: ing.name,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          checked: !!ing.checked,
          source: 'erinslist',
        })),
        ...extraItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: null,
          unit: null,
          checked: !!item.checked,
          source: 'app',
        })),
      ];
      return { statusCode: 200, headers, body: JSON.stringify({ items }) };
    } catch (err) {
      console.error('shopping-list.js: Failed to fetch from ErinsList:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to fetch shopping list.' }) };
    }
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
    }
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required "name".' }) };
    }

    const newItem = { id: crypto.randomUUID(), name, checked: false };
    const extraItems = await loadExtraItems();
    extraItems.push(newItem);
    await saveExtraItems(extraItems);

    return { statusCode: 201, headers, body: JSON.stringify({ item: { ...newItem, quantity: null, unit: null, source: 'app' } }) };
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
    if (typeof body.checked !== 'boolean') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing or invalid "checked".' }) };
    }

    if (id.startsWith('el-')) {
      const index = Number(id.slice(3));
      if (!Number.isInteger(index) || index < 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid item id.' }) };
      }
      try {
        await postErinsList('/update-shopping-item', session.email, { index, checked: body.checked });
        return { statusCode: 200, headers, body: JSON.stringify({ id, checked: body.checked }) };
      } catch (err) {
        console.error('shopping-list.js: Failed to update ErinsList item:', err);
        return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to update ErinsList shopping item.' }) };
      }
    }

    const extraItems = await loadExtraItems();
    const item = extraItems.find((i) => i.id === id);
    if (!item) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Item not found.' }) };
    }
    item.checked = body.checked;
    await saveExtraItems(extraItems);
    return { statusCode: 200, headers, body: JSON.stringify({ id, checked: body.checked }) };
  }

  if (event.httpMethod === 'DELETE') {
    const id = (event.queryStringParameters || {}).id;
    if (!id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing "id" query parameter.' }) };
    }
    if (id.startsWith('el-')) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'ErinsList items can only be removed from ErinsList.' }) };
    }
    const extraItems = await loadExtraItems();
    const filtered = extraItems.filter((i) => i.id !== id);
    await saveExtraItems(filtered);
    return { statusCode: 200, headers, body: JSON.stringify({ deleted: id }) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed.' }) };
};
