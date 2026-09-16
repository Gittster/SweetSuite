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

export default function RecipeView({ recipeId, onClose }: RecipeViewProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
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

  return (
    <div className="recipe-view">
      <button type="button" className="recipe-view-close" onClick={onClose} aria-label="Close recipe">
        ✕
      </button>

      {loading && <p className="recipe-view-status">Loading recipe…</p>}
      {error && <p className="recipe-view-status recipe-view-error">Couldn't load this recipe: {error}</p>}

      {recipe && (
        <div className="recipe-view-content">
          {recipe.imageUrl && (
            <div className="recipe-view-image" style={{ backgroundImage: `url(${recipe.imageUrl})` }} />
          )}
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
                    <li key={i}>{formatIngredient(ing)}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Instructions</h3>
                <div className="recipe-view-instructions">
                  {recipe.instructions
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
