import { WithId } from "mongodb";

import parentLogger from "@/common/logger";
import { Organisme } from "@/common/model/@types";
import { organismesDb, organismesReferentielDb } from "@/common/model/collections";

const logger = parentLogger.child({
  module: "job:hydrate:organismes-relations",
});

/**
 * Ce job peuple le champ organisme.relatedOrganismes avec les relations du référentiel stockées dans la collection organismeReferentiel.
 *
 */
export const hydrateOrganismesRelations = async () => {
  const organismesCursor = organismesDb().find({}, { projection: { _id: 1, uai: 1, siret: 1 } });

  while (await organismesCursor.hasNext()) {
    const organisme = (await organismesCursor.next()) as WithId<Organisme>;
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
  }
};
