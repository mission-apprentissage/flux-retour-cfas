import { ObjectId } from "mongodb";

import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";

export const up = async () => {
  const now = new Date();
  const cursor = missionLocaleEffectifsDb().find({
    updated_at: { $exists: true },
  });

  const bulkOperations: Array<any> = [];
  for await (const mle of cursor) {
    bulkOperations.push({
      insertOne: {
        document: {
          _id: new ObjectId(),
          situation: mle.situation,
          situation_autre: mle.situation_autre,
          deja_connu: mle.deja_connu,
          commentaires: mle.commentaires,
          created_at: now,
          mission_locale_effectif_id: mle._id,
        },
      },
    });
  }
  await missionLocaleEffectifsLogDb().bulkWrite(bulkOperations);
};
