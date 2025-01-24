import { MongoError } from "mongodb";
import { MOTIF_SUPPRESSION } from "shared/constants";
import { IEffectif } from "shared/models";

import { softDeleteEffectif } from "@/common/actions/effectifs.actions";
import { effectifsDb, effectifsDECADb } from "@/common/model/collections";
import {
  fiabilisationEffectifFormation,
  getEffectifCertification,
} from "@/jobs/fiabilisation/certification/fiabilisation-certification";

export const tmpFiabilisationCertification = async (job, signal) => {
  await generiqueFiabilisationCertification(effectifsDb(), job, signal, true);
  await generiqueFiabilisationCertification(effectifsDECADb(), job, signal);
};

const generiqueFiabilisationCertification = async (db, job, signal, withDeletionDoublon = false) => {
  const processEffectif = async (effectif: IEffectif) => {
    const certification = await getEffectifCertification(effectif);
    const computedFormation = await fiabilisationEffectifFormation(effectif, certification);
    const update = {
      formation: computedFormation,
    };

    await db.updateOne({ _id: effectif._id }, { $set: update }).catch(async (err) => {
      // If the document is a duplicated effectif, we can safely remove the older document
      if (err instanceof MongoError && err.code === 11000 && withDeletionDoublon) {
        await softDeleteEffectif(effectif._id, null, {
          motif: MOTIF_SUPPRESSION.Doublon,
          description: "Suppression du doublon suite à la migration des formations",
        });
        return;
      }

      throw err;
    });
  };

  const cursorEffectif = db.find(
    { created_at: { $lte: job.created_at }, "formation.libelle_long": { $exists: false } },
    { sort: { created_at: -1 } }
  );
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
