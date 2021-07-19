const { codesStatutsCandidats } = require("../model/constants");
const { StatutCandidat } = require("../model");
const { isWithinInterval } = require("date-fns");
const { countSubArrayInArray } = require("../utils/subArrayUtils");

module.exports = () => ({
  getEffectifsCountByCfaAtDate,
  getApprentisCountAtDate,
  getAbandonsCountAtDate,
  getRupturantsCountAtDate,
  getJeunesSansContratCountAtDate,
  getNouveauxContratsCountInDateRange,
  getNbRupturesContratAtDate,
  getEffectifsCountByNiveauFormationAtDate,
  getEffectifsCountByFormationAtDate,
  getEffectifsCountByAnneeFormationAtDate,
});

/*
  Principe :
  * 1. On filtre dans l'historique sur les élements ayant une date <= date recherchée
  * 2. On construit dans l'historique des statuts un champ diff_date_search = différence entre la date du statut de l'historique et la date recherchée
  * 3. On crée un champ statut_apprenant_at_date = statut dans l'historique avec le plus petit diff_date_search
*/
const getEffectifsWithStatutAtDateAggregationPipeline = (date, projection = {}) => {
  return [
    // Filtrage sur les élements avec date antérieure à la date recherchée
    {
      $project: {
        ...projection,
        historique_statut_apprenant: {
          $filter: {
            input: "$historique_statut_apprenant",
            as: "result",
            // Filtre dans l'historique sur les valeurs ayant une date antérieure à la date de recherche
            cond: {
              $lte: ["$$result.date_statut", date],
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
              // Calcul de la différence entre item.date_statut & date
              diff_date_search: { $abs: [{ $subtract: ["$$item.date_statut", date] }] },
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
  ];
};

const getEffectifsCountAtDate = async (searchDate, filters = {}, { groupedBy, projection }) => {
  const aggregationPipeline = [
    { $match: filters },
    ...getEffectifsWithStatutAtDateAggregationPipeline(searchDate, projection),
    {
      $match: {
        "statut_apprenant_at_date.valeur_statut": {
          $in: [codesStatutsCandidats.apprenti, codesStatutsCandidats.inscrit, codesStatutsCandidats.abandon],
        },
      },
    },
    {
      $group: {
        ...groupedBy,
        apprentis: {
          $sum: {
            $cond: [{ $eq: ["$statut_apprenant_at_date.valeur_statut", codesStatutsCandidats.apprenti] }, 1, 0],
          },
        },
        inscrits: {
          $sum: {
            $cond: [{ $eq: ["$statut_apprenant_at_date.valeur_statut", codesStatutsCandidats.inscrit] }, 1, 0],
          },
        },
        abandons: {
          $sum: {
            $cond: [{ $eq: ["$statut_apprenant_at_date.valeur_statut", codesStatutsCandidats.abandon] }, 1, 0],
          },
        },
      },
    },
  ];

  return StatutCandidat.aggregate(aggregationPipeline);
};

/**
 * Récupération des effectifs par niveau de formation à une date donnée
 * @param {Date} searchDate
 * @param {*} filters
 * @returns [{
 *  niveau: string
 *  effectifs: {
 *    apprentis: number
 *    inscrits: number
 *    abandons: number
 *  }
 * }]
 */
const getEffectifsCountByNiveauFormationAtDate = async (searchDate, filters = {}) => {
  const projection = { niveau_formation: 1 };
  const groupedBy = { _id: "$niveau_formation" };
  const effectifsByNiveauFormation = await getEffectifsCountAtDate(
    searchDate,
    {
      ...filters,
      niveau_formation: { $ne: null },
    },
    { projection, groupedBy }
  );

  return effectifsByNiveauFormation.map(({ _id, ...effectifs }) => {
    return {
      niveau_formation: _id,
      effectifs,
    };
  });
};

/**
 * Récupération des effectifs par formation à une date donnée
 * @param {Date} searchDate
 * @param {*} filters
 * @returns [{
 *  cfd: string
 *  intitule: string
 *  effectifs: {
 *    apprentis: number
 *    inscrits: number
 *    abandons: number
 *  }
 * }]
 */
const getEffectifsCountByFormationAtDate = async (searchDate, filters = {}) => {
  const projection = { formation_cfd: 1, libelle_long_formation: 1 };
  const groupedBy = { _id: "$formation_cfd", libelle_long_formation: { $first: "$libelle_long_formation" } };
  const effectifsByFormation = await getEffectifsCountAtDate(searchDate, filters, {
    groupedBy,
    projection,
  });
  return effectifsByFormation.map(({ _id, libelle_long_formation, ...effectifs }) => {
    return {
      formation_cfd: _id,
      intitule: libelle_long_formation,
      effectifs,
    };
  });
};

/**
 * Récupération des effectifs par année de formation à une date donnée
 * @param {Date} searchDate
 * @param {*} filters
 * @returns [{
 *  annee_formation: string
 *  effectifs: {
 *    apprentis: number
 *    inscrits: number
 *    abandons: number
 *  }
 * }]
 */
const getEffectifsCountByAnneeFormationAtDate = async (searchDate, filters = {}) => {
  const projection = { annee_formation: 1 };
  const groupedBy = { _id: "$annee_formation" };
  const effectifsByAnneeFormation = await getEffectifsCountAtDate(
    searchDate,
    {
      ...filters,
      annee_formation: { $ne: null },
    },
    { groupedBy, projection }
  );

  return effectifsByAnneeFormation.map(({ _id, ...effectifs }) => {
    return {
      annee_formation: _id,
      effectifs,
    };
  });
};

/**
 * Récupération du nombre de statuts apprenants par cfa à une date donnée
 * @param {Date} searchDate
 * @param {*} filters
 * @returns [{
 *  siret_etablissement: string
 *  uai_etablissement: string
 *  nom_etablissement: string
 *  effectifs: {
 *    apprentis: number
 *    inscrits: number
 *    abandons: number
 *  }
 * }]
 */
const getEffectifsCountByCfaAtDate = async (searchDate, filters = {}) => {
  const projection = {
    siret_etablissement: 1,
    uai_etablissement: 1,
    nom_etablissement: 1,
  };
  const groupedBy = {
    _id: "$uai_etablissement",
    siret_etablissement: { $first: "$siret_etablissement" },
    nom_etablissement: { $first: "$nom_etablissement" },
  };
  const effectifsByCfa = await getEffectifsCountAtDate(
    searchDate,
    {
      ...filters,
      annee_formation: { $ne: null },
    },
    { groupedBy, projection }
  );

  return effectifsByCfa.map(({ _id, siret_etablissement, nom_etablissement, ...counts }) => {
    return {
      uai_etablissement: _id,
      siret_etablissement,
      nom_etablissement,
      effectifs: counts,
    };
  });
};

const getNouveauxContratsCountInDateRange = async (dateRange, filters = {}) => {
  const statutsWithStatutApprenant3InHistorique = await StatutCandidat.aggregate([
    { $match: { ...filters, "historique_statut_apprenant.valeur_statut": codesStatutsCandidats.apprenti } },
  ]);

  let count = 0;
  statutsWithStatutApprenant3InHistorique.forEach((statut) => {
    statut.historique_statut_apprenant.forEach((historiqueEl) => {
      if (
        historiqueEl.valeur_statut === codesStatutsCandidats.apprenti &&
        isWithinInterval(historiqueEl.date_statut, { start: dateRange[0], end: dateRange[1] })
      ) {
        count++;
      }
    });
  });
  return count;
};

/**
 * Récupération des rupturants à une date donnée
 *
 */
const getRupturantsCountAtDate = async (searchDate, filters = {}) => {
  const aggregationPipeline = [
    // Filtrage sur les filtres passés en paramètres
    {
      $match: {
        ...filters,
        "historique_statut_apprenant.valeur_statut": codesStatutsCandidats.inscrit,
        "historique_statut_apprenant.1": { $exists: true },
      },
    },
    ...getEffectifsWithStatutAtDateAggregationPipeline(searchDate),
    {
      $match: {
        "statut_apprenant_at_date.valeur_statut": codesStatutsCandidats.inscrit,
      },
    },
  ];

  const inscrits = await StatutCandidat.aggregate(aggregationPipeline);

  const rupturants = inscrits.filter((inscrit) => {
    const previousStatutIndexInHistorique =
      inscrit.historique_statut_apprenant.findIndex((historiqueElem) => {
        return historiqueElem.date_statut.getTime() === inscrit.statut_apprenant_at_date.date_statut.getTime();
      }) - 1;
    const previousStatutApprenant = inscrit.historique_statut_apprenant[previousStatutIndexInHistorique]?.valeur_statut;
    return previousStatutApprenant === codesStatutsCandidats.apprenti;
  });

  return rupturants.length;
};

// Jeunes sans contrat = Apprenants ayant démarré une formation en apprentissage
// sans avoir signé de contrat et toujours dans cette situation à la date consultée
// https://docs.google.com/document/d/1kxRQNm6qSlgk0FOVhkIbClB2Xq3QTDRj_fPuyfNdJHk/edit
const getJeunesSansContratCountAtDate = async (searchDate, filters = {}) => {
  const aggregationPipeline = [
    // Filtrage sur les filtres passés en paramètres
    {
      $match: {
        ...filters,
        "historique_statut_apprenant.valeur_statut": codesStatutsCandidats.inscrit,
      },
    },
    ...getEffectifsWithStatutAtDateAggregationPipeline(searchDate),
    {
      $match: {
        "statut_apprenant_at_date.valeur_statut": codesStatutsCandidats.inscrit,
        "historique_statut_apprenant.valeur_statut": { $ne: codesStatutsCandidats.apprenti },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
      },
    },
  ];

  const result = await StatutCandidat.aggregate(aggregationPipeline);
  return result.length === 1 ? result[0].count : 0;
};

// Apprentis = Apprenants ayant le statut apprenti
// https://docs.google.com/document/d/1kxRQNm6qSlgk0FOVhkIbClB2Xq3QTDRj_fPuyfNdJHk/edit
const getApprentisCountAtDate = async (searchDate, filters = {}) => {
  const aggregationPipeline = [
    {
      $match: { ...filters, "historique_statut_apprenant.valeur_statut": codesStatutsCandidats.apprenti },
    },
    ...getEffectifsWithStatutAtDateAggregationPipeline(searchDate),
    {
      $match: {
        "statut_apprenant_at_date.valeur_statut": codesStatutsCandidats.apprenti,
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
      },
    },
  ];

  const result = await StatutCandidat.aggregate(aggregationPipeline);
  return result.length === 1 ? result[0].count : 0;
};

// Abandons = Apprenants ayant le statut abandon
// https://docs.google.com/document/d/1kxRQNm6qSlgk0FOVhkIbClB2Xq3QTDRj_fPuyfNdJHk/edit
const getAbandonsCountAtDate = async (searchDate, filters = {}) => {
  const aggregationPipeline = [
    {
      $match: { ...filters, "historique_statut_apprenant.valeur_statut": codesStatutsCandidats.abandon },
    },
    ...getEffectifsWithStatutAtDateAggregationPipeline(searchDate),
    {
      $match: {
        "statut_apprenant_at_date.valeur_statut": codesStatutsCandidats.abandon,
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
      },
    },
  ];

  const result = await StatutCandidat.aggregate(aggregationPipeline);
  return result.length === 1 ? result[0].count : 0;
};

/**
 * Décompte du nombre de ruptures dans les statutsCandidats
 * = Somme des ruptures apprenti vers abandon et apprenti vers inscrit
 * On récupère tous les statuts en abandon / inscrit à la searchDate
 * On filtre pour ceux ayant eu un passage d'apprenti vers abandon ou apprenti vers inscrit
 * @param {*} searchDate
 * @param {*} filters
 * @returns
 */
const getNbRupturesContratAtDate = async (searchDate, filters = {}) => {
  const inscritsOrAbandonsAtDate = await StatutCandidat.aggregate([
    // Filtrage sur les filtres passées en paramètres
    {
      $match: {
        ...filters,
        "historique_statut_apprenant.1": { $exists: true },
      },
    },
    ...getEffectifsWithStatutAtDateAggregationPipeline(searchDate),
    {
      $match: {
        $or: [
          { "statut_apprenant_at_date.valeur_statut": codesStatutsCandidats.inscrit },
          { "statut_apprenant_at_date.valeur_statut": codesStatutsCandidats.abandon },
        ],
      },
    },
  ]);

  return inscritsOrAbandonsAtDate
    .map((item) => item.historique_statut_apprenant)
    .reduce(
      (arr, entry) =>
        arr +
        (countSubArrayInArray(
          entry.map((item) => item.valeur_statut),
          [codesStatutsCandidats.apprenti, codesStatutsCandidats.inscrit]
        ) +
          countSubArrayInArray(
            entry.map((item) => item.valeur_statut),
            [codesStatutsCandidats.apprenti, codesStatutsCandidats.abandon]
          )),
      0
    );
};
