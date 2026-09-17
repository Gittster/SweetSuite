const BASE_URL = process.env.ERINSLIST_BASE_URL || 'https://erinslist.netlify.app/.netlify/functions';

// Server-to-server call to ErinsList's own read-only API. The API key lives
// only here, on this backend — the browser never sees it. `email` tells
// ErinsList which household member's account to read (falls back to its own
// HOUSEHOLD_EMAIL env var if omitted).
export async function fetchErinsList(path, email) {
  const apiKey = process.env.ERINSLIST_API_KEY;
  if (!apiKey) throw new Error('ERINSLIST_API_KEY is not configured.');

  const headers = { 'X-SweetSuite-Key': apiKey };
  if (email) headers['X-Household-Email'] = email;

  const res = await fetch(`${BASE_URL}${path}`, { headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error || `ErinsList request failed (${res.status})`;
    const err = new Error(message);
    err.statusCode = res.status;
    throw err;
  }
  return data;
}
