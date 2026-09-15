# SweetSuite

A wall-mounted family dashboard — shared calendar, chores, meal planning (via an
embedded [ErinsList](https://erinslist.netlify.app)), and an ambient photo
screensaver. Built as a browser-first web app so it can be developed and tested
on any machine before it ever touches a Raspberry Pi kiosk.

See the design doc (shared separately) for full scope and hardware plans.

## Status

Phase 0/1 scaffold: frontend-only, running against mock data. No backend,
database, or Google Calendar sync yet — those come once the on-device
architecture (section 5 of the design doc) is built out.

## Local development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Works in any modern browser — no Pi or
touchscreen required.

## Build

```bash
npm run build
```

## Deploying to GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds and deploys `main` to
GitHub Pages automatically. In the repo's **Settings → Pages**, set the
source to **GitHub Actions** (not "Deploy from a branch") for this to work.

GitHub Pages is a static host: it's useful for previewing the UI in a real
browser, but it can't run the backend, SQLite, or hold Google Calendar OAuth
tokens described in the design doc's architecture — those require an
always-on backend (the eventual Pi).

## Known limitation: Meals tab

The Meals tab iframes ErinsList directly. If ErinsList's server sends
`X-Frame-Options`/CSP headers that block embedding, the iframe will render
blank — use the "open directly" link as a fallback until that's confirmed
either way.
