import { inscritsSansContratsIndicator } from "@/common/actions/effectifs/indicators";
import logger from "@/common/logger";
import { effectifsDb } from "@/common/model/collections";

const CURRENT_ANNEES_SCOLAIRES = ["2022-2023", "2023-2023"];

/**
 * Aggregation pour filtre sur le nb de jours dans ce statut
 * @param {*} nbJours
 * @returns
 */
const getAggregateNbJoursDepuisStatutStages = (nbJours) => [
  {
    $addFields: {
      nb_jours_depuis_statut: {
        $divide: [
          { $dateDiff: { startDate: "$statut_apprenant_at_date.date_statut", endDate: new Date(), unit: "day" } },
          1,
        ],
      },
    },
  },
  { $match: { nb_jours_depuis_statut: { $gte: nbJours } } },
];

/**
 * Méthode de suppression des effectifs inscrits sans contrats pour les années scolaires courantes
 * qui sont dans ce statut depuis nbJours
 */
export const removeInscritsSansContratsDepuis = async (nbJours) => {
  const filterStages = [{ $match: { annee_scolaire: { $in: CURRENT_ANNEES_SCOLAIRES } } }];

  const inscritsSansContratsIdsToRemove = (
    await effectifsDb()
      .aggregate([
        ...filterStages,
        ...inscritsSansContratsIndicator.getAtDateAggregationPipeline(new Date()),
        ...getAggregateNbJoursDepuisStatutStages(nbJours),
      ])
      .toArray()
  ).map((item) => item._id);

  const { deletedCount } = await effectifsDb().deleteMany({ _id: { $in: inscritsSansContratsIdsToRemove } });
  logger.info(`Suppression de ${deletedCount} effectifs inscrits dans ce statut depuis ${nbJours} jours !`);

  return {
    deletedCount,
  };
};
