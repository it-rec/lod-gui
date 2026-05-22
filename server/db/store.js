const logger = require('log4js').getLogger('Store');
const { MongoClient } = require('mongodb');
const { readFromDataBase, writeToDatabase } = require('./db-util');

// `mongdodb://` in the original code was a typo and meant the server could
// never reach a database. The URL is now configurable and spelled correctly.
const MONGO_URL =
  process.env.MONGO_URL ||
  'mongodb://localhost:27017/?retryWrites=true&retryReads=true&w=majority';

let mongoClient = null;
const memory = new Map();

const memoryKey = (collection, id) => `${collection}:${id}`;

// Tries to connect to MongoDB. When that fails (e.g. no database in a local
// or CI environment) the server keeps running with an in-memory store instead
// of crashing, so the app is always usable for development and demos.
const connect = async () => {
  try {
    const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    await client.db('lod').command({ ping: 1 });
    mongoClient = client;
    logger.info('Connected to MongoDB — game state is persistent.');
  } catch (err) {
    mongoClient = null;
    logger.warn(
      'MongoDB unavailable — using in-memory store. State will not survive a restart.'
    );
    logger.warn(err.message);
  }
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

module.exports = { connect, read, write, isPersistent };
