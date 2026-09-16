# SweetSuite

A wall-mounted family dashboard — shared calendar, chores, meal planning (via
[ErinsList](https://erinslist.netlify.app)'s API), and an ambient photo
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
cp .env.example .env   # then fill in VITE_SWEETSUITE_API_KEY
npm run dev
```

Opens at `http://localhost:5173`. Works in any modern browser — no Pi or
touchscreen required.

## Meals tab: ErinsList API key

The Meals tab calls three read-only Netlify Functions on the ErinsList
(`recipe`) repo — see that repo's `CLAUDE.md` for the endpoints. It needs
`VITE_SWEETSUITE_API_KEY` to match the `SWEETSUITE_API_KEY` value set in
ErinsList's Netlify environment variables:

- **Local dev**: put it in `.env` (see `.env.example`, gitignored).
- **GitHub Pages build**: add it as a repo secret named `SWEETSUITE_API_KEY`
  under **Settings → Secrets and variables → Actions** — the deploy workflow
  injects it at build time as `VITE_SWEETSUITE_API_KEY`.

This key ends up embedded in the built JS bundle either way, since GitHub
Pages is static hosting with no server to keep it hidden behind. That's an
acceptable trade-off for a private single-household kiosk, not something to
carry over if this ever became a multi-user or public deployment.

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

