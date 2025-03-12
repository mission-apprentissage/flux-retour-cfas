import { IEffectif } from "shared/models";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";

import { effectifsDb, missionLocaleEffectifsDb } from "@/common/model/collections";

export const up = async () => {
  const cursor = missionLocaleEffectifsDb().find({ effectif_snapshot: { $exists: false } });
  while (await cursor.hasNext()) {
    const mleff = await cursor.next();
    if (mleff) {
      const effectif: IEffectif | IEffectifDECA = (await effectifsDb()
        .aggregate([
          {
            $unionWith: {
              coll: "effectifsDECA",
              pipeline: [{ $match: { is_deca_compatible: true } }],
            },
          },
          {
            $match: {
              _id: mleff.effectif_id,
            },
          },
        ])
        .next()) as IEffectif | IEffectifDECA;

      if (effectif) {
        await missionLocaleEffectifsDb().updateOne(
          {
            _id: mleff._id,
          },
          {
            $set: {
              effectif_snapshot: effectif,
            },
          }
        );
      }
    }
  }
};
