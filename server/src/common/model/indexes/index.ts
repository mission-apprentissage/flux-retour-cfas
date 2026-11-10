import logger from "@/common/logger";
import { modelDescriptors } from "@/common/model/collections";
import { createCollectionIndexes } from "@/common/model/indexes/createCollectionIndexes";
import { getDbCollection, getCollectionList } from "@/common/mongodb";

export const createIndexes = async () => {
  for (const descriptor of modelDescriptors) {
    if (!descriptor.indexes) {
      continue;
    }
    logger.info(`Create indexes for collection ${descriptor.collectionName}`);
    await createCollectionIndexes(descriptor);
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
