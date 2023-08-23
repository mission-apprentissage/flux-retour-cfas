import { CollectionInfo, Document, MongoClient } from "mongodb";
import omitDeep from "omit-deep";

import logger from "@/common/logger";

import { zodToMongoSchema } from "./utils/mongoSchemaBuilder";

let mongodbClient: MongoClient;

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
  logger.info("Connecting to MongoDB...");
  const client = new MongoClient(uri);

  await client.connect();
  mongodbClient = client;
  logger.info("Connected to MongoDB");

  return client;
};

export const getMongodbClient = () => mongodbClient;

export const closeMongodbConnection = () => {
  ensureInitialization();
  return mongodbClient.close();
};

export const getDatabase = () => {
  ensureInitialization();
  return mongodbClient.db();
};

export const getCollectionList = () => {
  return mongodbClient.db().listCollections().toArray();
};

export const getDbCollection = <TSchema extends Document>(name) => {
  ensureInitialization();
  return mongodbClient.db().collection<TSchema>(name);
};

export const getDbCollectionSchema = async (name) => {
  ensureInitialization();
  const collectionInfo: CollectionInfo | null = await mongodbClient.db().listCollections({ name }).next();
  return collectionInfo?.options?.validator;
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
  ensureInitialization();
  await getDatabase().collection(name).deleteMany({});
}
