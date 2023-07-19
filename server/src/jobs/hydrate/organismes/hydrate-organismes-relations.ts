import { PromisePool } from "@supercharge/promise-pool";

import parentLogger from "@/common/logger";
import { organismesDb, organismesReferentielDb } from "@/common/model/collections";

const logger = parentLogger.child({
  module: "job:hydrate:organismes-relations",
});

/**
 * Ce job peuple le champ organisme.relatedOrganismes avec les relations du référentiel stockées dans la collection organismeReferentiel.
 */
export const hydrateOrganismesRelations = async () => {
  const organismes = await organismesDb()
    .find({}, { projection: { _id: 1, uai: 1, siret: 1 } })
    .toArray();

  const organismeIdBySIRETAndUAI = organismes.reduce((acc, organisme) => {
    acc[`${organisme.siret}-${organisme.uai}`] = organisme._id;
    return acc;
  }, {});

  await PromisePool.for(organismes).process(async (organisme) => {
    const organismesLiés = await organismesReferentielDb()
      .aggregate([
        {
          $match: {
            siret: organisme.siret,
            uai: organisme.uai,
          },
        },
        {
          $unwind: "$relations",
        },
        {
          $replaceRoot: {
            newRoot: "$relations",
          },
        },
      ])
      .toArray();

    const organismesFormateurs = organismesLiés.filter((organisme) => organisme.type === "responsable->formateur");
    const organismesResponsables = organismesLiés.filter((organisme) => organisme.type === "formateur->responsable");
    [...organismesFormateurs, ...organismesResponsables].forEach((organisme) => {
      organisme._id = organismeIdBySIRETAndUAI[`${organisme.siret}-${organisme.uai}`];
    });

    logger.info(
      {
        uai: organisme.uai,
        siret: organisme.siret,
        organismesFormateurs: organismesFormateurs.length,
        organismesResponsables: organismesResponsables.length,
      },
      "updating organisme organismesFormateurs"
    );
    await organismesDb().updateOne(
      { _id: organisme._id },
      {
        $set: {
          organismesFormateurs,
          organismesResponsables,
          updated_at: new Date(),
        },
      }
    );
  });
};
