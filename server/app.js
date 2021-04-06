const express = require('express');
const path = require('path');
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

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../build')));

app.get('/', (req,res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

MongoClient.connect('mongodb://localhost:27017?retryWrites=true&w=majority',
  { useUnifiedTopology: true },
  function(err, database) {
    if(err) throw err;

    configureEndpoints(app, io, database);

    server.listen(port, () => {
      console.log(`Server listening on the port::${port}`);
      console.log('Routes:');
      console.log(app._router.stack
        .filter(layer => layer?.route)
        .map(layer => layer.route)
        .map(route => ({path: route.path, methods: route.methods}))
      );
    });

  }
);

io.on('connection', (socket) => {
  sockets.push(socket);
  socket.on('disconnect', () => {
    console.log('Removed socket:');
    console.log(
      sockets.splice(
        sockets.findIndex((registeredSocket => registeredSocket === socket)),
        1)?.client
    );
  });
});

io.on('disconnect', () => {
  console.log(io.connected); // false
});
io.on('connect_error', (error) => {
  console.log('error');
  console.error(error);
});