import { CollectionInfo, Document, MongoClient } from "mongodb";
import omitDeep from "omit-deep";

import logger from "@/common/logger";

import { zodToMongoSchema } from "./utils/mongoSchemaBuilder";

let mongodbClient: MongoClient | null = null;

const ensureInitialization = (client: MongoClient | null): MongoClient => {
  if (!client) {
    throw new Error("Database connection does not exist. Please call connectToMongodb before.");
  }
  return client;
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
  const client = new MongoClient(uri);

  await client.connect();
  mongodbClient = client;
  logger.info("Connected to MongoDB");

  return client;
};

export const getMongodbClient = () => mongodbClient;

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

export const getDbCollectionIndexes = async (name) => {
  return await ensureInitialization(mongodbClient).db().collection(name).indexes();
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
    modelDescriptors.map(async ({ collectionName, schema, zod }) => {
      await createCollectionIfDoesNotExist(collectionName);

      if (!schema && !zod) {
        return;
      }
      let convertedSchema = schema;
      if (zod) {
        convertedSchema = zodToMongoSchema(zod);
      }
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

/**
 * Clear d'une collection
 * @param {string} name
 * @returns
 */
export async function clearCollection(name) {
  logger.warn(`Suppression des données de la collection ${name}...`);
  await getDatabase().collection(name).deleteMany({});
}
