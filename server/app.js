const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('log4js').getLogger('Server');

const store = require('./db/store');
const configureEndpoints = require('./api');
const { roomFor } = require('./rooms');

logger.level = 'debug';

const PORT = process.env.PORT || 3080;

// CORS is opt-in. In production the client is served from this same origin,
// and in development Vite proxies '/api' and '/socket.io', so no cross-origin
// access is needed by default. Set ALLOWED_ORIGINS to a comma-separated
// allowlist, or '*' to permit any origin.
const parseOrigins = (raw) => {
  if (raw === '*') return true;
  if (!raw) return false;
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};
const ALLOWED_ORIGINS = parseOrigins(process.env.ALLOWED_ORIGINS);

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: ALLOWED_ORIGINS }));
// Cap request bodies: a campaign payload is a few KB, so 256kb is generous
// while still refusing an oversized body before it reaches the store.
app.use(bodyParser.json({ limit: '256kb' }));
app.use(express.static(path.join(__dirname, '../build')));

// Broadcast the current head-count to every connected socket. Used by the
// presence indicator next to the connection badge.
const broadcastPresence = () => {
  io.emit('presence', { players: io.engine.clientsCount });
};

// Validate a game id arriving over a socket the same way the REST layer does.
const parseGameID = (raw) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);
  socket.emit('presence', { players: io.engine.clientsCount });
  broadcastPresence();

  // The client announces which game it is watching so realtime updates can be
  // scoped to a room. Without this, a write to one campaign would broadcast to
  // every connected client of every campaign.
  socket.on('game:join', (rawGameID) => {
    const gameID = parseGameID(rawGameID);
    if (gameID === null) return;
    socket.data.gameID = gameID;
    socket.join(roomFor(gameID));
  });

  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
    broadcastPresence();
  });

  // Relay an ephemeral table-side event to everyone in the sender's game
  // room. Falls back to a global broadcast if the socket never joined a game.
  const relayToGame = (event, message) => {
    const gameID = socket.data.gameID;
    if (gameID) {
      io.to(roomFor(gameID)).emit(event, message);
    } else {
      io.emit(event, message);
    }
  };

  // Dice rolls are ephemeral: never written to the store, just relayed so
  // every connected player sees what was rolled. The server stamps the
  // payload with the originating socket id and a timestamp so other clients
  // can ignore their own echo and sort consistently.
  socket.on('dice:roll', (payload) => {
    if (!payload || typeof payload !== 'object') return;
    relayToGame('dice:roll', {
      ...payload,
      origin: socket.id,
      rolledAt: payload.rolledAt || new Date().toISOString(),
    });
  });
  // Soundscape is ephemeral table-side state. The server only relays the
  // current scene name; each client decides whether it has a synth attached
  // and what its local volume is.
  socket.on('soundscape:set', (payload) => {
    if (!payload || typeof payload !== 'object') return;
    const scene = typeof payload.scene === 'string' ? payload.scene : null;
    if (!scene || scene.length > 32) return;
    relayToGame('soundscape:set', { scene, origin: socket.id });
  });
  // Reactions are also ephemeral table-side noise. The server only relays
  // them; the client decides what to render and for how long.
  socket.on('reaction:send', (payload) => {
    if (!payload || typeof payload !== 'object') return;
    const emoji = typeof payload.emoji === 'string' ? payload.emoji : null;
    if (!emoji || emoji.length > 8) return;
    relayToGame('reaction:send', {
      emoji,
      origin: socket.id,
      sentAt: new Date().toISOString(),
    });
  });
});

io.on('connect_error', (error) => logger.error('Socket error', error));

const start = async () => {
  logger.info('Initializing data store...');
  await store.connect();

  configureEndpoints(app, io);

  // SPA fallback: anything not matched by the API or a static asset returns
  // the built index.html so client-side rendering can take over.
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });

  // Turn request errors — malformed JSON or an oversized body rejected by
  // body-parser — into clean JSON responses. Without this, Express's default
  // handler dumps a full stack trace to the log for what are ordinary 4xx
  // client errors. Genuine 5xx faults are still logged in full.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) {
      logger.error('Unhandled request error', err);
    } else {
      logger.warn(`Rejected request (${status}): ${err.message}`);
    }
    res.status(status).json({ error: err.message });
  });

  server.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
    logger.info(
      `Persistence: ${store.isPersistent() ? 'MongoDB' : 'in-memory (no database)'}`
    );
  });

  // Stop accepting requests and release the database connection on shutdown
  // so the process exits cleanly instead of being killed mid-write.
  const shutdown = async (signal) => {
    logger.info(`Received ${signal} — shutting down.`);
    server.close();
    await store.close();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start();
