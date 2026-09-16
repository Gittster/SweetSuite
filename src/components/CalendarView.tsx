import { useEffect, useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import { getCalendarEvents, isBackendConfigured } from '../api/backend'
import { events as mockEvents, people } from '../data/mockData'
import type { CalendarEvent } from '../types'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'
import './CalendarView.css'

type ViewMode = 'day' | 'week' | 'month' | 'schedule'

const MAX_TILES_PER_DAY = 3
const FETCH_RANGE_DAYS_BACK = 30
const FETCH_RANGE_DAYS_FORWARD = 60

const personById = new Map(people.map((p) => [p.id, p]))

function eventsOnDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((e) => isSameDay(new Date(e.start), day))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}

function EventChip({ event }: { event: CalendarEvent }) {
  const person = event.personId ? personById.get(event.personId) : undefined
  return (
    <div className="event-chip" style={{ borderLeftColor: person?.color ?? '#999' }}>
      <div className="event-chip-time">{format(new Date(event.start), 'h:mm a')}</div>
      <div className="event-chip-body">
        <div className="event-chip-title">{event.title}</div>
        {event.location && <div className="event-chip-location">{event.location}</div>}
      </div>
      {person && (
        <span className="event-chip-person" style={{ background: person.color }}>
          {person.name}
        </span>
      )}
    </div>
  )
}

function DayDetail({ events, day }: { events: CalendarEvent[]; day: Date }) {
  const dayEvents = eventsOnDay(events, day)
  return (
    <div className="day-detail">
      <h3>{format(day, 'EEEE, MMMM d')}</h3>
      {dayEvents.length === 0 ? (
        <p className="empty-state">No events</p>
      ) : (
        <div className="event-list">
          {dayEvents.map((e) => (
            <EventChip key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  )
}

function MonthGrid({
  events,
  selectedDate,
  onSelect,
}: {
  events: CalendarEvent[]
  selectedDate: Date
  onSelect: (d: Date) => void
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(selectedDate))
    const end = endOfWeek(endOfMonth(selectedDate))
    return eachDayOfInterval({ start, end })
  }, [selectedDate])

  return (
    <div className="month-grid">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
        <div key={d} className="month-grid-weekday">
          {d}
        </div>
      ))}
      {days.map((day) => {
        const dayEvents = eventsOnDay(events, day)
        const inMonth = isSameMonth(day, selectedDate)
        const selected = isSameDay(day, selectedDate)
        const visible = dayEvents.slice(0, MAX_TILES_PER_DAY)
        const overflow = dayEvents.length - visible.length
        return (
          <button
            key={day.toISOString()}
            type="button"
            className={`month-grid-cell ${inMonth ? '' : 'outside'} ${selected ? 'selected' : ''} ${isToday(day) ? 'today' : ''}`}
            onClick={() => onSelect(day)}
          >
            <span className="month-grid-daynum">{format(day, 'd')}</span>
            <span className="month-grid-tiles">
              {visible.map((e) => {
                const person = e.personId ? personById.get(e.personId) : undefined
                return (
                  <span
                    key={e.id}
                    className="month-grid-tile"
                    style={{ background: person?.color ?? '#999' }}
                  >
                    {e.title}
                  </span>
                )
              })}
              {overflow > 0 && <span className="month-grid-more">+{overflow} more</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function WeekView({ events, selectedDate }: { events: CalendarEvent[]; selectedDate: Date }) {
  const days = useMemo(() => {
    const start = startOfWeek(selectedDate)
    return eachDayOfInterval({ start, end: endOfWeek(selectedDate) })
  }, [selectedDate])

  return (
    <div className="week-view">
      {days.map((day) => {
        const dayEvents = eventsOnDay(events, day)
        return (
          <div key={day.toISOString()} className={`week-view-day ${isToday(day) ? 'today' : ''}`}>
            <div className="week-view-day-header">{format(day, 'EEE d')}</div>
            <div className="event-list">
              {dayEvents.map((e) => (
                <EventChip key={e.id} event={e} />
              ))}
              {dayEvents.length === 0 && <p className="empty-state small">—</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ScheduleView({ events }: { events: CalendarEvent[] }) {
  const upcoming = useMemo(() => {
    const today = startOfDay(new Date())
    const byDay = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const day = startOfDay(new Date(e.start))
      if (day < today) continue
      const key = day.toISOString()
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key)!.push(e)
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, evts]) => ({
        day: new Date(key),
        events: evts.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
      }))
  }, [events])

  return (
    <div className="schedule-view">
      {upcoming.length === 0 && <p className="empty-state">No upcoming events</p>}
      {upcoming.map(({ day, events: dayEvents }) => (
        <div key={day.toISOString()} className="schedule-day">
          <h3>{format(day, 'EEEE, MMMM d')}</h3>
          <div className="event-list">
            {dayEvents.map((e) => (
              <EventChip key={e.id} event={e} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CalendarView() {
  const [view, setView] = useState<ViewMode>('month')
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents)
  const [usingLiveData, setUsingLiveData] = useState(false)

  useEffect(() => {
    if (!isBackendConfigured()) return

    const start = addDays(new Date(), -FETCH_RANGE_DAYS_BACK).toISOString()
    const end = addDays(new Date(), FETCH_RANGE_DAYS_FORWARD).toISOString()
    getCalendarEvents(start, end)
      .then(({ events: apiEvents }) => {
        setEvents(apiEvents.map((e) => ({ ...e, location: e.location ?? undefined, personId: undefined })))
        setUsingLiveData(true)
      })
      .catch((err) => {
        console.error('Failed to fetch Google Calendar events, showing demo data:', err)
      })
  }, [])

  const goToday = () => setSelectedDate(new Date())
  const goPrev = () => {
    if (view === 'week') setSelectedDate((d) => subWeeks(d, 1))
    else if (view === 'day') setSelectedDate((d) => addDays(d, -1))
    else setSelectedDate((d) => subMonths(d, 1))
  }
  const goNext = () => {
    if (view === 'week') setSelectedDate((d) => addWeeks(d, 1))
    else if (view === 'day') setSelectedDate((d) => addDays(d, 1))
    else setSelectedDate((d) => addMonths(d, 1))
  }

  return (
    <div className="calendar-view">
      <header className="calendar-header">
        <div className="calendar-nav">
          <button type="button" className="calendar-nav-btn" onClick={goPrev} aria-label="Previous">
            <ChevronLeftIcon className="calendar-nav-icon" />
          </button>
          <button type="button" className="calendar-today-btn" onClick={goToday}>Today</button>
          <button type="button" className="calendar-nav-btn" onClick={goNext} aria-label="Next">
            <ChevronRightIcon className="calendar-nav-icon" />
          </button>
          <h2>{format(selectedDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}</h2>
        </div>
        <div className="calendar-view-toggle">
          {(['day', 'week', 'month', 'schedule'] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              className={view === v ? 'active' : ''}
              onClick={() => setView(v)}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        {!usingLiveData && (
          <p className="calendar-demo-note">Showing demo data — connect Google Calendar in Setup.</p>
        )}
        <div className="calendar-legend">
          {people.map((p) => (
            <span key={p.id} className="legend-item">
              <span className="legend-dot" style={{ background: p.color }} />
              {p.name}
            </span>
          ))}
        </div>
      </header>

      <div className="calendar-body">
        {view === 'month' && (
          <>
            <MonthGrid events={events} selectedDate={selectedDate} onSelect={setSelectedDate} />
            <DayDetail events={events} day={selectedDate} />
          </>
        )}
        {view === 'week' && <WeekView events={events} selectedDate={selectedDate} />}
        {view === 'day' && <DayDetail events={events} day={selectedDate} />}
        {view === 'schedule' && <ScheduleView events={events} />}
      </div>
    </div>
  )
}
