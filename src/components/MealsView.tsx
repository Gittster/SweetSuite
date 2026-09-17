import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { createRecipe, deleteRecipe, getMealPlan, getRecipes, type NewShorthandRecipe, type PlannedMeal, type RecipeSummary } from '../api/erinsList'
import AddRecipeModal from './AddRecipeModal'
import LoadingOverlay from './LoadingOverlay'
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
  const [recipeActionError, setRecipeActionError] = useState<string | null>(null)
  const [showAddRecipe, setShowAddRecipe] = useState(false)
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

  const handleAddRecipe = (data: NewShorthandRecipe) => {
    setRecipeActionError(null)
    createRecipe(data)
      .then((res) => {
        setRecipes((current) => (current ? [...current, res.recipe] : [res.recipe]))
        setShowAddRecipe(false)
      })
      .catch((err: Error) => setRecipeActionError(err.message))
  }

  const handleDeleteRecipe = (recipe: RecipeSummary) => {
    if (!recipes) return
    setRecipeActionError(null)
    const previous = recipes
    setRecipes(recipes.filter((r) => r.id !== recipe.id))
    deleteRecipe(recipe.id).catch((err: Error) => {
      setRecipes(previous)
      setRecipeActionError(err.message)
    })
  }

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
          <div className="meals-recipe-toolbar">
            <input
              className="meals-recipe-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes…"
              aria-label="Search recipes"
            />
            <button type="button" className="meals-recipe-add-btn" onClick={() => setShowAddRecipe(true)}>
              + Add
            </button>
          </div>
        )}
      </header>

      <div className="meals-body">
        {subTab === 'planning' && (
          <>
            {planningLoading && <LoadingOverlay label="Loading meals…" />}
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
            {(recipesLoading || recipes === null) && !recipesError && <LoadingOverlay label="Loading recipes…" />}
            {recipesError && (
              <div className="meals-error">
                <p>Couldn't reach ErinsList: {recipesError}</p>
                <button type="button" onClick={loadRecipes}>Try again</button>
              </div>
            )}
            {recipes !== null && !recipesError && (
              <section className="meals-section">
                {recipeActionError && <p className="meals-recipe-action-error">{recipeActionError}</p>}
                {filteredRecipes.length === 0 && (
                  <p className="empty-state">{search ? 'No recipes match your search.' : 'No recipes yet.'}</p>
                )}
                <div className="meals-recipes-grid">
                  {filteredRecipes.map((recipe) => (
                    <div key={recipe.id} className="meals-recipe-tile">
                      <button
                        type="button"
                        className="meals-recipe-tile-open"
                        onClick={() => setOpenRecipeId(recipe.id)}
                      >
                        <span className="meals-recipe-tile-name">{recipe.name || 'Untitled recipe'}</span>
                        {recipe.tags.length > 0 && (
                          <span className="meals-recipe-tile-tags">{recipe.tags.join(', ')}</span>
                        )}
                        {recipe.source === 'app' && <span className="meals-recipe-tile-badge">Quick recipe</span>}
                      </button>
                      {recipe.source === 'app' && (
                        <button
                          type="button"
                          className="meals-recipe-tile-delete"
                          aria-label={`Remove ${recipe.name}`}
                          onClick={() => handleDeleteRecipe(recipe)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {openRecipeId && <RecipeView recipeId={openRecipeId} onClose={() => setOpenRecipeId(null)} />}
      {showAddRecipe && <AddRecipeModal onClose={() => setShowAddRecipe(false)} onSubmit={handleAddRecipe} />}
    </div>
  )
}
