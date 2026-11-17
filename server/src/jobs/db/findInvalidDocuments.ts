import { MongoServerError } from "mongodb";

import logger from "@/common/logger";
import { getDatabase } from "@/common/mongodb";

const DEFAULT_LIMIT = 100;

export const findInvalidDocuments = async (name: string, limit = DEFAULT_LIMIT) => {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Option limit invalide : entier supérieur ou égal à 1 attendu");
  }

  const db = getDatabase();
  const [collectionInfo] = await db.listCollections({ name }, { nameOnly: false }).toArray();
  const options = collectionInfo?.options;
  if (!options?.validator) {
    logger.info(`Schema not found for ${name}`);
    return;
  }
  if (options.validationLevel !== "strict" || options.validationAction !== "error") {
    throw new Error(
      `Recherche refusée sur ${name} : le validateur n'est pas en strict et error, le diagnostic écrirait dans les documents`
    );
  }

  const collection = db.collection(name);
  const documents = await collection
    .find({ $nor: [options.validator] })
    .limit(limit)
    .toArray();

  logger.info(`Find ${documents.length} invalid documents for ${name} (limit ${limit})`);
  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];
    try {
      await collection.updateOne({ _id: document._id }, { $set: { invalidDoc: true } });
    } catch (error) {
      const details = error instanceof MongoServerError ? error.errInfo?.details?.schemaRulesNotSatisfied : error;
      logger.info(` #${i + 1} ${name} ${document._id}: ${JSON.stringify(details)}`);
    }
  }
};
