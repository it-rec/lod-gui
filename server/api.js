const store = require('./db/store');

// Channel / collection names. These must stay in sync with `src/shared.js`
// on the client. They are duplicated here on purpose: the client file is an
// ES module and this server file is CommonJS.
const COLLECTIONS = {
  STORY_POINTS: 'storyPoints',
  FAME: 'fame',
  GOLD: 'gold',
  HEROES: 'heroes',
  CALENDAR: 'calendar',
  KEYWORDS: 'keywords',
  QUESTS: 'quests',
  NPCS: 'npcs',
  LOCATIONS: 'locations',
  JOURNAL: 'journal',
  INITIATIVE: 'initiative',
  INVENTORY: 'inventory',
};

const API_PATH = '/api';
const GAME_ID_PATH = `${API_PATH}/game/:gameID`;

const endpoints = [
  { path: `${GAME_ID_PATH}/storyPoints/`, collection: COLLECTIONS.STORY_POINTS },
  { path: `${GAME_ID_PATH}/heroes/`, collection: COLLECTIONS.HEROES },
  { path: `${GAME_ID_PATH}/fame/`, collection: COLLECTIONS.FAME },
  { path: `${GAME_ID_PATH}/gold/`, collection: COLLECTIONS.GOLD },
  { path: `${GAME_ID_PATH}/calendar/`, collection: COLLECTIONS.CALENDAR },
  { path: `${GAME_ID_PATH}/keywords/`, collection: COLLECTIONS.KEYWORDS },
  { path: `${GAME_ID_PATH}/quests/`, collection: COLLECTIONS.QUESTS },
  { path: `${GAME_ID_PATH}/npcs/`, collection: COLLECTIONS.NPCS },
  { path: `${GAME_ID_PATH}/locations/`, collection: COLLECTIONS.LOCATIONS },
  { path: `${GAME_ID_PATH}/journal/`, collection: COLLECTIONS.JOURNAL },
  { path: `${GAME_ID_PATH}/initiative/`, collection: COLLECTIONS.INITIATIVE },
  { path: `${GAME_ID_PATH}/inventory/`, collection: COLLECTIONS.INVENTORY },
];

const configureEndpoints = (app, io) => {
  endpoints.forEach(({ path, collection }) => {
    app.get(path, async (req, res, next) => {
      try {
        const gameID = parseInt(req.params.gameID, 10);
        const payload = await store.read(collection, gameID);
        res.json(payload);
      } catch (err) {
        next(err);
      }
    });

    app.post(path, async (req, res, next) => {
      try {
        const gameID = parseInt(req.params.gameID, 10);
        await store.write(collection, gameID, req.body);
        // The originating client id lets the browser ignore its own echo and
        // avoid input flicker while still receiving everyone else's updates.
        const origin = req.get('X-Client-Id') || null;
        io.emit(collection, req.body, origin);
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
