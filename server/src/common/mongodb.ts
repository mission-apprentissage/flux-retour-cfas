import { captureException } from "@sentry/node";
import { isEqual } from "lodash-es";
import { CollectionInfo, Document, MongoClient, MongoServerError } from "mongodb";
import { zodToMongoSchema } from "shared/models";
import type { ZodTypeAny } from "zod";

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
export const connectToMongodb = async (uri: string) => {
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

export const getDbCollection = <TSchema extends Document>(name: string) => {
  return ensureInitialization(mongodbClient).db().collection<TSchema>(name);
};

export const getDbCollectionSchema = async (name: string) => {
  const collectionInfo: CollectionInfo | null = await ensureInitialization(mongodbClient)
    .db()
    .listCollections({ name })
    .next();
  return collectionInfo?.options?.validator;
};

export type ValidationLevel = "strict" | "moderate";

type ValidationOptions = {
  level?: ValidationLevel;
  onIndexBuild?: "throw" | "warn";
};

const NAMESPACE_EXISTS = 48;
const INDEX_BUILD_IN_PROGRESS = 12587;

const createCollectionIfDoesNotExist = async (collectionName: string) => {
  try {
    await getDatabase().createCollection(collectionName);
  } catch (err) {
    if (err instanceof MongoServerError && err.code === NAMESPACE_EXISTS) {
      return;
    }
    throw err;
  }
};

export const configureDbSchemaValidation = async (
  modelDescriptors: ReadonlyArray<{ collectionName: string; zod?: ZodTypeAny | null }>,
  { level = "strict", onIndexBuild = "throw" }: ValidationOptions = {}
) => {
  const db = getDatabase();
  const collections = await db.listCollections().toArray();
  const optionsByName = new Map(collections.map((collection: CollectionInfo) => [collection.name, collection.options]));

  await Promise.all(
    modelDescriptors.map(async ({ collectionName, zod }) => {
      if (!optionsByName.has(collectionName)) {
        await createCollectionIfDoesNotExist(collectionName);
      }

      if (!zod) {
        return;
      }
      const convertedSchema = zodToMongoSchema(zod);
      if (!convertedSchema) {
        return;
      }

      const validator = {
        $jsonSchema: { title: collectionName, ...omitDeepKeys(convertedSchema, ["example"]) },
      };

      const current = optionsByName.get(collectionName);
      if (
        current?.validationLevel === level &&
        current?.validationAction === "error" &&
        isEqual(current?.validator, validator)
      ) {
        return;
      }

      try {
        await db.command({
          collMod: collectionName,
          validationLevel: level,
          validationAction: "error",
          validator,
        });
      } catch (err) {
        if (onIndexBuild === "warn" && err instanceof MongoServerError && err.code === INDEX_BUILD_IN_PROGRESS) {
          logger.warn({ err, collectionName }, "Validateur non appliqué : construction d'index en cours");
          captureException(new Error(`Validateur non appliqué sur ${collectionName}`, { cause: err }));
          return;
        }
        throw err;
      }
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
 * Retire récursivement les clés indiquées (jsonSchema Mongo n'accepte pas le champ `example`).
 */
function omitDeepKeys<T>(value: T, keys: string[]): T {
  if (Array.isArray(value)) {
    return value.map((item) => omitDeepKeys(item, keys)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !keys.includes(key))
        .map(([key, item]) => [key, omitDeepKeys(item, keys)])
    ) as T;
  }

  return value;
}
