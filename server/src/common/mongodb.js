import { MongoClient } from "mongodb";
import logger from "./logger.js";
import { asyncForEach } from "./utils/asyncUtils.js";

let mongodbClient;

const ensureInitialization = () => {
  if (!mongodbClient) {
    throw new Error("Database connection does not exist. Please call connectToMongodb before.");
  }
};

/**
 * @param  {string} uri
 * @returns client
 */
export const connectToMongodb = async (uri) => {
  logger.info("Connecting to MongoDB at", uri);
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  mongodbClient = client;

  return client;
};

export const closeMongodbConnection = () => {
  ensureInitialization();
  return mongodbClient.close();
};

export const getDatabase = () => {
  ensureInitialization();
  return mongodbClient.db();
};

export const getDbCollection = (name) => {
  ensureInitialization();
  return mongodbClient.db().collection(name);
};

export const getDbCollectionIndexes = async (name) => {
  ensureInitialization();
  return await mongodbClient.db().collection(name).indexes();
};

/**
 * Création d'une collection si elle n'existe pas
 * @param {string} collectionName
 */
const createCollectionIfDoesNotExist = async (collectionName) => {
  const db = getDatabase();
  const collectionsInDb = await db.listCollections().toArray();
  const collectionExistsInDb = collectionsInDb.map(({ name }) => name).includes(collectionName);

  if (!collectionExistsInDb) {
    await db.createCollection(collectionName);
  }
};

export const configureDbSchemaValidation = async (modelDescriptors) => {
  const db = getDatabase();
  await ensureInitialization();
  await asyncForEach(modelDescriptors, async ({ collectionName, schema }) => {
    await createCollectionIfDoesNotExist(collectionName);

    if (!schema) {
      return;
    }
    await db.command({
      collMod: collectionName,
      validationLevel: "strict",
      validationAction: "error",
      validator: {
        $jsonSchema: { title: `${collectionName} validation schema`, ...schema },
      },
    });
  });
};
