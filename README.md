# lod-gui

A React app (powered by [Vite](https://vitejs.dev/)) with an Express + Socket.IO backend.

## Available Scripts

### `yarn start`

Runs the Vite dev server at [http://localhost:3000](http://localhost:3000).
Requests to `/api` and `/socket.io` are proxied to the backend on `http://localhost:3080`.

### `yarn dev`

Runs the backend server (Express + Socket.IO) with `nodemon` on port `3080`.

### `yarn build`

Builds the app for production into the `build/` folder. The Express server (`server/app.js`)
serves this directory.

### `yarn preview`

Serves the production build locally for previewing.

### `yarn test`

Runs the test suite with [Vitest](https://vitest.dev/).

## Project structure

- `src/` — React source (Vite entry: `src/index.js`).
- `public/` — Static assets copied verbatim to the build root.
- `index.html` — Vite HTML entry (at project root).
- `server/` — Express + Socket.IO backend.
- `vite.config.js` — Vite configuration (dev server proxy, JSX-in-`.js` loader, build output).
