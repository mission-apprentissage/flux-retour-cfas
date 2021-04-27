const { codesStatutsCandidats } = require("../model/constants");
const { StatutCandidat } = require("../model");
const groupBy = require("lodash.groupby");
const { getPercentageDifference } = require("../utils/calculUtils");
const { uniqueValues } = require("../utils/miscUtils");
const sortBy = require("lodash.sortby");

module.exports = () => ({
  getEffectifsCountByStatutApprenantAtDate,
  getEffectifsDetailDataForSiret,
});

/**
 * Récupération des effectifs par statut_apprenant à une date donnée
 *
 * Principe :
 * 1. On filtre sur les params en entrée
 * 2. On filtre dans l'historique sur les élements ayant une date <= date recherchée
 * 3. On construit dans l'historique des statuts un champ diff_date_search = différence entre la date du statut de l'historique et la date recherchée
 * 4. On crée un champ statut_apprenant_at_date = statut dans l'historique avec le plus petit diff_date_search
 * 5. On compte les effectifs résultant par statut_apprenant
 */
const getEffectifsCountByStatutApprenantAtDate = async (searchDate, filters = {}) => {
  const aggregationPipeline = [
    // Filtrage sur les filtres passées en paramètres
    {
      $match: {
        ...filters,
        siret_etablissement_valid: true,
      },
    },
    // Filtrage sur les élements avec date antérieure à la date recherchée
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
    {
      $match: { historique_statut_apprenant: { $not: { $size: 0 } } },
    },
    // Ajout d'un champ diff_date_search : écart entre la date de l'historique et la date recherchée
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
    // Ajout d'un champ statut_apprenant_at_date correspondant à l'élément de l'historique ayant le plus petit écart avec la date recherchée
    {
      $addFields: {
        statut_apprenant_at_date: {
          $first: {
            $filter: {
              input: "$historique_statut_apprenant",
              as: "result",
              cond: {
                $eq: ["$$result.diff_date_search", { $min: "$historique_statut_apprenant.diff_date_search" }],
              },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: "$statut_apprenant_at_date.valeur_statut",
        count: { $sum: 1 },
      },
    },
  ];

  const effectifsCount = await StatutCandidat.aggregate(aggregationPipeline);

  return Object.values(codesStatutsCandidats).reduce((acc, codeStatut) => {
    const effectifsForStatut = effectifsCount.find((effectif) => effectif._id === codeStatut);
    return {
      ...acc,
      [codeStatut]: {
        count: effectifsForStatut?.count || 0,
      },
    };
  }, {});
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
  const statutsFound = await getEffectifsWithStatutApprenantAtDate(searchDate, searchStatut, {
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
 * Récupération des effectifs ayant le statut donné à la date donnée
 *
 * Principe :
 * 1. On filtre sur les params en entrée
 * 2. On filtre dans l'historique sur les élements ayant une date <= date recherchée
 * 3. On construit dans l'historique des statuts un champ diff_date_search = différence entre la date du statut de l'historique et la date recherchée
 * 4. On crée un champ statut_apprenant_at_date = statut dans l'historique avec le plus petit diff_date_search
 * 5. On garde uniquement les statuts correspondants à celui demandé
 */
const getEffectifsWithStatutApprenantAtDate = async (searchDate, statutApprenant, filters = {}) => {
  const aggregationPipeline = [
    // Filtrage sur les filtres passées en paramètres
    {
      $match: {
        ...filters,
        siret_etablissement_valid: true,
      },
    },
    // Filtrage sur les élements avec date antérieure à la date recherchée
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
    {
      $match: { historique_statut_apprenant: { $not: { $size: 0 } } },
    },
    // Ajout d'un champ diff_date_search : écart entre la date de l'historique et la date recherchée
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
    // Ajout d'un champ statut_apprenant_at_date correspondant à l'élément de l'historique ayant le plus petit écart avec la date recherchée
    {
      $addFields: {
        statut_apprenant_at_date: {
          $first: {
            $filter: {
              input: "$historique_statut_apprenant",
              as: "result",
              cond: {
                $eq: ["$$result.diff_date_search", { $min: "$historique_statut_apprenant.diff_date_search" }],
              },
            },
          },
        },
      },
    },
    {
      $match: {
        "statut_apprenant_at_date.valeur_statut": statutApprenant,
      },
    },
  ];

  return StatutCandidat.aggregate(aggregationPipeline);
};

/**
 * Construction de la liste des détails des formations à partir des effectifs startDate / endDate
 * Principe :
 * On récupère la liste des niveaux uniques et des formations uniques dans la liste
 * Pour chaque niveau, chaque formation / année on construit la liste
 * @param {*} param
 * @returns
 */
const buildEffectifByNiveauxList = ({ startDate, endDate }) => {
  const effectifByNiveauxList = [];

  // Récup les niveaux présents dans les données
  const uniquesNiveaux = getUniquesNiveauxFrom(startDate, endDate);

  // Pour chaque niveau on construit un objet contenant les infos de niveaux + les formations rattachées
  uniquesNiveaux.forEach((currentNiveau) => {
    effectifByNiveauxList.push({
      niveau: {
        libelle: currentNiveau,
        apprentis: buildStatutDataForNiveau(endDate.apprentis, startDate.apprentis, currentNiveau),
        inscrits: buildStatutDataForNiveau(endDate.inscrits, startDate.inscrits, currentNiveau),
        abandons: buildStatutDataForNiveau(endDate.abandons, startDate.abandons, currentNiveau),
      },
      formations: buildFormationsDataForNiveau(endDate, startDate, currentNiveau),
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
const buildFormationsDataForNiveau = (endDateData, startDateData, currentNiveau) => {
  const allFormationsForNiveau = [];

  // Récupération des couples année - libellé uniques dans les données effectifs
  const uniquesFormationsParAnneesForNiveau = getUniquesFormationsParAnneesForNiveau(endDateData, currentNiveau);

  // Pour chaque couple année - libéllé on construit un objet avec les nb de statuts (apprentis / inscrits / abandons)
  uniquesFormationsParAnneesForNiveau.forEach((currentFormationParAnnee) => {
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
