import { getNiveauFormationFromLibelle } from "@/common/actions/formations.actions";
import TabCoCfdInfo from "@/common/apis/@types/TabCoCfdInfo";
import { getCfdInfo } from "@/common/apis/apiTablesCorrespondances";
import logger from "@/common/logger";
import { effectifsDb } from "@/common/model/collections";

const DELAY_BETWEEN_API_CALLS = 250;

export async function hydrateEffectifsFormationsNiveaux() {
  logger.info("Hydrating effectifs.formation.niveaux ...");

  // Récupération de la liste des CFD pour lesquels le niveau est vide
  const effectifsCfdWithoutNiveau: string[] = (
    await effectifsDb()
      .aggregate([
        {
          $match: {
            $or: [{ "formation.niveau": null }, { "formation.niveau": { $exists: false } }, { "formation.niveau": "" }],
          },
        },
        { $group: { _id: { formation: { cfd: "$formation.cfd" } } } },
        { $project: { _id: false, "formation.cfd": "$_id.formation.cfd" } },
      ])
      .toArray()
  ).map((item) => item.formation?.cfd);

  let nbEffectifsUpdated = 0;
  let nbEffectifsNotUpdated = 0;

  logger.info(`${effectifsCfdWithoutNiveau.length} codes CFD avec niveau vide dans les effectifs`);

  // Pour chaque CFD qui a son niveau vide on appelle l'API TCO et on update tous les effectifs concernés avec le niveau récupéré
  for (const currentCfd of effectifsCfdWithoutNiveau) {
    try {
      const cfdInfo: TabCoCfdInfo | null = await getCfdInfo(currentCfd);

      if (cfdInfo) {
        // On MAJ le niveau pour les effectifs liés à ce CFD et n'ayant pas niveau
        const { modifiedCount } = await effectifsDb().updateMany(
          {
            "formation.cfd": currentCfd,
            $or: [{ "formation.niveau": null }, { "formation.niveau": { $exists: false } }, { "formation.niveau": "" }],
          },
          {
            $set: {
              "formation.niveau": getNiveauFormationFromLibelle(cfdInfo.niveau),
              "formation.niveau_libelle": cfdInfo.niveau,
            },
          }
        );
        nbEffectifsUpdated += modifiedCount;
      } else {
        logger.error(`Aucune info du CFD ${currentCfd} renvoyée par l'API TCO !`);
        nbEffectifsNotUpdated++;
      }

      // Délai entre les appels API
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_API_CALLS));
    } catch (err) {
      nbEffectifsNotUpdated++;
      logger.error(JSON.stringify(err));
    }
  }

  logger.info(`${nbEffectifsUpdated} effectifs avec niveau vide mis à jour.`);
  logger.info(`${nbEffectifsNotUpdated} effectifs non mis à jour !`);

  return {
    nbEffectifsUpdated,
    nbEffectifsNotUpdated,
  };
}
