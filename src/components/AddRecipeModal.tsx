import { useState, type FormEvent } from 'react'
import type { NewShorthandRecipe } from '../api/erinsList'
import './AddRecipeModal.css'

interface AddRecipeModalProps {
  onClose: () => void
  onSubmit: (data: NewShorthandRecipe) => void
}

export default function AddRecipeModal({ onClose, onSubmit }: AddRecipeModalProps) {
  const [name, setName] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [instructions, setInstructions] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      ingredients: ingredients.split('\n').map((line) => line.trim()).filter(Boolean),
      instructions: instructions.trim(),
    })
  }

  return (
    <div className="add-recipe-overlay" onClick={onClose}>
      <form className="add-recipe-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>Add a Quick Recipe</h3>
        <p className="add-recipe-hint">A shorthand recipe just for this dashboard — not saved to ErinsList.</p>

        <label className="add-recipe-field">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </label>

        <label className="add-recipe-field">
          Ingredients (optional)
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder={'One per line, e.g.\n2 cups flour\n1 tsp salt'}
            rows={4}
          />
        </label>

        <label className="add-recipe-field">
          Instructions (optional)
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={'One step per line'}
            rows={4}
          />
        </label>

        <div className="add-recipe-actions">
          <button type="button" className="add-recipe-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="add-recipe-submit" disabled={!name.trim()}>Add</button>
        </div>
      </form>
    </div>
  )
}
