const {collections} = require('../../src/shared');
const LOD_DB = 'lod';
const getCollection = (dataBase, collection) => dataBase.db(LOD_DB).collection(collection);

const writeToDatabase = (dataBase, collection, id, object) => {
  return getCollection(dataBase, collection).replaceOne(
    { id },
    {
      id,
      payload: object
    },
    { upsert: true });
};

const readFromDataBase = async (dataBase, collection, id, query = {}) => {
  const searchQuery = { id, ...query };

  return await getCollection(dataBase, collection).findOne(
    searchQuery,
    { projection: { _id: 0 } },
  );
};

module.exports = {
  readFromDataBase,
  writeToDatabase,
};