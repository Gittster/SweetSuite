const crypto = require('crypto');
const { corsHeaders } = require('../../lib/cors');
const { setSessionCookieHeader } = require('../../lib/session');

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

function pinMatches(candidate, expected) {
  const a = hash(candidate);
  const b = hash(expected);
  return crypto.timingSafeEqual(a, b);
}

exports.handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed. Please use POST.' }) };
  }
  if (!process.env.SETUP_PIN || !process.env.SESSION_SECRET) {
    console.error('setup-login.js: SETUP_PIN or SESSION_SECRET is not configured.');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Setup is not configured.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
  }

  if (typeof body.pin !== 'string' || !body.pin) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing "pin".' }) };
  }

  if (!pinMatches(body.pin, process.env.SETUP_PIN)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Incorrect PIN.' }) };
  }

  return {
    statusCode: 200,
    headers: { ...headers, 'Set-Cookie': setSessionCookieHeader() },
    body: JSON.stringify({ authenticated: true }),
  };
};
