# LoD — Campaign Companion

A real-time companion app for a tabletop campaign. It keeps the shared state of
a game in sync across every player's screen:

- **The Party** — hero cards with race, class, level, a vitality tracker and a
  full character sheet (skills, inventory, notes).
- **Treasury** — the party's gold.
- **Renown** — the party's reputation and deeds.
- **The Chronicle** — an A1–Z8 grid of story entries, with progress, chapter
  navigation and filtering.

Built as a React app (powered by [Vite](https://vitejs.dev/)) with an
Express + Socket.IO backend. Every change is broadcast over Socket.IO so all
connected players stay in sync instantly.

## Available Scripts

### `yarn start`

Runs the Vite dev server at [http://localhost:3000](http://localhost:3000).
Requests to `/api` and `/socket.io` are proxied to the backend on
`http://localhost:3080`.

### `yarn dev`

Runs the backend server (Express + Socket.IO) with `nodemon` on port `3080`.

If MongoDB is not reachable the server logs a warning and falls back to an
**in-memory store**, so the app is fully usable for local development and demos
without a database. Set `MONGO_URL` to point at a database for real persistence.

### `yarn build`

Builds the app for production into the `build/` folder. The Express server
(`server/app.js`) serves this directory and provides the SPA fallback.

### `yarn preview`

Serves the production build locally for previewing.

### `yarn test`

Runs the test suite with [Vitest](https://vitest.dev/).

### `yarn lint`

Runs ESLint over the project.

## Project structure

- `src/` — React source (Vite entry: `src/index.jsx`).
  - `components/` — feature panels and shared UI components.
  - `hooks/` — `useGameChannel` (per-channel data + realtime sync) and
    `useConnection`.
  - `socket/` — the shared Socket.IO connection.
  - design tokens live in `src/index.scss`; component styles in `*.module.scss`.
- `public/` — static assets copied verbatim to the build root.
- `index.html` — Vite HTML entry (at project root).
- `server/` — Express + Socket.IO backend with a MongoDB / in-memory store.
- `vite.config.mjs` — Vite configuration (dev server proxy, build output, tests).
