# SweetSuite

A wall-mounted family dashboard — shared calendar (Google Calendar), chores,
meal planning (via [ErinsList](https://erinslist.netlify.app)), and an
ambient photo screensaver. Built as a browser-first web app so it can be
developed and tested on any machine before it ever touches a Raspberry Pi
kiosk.

See the design doc (shared separately) for full scope and hardware plans.

## Architecture

One Netlify site serves both the static frontend (`src/`, built with Vite)
and the backend (`netlify/functions/`) — same origin, so the browser never
needs to hold any secret. Everything it does is gated by one HttpOnly
session cookie, issued after signing in with an approved Google account.

- **Sign-in** (`auth-google-start`/`auth-google-callback`): lightweight
  Google OAuth requesting only `openid email`, checked against
  `ALLOWED_EMAILS`. This gates the whole app, not just Setup.
- **Google Calendar connect** (`google-oauth-start`/`google-oauth-callback`,
  Setup tab): a separate, deliberate action requesting `calendar.readonly` +
  offline access. Kept distinct from sign-in so one household member signing
  in doesn't silently swap out the calendar someone else connected — there's
  one shared family calendar regardless of who's currently signed in.
- **ErinsList proxy** (`meal-plan`, `shopping-list`, `recipe`): server-to-server
  calls holding the ErinsList API key here, never in the browser.
- **Photos**: the browser's native folder picker (File System Access API) —
  no accounts, no backend involved at all.

No API keys, PINs, or secrets of any kind ship in the built JS bundle.

## Local development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173` for frontend-only work (Calendar/Chores/
Photos UI). Sign-in and the API endpoints need Netlify Functions, which
plain `vite dev` doesn't run — for full-stack local testing, use the
[Netlify CLI](https://docs.netlify.com/cli/get-started/) instead:

```bash
npm install -g netlify-cli
netlify link      # after creating the site below
netlify dev
```

## Deploying

1. **Make the GitHub repo private** (Settings → General → Danger Zone →
   Change visibility). Since everything sensitive now lives server-side
   behind sign-in, this isn't strictly required for security — but it's
   good hygiene, and there's no more GitHub Pages workflow that needed the
   repo to stay public.
2. In Netlify: **Add new site → Import an existing project** → this repo.
   `netlify.toml` at the root already has the build command, publish
   directory, and function config — no manual build settings needed.
3. Set the environment variables below on that site, then deploy.

## Environment variables (Netlify site settings)

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Long random string signing the session cookie and OAuth CSRF state. Generate with `openssl rand -hex 32`. |
| `ALLOWED_EMAILS` | Comma-separated Google account emails allowed to sign in (e.g. `you@gmail.com,partner@gmail.com`). |
| `FRONTEND_ORIGIN` | This site's own URL, e.g. `https://sweetsuite.netlify.app`. Used for CORS and where OAuth redirects land back. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From one Google Cloud OAuth client shared by both Google flows below. |
| `GOOGLE_AUTH_REDIRECT_URI` | `<FRONTEND_ORIGIN>/.netlify/functions/auth-google-callback` — the sign-in flow's redirect URI. |
| `GOOGLE_CALENDAR_REDIRECT_URI` | `<FRONTEND_ORIGIN>/.netlify/functions/google-oauth-callback` — the calendar-connect flow's redirect URI. Must differ from the one above. |
| `GOOGLE_CALENDAR_ID` | Optional, defaults to `primary`. |
| `ERINSLIST_API_KEY` | Must match `SWEETSUITE_API_KEY` set in the `recipe` repo's Netlify env vars. |
| `ERINSLIST_BASE_URL` | Optional, defaults to `https://erinslist.netlify.app/.netlify/functions`. |

## Setting up the Google OAuth client

1. [Google Cloud Console](https://console.cloud.google.com/) → create/select a project.
2. **APIs & Services → Library** → enable the **Google Calendar API**.
3. **APIs & Services → OAuth consent screen** → **External**, minimum required
   fields, add every email from `ALLOWED_EMAILS` under **Test users**.
   Personal use like this never needs Google's verification review as long
   as it stays in "Testing" mode.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**,
   type **Web application**. Under **Authorized redirect URIs**, add
   *both* `GOOGLE_AUTH_REDIRECT_URI` and `GOOGLE_CALENDAR_REDIRECT_URI` from
   above.
5. Copy the **Client ID** and **Client Secret** into the site's env vars.

## Setup tab

The gear-icon tab is where the household connects/disconnects Google
Calendar and picks the local photos folder. It's reachable by anyone signed
in — there's no separate PIN layer on top, since sign-in itself is already
the access control for the whole app.
