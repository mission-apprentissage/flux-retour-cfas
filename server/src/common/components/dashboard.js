const { codesStatutsCandidats } = require("../model/constants");
const { StatutCandidat } = require("../model");
const { isWithinInterval } = require("date-fns");
const { countSubArrayInArray } = require("../utils/subArrayUtils");
const { mergeObjectsBy } = require("../utils/mergeObjectsBy");

module.exports = () => ({
  getEffectifsCountByCfaAtDate,
  getApprentisCountAtDate,
  getAbandonsCountAtDate,
  getRupturantsCountAtDate,
  getInscritsSansContratCountAtDate,
  getNouveauxContratsCountInDateRange,
  getNbRupturesContratAtDate,
  getEffectifsCountByNiveauFormationAtDate,
  getEffectifsCountByFormationAtDate,
  getEffectifsCountByAnneeFormationAtDate,
  getEffectifsCountByDepartementAtDate,
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
  // compute number of apprentis, abandons, inscrits sans contrat and rupturants
  const apprentisCountByCfa = await getApprentisCountAtDate(searchDate, filters, {
    groupedBy: { ...groupedBy, apprentis: { $sum: 1 } },
    projection,
  });
  const abandonsCountByCfa = await getAbandonsCountAtDate(searchDate, filters, {
    groupedBy: { ...groupedBy, abandons: { $sum: 1 } },
    projection,
  });
  const inscritsSansContratCountByCfa = await getInscritsSansContratCountAtDate(searchDate, filters, {
    groupedBy: { ...groupedBy, inscritsSansContrat: { $sum: 1 } },
    projection,
  });
  const rupturantsCountByCfa = await getRupturantsCountAtDate(searchDate, filters, {
    groupedBy: { ...groupedBy, rupturants: { $sum: 1 } },
    projection,
  });

  // merge apprentis, abandons, inscrits sans contrat and rupturants with same _id to have them grouped
  return mergeObjectsBy(
    [...apprentisCountByCfa, ...abandonsCountByCfa, ...inscritsSansContratCountByCfa, ...rupturantsCountByCfa],
    "_id"
  );
};

/**
 * Récupération des effectifs par niveau de formation à une date donnée
 * @param {Date} searchDate
 * @param {*} filters
 * @returns [{
 *  niveau: string
 *  effectifs: {
 *    apprentis: number
 *    inscritsSansContrat: number
 *    rupturants: number
 *    abandons: number
 *  }
 * }]
 */
const getEffectifsCountByNiveauFormationAtDate = async (searchDate, filters = {}) => {
  const projection = { niveau_formation: 1 };
  const groupedBy = { _id: "$niveau_formation" };
  // compute number of apprentis, abandons, inscrits sans contrat and rupturants
  const effectifsByNiveauFormation = await getEffectifsCountAtDate(
    searchDate,
    // compute effectifs with a niveau_formation
    { ...filters, niveau_formation: { $ne: null } },
    {
      groupedBy,
      projection,
    }
  );

  return effectifsByNiveauFormation.map(({ _id, ...effectifs }) => {
    return {
      niveau_formation: _id,
      effectifs: {
        apprentis: effectifs.apprentis || 0,
        inscritsSansContrat: effectifs.inscritsSansContrat || 0,
        rupturants: effectifs.rupturants || 0,
        abandons: effectifs.abandons || 0,
      },
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
 *    inscritsSansContrat: number
 *    rupturants: number
 *    abandons: number
 *  }
 * }]
 */
const getEffectifsCountByFormationAtDate = async (searchDate, filters = {}) => {
  const projection = { formation_cfd: 1, libelle_long_formation: 1 };
  const groupedBy = {
    _id: "$formation_cfd",
    // we will send libelle_long_formation along with the grouped effectifs so we need to project it
    libelle_long_formation: { $first: "$libelle_long_formation" },
  };
  const effectifsByFormation = await getEffectifsCountAtDate(searchDate, filters, {
    groupedBy,
    projection,
  });

  return effectifsByFormation.map(({ _id, libelle_long_formation, ...effectifs }) => {
    return {
      formation_cfd: _id,
      intitule: libelle_long_formation,
      effectifs: {
        apprentis: effectifs.apprentis || 0,
        inscritsSansContrat: effectifs.inscritsSansContrat || 0,
        rupturants: effectifs.rupturants || 0,
        abandons: effectifs.abandons || 0,
      },
    };
  });
};

/**
 * Récupération des effectifs par annee_formation à une date donnée
 * @param {Date} searchDate
 * @param {*} filters
 * @returns [{
 *  annee_formation: string
 *  effectifs: {
 *    apprentis: number
 *    inscritsSansContrat: number
 *    rupturants: number
 *    abandons: number
 *  }
 * }]
 */
const getEffectifsCountByAnneeFormationAtDate = async (searchDate, filters = {}) => {
  const projection = { annee_formation: 1 };
  const groupedBy = { _id: "$annee_formation" };
  const effectifsByAnneeFormation = await getEffectifsCountAtDate(searchDate, filters, { groupedBy, projection });

  return effectifsByAnneeFormation.map(({ _id, ...effectifs }) => {
    return {
      annee_formation: _id,
      effectifs: {
        apprentis: effectifs.apprentis || 0,
        inscritsSansContrat: effectifs.inscritsSansContrat || 0,
        rupturants: effectifs.rupturants || 0,
        abandons: effectifs.abandons || 0,
      },
    };
  });
};

/**
 * Récupération des effectifs par uai_etablissement à une date donnée
 * @param {Date} searchDate
 * @param {*} filters
 * @returns [{
 *  uai_etablissement: string
 *  nom_etablissement: string
 *  effectifs: {
 *    apprentis: number
 *    inscritsSansContrat: number
 *    rupturants: number
 *    abandons: number
 *  }
 * }]
 */
const getEffectifsCountByCfaAtDate = async (searchDate, filters = {}) => {
  // we need to project these fields to give information about the CFAs
  const projection = {
    uai_etablissement: 1,
    nom_etablissement: 1,
  };
  const groupedBy = {
    _id: "$uai_etablissement",
    // we will send information about the organisme along with the grouped effectifs so we project it
    nom_etablissement: { $first: "$nom_etablissement" },
  };
  const effectifsCountByCfa = await getEffectifsCountAtDate(
    searchDate,
    // compute effectifs with a uai_etablissement
    { ...filters, uai_etablissement: { $ne: null } },
    { groupedBy, projection }
  );

  return effectifsCountByCfa.map((effectifForCfa) => {
    const { _id, nom_etablissement, ...effectifs } = effectifForCfa;
    return {
      uai_etablissement: _id,
      nom_etablissement,
      effectifs: {
        apprentis: effectifs.apprentis || 0,
        inscritsSansContrat: effectifs.inscritsSansContrat || 0,
        rupturants: effectifs.rupturants || 0,
        abandons: effectifs.abandons || 0,
      },
    };
  });
};

/**
 * Récupération des effectifs par etablissement_num_departement à une date donnée
 * @param {Date} searchDate
 * @param {*} filters
 * @returns [{
 *  etablissement_num_departement: string
 *  etablissement_nom_departement: string
 *  effectifs: {
 *    apprentis: number
 *    inscritsSansContrat: number
 *    rupturants: number
 *    abandons: number
 *  }
 * }]
 */
const getEffectifsCountByDepartementAtDate = async (searchDate, filters = {}) => {
  // we need to project these fields to give information about the departement
  const projection = {
    etablissement_nom_departement: 1,
    etablissement_num_departement: 1,
  };
  const groupedBy = {
    _id: "$etablissement_num_departement",
    etablissement_nom_departement: { $first: "$etablissement_nom_departement" },
  };
  const effectifsCountByDepartement = await getEffectifsCountAtDate(searchDate, filters, { groupedBy, projection });

  return effectifsCountByDepartement.map((effectifForDepartement) => {
    const { _id, etablissement_nom_departement, ...effectifs } = effectifForDepartement;
    return {
      etablissement_num_departement: _id,
      etablissement_nom_departement,
      effectifs: {
        apprentis: effectifs.apprentis || 0,
        inscritsSansContrat: effectifs.inscritsSansContrat || 0,
        rupturants: effectifs.rupturants || 0,
        abandons: effectifs.abandons || 0,
      },
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
const getRupturantsCountAtDate = async (searchDate, filters = {}, options = {}) => {
  const groupedBy = options.groupedBy ?? { _id: null, count: { $sum: 1 } };
  const aggregationPipeline = [
    // Filtrage sur les filtres passés en paramètres
    {
      $match: {
        ...filters,
        "historique_statut_apprenant.valeur_statut": codesStatutsCandidats.inscrit,
        "historique_statut_apprenant.1": { $exists: true },
      },
    },
    ...getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
    {
      $match: {
        "statut_apprenant_at_date.valeur_statut": codesStatutsCandidats.inscrit,
      },
    },
    // set previousStatutAtDate to be the element in historique_statut_apprenant juste before statut_apprenant_at_date
    {
      $addFields: {
        previousStatutAtDate: {
          $arrayElemAt: [
            "$historique_statut_apprenant",
            {
              $subtract: [
                {
                  $indexOfArray: ["$historique_statut_apprenant.date_statut", "$statut_apprenant_at_date.date_statut"],
                },
                1,
              ],
            },
          ],
        },
      },
    },
    {
      $match: {
        "previousStatutAtDate.valeur_statut": codesStatutsCandidats.apprenti,
      },
    },
    {
      $group: groupedBy,
    },
  ];

  const result = await StatutCandidat.aggregate(aggregationPipeline);

  if (!options.groupedBy) {
    return result.length === 1 ? result[0].count : 0;
  }
  return result;
};

// Inscrits sans contrat = Apprenants ayant démarré une formation en apprentissage
// sans avoir signé de contrat et toujours dans cette situation à la date consultée
// https://docs.google.com/document/d/1kxRQNm6qSlgk0FOVhkIbClB2Xq3QTDRj_fPuyfNdJHk/edit
const getInscritsSansContratCountAtDate = async (searchDate, filters = {}, options = {}) => {
  const groupedBy = options.groupedBy ?? { _id: null, count: { $sum: 1 } };
  const aggregationPipeline = [
    // Filtrage sur les filtres passés en paramètres
    {
      $match: {
        ...filters,
        "historique_statut_apprenant.valeur_statut": codesStatutsCandidats.inscrit,
      },
    },
    ...getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
    {
      $match: {
        "statut_apprenant_at_date.valeur_statut": codesStatutsCandidats.inscrit,
        "historique_statut_apprenant.valeur_statut": { $ne: codesStatutsCandidats.apprenti },
      },
    },
    {
      $group: groupedBy,
    },
  ];

  const result = await StatutCandidat.aggregate(aggregationPipeline);

  if (!options.groupedBy) {
    return result.length === 1 ? result[0].count : 0;
  }
  return result;
};

// Apprentis = Apprenants ayant le statut apprenti
// https://docs.google.com/document/d/1kxRQNm6qSlgk0FOVhkIbClB2Xq3QTDRj_fPuyfNdJHk/edit
const getApprentisCountAtDate = async (searchDate, filters = {}, options = {}) => {
  const groupedBy = options.groupedBy ?? { _id: null, count: { $sum: 1 } };
  const aggregationPipeline = [
    {
      $match: { ...filters, "historique_statut_apprenant.valeur_statut": codesStatutsCandidats.apprenti },
    },
    ...getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
    {
      $match: {
        "statut_apprenant_at_date.valeur_statut": codesStatutsCandidats.apprenti,
      },
    },
    {
      $group: groupedBy,
    },
  ];

  const result = await StatutCandidat.aggregate(aggregationPipeline);

  if (!options.groupedBy) {
    return result.length === 1 ? result[0].count : 0;
  }
  return result;
};

// Abandons = Apprenants ayant le statut abandon
// https://docs.google.com/document/d/1kxRQNm6qSlgk0FOVhkIbClB2Xq3QTDRj_fPuyfNdJHk/edit
const getAbandonsCountAtDate = async (searchDate, filters = {}, options = {}) => {
  const groupedBy = options.groupedBy ?? { _id: null, count: { $sum: 1 } };
  const aggregationPipeline = [
    {
      $match: { ...filters, "historique_statut_apprenant.valeur_statut": codesStatutsCandidats.abandon },
    },
    ...getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
    {
      $match: {
        "statut_apprenant_at_date.valeur_statut": codesStatutsCandidats.abandon,
      },
    },
    {
      $group: groupedBy,
    },
  ];

  const result = await StatutCandidat.aggregate(aggregationPipeline);

  if (!options.groupedBy) {
    return result.length === 1 ? result[0].count : 0;
  }
  return result;
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
