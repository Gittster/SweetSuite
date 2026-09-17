import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { addShoppingItem, deleteShoppingItem, getShoppingList, toggleShoppingItem, type ShoppingItem } from '../api/erinsList'
import './ShoppingView.css'

export default function ShoppingView() {
  const [items, setItems] = useState<ShoppingItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [adding, setAdding] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    getShoppingList()
      .then((res) => setItems(res.items))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const sortedItems = useMemo(() => {
    if (!items) return []
    return [...items].sort((a, b) => Number(a.checked) - Number(b.checked))
  }, [items])

  const handleToggle = (item: ShoppingItem) => {
    if (!items) return
    const nextChecked = !item.checked
    setActionError(null)
    setItems(items.map((i) => (i.id === item.id ? { ...i, checked: nextChecked } : i)))
    toggleShoppingItem(item.id, nextChecked).catch((err: Error) => {
      setItems((current) => current?.map((i) => (i.id === item.id ? { ...i, checked: item.checked } : i)) ?? null)
      setActionError(err.message)
    })
  }

  const handleDelete = (item: ShoppingItem) => {
    if (!items) return
    setActionError(null)
    const previous = items
    setItems(items.filter((i) => i.id !== item.id))
    deleteShoppingItem(item.id).catch((err: Error) => {
      setItems(previous)
      setActionError(err.message)
    })
  }

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    const name = newItemName.trim()
    if (!name || adding) return
    setAdding(true)
    setActionError(null)
    addShoppingItem(name)
      .then((res) => {
        setItems((current) => (current ? [...current, res.item] : [res.item]))
        setNewItemName('')
      })
      .catch((err: Error) => setActionError(err.message))
      .finally(() => setAdding(false))
  }

  return (
    <div className="shopping-view">
      <header className="shopping-header">
        <h2>Shopping List</h2>
        <p className="shopping-subtitle">From ErinsList, plus anything you add here</p>
      </header>

      <div className="shopping-body">
        {loading && <p className="empty-state">Loading…</p>}
        {error && (
          <div className="shopping-error">
            <p>Couldn't reach ErinsList: {error}</p>
            <button type="button" onClick={load}>Try again</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {actionError && <p className="shopping-action-error">{actionError}</p>}

            {sortedItems.length === 0 && <p className="empty-state">Shopping list is empty.</p>}
            <ul className="shopping-items">
              {sortedItems.map((item) => (
                <li key={item.id} className={item.checked ? 'checked' : ''}>
                  <button type="button" className="shopping-item-row" onClick={() => handleToggle(item)}>
                    <span className="shopping-item-check" aria-hidden="true" />
                    <span className="shopping-item-name">
                      {[item.quantity, item.unit, item.name].filter(Boolean).join(' ')}
                    </span>
                    {item.source === 'erinslist' && <span className="shopping-item-badge">ErinsList</span>}
                  </button>
                  {item.source === 'app' && (
                    <button
                      type="button"
                      className="shopping-item-delete"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => handleDelete(item)}
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <form className="shopping-add-form" onSubmit={handleAdd}>
              <input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Add an item…"
                aria-label="New shopping item"
              />
              <button type="submit" disabled={!newItemName.trim() || adding}>Add</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
