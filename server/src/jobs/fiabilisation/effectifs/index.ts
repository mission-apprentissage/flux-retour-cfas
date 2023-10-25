import { addDays } from "date-fns";
import { getAnneesScolaireListFromDate } from "shared";

import {
  abandonsIndicator,
  inscritsSansContratsIndicator,
  rupturantsIndicator,
} from "@/common/actions/effectifs/indicators";
import { CODES_STATUT_APPRENANT } from "@/common/constants/dossierApprenant";
import logger from "@/common/logger";
import { effectifsDb } from "@/common/model/collections";

const filterStages = [{ $match: { annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) } } }];

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

const getNbAbandonsADate = async () => (await abandonsIndicator.getListAtDate(new Date(), filterStages)).length;

/**
 * Méthode de suppression des effectifs inscrits sans contrats pour les années scolaires courantes
 * qui sont dans ce statut depuis nbJours
 */
export const removeInscritsSansContratsDepuis = async (nbJours = 90) => {
  const filterStages = [{ $match: { annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) } } }];

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

/**
 * Méthode de transformation des effectifs rupturants en abandons (dans ce statut depuis nbJours)
 * @param {*} nbJours
 */
export const transformRupturantsToAbandonsDepuis = async (nbJours = 180) => {
  logger.info(`${await getNbAbandonsADate()} abandons à date avant lancement du script`);

  const dateAbandonToSet = addDays(new Date(), -180);

  const rupturantsToTransform = await effectifsDb()
    .aggregate([
      ...filterStages,
      ...rupturantsIndicator.getAtDateAggregationPipeline(new Date()),
      ...getAggregateNbJoursDepuisStatutStages(nbJours),
    ])
    .toArray();

  let nbUpdated = 0;
  await Promise.all(
    rupturantsToTransform.map(async (item) => {
      const effectif = await effectifsDb().findOne({ _id: item._id });
      if (!effectif) {
        throw new Error(`Unable to find effectif ${item._id.toString()}`);
      } else {
        await updateEffectifRupturantToAbandon(effectif, dateAbandonToSet);
        nbUpdated++;
      }
    })
  );

  logger.info(`${await getNbAbandonsADate()} abandons à date après lancement du script`);
  logger.info(
    `Transformation de ${nbUpdated} effectifs rupturants dans ce statut depuis ${nbJours} jours en abandons effectuée avec succès !`
  );

  return {
    nbUpdated,
  };
};

/**
 * Fonction d'update d'un effectif en y ajoutant un élément de type ABANDON à son historique
 * @param {*} effectif
 * @param {*} abandonDate
 */
const updateEffectifRupturantToAbandon = async (effectif, abandonDate) => {
  try {
    // Ajout d'une entrée manuelle "ABANDON" à la date
    effectif.apprenant.historique_statut.push({
      valeur_statut: CODES_STATUT_APPRENANT.abandon,
      date_statut: abandonDate,
      date_reception: abandonDate,
    });

    await effectifsDb().findOneAndUpdate(
      { _id: effectif._id },
      {
        $set: {
          ...effectif,
          updated_at: new Date(),
        },
      },
      { returnDocument: "after", bypassDocumentValidation: true }
    );
  } catch (err) {
    logger.error(err);
  }
};
