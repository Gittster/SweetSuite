import { useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { people } from '../data/mockData'
import type { NewAppEvent } from '../api/backend'
import './AddEventModal.css'

interface AddEventModalProps {
  defaultDate: Date
  onClose: () => void
  onSubmit: (data: NewAppEvent) => void
}

export default function AddEventModal({ defaultDate, onClose, onSubmit }: AddEventModalProps) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => format(defaultDate, 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [personId, setPersonId] = useState('')
  const [location, setLocation] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      start: new Date(`${date}T${startTime}`).toISOString(),
      end: new Date(`${date}T${endTime}`).toISOString(),
      personId: personId || null,
      location: location.trim() || null,
    })
  }

  return (
    <div className="add-event-overlay" onClick={onClose}>
      <form className="add-event-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>Add Event</h3>

        <label className="add-event-field">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />
        </label>

        <label className="add-event-field">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>

        <div className="add-event-time-row">
          <label className="add-event-field">
            Start
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </label>
          <label className="add-event-field">
            End
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </label>
        </div>

        <label className="add-event-field">
          Who
          <select value={personId} onChange={(e) => setPersonId(e.target.value)}>
            <option value="">Family</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label className="add-event-field">
          Location (optional)
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>

        <div className="add-event-actions">
          <button type="button" className="add-event-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="add-event-submit">Add</button>
        </div>
      </form>
    </div>
  )
}
