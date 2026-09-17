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
import { addAppEvent, deleteAppEvent, getAppEvents, getCalendarEvents, type NewAppEvent } from '../api/backend'
import { getMealPlan } from '../api/erinsList'
import { events as mockEvents, people } from '../data/mockData'
import type { CalendarEvent } from '../types'
import AddEventModal from './AddEventModal'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'
import LoadingOverlay from './LoadingOverlay'
import RecipeView from './RecipeView'
import './CalendarView.css'

type ViewMode = 'day' | 'week' | 'month' | 'schedule'

const MAX_TILES_PER_DAY = 3
const FETCH_RANGE_DAYS_BACK = 30
const FETCH_RANGE_DAYS_FORWARD = 60
const MEAL_COLOR = '#7b5ea7'

const personById = new Map(people.map((p) => [p.id, p]))

function colorFor(event: CalendarEvent): string {
  if (event.source === 'meal') return MEAL_COLOR
  const person = event.personId ? personById.get(event.personId) : undefined
  return person?.color ?? '#999'
}

function eventsOnDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((e) => isSameDay(new Date(e.start), day))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}

function EventChip({
  event,
  onDelete,
  onOpenRecipe,
}: {
  event: CalendarEvent
  onDelete?: (id: string) => void
  onOpenRecipe?: (recipeId: string) => void
}) {
  const person = event.personId ? personById.get(event.personId) : undefined
  const openable = event.source === 'meal' && event.recipeId && onOpenRecipe
  return (
    <div
      className={`event-chip ${openable ? 'clickable' : ''}`}
      style={{ borderLeftColor: colorFor(event) }}
      onClick={openable ? () => onOpenRecipe!(event.recipeId!) : undefined}
    >
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
      {event.source === 'meal' && (
        <span className="event-chip-person" style={{ background: MEAL_COLOR }}>
          Meal
        </span>
      )}
      {event.source === 'app' && onDelete && (
        <button
          type="button"
          className="event-chip-delete"
          aria-label="Delete event"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(event.id)
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

function DayDetail({
  events,
  day,
  onDelete,
  onOpenRecipe,
}: {
  events: CalendarEvent[]
  day: Date
  onDelete: (id: string) => void
  onOpenRecipe: (recipeId: string) => void
}) {
  const dayEvents = eventsOnDay(events, day)
  return (
    <div className="day-detail">
      <h3>{format(day, 'EEEE, MMMM d')}</h3>
      {dayEvents.length === 0 ? (
        <p className="empty-state">No events</p>
      ) : (
        <div className="event-list">
          {dayEvents.map((e) => (
            <EventChip key={e.id} event={e} onDelete={onDelete} onOpenRecipe={onOpenRecipe} />
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
              {visible.map((e) => (
                <span
                  key={e.id}
                  className="month-grid-tile"
                  style={{ background: colorFor(e) }}
                >
                  {e.title}
                </span>
              ))}
              {overflow > 0 && <span className="month-grid-more">+{overflow} more</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function WeekView({
  events,
  selectedDate,
  onDelete,
  onOpenRecipe,
}: {
  events: CalendarEvent[]
  selectedDate: Date
  onDelete: (id: string) => void
  onOpenRecipe: (recipeId: string) => void
}) {
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
                <EventChip key={e.id} event={e} onDelete={onDelete} onOpenRecipe={onOpenRecipe} />
              ))}
              {dayEvents.length === 0 && <p className="empty-state small">—</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ScheduleView({
  events,
  onDelete,
  onOpenRecipe,
}: {
  events: CalendarEvent[]
  onDelete: (id: string) => void
  onOpenRecipe: (recipeId: string) => void
}) {
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
              <EventChip key={e.id} event={e} onDelete={onDelete} onOpenRecipe={onOpenRecipe} />
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
  const [syncedEvents, setSyncedEvents] = useState<CalendarEvent[]>([])
  const [appEvents, setAppEvents] = useState<CalendarEvent[]>([])
  const [mealEvents, setMealEvents] = useState<CalendarEvent[]>([])
  const [usingLiveData, setUsingLiveData] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const start = addDays(new Date(), -FETCH_RANGE_DAYS_BACK)
    const end = addDays(new Date(), FETCH_RANGE_DAYS_FORWARD)

    Promise.allSettled([
      getCalendarEvents(start.toISOString(), end.toISOString()),
      getAppEvents(),
      getMealPlan(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')),
    ]).then(([calResult, appResult, mealResult]) => {
      if (calResult.status === 'fulfilled') {
        setSyncedEvents(calResult.value.events.map((e) => ({ ...e, location: e.location ?? undefined, personId: undefined })))
        setUsingLiveData(true)
      } else {
        console.error('Failed to fetch Google Calendar events, showing demo data:', calResult.reason)
        setSyncedEvents(mockEvents)
      }

      if (appResult.status === 'fulfilled') {
        setAppEvents(appResult.value.events.map((e) => ({ ...e, personId: e.personId ?? undefined, location: e.location ?? undefined })))
      } else {
        console.error('Failed to fetch app-added events:', appResult.reason)
      }

      if (mealResult.status === 'fulfilled') {
        setMealEvents(
          mealResult.value.meals
            .filter((m) => m.date)
            .map((m) => ({
              id: `meal-${m.id}`,
              title: m.recipeName || 'Meal',
              start: `${m.date}T12:00:00`,
              end: `${m.date}T12:30:00`,
              source: 'meal' as const,
              recipeId: m.recipeId ?? undefined,
            }))
        )
      } else {
        console.error('Failed to fetch planned meals for the calendar:', mealResult.reason)
      }

      setLoading(false)
    })
  }, [])

  const allEvents = useMemo(() => [...syncedEvents, ...appEvents, ...mealEvents], [syncedEvents, appEvents, mealEvents])

  const handleAddEvent = (data: NewAppEvent) => {
    addAppEvent(data)
      .then(({ event }) => {
        setAppEvents((prev) => [...prev, { ...event, personId: event.personId ?? undefined, location: event.location ?? undefined }])
        setShowAddModal(false)
      })
      .catch((err) => console.error('Failed to add event:', err))
  }

  const handleDeleteEvent = (id: string) => {
    setAppEvents((prev) => prev.filter((e) => e.id !== id))
    deleteAppEvent(id).catch((err) => console.error('Failed to delete event:', err))
  }

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
          <button type="button" className="calendar-add-btn" onClick={() => setShowAddModal(true)}>+ Add</button>
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
        {!loading && !usingLiveData && (
          <p className="calendar-demo-note">Showing demo data — connect Google Calendar in Setup.</p>
        )}
        <div className="calendar-legend">
          {people.map((p) => (
            <span key={p.id} className="legend-item">
              <span className="legend-dot" style={{ background: p.color }} />
              {p.name}
            </span>
          ))}
          <span className="legend-item">
            <span className="legend-dot" style={{ background: MEAL_COLOR }} />
            Meals
          </span>
        </div>
      </header>

      <div className="calendar-body">
        {loading && <LoadingOverlay label="Loading calendar…" />}
        {!loading && (
          <>
            {view === 'month' && (
              <>
                <MonthGrid events={allEvents} selectedDate={selectedDate} onSelect={setSelectedDate} />
                <DayDetail events={allEvents} day={selectedDate} onDelete={handleDeleteEvent} onOpenRecipe={setOpenRecipeId} />
              </>
            )}
            {view === 'week' && (
              <WeekView events={allEvents} selectedDate={selectedDate} onDelete={handleDeleteEvent} onOpenRecipe={setOpenRecipeId} />
            )}
            {view === 'day' && (
              <DayDetail events={allEvents} day={selectedDate} onDelete={handleDeleteEvent} onOpenRecipe={setOpenRecipeId} />
            )}
            {view === 'schedule' && (
              <ScheduleView events={allEvents} onDelete={handleDeleteEvent} onOpenRecipe={setOpenRecipeId} />
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <AddEventModal
          defaultDate={selectedDate}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddEvent}
        />
      )}

      {openRecipeId && <RecipeView recipeId={openRecipeId} onClose={() => setOpenRecipeId(null)} />}
    </div>
  )
}
