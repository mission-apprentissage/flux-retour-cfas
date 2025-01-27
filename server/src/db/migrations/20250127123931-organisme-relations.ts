import { type AnyBulkWriteOperation } from "mongodb";
import { zOrganisme, type IOrganisme } from "shared/models";

import { organismesDb } from "@/common/model/collections";

export const up = async () => {
  const cursor = organismesDb().find({});

  let bulk: AnyBulkWriteOperation<IOrganisme>[] = [];
  for await (const organisme of cursor) {
    bulk.push({
      replaceOne: {
        filter: { _id: organisme._id },
        replacement: zOrganisme.parse(organisme),
      },
    });

    if (bulk.length > 1000) {
      await organismesDb().bulkWrite(bulk);
      bulk = [];
    }
  }

  if (bulk.length > 0) {
    await organismesDb().bulkWrite(bulk);
  }
};
