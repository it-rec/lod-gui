const {collections} = require('../src/shared');
const { readFromDataBase, writeToDatabase } = require('./db/db-util.js');

const API_PATH = '/api';
const GAME_PATH = `${API_PATH}/game`;
const GAME_ID_PATH = `${GAME_PATH}/:gameID`;
const STORY_POINTS_PATH = `${GAME_ID_PATH}/storypoints/`;
const FAME_PATH = `${GAME_ID_PATH}/fame/`;
const GOLD_PATH = `${GAME_ID_PATH}/gold/`;

const generatePostAndGetEndpoint = (app, io, db, path, collection) => {
  app.get(path, (req, res) => {
    const { gameID } = req.params;

    readFromDataBase(db, collection, parseInt(gameID, 10)).then(
      result => {
        // console.debug(`[GET - ${collection}]:`);
        // console.debug(result.payload);
        res.json(result.payload);
      }
    );
  });

  app.post(path, (req, res) => {
    const { gameID } = req.params;

    writeToDatabase(db, collection, parseInt(gameID, 10), req.body);
    io.emit(collection, req.body);
    // console.debug(`[POST - ${collection}]:`);
    // console.debug(req.body);
    res.json(req.body);
  });
};


const configureEndpoints =  (app, io, db) => {
  generatePostAndGetEndpoint(app, io, db, STORY_POINTS_PATH, collections.STORY_POINTS);
  generatePostAndGetEndpoint(app, io ,db, FAME_PATH, collections.FAME);
  generatePostAndGetEndpoint(app, io, db, GOLD_PATH, collections.GOLD);
};

module.exports = configureEndpoints;