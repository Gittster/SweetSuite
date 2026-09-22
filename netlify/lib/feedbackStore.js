import crypto from 'node:crypto';
import { store } from './store.js';

const TICKETS_KEY = 'feedback-tickets';
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4MB raw per attachment
export const MAX_ATTACHMENTS_PER_SUBMISSION = 3;

export async function loadTickets() {
  const tickets = await store().get(TICKETS_KEY, { type: 'json' });
  return Array.isArray(tickets) ? tickets : [];
}

export function saveTickets(tickets) {
  return store().setJSON(TICKETS_KEY, tickets);
}

export function attachmentBlobKey(id) {
  return `feedback-attachment-${id}`;
}

// Persists each raw {filename, contentType, dataBase64} as its own blob and
// returns the lightweight {id, filename, contentType} records that get
// embedded in a ticket/reply — the tickets array itself never holds raw bytes.
export async function saveAttachments(rawAttachments) {
  if (!Array.isArray(rawAttachments) || rawAttachments.length === 0) return [];
  if (rawAttachments.length > MAX_ATTACHMENTS_PER_SUBMISSION) {
    const err = new Error(`Too many attachments (max ${MAX_ATTACHMENTS_PER_SUBMISSION} per submission).`);
    err.statusCode = 400;
    throw err;
  }

  const saved = [];
  for (const raw of rawAttachments) {
    if (!raw || typeof raw.dataBase64 !== 'string' || !raw.filename || !raw.contentType) continue;
    const buffer = Buffer.from(raw.dataBase64, 'base64');
    if (buffer.length > MAX_ATTACHMENT_BYTES) {
      const err = new Error(`"${raw.filename}" is too large (max ${Math.floor(MAX_ATTACHMENT_BYTES / (1024 * 1024))}MB per file).`);
      err.statusCode = 400;
      throw err;
    }
    const id = crypto.randomUUID();
    await store().set(attachmentBlobKey(id), buffer);
    saved.push({ id, filename: String(raw.filename).slice(0, 200), contentType: String(raw.contentType) });
  }
  return saved;
}

export function findAttachmentMeta(tickets, id) {
  for (const ticket of tickets) {
    const inTicket = (ticket.attachments || []).find((a) => a.id === id);
    if (inTicket) return inTicket;
    for (const reply of ticket.replies || []) {
      const inReply = (reply.attachments || []).find((a) => a.id === id);
      if (inReply) return inReply;
    }
  }
  return null;
}
