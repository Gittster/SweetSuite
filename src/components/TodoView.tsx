import { useEffect, useRef, useState } from 'react'
import {
  addTodoItem,
  addTodoSection,
  deleteTodoItem,
  deleteTodoSection,
  getTodos,
  updateTodoItem,
  updateTodoSection,
  type TodoItemDto,
  type TodoSectionDto,
  type TodoSubtaskDto,
} from '../api/backend'
import { CheckIcon } from './Icons'
import LoadingOverlay from './LoadingOverlay'
import './TodoView.css'

function byOrder<T extends { order: number }>(a: T, b: T): number {
  return a.order - b.order
}

function uid(): string {
  return Math.random().toString(36).slice(2)
}

interface DragInfo {
  itemId: string
  fromSectionId: string
}

function TodoCard({
  item,
  onToggleDone,
  onDelete,
  onUpdate,
  expanded,
  onToggleExpanded,
  dragging,
  onDragStart,
}: {
  item: TodoItemDto
  onToggleDone: () => void
  onDelete: () => void
  onUpdate: (data: { title?: string; note?: string; dueDate?: string; subtasks?: TodoSubtaskDto[] }) => void
  expanded: boolean
  onToggleExpanded: () => void
  dragging: boolean
  onDragStart: (e: React.PointerEvent) => void
}) {
  const [newSubtask, setNewSubtask] = useState('')
  const remaining = item.subtasks.filter((s) => !s.done).length

  const setSubtasks = (subtasks: TodoSubtaskDto[]) => onUpdate({ subtasks })

  const handleAddSubtask = () => {
    const title = newSubtask.trim()
    if (!title) return
    setSubtasks([...item.subtasks, { id: uid(), title, done: false }])
    setNewSubtask('')
  }

  return (
    <div className={`todo-card ${item.done ? 'done' : ''} ${dragging ? 'dragging' : ''}`} data-item-id={item.id}>
      <div className="todo-card-row">
        <button
          type="button"
          className="todo-drag-handle"
          onPointerDown={onDragStart}
          aria-label="Drag to reorder"
        >
          ⠿
        </button>
        <button type="button" className="todo-check" onClick={onToggleDone} aria-label="Toggle done">
          {item.done && <CheckIcon className="todo-check-icon" />}
        </button>
        <button type="button" className="todo-title-btn" onClick={onToggleExpanded}>
          <span className="todo-title">{item.title}</span>
          <span className="todo-meta">
            {item.dueDate && <span className="todo-due">{item.dueDate}</span>}
            {item.subtasks.length > 0 && (
              <span className="todo-subtask-count">{item.subtasks.length - remaining}/{item.subtasks.length}</span>
            )}
          </span>
        </button>
        <button type="button" className="todo-delete" aria-label="Delete" onClick={onDelete}>✕</button>
      </div>

      {expanded && (
        <div className="todo-detail">
          <label className="todo-detail-field">
            Due date
            <input
              type="date"
              value={item.dueDate || ''}
              onChange={(e) => onUpdate({ dueDate: e.target.value || undefined })}
            />
          </label>
          <label className="todo-detail-field">
            Note
            <textarea
              defaultValue={item.note || ''}
              placeholder="Add a note…"
              onBlur={(e) => onUpdate({ note: e.target.value || undefined })}
            />
          </label>

          <div className="todo-subtasks">
            {item.subtasks.map((st) => (
              <div key={st.id} className="todo-subtask-row">
                <button
                  type="button"
                  className="todo-check small"
                  onClick={() =>
                    setSubtasks(item.subtasks.map((s) => (s.id === st.id ? { ...s, done: !s.done } : s)))
                  }
                >
                  {st.done && <CheckIcon className="todo-check-icon" />}
                </button>
                <span className={`todo-subtask-title ${st.done ? 'done' : ''}`}>{st.title}</span>
                <button
                  type="button"
                  className="todo-subtask-delete"
                  aria-label="Remove subtask"
                  onClick={() => setSubtasks(item.subtasks.filter((s) => s.id !== st.id))}
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="todo-subtask-add">
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a sub-task…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask()
                }}
              />
              <button type="button" onClick={handleAddSubtask}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TodoView() {
  const [sections, setSections] = useState<TodoSectionDto[]>([])
  const [items, setItems] = useState<TodoItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newItemText, setNewItemText] = useState<Record<string, string>>({})
  const [newSectionName, setNewSectionName] = useState('')
  const dragRef = useRef<DragInfo | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  useEffect(() => {
    getTodos()
      .then((res) => {
        setSections(res.sections)
        setItems(res.items)
      })
      .catch((err) => console.error('Failed to load to-dos:', err))
      .finally(() => setLoading(false))
  }, [])

  const itemsFor = (sectionId: string) => items.filter((i) => i.sectionId === sectionId).sort(byOrder)

  const handleToggleDone = (item: TodoItemDto) => {
    const nextDone = !item.done
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: nextDone } : i)))
    updateTodoItem(item.id, { done: nextDone }).catch((err) => console.error('Failed to update to-do:', err))
  }

  const handleUpdateItem = (item: TodoItemDto, data: Parameters<typeof updateTodoItem>[1]) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...data } : i)))
    updateTodoItem(item.id, data).catch((err) => console.error('Failed to update to-do:', err))
  }

  const handleDeleteItem = (item: TodoItemDto) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    deleteTodoItem(item.id).catch((err) => console.error('Failed to delete to-do:', err))
  }

  const handleAddItem = (sectionId: string) => {
    const title = (newItemText[sectionId] || '').trim()
    if (!title) return
    addTodoItem({ sectionId, title })
      .then(({ item }) => {
        setItems((prev) => [...prev, item])
        setNewItemText((prev) => ({ ...prev, [sectionId]: '' }))
      })
      .catch((err) => console.error('Failed to add to-do:', err))
  }

  const handleAddSection = () => {
    const name = newSectionName.trim()
    if (!name) return
    addTodoSection(name)
      .then(({ section }) => {
        setSections((prev) => [...prev, section])
        setNewSectionName('')
      })
      .catch((err) => console.error('Failed to add section:', err))
  }

  const handleRenameSection = (section: TodoSectionDto, name: string) => {
    if (!name.trim() || name.trim() === section.name) return
    setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, name: name.trim() } : s)))
    updateTodoSection(section.id, { name: name.trim() }).catch((err) => console.error('Failed to rename section:', err))
  }

  const handleDeleteSection = (section: TodoSectionDto) => {
    if (!window.confirm(`Delete "${section.name}" and everything in it?`)) return
    setSections((prev) => prev.filter((s) => s.id !== section.id))
    setItems((prev) => prev.filter((i) => i.sectionId !== section.id))
    deleteTodoSection(section.id).catch((err) => console.error('Failed to delete section:', err))
  }

  // Touch-friendly drag reorder: track the dragged item and, as the pointer moves,
  // splice it live into whichever section/position sits under the pointer — a
  // classic "reorder on hover" pattern that avoids the HTML5 DnD API, which
  // doesn't work on touchscreens.
  const handleDragStart = (item: TodoItemDto, e: React.PointerEvent) => {
    e.preventDefault()
    dragRef.current = { itemId: item.id, fromSectionId: item.sectionId }
    setDraggingId(item.id)
    document.body.classList.add('todo-dragging-active')

    const handleMove = (moveEvent: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const el = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)
      const sectionEl = el?.closest<HTMLElement>('[data-section-id]')
      if (!sectionEl) return
      const targetSectionId = sectionEl.dataset.sectionId!
      const cardEl = el?.closest<HTMLElement>('[data-item-id]')

      setItems((prev) => {
        const dragged = prev.find((i) => i.id === drag.itemId)
        if (!dragged) return prev
        const withoutDragged = prev.filter((i) => i.id !== drag.itemId)
        const targetList = withoutDragged.filter((i) => i.sectionId === targetSectionId).sort(byOrder)

        let insertAt = targetList.length
        if (cardEl && cardEl.dataset.itemId !== drag.itemId) {
          const overId = cardEl.dataset.itemId
          const idx = targetList.findIndex((i) => i.id === overId)
          if (idx !== -1) {
            const rect = cardEl.getBoundingClientRect()
            const before = moveEvent.clientY < rect.top + rect.height / 2
            insertAt = before ? idx : idx + 1
          }
        }

        targetList.splice(insertAt, 0, { ...dragged, sectionId: targetSectionId })
        const renumbered = targetList.map((i, idx) => ({ ...i, order: idx }))
        const others = withoutDragged.filter((i) => i.sectionId !== targetSectionId)
        return [...others, ...renumbered]
      })
    }

    const handleUp = () => {
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
      document.body.classList.remove('todo-dragging-active')
      setDraggingId(null)
      const drag = dragRef.current
      dragRef.current = null
      if (!drag) return

      // Persist final order/section for every item in the (possibly two)
      // affected sections, using the latest state via a functional read.
      setItems((current) => {
        const sectionIds = new Set(current.filter((i) => i.id === drag.itemId).map((i) => i.sectionId))
        sectionIds.add(drag.fromSectionId)
        for (const sid of sectionIds) {
          current
            .filter((i) => i.sectionId === sid)
            .sort(byOrder)
            .forEach((i, idx) => {
              updateTodoItem(i.id, { order: idx, sectionId: i.sectionId }).catch((err) =>
                console.error('Failed to persist to-do order:', err)
              )
            })
        }
        return current
      })
    }

    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
  }

  return (
    <div className="todo-view">
      <header className="todo-header">
        <h2>To-Do</h2>
        <p className="todo-subtitle">Shared family list</p>
      </header>

      <div className="todo-body">
        {loading && <LoadingOverlay label="Loading to-dos…" />}
        {!loading && (
          <div className="todo-sections">
            {sections.sort(byOrder).map((section) => (
              <div key={section.id} className="todo-section" data-section-id={section.id}>
                <div className="todo-section-header">
                  <input
                    className="todo-section-name"
                    defaultValue={section.name}
                    onBlur={(e) => handleRenameSection(section, e.target.value)}
                  />
                  <button
                    type="button"
                    className="todo-section-delete"
                    aria-label={`Delete ${section.name}`}
                    onClick={() => handleDeleteSection(section)}
                  >
                    ✕
                  </button>
                </div>

                <div className="todo-cards">
                  {itemsFor(section.id).map((item) => (
                    <TodoCard
                      key={item.id}
                      item={item}
                      expanded={expandedId === item.id}
                      onToggleExpanded={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                      onToggleDone={() => handleToggleDone(item)}
                      onDelete={() => handleDeleteItem(item)}
                      onUpdate={(data) => handleUpdateItem(item, data)}
                      dragging={draggingId === item.id}
                      onDragStart={(e) => handleDragStart(item, e)}
                    />
                  ))}
                  {itemsFor(section.id).length === 0 && <p className="empty-state small">Nothing here yet.</p>}
                </div>

                <div className="todo-add-item">
                  <input
                    value={newItemText[section.id] || ''}
                    onChange={(e) => setNewItemText((prev) => ({ ...prev, [section.id]: e.target.value }))}
                    placeholder="Add a to-do…"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddItem(section.id)
                    }}
                  />
                  <button type="button" onClick={() => handleAddItem(section.id)}>Add</button>
                </div>
              </div>
            ))}

            <div className="todo-section todo-add-section">
              <input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="New section…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSection()
                }}
              />
              <button type="button" onClick={handleAddSection}>Add Section</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
