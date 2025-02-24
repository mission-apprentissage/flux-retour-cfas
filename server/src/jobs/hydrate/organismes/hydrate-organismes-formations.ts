import parentLogger from "@/common/logger";
import { formationsCatalogueDb, organismesDb } from "@/common/model/collections";

const logger = parentLogger.child({
  module: "job:hydrate:organismes-formations-count-count",
});

export const hydrateOrganismesFormationsCount = async () => {
  logger.info("mise à jour du compteur de formations par organisme");

  const organismesCursor = organismesDb().find({}, { projection: { _id: 1, uai: 1, siret: 1 } });

  for await (const organisme of organismesCursor) {
    await organismesDb().updateOne(
      { _id: organisme._id },
      {
        $set: {
          formations_count: await countFormationsBySIRET(organisme.siret),
          updated_at: new Date(),
        },
      }
    );
  }
};

/**
 * Retourne les formations en faisant la correspondance avec l'uai + siret d'un organisme
 * Par priorité :
 * - (siret et uai) gestionnaire ou formateur
 * - (siret) gestionnaire ou formateur
 * - (uai) gestionnaire ou formateur
 */
async function countFormationsBySIRET(siret: string): Promise<number> {
  return formationsCatalogueDb().countDocuments({
    $and: [
      { published: true },
      {
        $or: [{ etablissement_formateur_siret: siret }, { etablissement_gestionnaire_siret: siret }],
      },
    ],
  });
}
