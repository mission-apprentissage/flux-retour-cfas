import { beforeEach, beforeAll, afterAll } from "vitest";

import { modelDescriptors } from "@/common/model/collections";
import { clearAllCollections, configureDbSchemaValidation, getDbCollection } from "@/common/mongodb";
import { startAndConnectMongodb, stopMongodb } from "@tests/utils/mongoUtils";

/**
 * Crée à l'avance les index que `rate-limiter-flexible` créerait lui-même au
 * premier usage d'une route rate-limitée.
 *
 * Sa méthode `_initCollection` lance ses deux `createIndex` SANS les attendre
 * ni les catcher (cf RateLimiterMongo.js) : ils sont donc encore en vol quand
 * un test court se termine. Depuis mongodb v6, fermer le client interrompt
 * activement les opérations en cours (`ConnectionPool.closeCheckedOutConnections`
 * → `MongoClientClosedError`), là où v5 les abandonnait en silence. Ces rejets
 * n'appartenant à aucun test, vitest les compte en "unhandled errors" et sort
 * en code 1 — CI rouge alors que tous les tests passent.
 *
 * En créant les index ici, l'appel de la lib devient un no-op immédiat.
 */
const createRateLimiterIndexes = async () => {
  const collection = getDbCollection("rateLimits");
  await collection.createIndex({ expire: -1 }, { expireAfterSeconds: 0 });
  await collection.createIndex({ key: 1 }, { unique: true });
};

export const useMongo = () => {
  beforeAll(async () => {
    // connect to mongodb and create indexes before running tests
    await startAndConnectMongodb();
    await configureDbSchemaValidation(modelDescriptors);
    await createRateLimiterIndexes();
  }, 30_000);
  afterAll(async () => {
    await stopMongodb();
  });
  beforeEach(async () => {
    await clearAllCollections();
  });
};
