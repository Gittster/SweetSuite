const { getStore } = require('@netlify/blobs');

// A single small store for everything this backend needs to persist:
// the Google refresh token and short-lived OAuth "state" nonces.
function store() {
  return getStore('sweetsuite');
}

module.exports = { store };
