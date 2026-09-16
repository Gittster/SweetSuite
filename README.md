# SweetSuite

A wall-mounted family dashboard — shared calendar (Google Calendar), chores,
meal planning (via [ErinsList](https://erinslist.netlify.app)'s API), and an
ambient photo screensaver. Built as a browser-first web app so it can be
developed and tested on any machine before it ever touches a Raspberry Pi
kiosk.

See the design doc (shared separately) for full scope and hardware plans.

## Status

Phase 1: frontend on GitHub Pages, plus a small dedicated backend
(`backend/`, its own Netlify site) that holds the Google Calendar OAuth
token and the Setup PIN. Meals already talks to ErinsList's own backend.
Photos is local-folder-only, no backend needed. SQLite / on-device sync
described in the design doc's section 5 still comes later, once there's a
Pi to run it on.

## Repo layout

- `src/` — the frontend (Vite + React), deployed to GitHub Pages.
- `backend/` — SweetSuite's own backend (Setup PIN, Google OAuth, calendar
  events), deployed as a **second, separate Netlify site** from this same
  repo. See `backend/README.md` for full setup steps.

## Local development

```bash
npm install
cp .env.example .env   # fill in the values below
npm run dev
```

Opens at `http://localhost:5173`. Works in any modern browser — no Pi or
touchscreen required. Chrome or Edge are needed for the Photos folder picker
(File System Access API); other tabs work everywhere.

## Setup tab: PIN-gated connections dashboard

The **Setup** tab (gear icon) is where the household connects/disconnects
Google Calendar and picks the local photos folder — the single place that
"manages all these connections," as opposed to hopping between two
different Netlify dashboards. It's gated by a shared PIN (not a full login,
per the design doc's no-accounts goal) so the kids can see it exists but
can't reconfigure anything without it.

## Environment variables

All of these go in `.env` for local dev, or as GitHub Actions repo secrets
(**Settings → Secrets and variables → Actions → Secrets**, not Environment
secrets) for the deployed build — the workflow injects them at build time.

| Variable | Purpose |
|---|---|
| `VITE_SWEETSUITE_API_BASE` | ErinsList's function base URL. Defaults to production if unset. |
| `VITE_SWEETSUITE_API_KEY` | Shared secret for the Meals tab's calls to ErinsList. Must match `SWEETSUITE_API_KEY` set in the `recipe` repo's Netlify env vars. |
| `VITE_BACKEND_URL` | URL of the `backend/` Netlify site (see below). Leave unset to run without a backend — Calendar falls back to demo data, Setup can't manage Google Calendar. |
| `VITE_BACKEND_API_KEY` | Shared secret for reading calendar events. Must match `BACKEND_API_KEY` on the backend Netlify site. **Use a different value than `VITE_SWEETSUITE_API_KEY`** — these are two independent systems, and a leak of one shouldn't compromise the other. |

Every one of these keys ends up embedded in the built JS bundle, since
GitHub Pages is static hosting with no server to keep them hidden behind.
That's an acceptable trade-off for a private single-household kiosk — the
keys only grant read access to meal/calendar data, never write access or
account credentials (those live server-side in `backend/`, never shipped to
the browser). Not something to carry over if this ever became a multi-user
or public deployment.

## Build

```bash
npm run build
```

## Deploying to GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds and deploys `main` to
GitHub Pages automatically. In the repo's **Settings → Pages**, set the
source to **GitHub Actions** (not "Deploy from a branch") for this to work.
