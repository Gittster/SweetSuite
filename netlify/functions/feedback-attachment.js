import { corsHeaders } from '../lib/cors.js';
import { getSession } from '../lib/session.js';
import { store } from '../lib/store.js';
import { loadTickets, findAttachmentMeta, attachmentBlobKey } from '../lib/feedbackStore.js';

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
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Not authenticated.' }) };
  }

  const id = (event.queryStringParameters || {}).id;
  if (!id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing "id" query parameter.' }) };
  }

  const tickets = await loadTickets();
  const meta = findAttachmentMeta(tickets, id);
  if (!meta) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Attachment not found.' }) };
  }

  const data = await store().get(attachmentBlobKey(id), { type: 'arrayBuffer' });
  if (!data) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Attachment not found.' }) };
  }

  return {
    statusCode: 200,
    headers: {
      ...headers,
      'Content-Type': meta.contentType,
      'Content-Disposition': `inline; filename="${meta.filename.replace(/"/g, '')}"`,
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
    body: Buffer.from(data).toString('base64'),
    isBase64Encoded: true,
  };
};
