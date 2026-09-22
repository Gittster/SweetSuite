import crypto from 'node:crypto';
import { corsHeaders } from '../lib/cors.js';
import { getSession } from '../lib/session.js';
import { loadTickets, saveTickets, saveAttachments } from '../lib/feedbackStore.js';

function lastActivity(ticket) {
  const times = [ticket.createdAt, ...(ticket.replies || []).map((r) => r.createdAt)].map((t) => new Date(t).getTime());
  return Math.max(...times);
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
    const tickets = await loadTickets();
    const sorted = [...tickets].sort((a, b) => lastActivity(b) - lastActivity(a));
    return { statusCode: 200, headers, body: JSON.stringify({ tickets: sorted }) };
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
    }
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required "title".' }) };
    }
    const description = typeof body.description === 'string' ? body.description.trim() : '';

    let attachments;
    try {
      attachments = await saveAttachments(body.attachments);
    } catch (err) {
      return { statusCode: err.statusCode || 500, headers, body: JSON.stringify({ error: err.message }) };
    }

    const ticket = {
      id: crypto.randomUUID(),
      title,
      description,
      authorEmail: session.email,
      createdAt: new Date().toISOString(),
      attachments,
      replies: [],
    };

    const tickets = await loadTickets();
    tickets.push(ticket);
    await saveTickets(tickets);

    return { statusCode: 201, headers, body: JSON.stringify({ ticket }) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed.' }) };
};
