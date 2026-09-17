// Calls our own backend's proxy endpoints (netlify/functions/meal-plan.js etc.),
// which hold the ErinsList API key server-side — the browser never sees it,
// only the session cookie that already gates everything else.

export interface PlannedMeal {
  id: string
  date: string // YYYY-MM-DD
  recipeName: string | null
  recipeId: string | null
}

export interface ShoppingItem {
  id: string
  name: string
  quantity: string | number | null
  unit: string | null
  checked: boolean
  source: 'erinslist' | 'app'
}

export interface RecipeIngredient {
  name: string
  quantity?: string | number
  unit?: string
}

export interface Recipe {
  id: string
  name: string | null
  imageUrl: string | null
  ingredients: RecipeIngredient[]
  instructions: string
  tags: string[]
  rating: number
}

export interface RecipeSummary {
  id: string
  name: string | null
  imageUrl: string | null
  tags: string[]
  rating: number
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/.netlify/functions${path}`, { credentials: 'include', ...init })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export function getMealPlan(start?: string, end?: string): Promise<{ meals: PlannedMeal[] }> {
  const params = new URLSearchParams()
  if (start) params.set('start', start)
  if (end) params.set('end', end)
  const query = params.toString()
  return request(`/meal-plan${query ? `?${query}` : ''}`)
}

export function getShoppingList(): Promise<{ items: ShoppingItem[] }> {
  return request('/shopping-list')
}

export function addShoppingItem(name: string): Promise<{ item: ShoppingItem }> {
  return request('/shopping-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
}

export function toggleShoppingItem(id: string, checked: boolean): Promise<{ id: string; checked: boolean }> {
  return request(`/shopping-list?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checked }),
  })
}

export function deleteShoppingItem(id: string): Promise<{ deleted: string }> {
  return request(`/shopping-list?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function getRecipe(id: string): Promise<{ recipe: Recipe }> {
  return request(`/recipe?id=${encodeURIComponent(id)}`)
}

export function getRecipes(): Promise<{ recipes: RecipeSummary[] }> {
  return request('/recipes')
}
