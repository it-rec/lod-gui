const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('log4js').getLogger('Server');

const store = require('./db/store');
const configureEndpoints = require('./api');

logger.level = 'debug';

const PORT = process.env.PORT || 3080;

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: { origin: true, methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../build')));

// Broadcast the current head-count to every connected socket. Used by the
// presence indicator next to the connection badge.
const broadcastPresence = () => {
  io.emit('presence', { players: io.engine.clientsCount });
};

io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);
  socket.emit('presence', { players: io.engine.clientsCount });
  broadcastPresence();
  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
    broadcastPresence();
  });
  // Dice rolls are ephemeral: never written to the store, just relayed so
  // every connected player sees what was rolled. The server stamps the
  // payload with the originating socket id and a timestamp so other clients
  // can ignore their own echo and sort consistently.
  socket.on('dice:roll', (payload) => {
    if (!payload || typeof payload !== 'object') return;
    io.emit('dice:roll', {
      ...payload,
      origin: socket.id,
      rolledAt: payload.rolledAt || new Date().toISOString(),
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

  server.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
    logger.info(
      `Persistence: ${store.isPersistent() ? 'MongoDB' : 'in-memory (no database)'}`
    );
  });
};

start();
