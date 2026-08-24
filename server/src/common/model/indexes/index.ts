import { captureException } from "@sentry/node";

import logger from "@/common/logger";
import { modelDescriptors } from "@/common/model/collections";
import { getDbCollection, getCollectionList } from "@/common/mongodb";

export const createIndexes = async () => {
  for (const descriptor of modelDescriptors) {
    if (!descriptor.indexes) {
      return;
    }
    logger.info(`Create indexes for collection ${descriptor.collectionName}`);
    await Promise.all(
      descriptor.indexes.map(async ([index, options]) => {
        try {
          await getDbCollection(descriptor.collectionName).createIndex(index, options);
        } catch (err) {
          logger.error({ err, collectionName: descriptor.collectionName }, "Erreur lors de la création des index");
          captureException(new Error(`Error creating indexes for ${descriptor.collectionName}`, { cause: err }));
        }
      })
    );
  }
};

export const dropIndexes = async () => {
  const collections = (await getCollectionList()).map((collection) => collection.name);
  for (const descriptor of modelDescriptors) {
    logger.info(`Drop indexes for collection ${descriptor.collectionName}`);
    if (collections.includes(descriptor.collectionName)) {
      await getDbCollection(descriptor.collectionName).dropIndexes();
    }
  }
};
