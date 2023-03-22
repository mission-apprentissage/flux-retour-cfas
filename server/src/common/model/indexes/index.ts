import logger from "../../logger.js";
import { getDbCollection, getCollectionList } from "../../mongodb.js";
import { modelDescriptors } from "../collections.js";

export const createIndexes = async () => {
  const collections = (await getCollectionList()).map((collection) => collection.name);

  for (const descriptor of modelDescriptors) {
    if (descriptor.indexes && collections.includes(descriptor.collectionName)) {
      logger.info(`Create indexes for collection ${descriptor.collectionName}`);
      await Promise.all(
        descriptor.indexes.map(([index, options]) => {
          return getDbCollection(descriptor.collectionName).createIndex(index, options);
        })
      );
    }
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
