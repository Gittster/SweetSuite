import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type FormEvent } from 'react'
import { format } from 'date-fns'
import {
  addFeedbackReply,
  createFeedbackTicket,
  feedbackAttachmentUrl,
  fileToAttachment,
  getFeedbackTickets,
  type FeedbackAttachment,
  type FeedbackReply,
  type FeedbackTicket,
  type NewAttachment,
} from '../api/feedback'
import { ChatIcon, ChevronLeftIcon, PaperclipIcon } from './Icons'
import LoadingOverlay from './LoadingOverlay'
import './FeedbackWidget.css'

const MAX_ATTACHMENTS = 3

function isImage(contentType: string): boolean {
  return contentType.startsWith('image/')
}

function imagesFromClipboard(e: ClipboardEvent<HTMLTextAreaElement>): File[] {
  const items = e.clipboardData?.items
  if (!items) return []
  const images: File[] = []
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) images.push(file)
    }
  }
  return images
}

function AttachButton({ onFiles, disabled }: { onFiles: (files: File[]) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <button
        type="button"
        className="feedback-attach-btn"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <PaperclipIcon className="feedback-attach-icon" />
        Attach
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.log"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) onFiles(Array.from(e.target.files))
          e.target.value = ''
        }}
      />
    </>
  )
}

function AttachmentPreview({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  if (files.length === 0) return null
  return (
    <div className="feedback-attachment-chips">
      {files.map((file, i) => (
        <span key={i} className="feedback-attachment-chip">
          {file.name}
          <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${file.name}`}>×</button>
        </span>
      ))}
    </div>
  )
}

function AttachedFiles({ attachments }: { attachments: FeedbackAttachment[] }) {
  if (!attachments || attachments.length === 0) return null
  return (
    <div className="feedback-attached-files">
      {attachments.map((a) =>
        isImage(a.contentType) ? (
          <a key={a.id} href={feedbackAttachmentUrl(a.id)} target="_blank" rel="noreferrer" className="feedback-attached-image">
            <img src={feedbackAttachmentUrl(a.id)} alt={a.filename} />
          </a>
        ) : (
          <a key={a.id} href={feedbackAttachmentUrl(a.id)} target="_blank" rel="noreferrer" className="feedback-attached-file">
            {a.filename}
          </a>
        )
      )}
    </div>
  )
}

function TicketList({ tickets, onSelect }: { tickets: FeedbackTicket[]; onSelect: (id: string) => void }) {
  if (tickets.length === 0) {
    return <p className="empty-state">No feedback yet — be the first to share an idea.</p>
  }
  return (
    <ul className="feedback-ticket-list">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <button type="button" className="feedback-ticket-row" onClick={() => onSelect(ticket.id)}>
            <span className="feedback-ticket-title">{ticket.title}</span>
            <span className="feedback-ticket-meta">
              {ticket.authorEmail} · {format(new Date(ticket.createdAt), 'MMM d')}
              {ticket.replies.length > 0 &&
                ` · ${ticket.replies.length} repl${ticket.replies.length === 1 ? 'y' : 'ies'}`}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function TicketDetail({ ticket, onReplied }: { ticket: FeedbackTicket; onReplied: (reply: FeedbackReply) => void }) {
  const [replyBody, setReplyBody] = useState('')
  const [replyFiles, setReplyFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addFiles = (newFiles: File[]) => {
    setReplyFiles((prev) => [...prev, ...newFiles].slice(0, MAX_ATTACHMENTS))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!replyBody.trim() && replyFiles.length === 0) return
    setSubmitting(true)
    setError(null)
    try {
      const attachments: NewAttachment[] = await Promise.all(replyFiles.map(fileToAttachment))
      const { reply } = await addFeedbackReply({ ticketId: ticket.id, body: replyBody.trim(), attachments })
      onReplied(reply)
      setReplyBody('')
      setReplyFiles([])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="feedback-ticket-detail">
      <div className="feedback-thread">
        <div className="feedback-message">
          <div className="feedback-message-meta">
            {ticket.authorEmail} · {format(new Date(ticket.createdAt), 'MMM d, h:mm a')}
          </div>
          <div className="feedback-message-title">{ticket.title}</div>
          {ticket.description && <p className="feedback-message-body">{ticket.description}</p>}
          <AttachedFiles attachments={ticket.attachments} />
        </div>

        {ticket.replies.map((reply) => (
          <div key={reply.id} className="feedback-message reply">
            <div className="feedback-message-meta">
              {reply.authorEmail} · {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
            </div>
            {reply.body && <p className="feedback-message-body">{reply.body}</p>}
            <AttachedFiles attachments={reply.attachments} />
          </div>
        ))}
      </div>

      <form className="feedback-reply-form" onSubmit={handleSubmit}>
        {error && <p className="feedback-form-error">{error}</p>}
        <AttachmentPreview files={replyFiles} onRemove={(i) => setReplyFiles((prev) => prev.filter((_, idx) => idx !== i))} />
        <textarea
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          onPaste={(e) => {
            const images = imagesFromClipboard(e)
            if (images.length) addFiles(images)
          }}
          placeholder="Write a reply… (paste a screenshot to attach it)"
          rows={2}
        />
        <div className="feedback-reply-actions">
          <AttachButton onFiles={addFiles} disabled={replyFiles.length >= MAX_ATTACHMENTS} />
          <button
            type="submit"
            className="feedback-submit-btn"
            disabled={submitting || (!replyBody.trim() && replyFiles.length === 0)}
          >
            {submitting ? 'Sending…' : 'Reply'}
          </button>
        </div>
      </form>
    </div>
  )
}

function NewTicketForm({ onCreated, onCancel }: { onCreated: (ticket: FeedbackTicket) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles].slice(0, MAX_ATTACHMENTS))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const attachments: NewAttachment[] = await Promise.all(files.map(fileToAttachment))
      const { ticket } = await createFeedbackTicket({ title: title.trim(), description: description.trim(), attachments })
      onCreated(ticket)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="feedback-new-form" onSubmit={handleSubmit}>
      <p className="feedback-hint">Visible to everyone signed into this dashboard.</p>
      {error && <p className="feedback-form-error">{error}</p>}
      <label className="feedback-field">
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />
      </label>
      <label className="feedback-field">
        Details (optional)
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onPaste={(e) => {
            const images = imagesFromClipboard(e)
            if (images.length) addFiles(images)
          }}
          placeholder="What's the idea or issue? Paste a screenshot to attach it."
          rows={5}
        />
      </label>
      <AttachmentPreview files={files} onRemove={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))} />
      <div className="feedback-new-actions">
        <AttachButton onFiles={addFiles} disabled={files.length >= MAX_ATTACHMENTS} />
        <div className="feedback-new-actions-right">
          <button type="button" className="feedback-cancel-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="feedback-submit-btn" disabled={submitting || !title.trim()}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </form>
  )
}

type PanelView = 'list' | 'new'

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [tickets, setTickets] = useState<FeedbackTicket[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<PanelView>('list')

  const load = () => {
    setLoading(true)
    setError(null)
    getFeedbackTickets()
      .then((res) => setTickets(res.tickets))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (open && tickets === null && !loading) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const selectedTicket = useMemo(() => tickets?.find((t) => t.id === selectedId) ?? null, [tickets, selectedId])

  const handleClose = () => {
    setOpen(false)
    setSelectedId(null)
    setView('list')
  }

  const handleCreated = (ticket: FeedbackTicket) => {
    setTickets((current) => (current ? [ticket, ...current] : [ticket]))
    setView('list')
    setSelectedId(ticket.id)
  }

  const handleReplied = (ticketId: string, reply: FeedbackReply) => {
    setTickets((current) =>
      current ? current.map((t) => (t.id === ticketId ? { ...t, replies: [...t.replies, reply] } : t)) : current
    )
  }

  const showingDetail = !!selectedTicket
  const headerTitle = showingDetail ? 'Feedback' : view === 'new' ? 'New Feedback' : 'Feedback'

  return (
    <>
      <button type="button" className="feedback-fab" onClick={() => setOpen(true)} aria-label="Give feedback">
        <ChatIcon className="feedback-fab-icon" />
      </button>

      {open && (
        <div className="feedback-overlay" onClick={handleClose}>
          <div className="feedback-panel" onClick={(e) => e.stopPropagation()}>
            <header className="feedback-header">
              {showingDetail || view === 'new' ? (
                <button
                  type="button"
                  className="feedback-back-btn"
                  onClick={() => {
                    setSelectedId(null)
                    setView('list')
                  }}
                  aria-label="Back"
                >
                  <ChevronLeftIcon className="feedback-back-icon" />
                </button>
              ) : (
                <span className="feedback-header-spacer" />
              )}
              <h2>{headerTitle}</h2>
              <div className="feedback-header-actions">
                {!showingDetail && view === 'list' && (
                  <button type="button" className="feedback-new-btn" onClick={() => setView('new')}>+ New</button>
                )}
                <button type="button" className="feedback-close-btn" onClick={handleClose} aria-label="Close">✕</button>
              </div>
            </header>

            <div className="feedback-body">
              {loading && <LoadingOverlay label="Loading feedback…" />}
              {error && (
                <div className="feedback-error">
                  <p>Couldn't load feedback: {error}</p>
                  <button type="button" onClick={load}>Try again</button>
                </div>
              )}

              {!loading && !error && showingDetail && selectedTicket && (
                <TicketDetail ticket={selectedTicket} onReplied={(reply) => handleReplied(selectedTicket.id, reply)} />
              )}

              {!loading && !error && !showingDetail && view === 'list' && (
                <TicketList tickets={tickets ?? []} onSelect={setSelectedId} />
              )}

              {!loading && !error && !showingDetail && view === 'new' && (
                <NewTicketForm onCreated={handleCreated} onCancel={() => setView('list')} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
