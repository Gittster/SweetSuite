import crypto from 'node:crypto';
import { corsHeaders } from '../lib/cors.js';
import { getSession } from '../lib/session.js';
import { fetchErinsList } from '../lib/erinsList.js';
import { store } from '../lib/store.js';

// Quick "shorthand" recipes added directly in SweetSuite, without going
// through ErinsList's full recipe editor. Merged with ErinsList's own
// recipes at read time and tagged with `source` so the UI can tell them
// apart, same pattern as shopping's locally-added items.
const EXTRA_RECIPES_KEY = 'recipes-extra';

export async function loadExtraRecipes() {
  const recipes = await store().get(EXTRA_RECIPES_KEY, { type: 'json' });
  return Array.isArray(recipes) ? recipes : [];
}

function saveExtraRecipes(recipes) {
  return store().setJSON(EXTRA_RECIPES_KEY, recipes);
}

export const handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const session = getSession(event);
  if (!session) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Not authenticated.' }) };
  }

  if (event.httpMethod === 'GET') {
    try {
      const [{ recipes: erinsListRecipes }, extraRecipes] = await Promise.all([
        fetchErinsList('/get-recipes', session.email),
        loadExtraRecipes(),
      ]);
      const recipes = [
        ...erinsListRecipes.map((r) => ({ ...r, source: 'erinslist' })),
        ...extraRecipes.map((r) => ({ id: r.id, name: r.name, imageUrl: null, tags: r.tags, rating: r.rating, source: 'app' })),
      ];
      return { statusCode: 200, headers, body: JSON.stringify({ recipes }) };
    } catch (err) {
      console.error('recipes.js: Failed to fetch from ErinsList:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to fetch recipes.' }) };
    }
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
    }
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required "name".' }) };
    }
    const ingredients = Array.isArray(body.ingredients)
      ? body.ingredients.map((line) => String(line).trim()).filter(Boolean).map((line) => ({ name: line }))
      : [];
    const instructions = typeof body.instructions === 'string' ? body.instructions.trim() : '';

    const newRecipe = {
      id: crypto.randomUUID(),
      name,
      ingredients,
      instructions,
      tags: [],
      rating: 0,
    };

    const extraRecipes = await loadExtraRecipes();
    extraRecipes.push(newRecipe);
    await saveExtraRecipes(extraRecipes);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ recipe: { id: newRecipe.id, name: newRecipe.name, imageUrl: null, tags: newRecipe.tags, rating: newRecipe.rating, source: 'app' } }),
    };
  }

  if (event.httpMethod === 'DELETE') {
    const id = (event.queryStringParameters || {}).id;
    if (!id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing "id" query parameter.' }) };
    }
    const extraRecipes = await loadExtraRecipes();
    const filtered = extraRecipes.filter((r) => r.id !== id);
    if (filtered.length === extraRecipes.length) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Recipe not found.' }) };
    }
    await saveExtraRecipes(filtered);
    return { statusCode: 200, headers, body: JSON.stringify({ deleted: id }) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed.' }) };
};
