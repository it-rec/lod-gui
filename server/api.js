const store = require('./db/store');
const { roomFor } = require('./rooms');

// Collection names are the single source of truth shared with the client
// (src/shared.js) through shared/collections.json so the two can never drift.
const COLLECTIONS = require('../shared/collections.json');

const API_PATH = '/api';
const GAME_ID_PATH = `${API_PATH}/game/:gameID`;

// One GET + POST endpoint per collection, derived from the shared name map so
// adding a collection is a one-line change in the JSON.
const endpoints = Object.values(COLLECTIONS).map((collection) => ({
  path: `${GAME_ID_PATH}/${collection}/`,
  collection,
}));

// Parse and validate the :gameID path param. Returns a positive integer, or
// null for anything else (NaN, zero, negative, decimals) so a junk id is
// rejected with 400 instead of silently writing to a garbage key like NaN.
const parseGameID = (raw) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Persisted payloads are always JSON objects or arrays, never scalars or
// null. Rejecting anything else stops a malformed request from clobbering a
// collection with, say, the bare string "null".
const isValidPayload = (body) => body !== null && typeof body === 'object';

const configureEndpoints = (app, io) => {
  endpoints.forEach(({ path, collection }) => {
    app.get(path, async (req, res, next) => {
      try {
        const gameID = parseGameID(req.params.gameID);
        if (gameID === null) {
          res.status(400).json({ error: 'Invalid game id' });
          return;
        }
        const payload = await store.read(collection, gameID);
        res.json(payload);
      } catch (err) {
        next(err);
      }
    });

    app.post(path, async (req, res, next) => {
      try {
        const gameID = parseGameID(req.params.gameID);
        if (gameID === null) {
          res.status(400).json({ error: 'Invalid game id' });
          return;
        }
        if (!isValidPayload(req.body)) {
          res
            .status(400)
            .json({ error: 'Payload must be a JSON object or array' });
          return;
        }
        await store.write(collection, gameID, req.body);
        // The originating client id lets the browser ignore its own echo and
        // avoid input flicker while still receiving everyone else's updates.
        // Scoped to the game's room so other campaigns never see this update.
        const origin = req.get('X-Client-Id') || null;
        io.to(roomFor(gameID)).emit(collection, req.body, origin);
        res.json(req.body);
      } catch (err) {
        next(err);
      }
    });
  });

  app.get(`${API_PATH}/status`, (req, res) => {
    res.json({ persistent: store.isPersistent() });
  });
};

module.exports = configureEndpoints;
