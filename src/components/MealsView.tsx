import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { getMealPlan, getRecipes, type PlannedMeal, type RecipeSummary } from '../api/erinsList'
import RecipeView from './RecipeView'
import './MealsView.css'

type MealsSubTab = 'planning' | 'recipes'

export default function MealsView() {
  const [subTab, setSubTab] = useState<MealsSubTab>('planning')
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null)

  const [meals, setMeals] = useState<PlannedMeal[] | null>(null)
  const [planningError, setPlanningError] = useState<string | null>(null)
  const [planningLoading, setPlanningLoading] = useState(true)

  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null)
  const [recipesError, setRecipesError] = useState<string | null>(null)
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [search, setSearch] = useState('')

  const loadPlanning = () => {
    setPlanningLoading(true)
    setPlanningError(null)
    getMealPlan()
      .then((res) => setMeals(res.meals))
      .catch((err: Error) => setPlanningError(err.message))
      .finally(() => setPlanningLoading(false))
  }

  useEffect(loadPlanning, [])

  const loadRecipes = () => {
    setRecipesLoading(true)
    setRecipesError(null)
    getRecipes()
      .then((res) => setRecipes(res.recipes))
      .catch((err: Error) => setRecipesError(err.message))
      .finally(() => setRecipesLoading(false))
  }

  useEffect(() => {
    if (subTab === 'recipes' && recipes === null && !recipesLoading) loadRecipes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab])

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

  const filteredRecipes = useMemo(() => {
    if (!recipes) return []
    const sorted = [...recipes].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    const term = search.trim().toLowerCase()
    if (!term) return sorted
    return sorted.filter((r) => (r.name || '').toLowerCase().includes(term))
  }, [recipes, search])

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
        {subTab === 'recipes' && (
          <input
            className="meals-recipe-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes…"
            aria-label="Search recipes"
          />
        )}
      </header>

      <div className="meals-body">
        {subTab === 'planning' && (
          <>
            {planningLoading && <p className="empty-state">Loading…</p>}
            {planningError && (
              <div className="meals-error">
                <p>Couldn't reach ErinsList: {planningError}</p>
                <button type="button" onClick={loadPlanning}>Try again</button>
              </div>
            )}
            {!planningLoading && !planningError && (
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
          </>
        )}

        {subTab === 'recipes' && (
          <>
            {recipesLoading && <p className="empty-state">Loading…</p>}
            {recipesError && (
              <div className="meals-error">
                <p>Couldn't reach ErinsList: {recipesError}</p>
                <button type="button" onClick={loadRecipes}>Try again</button>
              </div>
            )}
            {!recipesLoading && !recipesError && (
              <section className="meals-section">
                {filteredRecipes.length === 0 && (
                  <p className="empty-state">{search ? 'No recipes match your search.' : 'No recipes yet.'}</p>
                )}
                <div className="meals-recipes-grid">
                  {filteredRecipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      type="button"
                      className="meals-recipe-tile"
                      onClick={() => setOpenRecipeId(recipe.id)}
                    >
                      <span className="meals-recipe-tile-name">{recipe.name || 'Untitled recipe'}</span>
                      {recipe.tags.length > 0 && (
                        <span className="meals-recipe-tile-tags">{recipe.tags.join(', ')}</span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {openRecipeId && <RecipeView recipeId={openRecipeId} onClose={() => setOpenRecipeId(null)} />}
    </div>
  )
}
