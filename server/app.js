const express = require('express');
const path = require('path');
const logger = require('log4js').getLogger('Server');
const app = express(),
  bodyParser = require('body-parser'),
  cors = require('cors'),
  port = 3080,
  server = require('http').createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3080',
    methods: ['GET', 'POST']
  }
});
const configureEndpoints = require('./api');

const MongoClient = require('mongodb').MongoClient;

const sockets = [];

logger.level = 'debug';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../build')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

logger.info('Initializing Database');

MongoClient.connect('mongdodb://localhost:27017?retryWrites=true&retryReads=true&w=majority')
  .then((mongoClient) => {
    configureEndpoints(app, io, mongoClient);

    server.listen(port, () => {
      logger.info(`Server listening on the port: ${port}`);
      logger.info('Routes:');
      console.log(app._router.stack
        .filter(layer => layer?.route)
        .map(layer => layer.route)
        .map(route => ({path: route.path, methods: route.methods}))
      );
    });
  }).catch((err) => {
    if (err) {
      logger.fatal('\x1b[31m%s\x1b[0m', 'Database is not reachable, can\'t initialize game state, shutting down.');
    } else {
      logger.info('Database loaded, initialized game state successfully.');
    }
  });

io.on('connection', (socket) => {
  sockets.push(socket);
  socket.on('disconnect', () => {
    logger.info('Removed socket:');
    console.log(
      sockets.splice(
        sockets.findIndex((registeredSocket => registeredSocket === socket)),
        1)?.client
    );
  });
});

io.on('disconnect', () => {
  logger.info(io.connected); // false
});
io.on('connect_error', (error) => {
  logger.error('error');
  logger.error(error);
});
