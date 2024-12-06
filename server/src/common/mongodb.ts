import { CollectionInfo, Document, MongoClient } from "mongodb";
import omitDeep from "omit-deep";
import { zodToMongoSchema } from "shared/models";

import logger from "@/common/logger";
import config from "@/config";

let mongodbClient: MongoClient | null = null;

const ensureInitialization = (client: MongoClient | null): MongoClient => {
  if (!client) {
    throw new Error("Database connection does not exist. Please call connectToMongodb before.");
  }
  return client;
};

export const getMongodbUri = (dbName: string = config.mongodb.dbName, withMainDbAuthent: boolean = false) => {
  if (withMainDbAuthent) {
    return `${config.mongodb.uri}${dbName}?${config.mongodb.options}&authSource=${config.mongodb.dbName}`;
  }
  return `${config.mongodb.uri}${dbName}?${config.mongodb.options}`;
};

export const getBALMongodbUri = (dbName: string) => {
  return `${config.mongodb.uriBal}${dbName}?${config.mongodb.optionsBal}`;
};

/**
 * @param  {string} uri
 * @returns client
 */
export const connectToMongodb = async (uri) => {
  if (mongodbClient) {
    return mongodbClient;
  }

  logger.info("Connecting to MongoDB...");
  const client = new MongoClient(uri, {
    maxIdleTimeMS: 600_000,
    minPoolSize: config.env === "local" ? 2 : 10,
    maxPoolSize: 500,
    heartbeatFrequencyMS: 60_000,
  });

  await client.connect();
  mongodbClient = client;
  logger.info("Connected to MongoDB");

  return client;
};

export const getMongodbClient = () => ensureInitialization(mongodbClient);

export const closeMongodbConnection = async () => {
  if (!mongodbClient) {
    return;
  }
  try {
    await mongodbClient.close();
  } finally {
    mongodbClient = null;
  }
};

export const getDatabase = () => {
  return ensureInitialization(mongodbClient).db();
};

export const getCollectionList = () => {
  return ensureInitialization(mongodbClient).db().listCollections().toArray();
};

export const getDbCollection = <TSchema extends Document>(name) => {
  return ensureInitialization(mongodbClient).db().collection<TSchema>(name);
};

export const getDbCollectionSchema = async (name) => {
  const collectionInfo: CollectionInfo | null = await ensureInitialization(mongodbClient)
    .db()
    .listCollections({ name })
    .next();
  return collectionInfo?.options?.validator;
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

/**
 * Config de la validation
 * @param {*} modelDescriptors
 */
export const configureDbSchemaValidation = async (modelDescriptors) => {
  const db = getDatabase();
  await Promise.all(
    modelDescriptors.map(async ({ collectionName, zod }) => {
      await createCollectionIfDoesNotExist(collectionName);

      if (!zod) {
        return;
      }
      let convertedSchema = zodToMongoSchema(zod);
      if (!convertedSchema) {
        return;
      }

      await db.command({
        collMod: collectionName,
        validationLevel: "strict",
        validationAction: "error",
        validator: {
          $jsonSchema: { title: collectionName, ...omitDeep(convertedSchema, ["example"]) }, // strip example field because NON STANDARD jsonSchema
        },
      });
    })
  );
};

/**
 * Clear de toutes les collections
 * @returns
 */
export const clearAllCollections = async () => {
  let collections = await getDatabase().collections();
  return Promise.all(collections.map((c) => c.deleteMany({})));
};
