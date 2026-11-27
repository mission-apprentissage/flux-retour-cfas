import { Db, ObjectId } from "mongodb";

import logger from "@/common/logger";

const DEFAULT_BATCH_SIZE = 10_000;
const WRITE_CONCERN = { w: "majority", wtimeoutMS: 60_000 } as const;
const WITH_HISTORY = { history: { $exists: true } };

const PROMOTE_LATEST_RAW_OF_SAME_CAMPAIGN = [
  {
    $set: {
      raw: {
        $ifNull: [
          {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$history.raw",
                  cond: {
                    $eq: [
                      { $ifNull: ["$$this.annee_scolaire_rentree", "$annee_scolaire_rentree"] },
                      "$annee_scolaire_rentree",
                    ],
                  },
                },
              },
              -1,
            ],
          },
          "$raw",
        ],
      },
    },
  },
  { $unset: "history" },
];

export const promoteAffelnetHistory = async (db: Db, batchSize = DEFAULT_BATCH_SIZE) => {
  const voeux = db.collection("voeuxAffelnet");

  let modified = 0;
  let lastId: ObjectId | null = null;
  for (;;) {
    const page = await voeux
      .find(lastId ? { _id: { $gt: lastId } } : {}, { projection: { _id: 1 } })
      .sort({ _id: 1 })
      .limit(batchSize)
      .toArray();
    if (page.length === 0) break;
    lastId = page[page.length - 1]._id;

    const result = await voeux.updateMany(
      { _id: { $in: page.map(({ _id }) => _id) }, ...WITH_HISTORY },
      PROMOTE_LATEST_RAW_OF_SAME_CAMPAIGN,
      { writeConcern: WRITE_CONCERN, bypassDocumentValidation: true }
    );
    modified += result.modifiedCount;
  }

  logger.info({ modified }, "[Migration] Dernier raw Affelnet de la campagne promu, history retiré");
};

export const up = async (db: Db) => {
  await promoteAffelnetHistory(db);
};
