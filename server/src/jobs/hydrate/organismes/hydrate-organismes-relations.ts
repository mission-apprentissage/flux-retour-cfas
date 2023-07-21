import { PromisePool } from "@supercharge/promise-pool";
import { ArrayElement } from "mongodb";

import parentLogger from "@/common/logger";
import { OrganismesReferentiel } from "@/common/model/@types";
import { organismesDb, organismesReferentielDb } from "@/common/model/collections";

const logger = parentLogger.child({
  module: "job:hydrate:organismes-relations",
});

/**
 * Ce job peuple le champ organisme.organismesFormateurs et organismesResponsables avec les relations du référentiel
 * stockées dans la collection organismeReferentiel.
 */
export const hydrateOrganismesRelations = async () => {
  const organismes = await organismesDb()
    .find({}, { projection: { _id: 1, uai: 1, siret: 1 } })
    .toArray();

  const organismeIdBySIRETAndUAI = organismes.reduce((acc, organisme) => {
    acc[getOrganismeKey(organisme)] = organisme._id;
    return acc;
  }, {});

  await PromisePool.for(organismes).process(async (organisme) => {
    const organismesLiés = await organismesReferentielDb()
      .aggregate<ArrayElement<OrganismesReferentiel["relations"]>>([
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [...organismesFormateurs, ...organismesResponsables].forEach(({ type, ...organisme }) => {
      return {
        ...organisme,
        _id: organismeIdBySIRETAndUAI[getOrganismeKey(organisme)],
      };
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

function getOrganismeKey(organisme: { siret?: string; uai?: string | null }): string {
  return `${organisme.siret ?? null}-${organisme.uai ?? null}`; // null permet d'harmoniser undefined et null
}
