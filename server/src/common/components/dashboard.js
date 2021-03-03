const { codesStatutsCandidats } = require("../model/constants");
const { StatutCandidat } = require("../model");

module.exports = () => ({
  getEffectifsData,
  getNbStatutsInHistoryForStatutAndDate,
});

/**
 * Récupération des données effectifs pour 2 dates et
 * passage de filtres en paramètres
 * @param {*} startDate
 * @param {*} endDate
 * @param {*} filters
 */
const getEffectifsData = async (startDate, endDate, filters = {}) => {
  const [
    nbInscritsBeginDate,
    nbApprentisBeginDate,
    nbAbandonsBeginDate,
    nbInscritsEndDate,
    nbApprentisEndDate,
    nbAbandonsEndDate,
  ] = await Promise.all([
    getNbStatutsInHistoryForStatutAndDate(startDate, codesStatutsCandidats.inscrit, filters),
    getNbStatutsInHistoryForStatutAndDate(startDate, codesStatutsCandidats.apprenti, filters),
    getNbStatutsInHistoryForStatutAndDate(startDate, codesStatutsCandidats.abandon, filters),
    getNbStatutsInHistoryForStatutAndDate(endDate, codesStatutsCandidats.inscrit, filters),
    getNbStatutsInHistoryForStatutAndDate(endDate, codesStatutsCandidats.apprenti, filters),
    getNbStatutsInHistoryForStatutAndDate(endDate, codesStatutsCandidats.abandon, filters),
  ]);

  return {
    startDate: {
      nbInscrits: nbInscritsBeginDate,
      nbApprentis: nbApprentisBeginDate,
      nbAbandons: nbAbandonsBeginDate,
    },
    endDate: {
      nbInscrits: nbInscritsEndDate,
      nbApprentis: nbApprentisEndDate,
      nbAbandons: nbAbandonsEndDate,
    },
  };
};

/**
 * Récupération des statuts ayant dans leur historique un élément valide
 * pour le statut (searchStatut) et la date souhaitée (searchDate)
 *
 * Principe :
 * 1. On filtre sur les params en entrée
 * 2. On filtre dans l'historique sur les élements ayant une date <= date recherchée
 * 3. On construit dans l'historique des statuts un champ
 *    diff_date_search = différence entre la date du statut de l'historique et la date recherchée
 * 4. On récupère la diff_date_search mini dans l'historique
 * 4. On construit un "historique des statuts valides" en se basant sur la plus petite diff_date_search & la bonne valeur de statut
 * 4. On ne prends que les statuts ayant au moins un statut dans l'historique des statuts valides
 * @param {string} searchDate Date pour laquelle on recherche les données
 * @param {number} searchStatut Code statut pour lequel on recherche les données
 * @param {*} filters Query correspondant aux filtres à appliquer en plus des paramètres date/statut
 */
const getNbStatutsInHistoryForStatutAndDate = async (searchDate, searchStatut, filters = {}) => {
  const statutsFound = await StatutCandidat.aggregate([
    // Filtrage sur les filtres passées en paramètres
    // et des éléments d'historiques antérieurs à la date de recherche
    {
      $match: filters,
    },
    // Filtrage sur les élements avec date <= searchDate
    {
      $project: {
        historique_statut_apprenant: {
          $filter: {
            input: "$historique_statut_apprenant",
            as: "result",
            // Filtre dans l'historique sur les valeurs ayant une date antérieure à la date de recherche
            cond: {
              $lte: ["$$result.date_statut", searchDate],
            },
          },
        },
      },
    },
    // Construction d'un champ diff_date_search : écart entre la date de l'historique et la date recherchée
    {
      $addFields: {
        historique_statut_apprenant: {
          $map: {
            input: "$historique_statut_apprenant",
            as: "item",
            in: {
              date_statut: "$$item.date_statut",
              valeur_statut: "$$item.valeur_statut",
              // Calcul de la différence entre item.date_statut & searchDate
              diff_date_search: { $abs: [{ $subtract: ["$$item.date_statut", searchDate] }] },
            },
          },
        },
      },
    },
    // Récupération de la diff_date_search mini dans l'historique
    {
      $project: {
        historique_statut_apprenant: 1,
        minDateDiff: { $min: "$historique_statut_apprenant.diff_date_search" },
      },
    },
    // Construction de la liste des élements valides dans l'historique
    // Elements valides = ayant la diff_date_search la plus petite
    // et ayant la bonne valeur de statut
    {
      $project: {
        historique_statut_apprenant: 1,
        minDateDiff: 1,
        historique_statut_apprenant_valid: {
          $filter: {
            input: "$historique_statut_apprenant",
            as: "result",
            // Filtre dans l'historique sur les valeurs ayant la minDateDiff
            // et ayant la bonne valeur de statut
            cond: {
              $and: [
                {
                  $eq: ["$$result.diff_date_search", "$minDateDiff"],
                },
                {
                  $eq: ["$$result.valeur_statut", searchStatut],
                },
              ],
            },
          },
        },
      },
    },
    // Filtre sur les statuts ayant au moins un élement de l'historique valide
    { $match: { historique_statut_apprenant_valid: { $not: { $size: 0 } } } },
  ]);

  return statutsFound.length;
};
