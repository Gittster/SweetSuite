import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { getMealPlan, getShoppingList, type PlannedMeal, type ShoppingIngredient } from '../api/erinsList'
import RecipeView from './RecipeView'
import './MealsView.css'

export default function MealsView() {
  const [meals, setMeals] = useState<PlannedMeal[] | null>(null)
  const [ingredients, setIngredients] = useState<ShoppingIngredient[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([getMealPlan(), getShoppingList()])
      .then(([planRes, shoppingRes]) => {
        setMeals(planRes.meals)
        setIngredients(shoppingRes.ingredients)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const mealsByDate = useMemo(() => {
    if (!meals) return []
    const byDate = new Map<string, PlannedMeal[]>()
    for (const meal of meals) {
      if (!meal.date) continue
      if (!byDate.has(meal.date)) byDate.set(meal.date, [])
      byDate.get(meal.date)!.push(meal)
    }
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [meals])

  const sortedIngredients = useMemo(() => {
    if (!ingredients) return []
    return [...ingredients].sort((a, b) => Number(!!a.checked) - Number(!!b.checked))
  }, [ingredients])

  return (
    <div className="meals-view">
      <header className="meals-header">
        <h2>Meals</h2>
        <p className="meals-subtitle">This week's plan &amp; shopping list from ErinsList</p>
      </header>

      <div className="meals-body">
        {loading && <p className="empty-state">Loading…</p>}
        {error && (
          <div className="meals-error">
            <p>Couldn't reach ErinsList: {error}</p>
            <button type="button" onClick={load}>Try again</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="meals-section">
              <h3>Planned meals</h3>
              {mealsByDate.length === 0 && <p className="empty-state">No meals planned yet.</p>}
              <div className="meals-plan-list">
                {mealsByDate.map(([date, dayMeals]) => (
                  <div key={date} className="meals-plan-day">
                    <div className="meals-plan-date">{format(parseISO(date), 'EEE, MMM d')}</div>
                    <div className="meals-plan-tiles">
                      {dayMeals.map((meal) => (
                        <button
                          key={meal.id}
                          type="button"
                          className="meals-plan-tile"
                          disabled={!meal.recipeId}
                          onClick={() => meal.recipeId && setOpenRecipeId(meal.recipeId)}
                        >
                          {meal.recipeName || 'Untitled meal'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="meals-section">
              <h3>Shopping list</h3>
              {sortedIngredients.length === 0 && <p className="empty-state">Shopping list is empty.</p>}
              <ul className="shopping-list">
                {sortedIngredients.map((ing, i) => (
                  <li key={i} className={ing.checked ? 'checked' : ''}>
                    {[ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ')}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>

      {openRecipeId && <RecipeView recipeId={openRecipeId} onClose={() => setOpenRecipeId(null)} />}
    </div>
  )
}
