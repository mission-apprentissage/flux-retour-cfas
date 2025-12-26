import { STATUT_APPRENANT } from "shared/constants";
import { IEffectif } from "shared/models";

import { createFranceTravailEffectifSnapshot } from "@/common/actions/franceTravail/franceTravailEffectif.actions";
import { effectifsDb, franceTravailEffectifsDb } from "@/common/model/collections";

export const hydrateInscritSansContrat = async (signal?: AbortSignal) => {
  const cursor = effectifsDb().find({ "_computed.statut.en_cours": STATUT_APPRENANT.INSCRIT });

  const BULK_SIZE = 1000;
  let bulkEffectifs: Array<IEffectif> = [];
  const processEffectif = async (effectif: IEffectif) => {
    return createFranceTravailEffectifSnapshot(effectif, false);
  };

  while (await cursor.hasNext()) {
    const effectif = await cursor.next();
    if (!effectif) continue;

    bulkEffectifs.push(effectif);

    if (bulkEffectifs.length >= BULK_SIZE) {
      await Promise.allSettled(bulkEffectifs.map(processEffectif));
      if (signal && signal.aborted) {
        return;
      }
      bulkEffectifs = [];
    }
  }

  if (bulkEffectifs.length > 0) {
    await Promise.allSettled(bulkEffectifs.map(processEffectif));
  }
};

export const dedupeInscritSansContrat = async () => {
  const cursor = franceTravailEffectifsDb().aggregate([
    {
      $group: {
        _id: "$person_id",
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ]);

  while (await cursor.hasNext()) {
    const group = await cursor.next();

    if (!group) continue;
    const personId = group._id;

    if (!personId) continue;

    const mostRecent = await franceTravailEffectifsDb()
      .find({ person_id: personId })
      .sort({ "effectif_snapshot.transmitted_at": -1 })
      .limit(1)
      .toArray();
    await franceTravailEffectifsDb().updateMany(
      {
        person_id: personId,
        _id: { $ne: mostRecent[0]._id },
      },
      {
        $set: { soft_deleted: true },
      }
    );
  }
};
