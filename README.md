# LoD — Campaign Companion

A real-time companion app for the storytelling board game **Legacy of
Dragonholt**. It keeps the shared state of a campaign in sync across every
player's screen:

- **The Party** — character cards with species, background, a stamina tracker
  and a full sheet: ranked skills, traits, conditions, inventory and notes.
- **Gold** — the party's coin.
- **Fame** — the party's reputation and deeds.
- **The Calendar** — the current day and time of day, with one-tap advancement.
- **Quests** — pledged errands with notes and active/completed filtering.
- **People** — the cast met along the way, tagged ally / foe / neutral /
  unknown, with location and notes.
- **Locations** — the map ledger of towns, wilds and ruins, tagged
  rumored / visited / home / lost, with region and notes; flips
  between a list and a hand-drawn parchment map with draggable pins.
- **Keywords** — the log of story keywords and notes recorded along the way.
- **The Chronicle** — an A1–Z8 grid of story entries, with progress, chapter
  navigation and filtering.
- **The Dice roller** — quick d4–d100 buttons and a full dice-notation parser
  (`2d6+3`, `3d4+2d6+1`, …). Every roll is broadcast live so the whole table
  sees the same dice.

The header also offers a **campaign menu** with one-click **Download backup**
(every panel saved to a single JSON file) and **Restore from backup**.

Built as a React app (powered by [Vite](https://vitejs.dev/)) with an
Express + Socket.IO backend. Every change is broadcast over Socket.IO so all
connected players stay in sync instantly.

## Documentation

A guided tour of every panel — with screenshots — is published to GitHub
Pages from the [`docs/`](./docs) folder. Browse it locally by opening
[`docs/index.md`](./docs/index.md), or read the live site at
<https://it-rec.github.io/lod-gui/>.

## Toolchain

This project uses [**Bun**](https://bun.sh/) as both its package manager
**and** its runtime for the backend dev server. The version is pinned in
[`.bun-version`](./.bun-version) and mirrored in the `packageManager` and
`engines.bun` fields of `package.json`.

Install [Bun](https://bun.sh/docs/installation) (`curl -fsSL https://bun.sh/install | bash`),
then install dependencies with `bun install`.

Vite still builds the React app and Vitest still runs the tests — Bun
just executes them.

## Available Scripts

> Always use `bun run <script>`. Bare `bun test` would invoke Bun's
> built-in test runner instead of the `test` script — we use Vitest here
> for its React Testing Library integration, so `bun run test` is what
> you want.

### `bun run start`

Runs the Vite dev server at [http://localhost:3000](http://localhost:3000).
Requests to `/api` and `/socket.io` are proxied to the backend on
`http://localhost:3080`.

### `bun run dev`

Runs the backend server (Express + Socket.IO) on port `3080` under Bun
with `--watch`, which restarts on changes to `server/` and its imports.

If MongoDB is not reachable the server logs a warning and falls back to an
**in-memory store**, so the app is fully usable for local development and demos
without a database. Set `MONGO_URL` to point at a database for real persistence.

### `bun run build`

Builds the app for production into the `build/` folder. The Express server
(`server/app.js`) serves this directory and provides the SPA fallback.

### `bun run preview`

Serves the production build locally for previewing.

### `bun run test`

Runs the test suite with [Vitest](https://vitest.dev/).

### `bun run lint`

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
