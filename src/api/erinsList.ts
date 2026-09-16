const API_BASE = import.meta.env.VITE_SWEETSUITE_API_BASE || 'https://erinslist.netlify.app/.netlify/functions'
const API_KEY = import.meta.env.VITE_SWEETSUITE_API_KEY as string | undefined

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
  const res = await fetch(`${API_BASE}${path}`, {
    headers: API_KEY ? { 'X-SweetSuite-Key': API_KEY } : {},
  })
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
  return request(`/get-meal-plan${query ? `?${query}` : ''}`)
}

export function getShoppingList(): Promise<{ ingredients: ShoppingIngredient[] }> {
  return request('/get-shopping-list')
}

export function getRecipe(id: string): Promise<{ recipe: Recipe }> {
  return request(`/get-recipe?id=${encodeURIComponent(id)}`)
}
