import crypto from 'node:crypto';
import { corsHeaders } from '../lib/cors.js';
import { getSession } from '../lib/session.js';
import { loadTickets, saveTickets, saveAttachments } from '../lib/feedbackStore.js';

export const handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed. Please use POST.' }) };
  }

  const session = getSession(event);
  if (!session) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Not authenticated.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
  }

  const ticketId = typeof body.ticketId === 'string' ? body.ticketId : '';
  const replyBody = typeof body.body === 'string' ? body.body.trim() : '';
  if (!ticketId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required "ticketId".' }) };
  }
  if (!replyBody && !(Array.isArray(body.attachments) && body.attachments.length)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Reply needs a message or an attachment.' }) };
  }

  let attachments;
  try {
    attachments = await saveAttachments(body.attachments);
  } catch (err) {
    return { statusCode: err.statusCode || 500, headers, body: JSON.stringify({ error: err.message }) };
  }

  const tickets = await loadTickets();
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Ticket not found.' }) };
  }

  const reply = {
    id: crypto.randomUUID(),
    authorEmail: session.email,
    body: replyBody,
    createdAt: new Date().toISOString(),
    attachments,
  };
  ticket.replies = ticket.replies || [];
  ticket.replies.push(reply);
  await saveTickets(tickets);

  return { statusCode: 201, headers, body: JSON.stringify({ reply }) };
};
