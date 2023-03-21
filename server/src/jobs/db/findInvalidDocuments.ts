import logger from "../../common/logger.js";
import { getDbCollectionSchema, getDbCollection } from "../../common/mongodb.js";

export const findInvalidDocuments = async (name) => {
  logger.info("Search invalid documents...");
  var schema = await getDbCollectionSchema(name);
  if (!schema) {
    logger.info(`Schema not found for ${name}`);
    return;
  }

  // Find any documents not matching the schema
  const documents = await getDbCollection(name)
    .find({ $nor: [schema] })
    .toArray();

  logger.info(`Find ${documents.length} invalid documents for ${name}`);
  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];
    try {
      await getDbCollection(name).updateOne({ _id: document._id }, { $set: { invalidDoc: true } });
    } catch (error: any) {
      logger.info(
        ` #${i + 1} ${name} ${document._id}: ${JSON.stringify(error.errInfo.details.schemaRulesNotSatisfied)}`
      );
    }
  }
};
