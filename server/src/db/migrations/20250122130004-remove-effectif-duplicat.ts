import { type Collection } from "mongodb";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";

import { effectifsDb, effectifsDECADb } from "@/common/model/collections";

async function removeDuplicates(coll: Collection<IEffectif> | Collection<IEffectifDECA>) {
  const cursor = coll.aggregate<{ effectifs: Array<IEffectif | IEffectifDECA> }>([
    {
      $group: {
        _id: {
          organisme_id: "$organisme_id",
          annee_scolaire: "$annee_scolaire",
          id_erp_apprenant: "$id_erp_apprenant",
        },
        effectifs: { $addToSet: "$$ROOT" },
        count: { $sum: 1 },
      },
    },
    {
      $match: { count: { $gt: 1 } },
    },
  ]);

  for await (const doc of cursor) {
    const { effectifs } = doc;
    const lastEffectif = effectifs.reduce((acc, curr) => {
      if (curr.updated_at == null) return acc;
      if (acc.updated_at == null) return curr;
      if (curr.updated_at.getTime() > acc.updated_at.getTime()) {
        return curr;
      }

      return acc;
    }, effectifs[0]);

    const toRemove = new Set(effectifs.map((e) => e._id));
    toRemove.delete(lastEffectif._id);

    await coll.deleteMany({ _id: { $in: Array.from(toRemove) } });
  }
}

export const up = async () => {
  await removeDuplicates(effectifsDb());
  await removeDuplicates(effectifsDECADb());
};
