const { codesStatutsCandidats } = require("../model/constants");
const { StatutCandidat } = require("../model");
const groupBy = require("lodash.groupby");
const { asyncForEach } = require("../utils/asyncUtils");
const { getPercentageDifference } = require("../utils/calculUtils");
const { uniqueValues } = require("../utils/miscUtils");
const sortBy = require("lodash.sortby");

module.exports = () => ({
  getEffectifsData,
  getNbStatutsInHistoryForStatutAndDate,
  getEffectifsDetailDataForSiret,
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
    nbAbandonsProspectsBeginDate,
    nbInscritsEndDate,
    nbApprentisEndDate,
    nbAbandonsEndDate,
    nbAbandonsProspectsEndDate,
  ] = await Promise.all([
    getNbStatutsInHistoryForStatutAndDate(startDate, codesStatutsCandidats.inscrit, filters),
    getNbStatutsInHistoryForStatutAndDate(startDate, codesStatutsCandidats.apprenti, filters),
    getNbStatutsInHistoryForStatutAndDate(startDate, codesStatutsCandidats.abandon, filters),
    getNbStatutsInHistoryForStatutAndDate(startDate, codesStatutsCandidats.abandonProspects, filters),
    getNbStatutsInHistoryForStatutAndDate(endDate, codesStatutsCandidats.inscrit, filters),
    getNbStatutsInHistoryForStatutAndDate(endDate, codesStatutsCandidats.apprenti, filters),
    getNbStatutsInHistoryForStatutAndDate(endDate, codesStatutsCandidats.abandon, filters),
    getNbStatutsInHistoryForStatutAndDate(endDate, codesStatutsCandidats.abandonProspects, filters),
  ]);

  return {
    startDate: {
      nbInscrits: nbInscritsBeginDate,
      nbApprentis: nbApprentisBeginDate,
      nbAbandons: nbAbandonsBeginDate,
      nbAbandonsProspects: nbAbandonsProspectsBeginDate,
    },
    endDate: {
      nbInscrits: nbInscritsEndDate,
      nbApprentis: nbApprentisEndDate,
      nbAbandons: nbAbandonsEndDate,
      nbAbandonsProspects: nbAbandonsProspectsEndDate,
    },
  };
};

/**
 * Récupération des données effectifs avec niveaux / annee pour 2 dates et un siret donné
 * @param {*} startDate
 * @param {*} endDate
 * @param {*} siret_etablissement
 */
const getEffectifsDetailDataForSiret = async (startDate, endDate, siret) => {
  const [
    inscritsBeginDate,
    apprentisBeginDate,
    abandonsBeginDate,
    inscritsEndDate,
    apprentisEndDate,
    abandonsEndDate,
  ] = await Promise.all([
    getEffectifsDetailWithNiveauxForStatutAndDate(startDate, codesStatutsCandidats.inscrit, siret),
    getEffectifsDetailWithNiveauxForStatutAndDate(startDate, codesStatutsCandidats.apprenti, siret),
    getEffectifsDetailWithNiveauxForStatutAndDate(startDate, codesStatutsCandidats.abandon, siret),
    getEffectifsDetailWithNiveauxForStatutAndDate(endDate, codesStatutsCandidats.inscrit, siret),
    getEffectifsDetailWithNiveauxForStatutAndDate(endDate, codesStatutsCandidats.apprenti, siret),
    getEffectifsDetailWithNiveauxForStatutAndDate(endDate, codesStatutsCandidats.abandon, siret),
  ]);

  const dateData = {
    startDate: {
      inscrits: inscritsBeginDate,
      apprentis: apprentisBeginDate,
      abandons: abandonsBeginDate,
    },
    endDate: {
      inscrits: inscritsEndDate,
      apprentis: apprentisEndDate,
      abandons: abandonsEndDate,
    },
  };

  const listData = await buildEffectifByNiveauxList(dateData);
  return listData;
};

/**
 * Récupération des statuts ayant dans leur historique un élément valide
 * pour le statut (searchStatut) et la date souhaitée (searchDate)
 *
 * @param {string} searchDate Date pour laquelle on recherche les données
 * @param {number} searchStatut Code statut pour lequel on recherche les données
 * @param {*} filters Query correspondant aux filtres à appliquer en plus des paramètres date/statut
 */
const getNbStatutsInHistoryForStatutAndDate = async (searchDate, searchStatut, filters = {}) => {
  const statutsFound = await getStatutsInHistoryForStatutAndDate(searchDate, searchStatut, filters);
  return statutsFound.length;
};

/**
 * Récupération des détail des effectifs avec niveaux / annee des formations
 * pour le statut (searchStatut) et la date souhaitée (searchDate) et un siret.
 *
 * Même fonctionnement que getNbStatutsInHistoryForStatutAndDate mais on récupère tout l'objet pour détail
 * @param {*} searchDate
 * @param {*} searchStatut
 * @param {*} searchSiret
 * @returns
 */
const getEffectifsDetailWithNiveauxForStatutAndDate = async (searchDate, searchStatut, searchSiret) => {
  // Récupération des effectifs depuis paramètres
  const statutsFound = await getStatutsInHistoryForStatutAndDate(searchDate, searchStatut, {
    siret_etablissement: searchSiret,
  });

  // Récupération total des effectifs
  const nbTotalStatuts = statutsFound.length;

  // Regroupement par niveau & construction objet
  const dataGroupedByNiveau = groupBy(statutsFound, "niveau_formation");
  const dataDetail = Object.keys(dataGroupedByNiveau).map((niveau) => ({
    niveau,
    nbStatuts: dataGroupedByNiveau[niveau].length,
    formations: dataGroupedByNiveau[niveau].map((item) => ({
      libelle: item.libelle_court_formation,
      annee: item.annee_formation,
    })),
  }));

  return {
    nbTotalStatuts,
    dataDetail,
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
 */
const getStatutsInHistoryForStatutAndDate = async (searchDate, searchStatut, filters = {}) => {
  const statutsFound = await StatutCandidat.aggregate([
    // Filtrage sur les filtres passées en paramètres
    // et des éléments d'historiques antérieurs à la date de recherche
    {
      $match: { ...filters, siret_etablissement_valid: true },
    },
    // Filtrage sur les élements avec date <= searchDate
    {
      $project: {
        niveau_formation: 1,
        annee_formation: 1,
        libelle_court_formation: 1,
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
        niveau_formation: 1,
        annee_formation: 1,
        libelle_court_formation: 1,
        historique_statut_apprenant: 1,
        minDateDiff: { $min: "$historique_statut_apprenant.diff_date_search" },
      },
    },
    // Construction de la liste des élements valides dans l'historique
    // Elements valides = ayant la diff_date_search la plus petite
    // et ayant la bonne valeur de statut
    {
      $project: {
        niveau_formation: 1,
        annee_formation: 1,
        libelle_court_formation: 1,
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

  return statutsFound;
};

/**
 * Construction de la liste des détails des formations à partir des effectifs startDate / endDate
 * Principe :
 * On récupère la liste des niveaux uniques et des formations uniques dans la liste
 * Pour chaque niveau, chaque formation / année on construit la liste
 * @param {*} param
 * @returns
 */
const buildEffectifByNiveauxList = async ({ startDate, endDate }) => {
  const effectifByNiveauxList = [];

  // Récup les niveaux présents dans les données
  const uniquesNiveaux = getUniquesNiveauxFrom(startDate, endDate);

  // Pour chaque niveau on construit un objet contenant les infos de niveaux + les formations rattachées
  await asyncForEach(uniquesNiveaux, async (currentNiveau) => {
    effectifByNiveauxList.push({
      niveau: {
        libelle: currentNiveau,
        apprentis: buildStatutDataForNiveau(endDate.apprentis, startDate.apprentis, currentNiveau),
        inscrits: buildStatutDataForNiveau(endDate.inscrits, startDate.inscrits, currentNiveau),
        abandons: buildStatutDataForNiveau(endDate.abandons, startDate.abandons, currentNiveau),
      },
      formations: await buildFormationsDataForNiveau(endDate, startDate, currentNiveau),
    });
  });

  return effectifByNiveauxList;
};

/**
 * Construction d'un objet contenant les nbTotaux / evolution pour un statut et un niveau
 * @param {*} statutDataEndDate
 * @param {*} statutDataStartDate
 * @param {*} currentNiveau
 * @returns
 */
const buildStatutDataForNiveau = (statutDataEndDate, statutDataStartDate, currentNiveau) => ({
  nbTotal: statutDataEndDate.nbTotalStatuts,
  nbTotalForNiveau: statutDataEndDate.dataDetail?.find((item) => item.niveau === currentNiveau)?.nbStatuts,
  evolution: getPercentageDifference(
    statutDataEndDate.dataDetail.find((item) => item.niveau === currentNiveau)?.nbStatuts,
    statutDataStartDate.dataDetail.find((item) => item.niveau === currentNiveau)?.nbStatuts
  ),
});

/**
 * Construction d'une liste d'objets contenant les données des formations pour un niveau
 * @param {*} endDateData
 * @param {*} startDateData
 * @param {*} currentNiveau
 * @returns
 */
const buildFormationsDataForNiveau = async (endDateData, startDateData, currentNiveau) => {
  const allFormationsForNiveau = [];

  // Récupération des couples année - libellé uniques dans les données effectifs
  const uniquesFormationsParAnneesForNiveau = getUniquesFormationsParAnneesForNiveau(endDateData, currentNiveau);

  // Pour chaque couple année - libéllé on construit un objet avec les nb de statuts (apprentis / inscrits / abandons)
  await asyncForEach(uniquesFormationsParAnneesForNiveau, async (currentFormationParAnnee) => {
    allFormationsForNiveau.push({
      libelle: currentFormationParAnnee.libelle,
      annee: currentFormationParAnnee.annee,
      apprentis: buildFormationsDataForStatut(
        endDateData.apprentis.dataDetail,
        startDateData.apprentis.dataDetail,
        currentFormationParAnnee,
        currentNiveau
      ),
      inscrits: buildFormationsDataForStatut(
        endDateData.inscrits.dataDetail,
        startDateData.inscrits.dataDetail,
        currentFormationParAnnee,
        currentNiveau
      ),
      abandons: buildFormationsDataForStatut(
        endDateData.abandons.dataDetail,
        startDateData.abandons.dataDetail,
        currentFormationParAnnee,
        currentNiveau
      ),
    });
  });

  return allFormationsForNiveau;
};

/**
 * Construction d'un objet contenant le nbTotal / evolution pour un couple formation - année et un niveau
 * @param {*} dataDetail
 * @param {*} startDateDataDetail
 * @param {*} currentFormationParAnnee
 * @param {*} currentNiveau
 * @returns
 */
const buildFormationsDataForStatut = (dataDetail, startDateDataDetail, currentFormationParAnnee, currentNiveau) => {
  const matchingFormations = dataDetail
    ?.find((x) => x.niveau === currentNiveau)
    ?.formations.filter(
      (x) => x.libelle === currentFormationParAnnee.libelle && x.annee === currentFormationParAnnee.annee
    );

  const matchingFormationsEndDate = startDateDataDetail
    ?.find((x) => x.niveau === currentNiveau)
    ?.formations.filter(
      (x) => x.libelle === currentFormationParAnnee.libelle && x.annee === currentFormationParAnnee.annee
    );

  return {
    nbTotalForNiveau: matchingFormations ? matchingFormations.length : 0,
    evolution: getPercentageDifference(matchingFormations?.length, matchingFormationsEndDate?.length),
  };
};

/**
 * Récupération des niveaux des formations uniques dans les effectifs
 * @param {*} startDate
 * @param {*} endDate
 * @returns
 */
const getUniquesNiveauxFrom = (startDate, endDate) => {
  return [
    ...new Set(
      Object.keys(startDate)
        .map((item) => ({
          statut: item,
          detail: startDate[item].dataDetail,
          nbTotal: startDate[item].nbTotalStatuts,
        }))
        .flat()
        .concat(
          Object.keys(endDate)
            .map((item) => ({
              statut: item,
              detail: endDate[item].dataDetail,
              nbTotal: endDate[item].nbTotalStatuts,
            }))
            .flat()
        )
        .map((item) => item.detail)
        .flat()
        .map((item) => item.niveau)
    ),
  ];
};

/**
 * Récupération des couples "année-libellé" uniques parmi les données des effectifs
 * @param {*} endDateData
 * @param {*} currentNiveau
 * @returns
 */
const getUniquesFormationsParAnneesForNiveau = (endDateData, currentNiveau) =>
  sortBy(
    uniqueValues(
      endDateData.apprentis.dataDetail
        .filter((x) => x.niveau === currentNiveau)
        .concat(endDateData.inscrits.dataDetail.filter((x) => x.niveau === currentNiveau))
        .concat(endDateData.abandons.dataDetail.filter((x) => x.niveau === currentNiveau))
        .map((x) => x.formations)
        .flat(),
      ["annee", "libelle"]
    ),
    ["libelle", "annee"]
  );
