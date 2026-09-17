import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { getMealPlan, type PlannedMeal } from '../api/erinsList'
import RecipeView from './RecipeView'
import './MealsView.css'

type MealsSubTab = 'planning' | 'recipes'

export default function MealsView() {
  const [subTab, setSubTab] = useState<MealsSubTab>('planning')
  const [meals, setMeals] = useState<PlannedMeal[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getMealPlan()
      .then((res) => setMeals(res.meals))
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

  const uniqueRecipes = useMemo(() => {
    if (!meals) return []
    const byId = new Map<string, string>()
    for (const meal of meals) {
      if (meal.recipeId && !byId.has(meal.recipeId)) {
        byId.set(meal.recipeId, meal.recipeName || 'Untitled recipe')
      }
    }
    return [...byId.entries()].sort(([, a], [, b]) => a.localeCompare(b))
  }, [meals])

  return (
    <div className="meals-view">
      <header className="meals-header">
        <h2>Meals</h2>
        <div className="meals-subtabs">
          <button
            type="button"
            className={subTab === 'planning' ? 'active' : ''}
            onClick={() => setSubTab('planning')}
          >
            Planning
          </button>
          <button
            type="button"
            className={subTab === 'recipes' ? 'active' : ''}
            onClick={() => setSubTab('recipes')}
          >
            Recipes
          </button>
        </div>
      </header>

      <div className="meals-body">
        {loading && <p className="empty-state">Loading…</p>}
        {error && (
          <div className="meals-error">
            <p>Couldn't reach ErinsList: {error}</p>
            <button type="button" onClick={load}>Try again</button>
          </div>
        )}

        {!loading && !error && subTab === 'planning' && (
          <section className="meals-section">
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
        )}

        {!loading && !error && subTab === 'recipes' && (
          <section className="meals-section">
            {uniqueRecipes.length === 0 && <p className="empty-state">No recipes in your plan yet.</p>}
            <div className="meals-recipes-grid">
              {uniqueRecipes.map(([id, name]) => (
                <button
                  key={id}
                  type="button"
                  className="meals-recipe-tile"
                  onClick={() => setOpenRecipeId(id)}
                >
                  {name}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {openRecipeId && <RecipeView recipeId={openRecipeId} onClose={() => setOpenRecipeId(null)} />}
    </div>
  )
}
