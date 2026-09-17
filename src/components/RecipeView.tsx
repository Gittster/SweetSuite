import { useEffect, useState } from 'react'
import { getRecipe, type Recipe } from '../api/erinsList'
import './RecipeView.css'

interface RecipeViewProps {
  recipeId: string
  onClose: () => void
}

function formatIngredient(ing: { name: string; quantity?: string | number; unit?: string }): string {
  return [ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ')
}

// ErinsList stores instructions as either a newline-joined string or an
// array of steps depending on how the recipe was created — normalize both.
function toSteps(instructions: string | string[] | null | undefined): string[] {
  const lines = Array.isArray(instructions) ? instructions : (instructions || '').split('\n')
  return lines.map((line) => String(line).trim()).filter(Boolean)
}

export default function RecipeView({ recipeId, onClose }: RecipeViewProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setCheckedIngredients(new Set())
    getRecipe(recipeId)
      .then(({ recipe }) => {
        if (!cancelled) setRecipe(recipe)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [recipeId])

  const toggleIngredient = (i: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="recipe-view">
      <button type="button" className="recipe-view-close" onClick={onClose} aria-label="Close recipe">
        ✕
      </button>

      {loading && <p className="recipe-view-status">Loading recipe…</p>}
      {error && <p className="recipe-view-status recipe-view-error">Couldn't load this recipe: {error}</p>}

      {recipe && (
        <div className="recipe-view-content">
          <div className="recipe-view-body">
            <h2>{recipe.name}</h2>
            {recipe.tags.length > 0 && (
              <div className="recipe-view-tags">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="recipe-view-tag">{tag}</span>
                ))}
              </div>
            )}

            <div className="recipe-view-columns">
              <section>
                <h3>Ingredients</h3>
                <ul className="recipe-view-ingredients">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className={checkedIngredients.has(i) ? 'checked' : ''}>
                      <button type="button" onClick={() => toggleIngredient(i)}>
                        <span className="recipe-view-ingredient-check" aria-hidden="true" />
                        {formatIngredient(ing)}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Instructions</h3>
                <ol className="recipe-view-instructions">
                  {toSteps(recipe.instructions).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
