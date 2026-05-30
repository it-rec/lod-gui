// Collection / channel names are the single source of truth shared with the
// server (server/api.js) via shared/collections.json, so the client and
// backend can never drift out of sync.
import collections from '../shared/collections.json';

// The one campaign this companion app tracks today. The data model is keyed
// by game id so it can grow to multiple campaigns later; for now every panel
// talks to game 1. Keeping it here means the id lives in exactly one place.
export const GAME_ID = 1;

// Build the REST path for a collection. Centralised so the '/api/game/<id>/'
// prefix is no longer hand-written into dozens of call sites; gamePath of the
// gold collection yields the gold endpoint under the current game id.
export const gamePath = (collection) => `/api/game/${GAME_ID}/${collection}/`;

export { collections };
