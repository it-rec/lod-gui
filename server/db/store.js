const logger = require('log4js').getLogger('Store');
const { MongoClient } = require('mongodb');
const { readFromDataBase, writeToDatabase } = require('./db-util');

// `mongdodb://` in the original code was a typo and meant the server could
// never reach a database. The URL is now configurable and spelled correctly.
const MONGO_URL =
  process.env.MONGO_URL ||
  'mongodb://localhost:27017/?retryWrites=true&retryReads=true&w=majority';

// How long to wait between attempts to reach MongoDB after the first one
// fails. Until a connection is established the server serves an in-memory
// store, then transparently switches to the database once it becomes
// reachable instead of staying in-memory forever.
const RECONNECT_INTERVAL_MS = Number(process.env.MONGO_RECONNECT_MS) || 10000;

let mongoClient = null;
let reconnectTimer = null;
let stopped = false;
const memory = new Map();

const memoryKey = (collection, id) => `${collection}:${id}`;

// Attempt a single connection. Returns true on success. Once connected, the
// MongoDB driver handles reconnection on its own; this only covers the case
// where the database is not reachable at startup.
const tryConnect = async () => {
  try {
    const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    await client.db('lod').command({ ping: 1 });
    mongoClient = client;
    logger.info('Connected to MongoDB — game state is persistent.');
    return true;
  } catch (err) {
    logger.warn(
      'MongoDB unavailable — using in-memory store. State will not survive a restart.'
    );
    logger.warn(err.message);
    return false;
  }
};

// Schedule another connection attempt unless one is already pending, we are
// already connected, or the store has been closed.
const scheduleReconnect = () => {
  if (stopped || mongoClient || reconnectTimer) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    const connected = await tryConnect();
    if (!connected) scheduleReconnect();
  }, RECONNECT_INTERVAL_MS);
  // Don't keep the event loop alive solely for the retry timer.
  reconnectTimer.unref?.();
};

// Tries to connect to MongoDB. When that fails (e.g. no database in a local
// or CI environment) the server keeps running with an in-memory store instead
// of crashing, and retries in the background so the app is always usable for
// development and demos.
const connect = async () => {
  stopped = false;
  const connected = await tryConnect();
  if (!connected) scheduleReconnect();
};

const read = async (collection, id) => {
  if (mongoClient) {
    const result = await readFromDataBase(mongoClient, collection, id);
    return result?.payload ?? null;
  }
  return memory.get(memoryKey(collection, id)) ?? null;
};

const write = async (collection, id, payload) => {
  if (mongoClient) {
    await writeToDatabase(mongoClient, collection, id, payload);
    return payload;
  }
  memory.set(memoryKey(collection, id), payload);
  return payload;
};

const isPersistent = () => Boolean(mongoClient);

// Stop retrying and release the MongoDB connection. Called on shutdown so the
// process can exit cleanly instead of being killed mid-write.
const close = async () => {
  stopped = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
  }
};

module.exports = { connect, read, write, isPersistent, close };
