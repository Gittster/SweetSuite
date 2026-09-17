// Cross-site cookies (Setup session) require an exact origin match, not "*" — and
// Access-Control-Allow-Credentials must be "true" for the browser to send/accept the cookie.
export function corsHeaders(extra = {}) {
  const origin = process.env.CONTEXT === 'dev' ? '*' : (process.env.FRONTEND_ORIGIN || '');
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, X-SweetSuite-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Content-Type': 'application/json',
    ...extra,
  };
}
