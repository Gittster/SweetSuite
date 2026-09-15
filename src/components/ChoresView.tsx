import { useEffect, useState } from 'react'
import { people, tasks as initialTasks } from '../data/mockData'
import type { Recurrence, Task } from '../types'
import './ChoresView.css'

const STORAGE_KEY = 'sweetsuite.tasks.done'

const RECURRENCE_LABEL: Record<Recurrence, string> = {
  none: 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

function loadDoneOverrides(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveDoneOverrides(overrides: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall back to in-memory only
  }
}

export default function ChoresView() {
  const [filter, setFilter] = useState<string>('all')
  const [doneOverrides, setDoneOverrides] = useState<Record<string, boolean>>(loadDoneOverrides)

  useEffect(() => {
    saveDoneOverrides(doneOverrides)
  }, [doneOverrides])

  const tasks: Task[] = initialTasks.map((t) => ({
    ...t,
    done: doneOverrides[t.id] ?? t.done,
  }))

  const toggleDone = (id: string) => {
    setDoneOverrides((prev) => ({ ...prev, [id]: !tasks.find((t) => t.id === id)?.done }))
  }

  const visibleTasks = tasks.filter((t) => filter === 'all' || t.personId === filter)
  const remaining = visibleTasks.filter((t) => !t.done).length

  return (
    <div className="chores-view">
      <header className="chores-header">
        <h2>Chores</h2>
        <p className="chores-subtitle">{remaining} left to do</p>
        <div className="chores-filter">
          <button
            type="button"
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              className={filter === p.id ? 'active' : ''}
              style={filter === p.id ? { background: p.color, borderColor: p.color } : undefined}
              onClick={() => setFilter(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </header>

      <div className="chores-list">
        {visibleTasks.map((task) => {
          const person = people.find((p) => p.id === task.personId)
          return (
            <button
              key={task.id}
              type="button"
              className={`chore-item ${task.done ? 'done' : ''}`}
              onClick={() => toggleDone(task.id)}
            >
              <span className="chore-checkbox" style={{ borderColor: person?.color ?? '#999' }}>
                {task.done && <span className="chore-checkmark" style={{ background: person?.color }}>✓</span>}
              </span>
              <span className="chore-body">
                <span className="chore-title">{task.title}</span>
                <span className="chore-meta">
                  {person && (
                    <span className="chore-person" style={{ color: person.color }}>
                      {person.name}
                    </span>
                  )}
                  <span className="chore-recurrence">{RECURRENCE_LABEL[task.recurrence]}</span>
                </span>
              </span>
            </button>
          )
        })}
        {visibleTasks.length === 0 && <p className="empty-state">No chores here.</p>}
      </div>
    </div>
  )
}
