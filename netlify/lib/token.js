// Minimal dependency-free signed token: base64url(payload) + "." + HMAC-SHA256 signature.
// Deliberately simpler than JWT (one fixed algorithm, no header to spoof) — used both for
// the Setup session cookie and the short-lived Google OAuth CSRF state parameter.
const crypto = require('crypto');

function sign(payload, secret) {
  if (!secret) throw new Error('Missing signing secret.');
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function createToken(data, secret) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;

  let expectedSig;
  try {
    expectedSig = sign(payload, secret);
  } catch {
    return null;
  }

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

module.exports = { createToken, verifyToken };
