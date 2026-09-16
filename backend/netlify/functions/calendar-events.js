const { corsHeaders } = require('../../lib/cors');
const { store } = require('../../lib/store');

const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

async function getAccessToken(refreshToken) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'Failed to refresh Google access token.');
  return data.access_token;
}

exports.handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed. Please use GET.' }) };
  }
  if (!BACKEND_API_KEY || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('calendar-events.js: Missing BACKEND_API_KEY, GOOGLE_CLIENT_ID, or GOOGLE_CLIENT_SECRET.');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Calendar access is not configured.' }) };
  }

  const providedKey = event.headers['x-sweetsuite-key'] || event.headers['X-SweetSuite-Key'] || '';
  if (providedKey !== BACKEND_API_KEY) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing or invalid API key.' }) };
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
  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || 'primary');

  try {
    const accessToken = await getAccessToken(refreshToken);

    const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
      new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime' });
    const eventsRes = await fetch(eventsUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const eventsData = await eventsRes.json();
    if (!eventsRes.ok) throw new Error(eventsData.error?.message || 'Failed to fetch calendar events.');

    // Google Calendar has no concept of SweetSuite's per-person Profiles, so synced
    // events don't carry a personId — only mock/local data does.
    const events = (eventsData.items || []).map((item) => ({
      id: item.id,
      title: item.summary || '(No title)',
      start: item.start?.dateTime || item.start?.date,
      end: item.end?.dateTime || item.end?.date,
      location: item.location || null,
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ events }) };
  } catch (err) {
    console.error('calendar-events.js: Failed to fetch calendar events:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch calendar events.' }) };
  }
};
