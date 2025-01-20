import { MongoError } from "mongodb";
import { MOTIF_SUPPRESSION } from "shared/constants";
import { IEffectif } from "shared/models";

import { softDeleteEffectif } from "@/common/actions/effectifs.actions";
import { effectifsDb } from "@/common/model/collections";
import {
  fiabilisationEffectifFormation,
  getEffectifCertification,
} from "@/jobs/fiabilisation/certification/fiabilisation-certification";

export const tmpFiabilisationCertification = async (job, signal) => {
  const processEffectif = async (effectif: IEffectif) => {
    const certification = await getEffectifCertification(effectif);
    const computedFormation = await fiabilisationEffectifFormation(effectif, certification);
    const update = {
      formation: computedFormation,
    };

    await effectifsDb()
      .updateOne({ _id: effectif._id }, { $set: update })
      .catch(async (err) => {
        // If the document is a duplicated effectif, we can safely remove the older document
        if (err instanceof MongoError && err.code === 11000) {
          await softDeleteEffectif(effectif._id, null, {
            motif: MOTIF_SUPPRESSION.Doublon,
            description: "Suppression du doublon suite à la migration des formations",
          });
          return;
        }

        throw err;
      });
  };

  const cursorEffectif = effectifsDb().find({ created_at: { $lte: job.created_at } }, { sort: { created_at: -1 } });
  let bulkEffectifs: IEffectif[] = [];
  for await (const effectif of cursorEffectif) {
    bulkEffectifs.push(effectif);

    if (bulkEffectifs.length > 100) {
      await Promise.all(bulkEffectifs.map(processEffectif));
      if (signal.aborted) {
        return;
      }
      bulkEffectifs = [];
    }
  }
  if (bulkEffectifs.length > 0) {
    await Promise.all(bulkEffectifs.map(processEffectif));
  }
};
