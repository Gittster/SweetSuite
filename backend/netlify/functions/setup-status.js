const { corsHeaders } = require('../../lib/cors');
const { isAuthenticated } = require('../../lib/session');
const { store } = require('../../lib/store');

exports.handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed. Please use GET.' }) };
  }

  if (!isAuthenticated(event)) {
    return { statusCode: 200, headers, body: JSON.stringify({ authenticated: false }) };
  }

  let googleConnected = false;
  try {
    const refreshToken = await store().get('google-refresh-token');
    googleConnected = !!refreshToken;
  } catch (err) {
    console.error('setup-status.js: Failed to read blob store:', err);
  }

  return { statusCode: 200, headers, body: JSON.stringify({ authenticated: true, googleConnected }) };
};
