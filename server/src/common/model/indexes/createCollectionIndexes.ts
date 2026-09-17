import { captureException } from "@sentry/node";
import type { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { getDbCollection } from "@/common/mongodb";

interface CollectionDescriptor {
  collectionName: string;
  indexes: [IndexSpecification, CreateIndexesOptions][];
}

export const createCollectionIndexes = async (collectionDescriptor?: CollectionDescriptor) => {
  if (!collectionDescriptor) {
    return;
  }

  await Promise.all(
    collectionDescriptor.indexes.map(async ([index, options]) => {
      try {
        await getDbCollection(collectionDescriptor.collectionName).createIndex(index, options);
      } catch (err) {
        console.error(`Error creating indexes for ${collectionDescriptor.collectionName}: ${err}`);
        captureException(
          new Error(`Error creating indexes for ${collectionDescriptor.collectionName}`, { cause: err })
        );
      }
    })
  );
};
