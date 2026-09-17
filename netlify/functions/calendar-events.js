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
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('calendar-events.js: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Calendar access is not configured.' }) };
  }
  if (!isAuthenticated(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Not authenticated.' }) };
  }

  const refreshToken = await store().get('google-refresh-token');
  if (!refreshToken) {
    return { statusCode: 409, headers, body: JSON.stringify({ error: 'Google Calendar is not connected yet.' }) };
  }

  const params = event.queryStringParameters || {};
  const timeMin = params.start ? new Date(params.start).toISOString() : new Date().toISOString();
  const timeMax = params.end
    ? new Date(params.end).toISOString()
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const selectedCalendarId = await store().get('selected-calendar-id');
  const calendarId = encodeURIComponent(selectedCalendarId || process.env.GOOGLE_CALENDAR_ID || 'primary');

  try {
    const accessToken = await getGoogleAccessToken(refreshToken);

    const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
      new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime' });
    const eventsRes = await fetch(eventsUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const eventsData = await eventsRes.json();
    if (!eventsRes.ok) throw new Error(eventsData.error?.message || 'Failed to fetch calendar events.');

    // Google Calendar has no concept of SweetSuite's per-person Profiles, so synced
    // events don't carry a personId — only app-native events do (see app-events.js).
    const events = (eventsData.items || []).map((item) => ({
      id: item.id,
      title: item.summary || '(No title)',
      start: item.start?.dateTime || item.start?.date,
      end: item.end?.dateTime || item.end?.date,
      location: item.location || null,
      source: 'google',
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ events }) };
  } catch (err) {
    console.error('calendar-events.js: Failed to fetch calendar events:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch calendar events.' }) };
  }
};
