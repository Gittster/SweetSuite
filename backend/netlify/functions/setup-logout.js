const { corsHeaders } = require('../../lib/cors');
const { clearSessionCookieHeader } = require('../../lib/session');

exports.handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed. Please use POST.' }) };
  }

  return {
    statusCode: 200,
    headers: { ...headers, 'Set-Cookie': clearSessionCookieHeader() },
    body: JSON.stringify({ authenticated: false }),
  };
};
