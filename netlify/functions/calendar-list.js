import { corsHeaders } from '../lib/cors.js';
import { isAuthenticated } from '../lib/session.js';
import { store } from '../lib/store.js';
import { getGoogleAccessToken } from '../lib/google.js';

export const handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed. Please use GET.' }) };
  }
  if (!isAuthenticated(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Not authenticated.' }) };
  }

  const refreshToken = await store().get('google-refresh-token');
  if (!refreshToken) {
    return { statusCode: 409, headers, body: JSON.stringify({ error: 'Google Calendar is not connected yet.' }) };
  }

  try {
    const accessToken = await getGoogleAccessToken(refreshToken);
    const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to list calendars.');

    const selectedId = await store().get('selected-calendar-id');
    const calendars = (data.items || []).map((c) => ({
      id: c.id,
      name: c.summary,
      color: c.backgroundColor || null,
      selected: selectedId ? c.id === selectedId : !!c.primary,
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ calendars }) };
  } catch (err) {
    console.error('calendar-list.js: Failed to list calendars:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to list calendars.' }) };
  }
};
