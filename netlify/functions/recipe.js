import { corsHeaders } from '../lib/cors.js';
import { getSession } from '../lib/session.js';
import { fetchErinsList } from '../lib/erinsList.js';
import { loadExtraRecipes } from './recipes.js';

export const handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed. Please use GET.' }) };
  }
  const session = getSession(event);
  if (!session) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Not authenticated.' }) };
  }

  const recipeId = (event.queryStringParameters || {}).id;
  if (!recipeId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required "id" query parameter.' }) };
  }

  const extraRecipes = await loadExtraRecipes();
  const localRecipe = extraRecipes.find((r) => r.id === recipeId);
  if (localRecipe) {
    return { statusCode: 200, headers, body: JSON.stringify({ recipe: { ...localRecipe, imageUrl: null, source: 'app' } }) };
  }

  try {
    const data = await fetchErinsList(`/get-recipe?id=${encodeURIComponent(recipeId)}`, session.email);
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    const statusCode = err.statusCode === 404 ? 404 : 502;
    if (statusCode !== 404) console.error('recipe.js: Failed to fetch from ErinsList:', err);
    return { statusCode, headers, body: JSON.stringify({ error: err.message || 'Failed to fetch recipe.' }) };
  }
};
