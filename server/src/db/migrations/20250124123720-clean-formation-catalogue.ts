import { type AnyBulkWriteOperation } from "mongodb";
import { zFormationCatalogue, type IFormationCatalogue } from "shared/models";

import { formationsCatalogueDb } from "@/common/model/collections";

export const up = async () => {
  const cursor = formationsCatalogueDb().find({});

  let bulk: AnyBulkWriteOperation<IFormationCatalogue>[] = [];

  for await (const doc of cursor) {
    const { _id, ...sanitized } = zFormationCatalogue.parse(doc);
    bulk.push({
      replaceOne: {
        filter: { _id: doc._id },
        replacement: sanitized,
      },
    });

    if (bulk.length >= 1000) {
      await formationsCatalogueDb().bulkWrite(bulk);
      bulk = [];
    }
  }

  if (bulk.length > 0) {
    await formationsCatalogueDb().bulkWrite(bulk);
  }
};
