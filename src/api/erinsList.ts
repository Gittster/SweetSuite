// Calls our own backend's proxy endpoints (netlify/functions/meal-plan.js etc.),
// which hold the ErinsList API key server-side — the browser never sees it,
// only the session cookie that already gates everything else.

export interface PlannedMeal {
  id: string
  date: string // YYYY-MM-DD
  recipeName: string | null
  recipeId: string | null
}

export interface ShoppingIngredient {
  name: string
  quantity?: string | number
  unit?: string
  checked?: boolean
}

export interface Recipe {
  id: string
  name: string | null
  imageUrl: string | null
  ingredients: ShoppingIngredient[]
  instructions: string
  tags: string[]
  rating: number
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`/.netlify/functions${path}`, { credentials: 'include' })
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

export function getShoppingList(): Promise<{ ingredients: ShoppingIngredient[] }> {
  return request('/shopping-list')
}

export function getRecipe(id: string): Promise<{ recipe: Recipe }> {
  return request(`/recipe?id=${encodeURIComponent(id)}`)
}
