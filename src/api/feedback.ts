export interface FeedbackAttachment {
  id: string
  filename: string
  contentType: string
}

export interface FeedbackReply {
  id: string
  authorEmail: string
  body: string
  createdAt: string
  attachments: FeedbackAttachment[]
}

export interface FeedbackTicket {
  id: string
  title: string
  description: string
  authorEmail: string
  createdAt: string
  attachments: FeedbackAttachment[]
  replies: FeedbackReply[]
}

export interface NewAttachment {
  filename: string
  contentType: string
  dataBase64: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/.netlify/functions${path}`, { credentials: 'include', ...init })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export function getFeedbackTickets(): Promise<{ tickets: FeedbackTicket[] }> {
  return request('/feedback-tickets')
}

export function createFeedbackTicket(input: {
  title: string
  description: string
  attachments: NewAttachment[]
}): Promise<{ ticket: FeedbackTicket }> {
  return request('/feedback-tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function addFeedbackReply(input: {
  ticketId: string
  body: string
  attachments: NewAttachment[]
}): Promise<{ reply: FeedbackReply }> {
  return request('/feedback-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function feedbackAttachmentUrl(id: string): string {
  return `/.netlify/functions/feedback-attachment?id=${encodeURIComponent(id)}`
}

export function fileToAttachment(file: File): Promise<NewAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const dataBase64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
      resolve({ filename: file.name || 'attachment', contentType: file.type || 'application/octet-stream', dataBase64 })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
