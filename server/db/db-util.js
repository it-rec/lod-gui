const LOD_DB = 'lod';
const getCollection = (mongoClient, collection) => mongoClient.db(LOD_DB).collection(collection);

const writeToDatabase = (dataBase, collection, id, object) => {
  return getCollection(dataBase, collection).replaceOne(
    { id },
    {
      id,
      payload: object
    },
    { upsert: true });
};

const readFromDataBase = async (mongoClient, collection, id, query = {}) => {
  const searchQuery = { id, ...query };

  return await getCollection(mongoClient, collection).findOne(
    searchQuery,
    { projection: { _id: 0 } },
  );
};

module.exports = {
  readFromDataBase,
  writeToDatabase,
};
