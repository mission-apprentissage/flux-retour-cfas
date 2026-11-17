import { Db, ObjectId } from "mongodb";

import logger from "@/common/logger";

const DEFAULT_BATCH_SIZE = 10_000;
const WRITE_CONCERN = { w: "majority", wtimeoutMS: 60_000 } as const;

export const TARGETS = [
  { collection: "effectifs", prefix: "" },
  { collection: "effectifsArchive", prefix: "" },
  { collection: "effectifsDECA", prefix: "" },
  { collection: "missionLocaleEffectif", prefix: "effectif_snapshot." },
  { collection: "franceTravailEffectif", prefix: "effectif_snapshot." },
] as const;

const unsetInBatches = async (db: Db, collectionName: string, prefix: string, batchSize: number) => {
  const fields = [`${prefix}_raw`, `${prefix}is_lock`];
  const filter = { $or: fields.map((field) => ({ [field]: { $exists: true } })) };
  const unset = Object.fromEntries(fields.map((field) => [field, ""]));
  const collection = db.collection(collectionName);

  let modified = 0;
  let lastId: ObjectId | null = null;
  for (;;) {
    const page = await collection
      .find(lastId ? { _id: { $gt: lastId } } : {}, { projection: { _id: 1 } })
      .sort({ _id: 1 })
      .limit(batchSize)
      .toArray();
    if (page.length === 0) break;
    lastId = page[page.length - 1]._id;

    const result = await collection.updateMany(
      { _id: { $in: page.map(({ _id }) => _id) }, ...filter },
      { $unset: unset },
      { writeConcern: WRITE_CONCERN, bypassDocumentValidation: true }
    );
    modified += result.modifiedCount;
  }

  logger.info({ collection: collectionName, modified }, "[Migration] _raw et is_lock retirés");
};

export const unsetEffectifLockAndRaw = async (db: Db, batchSize = DEFAULT_BATCH_SIZE) => {
  for (const { collection, prefix } of TARGETS) {
    await unsetInBatches(db, collection, prefix, batchSize);
  }
};

export const up = async (db: Db) => {
  await unsetEffectifLockAndRaw(db);
};
