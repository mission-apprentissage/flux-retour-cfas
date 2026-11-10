import type { CreateIndexesOptions, IndexSpecification } from "mongodb";

import logger from "@/common/logger";
import { getDbCollection } from "@/common/mongodb";
import { captureTiered } from "@/common/services/sentry/alertContract";

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
        logger.error(
          { err, collectionName: collectionDescriptor.collectionName },
          "Erreur lors de la création des index"
        );
        captureTiered(new Error(`Error creating indexes for ${collectionDescriptor.collectionName}`, { cause: err }), {
          tier: "veille",
          errorKind: "db",
          fingerprintKey: `indexes:${collectionDescriptor.collectionName}`,
        });
      }
    })
  );
};
