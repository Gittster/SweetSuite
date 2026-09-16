# SweetSuite backend

Serverless functions (Netlify Functions) holding the secrets the static
frontend can't hold: the Setup PIN, the session-signing secret, and the
Google Calendar OAuth refresh token. The frontend never sees the refresh
token — only calendar event data.

## Deploying this as its own Netlify site

This folder is meant to be deployed as a **second, separate Netlify site**
from the same GitHub repo (the frontend keeps deploying to GitHub Pages
unchanged):

1. In Netlify: **Add new site → Import an existing project** → pick the
   `SweetSuite` repo.
2. Under **Site settings → Build & deploy → Build settings**, set
   **Base directory** to `backend`.
3. Build command: `npm install` (already set in `netlify.toml`). Publish
   directory can be left blank/default — this site only serves functions,
   no static files.
4. Note the site's URL (e.g. `https://sweetsuite-api-xyz.netlify.app`) —
   you'll need it for the frontend's env vars.

## Environment variables (set in this Netlify site's settings)

| Variable | Purpose |
|---|---|
| `SETUP_PIN` | The passphrase that unlocks the Setup tab. Pick something longer than a 4-digit PIN. |
| `SESSION_SECRET` | Long random string signing the Setup session cookie and OAuth CSRF state. Generate with `openssl rand -hex 32`. |
| `BACKEND_API_KEY` | Shared secret the frontend sends as `X-SweetSuite-Key` when reading calendar events. Generate the same way — **use a different value than ErinsList's `SWEETSUITE_API_KEY`**, so a leak of one key doesn't expose the other system. |
| `FRONTEND_ORIGIN` | The frontend's exact origin, e.g. `https://gittster.github.io`. Used for CORS and for where the OAuth callback redirects back to. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From a Google Cloud OAuth client (see below). |
| `GOOGLE_REDIRECT_URI` | `https://<this-site>.netlify.app/.netlify/functions/google-oauth-callback` — must exactly match what's registered in Google Cloud Console. |
| `GOOGLE_CALENDAR_ID` | Optional, defaults to `primary` (the signed-in account's main calendar). |

## Setting up the Google OAuth client

1. Go to the [Google Cloud Console](https://console.cloud.google.com/), create or select a project.
2. **APIs & Services → Library** → enable the **Google Calendar API**.
3. **APIs & Services → OAuth consent screen**: choose **External**, fill in the
   minimum required fields, and add the Google account(s) you'll actually
   sign in with under **Test users**. Personal/household use like this never
   needs to go through Google's verification review as long as it stays in
   "Testing" mode.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**,
   type **Web application**. Under **Authorized redirect URIs**, add the
   exact `GOOGLE_REDIRECT_URI` value above.
5. Copy the generated **Client ID** and **Client Secret** into this site's
   env vars.

## Endpoints

- `POST /.netlify/functions/setup-login` `{pin}` → sets the Setup session cookie.
- `POST /.netlify/functions/setup-logout` → clears it.
- `GET /.netlify/functions/setup-status` → `{authenticated, googleConnected?}`.
- `GET /.netlify/functions/google-oauth-start` → session-gated redirect into Google's consent screen.
- `GET /.netlify/functions/google-oauth-callback` → Google redirects here; exchanges the code, stores the refresh token, redirects back to `FRONTEND_ORIGIN`.
- `POST /.netlify/functions/google-disconnect` → session-gated, deletes the stored refresh token.
- `GET /.netlify/functions/calendar-events?start=&end=` → `X-SweetSuite-Key`-gated, returns `{events: [...]}`.

Token storage uses [Netlify Blobs](https://docs.netlify.com/blobs/overview/),
which works automatically in production deploys — no separate database or
extra setup needed.
