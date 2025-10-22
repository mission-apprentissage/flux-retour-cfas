import { STATUT_APPRENANT } from "shared/constants";
import { IEffectif } from "shared/models";

import { createFranceTravailEffectifSnapshot } from "@/common/actions/franceTravail/franceTravailEffectif.actions";
import { effectifsDb } from "@/common/model/collections";

export const hydrateInscritSansContrat = async (signal?: AbortSignal) => {
  const cursor = effectifsDb().find({ "_computed.statut.en_cours": STATUT_APPRENANT.INSCRIT });

  const BULK_SIZE = 1000;
  let bulkEffectifs: Array<IEffectif> = [];
  const processEffectif = async (effectif: IEffectif) => {
    return createFranceTravailEffectifSnapshot(effectif);
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
