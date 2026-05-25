---
title: Getting started
layout: default
nav_order: 2
---

LoD is a small two-process app: a Vite-powered React frontend and an
Express + Socket.IO backend. You can run them side by side in development
or build a single production bundle that the backend serves.

## Prerequisites

- **Node.js 22.x** (matches the CI matrix).
- **Yarn 1.x** for installing dependencies.
- Optional: a reachable **MongoDB** instance. Without one, the server uses an
  in-memory store, which is perfect for an evening's session.

## Install

```bash
yarn install --frozen-lockfile
```

## Development

Open two terminals.

```bash
# Terminal 1 — backend on :3080
yarn dev
```

```bash
# Terminal 2 — Vite dev server on :3000 (with HMR)
yarn start
```

The dev server proxies `/api` and `/socket.io` to the backend, so everything
just works as a single app at <http://localhost:3000>.

If MongoDB is not reachable, the backend logs a warning and falls back to its
in-memory store. Set `MONGO_URL` to point at a real database when you want
persistence between sessions.

## Production build

```bash
yarn build       # bundles to ./build
yarn dev         # the backend also serves ./build at /
```

Once `build/` exists, the backend at `http://localhost:3080` serves the SPA,
the `/api/...` REST endpoints, and the Socket.IO transport — one process for
the whole app.

## Other scripts

| Command | What it does |
| --- | --- |
| `yarn test` | Runs the Vitest suite. |
| `yarn lint` | Runs ESLint over the project. |
| `yarn preview` | Serves the production build locally for previewing. |

## Connecting other players

The app is keyed to a single campaign (`game/1`). Anyone you point at the
same backend URL joins the same shared state — no accounts, no rooms. For a
remote table, expose the backend port behind a tunnel (or run it on a
network the players can reach) and share the URL.

When the realtime link drops, every edit you make is kept locally; a toast
announces the disconnect, and another announces the reconnect when it
returns.
