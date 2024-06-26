import { getNiveauFormationFromLibelle } from "@/common/actions/formations.actions";
import parentLogger from "@/common/logger";
import { effectifsDECADb, formationsCatalogueDb } from "@/common/model/collections";

const logger = parentLogger.child({ module: "tmp:patches:update-deca-formation" });

export async function updateDecaFormation() {
  let updated = 0;
  let notUpdated = 0;
  let count = 0;
  let percentage = 0;

  const total = await effectifsDECADb().countDocuments();
  const cursor = effectifsDECADb().find();
  while (await cursor.hasNext()) {
    try {
      const effectifDECA = await cursor.next();

      if (effectifDECA) {
        const formation = effectifDECA.formation;
        if (formation && formation.cfd && formation.rncp) {
          const { cfd, rncp } = formation;

          const formationFromCatalogue = await formationsCatalogueDb().findOne({ cfd, rncp_code: rncp });
          if (formationFromCatalogue) {
            const niveau = getNiveauFormationFromLibelle(formationFromCatalogue.niveau);
            await effectifsDECADb().updateOne(
              { _id: effectifDECA._id },
              { $set: { "formation.niveau": niveau } },
              { bypassDocumentValidation: true }
            );
            updated++;
          } else {
            notUpdated++;
          }
        }
      }
    } catch (err) {
      logger.error(`Échec de la mise à jour de l'effectif DECA: ${err}`);
    }

    // Update percentage
    const p = Math.floor((count / total) * 100);
    if (p > percentage) {
      percentage = p;
      logger.info(`Progression : ${percentage} %`);
    }

    count++;
  }
  logger.info(`Formation updated : ${updated}`);
  logger.info(`Formation not updated : ${notUpdated}`);
}
