import { getStore } from '@netlify/blobs';

// A single small store for everything this backend needs to persist:
// the Google refresh token and short-lived OAuth "state" nonces.
//
// Netlify is supposed to auto-inject site context so getStore('name') works
// with zero config, but that doesn't always reach the function runtime — in
// that case it throws MissingBlobsEnvironmentError. Falling back to explicit
// config (SITE_ID is always auto-provided; NETLIFY_BLOBS_TOKEN is a personal
// access token you create yourself) works regardless of why the automatic
// path failed.
export function store() {
  const siteID = process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  if (siteID && token) {
    return getStore({ name: 'sweetsuite', siteID, token });
  }
  return getStore('sweetsuite');
}
