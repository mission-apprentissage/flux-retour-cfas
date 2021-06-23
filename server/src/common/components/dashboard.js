const { codesStatutsCandidats } = require("../model/constants");
const { StatutCandidat } = require("../model");
const groupBy = require("lodash.groupby");
const { asyncForEach } = require("../utils/asyncUtils");
const { uniqueValues, paginate } = require("../utils/miscUtils");
const sortBy = require("lodash.sortby");
const omit = require("lodash.omit");
const { isWithinInterval } = require("date-fns");

module.exports = () => ({
  getEffectifsCountByStatutApprenantAtDate,
  getEffectifsParNiveauEtAnneeFormation,
  getPaginatedEffectifsParNiveauEtAnneeFormation,
  getEffectifsCountByCfaAtDate,
  getRupturantsCountAtDate,
  computeNouveauxContratsApprentissageForDateRange,
});

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
    ...getEffectifsWithStatutAtDateAggregationPipeline(searchDate),
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
const getEffectifsParNiveauEtAnneeFormation = async (date, filters) => {
  const [inscritsBeginDate, apprentisBeginDate, abandonsBeginDate] = await Promise.all([
    getEffectifsDetailWithNiveauxForStatutAndDate(date, codesStatutsCandidats.inscrit, filters),
    getEffectifsDetailWithNiveauxForStatutAndDate(date, codesStatutsCandidats.apprenti, filters),
    getEffectifsDetailWithNiveauxForStatutAndDate(date, codesStatutsCandidats.abandon, filters),
  ]);

  const effectifs = {
    inscrits: inscritsBeginDate,
    apprentis: apprentisBeginDate,
    abandons: abandonsBeginDate,
  };

  const listData = await buildEffectifByNiveauxList(effectifs);
  return listData;
};

/**
 * Récupération des données paginées des effectifs avec niveaux / annee pour 2 dates et un siret donné
 * @param {*} date
 * @param {*} filters
 */
const getPaginatedEffectifsParNiveauEtAnneeFormation = async (date, filters, page = 1, limit = 1000) => {
  const listData = await getEffectifsParNiveauEtAnneeFormation(date, filters);
  const flattenedData = await flattenEffectifDetails(listData);
  const paginatedData = paginate(flattenedData, page, limit);
  const regroupedData = regroupEffectifDetails(paginatedData.data, (item) => [
    item.niveau.libelle,
    item.niveau.apprentis,
    item.niveau.inscrits,
    item.niveau.abandons,
  ]);

  return {
    page: paginatedData.page,
    per_page: paginatedData.per_page,
    pre_page: paginatedData.pre_page,
    next_page: paginatedData.next_page,
    total: paginatedData.total,
    total_pages: paginatedData.total_pages,
    data: regroupedData,
  };
};

/**
 * Récupération des détail des effectifs avec niveaux / annee des formations
 * pour le statut (searchStatut) et la date souhaitée (searchDate)
 *
 * Même fonctionnement que getNbStatutsInHistoryForStatutAndDate mais on récupère tout l'objet pour détail
 * @param {*} searchDate
 * @param {*} searchStatut
 * @param {*} filters
 * @returns
 */
const getEffectifsDetailWithNiveauxForStatutAndDate = async (searchDate, searchStatut, filters) => {
  // Récupération des effectifs depuis paramètres
  const statutsFound = await getEffectifsWithStatutApprenantAtDate(searchDate, searchStatut, filters);

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
  const projection = {
    niveau_formation: 1,
    annee_formation: 1,
    libelle_court_formation: 1,
  };
  const aggregationPipeline = [
    // Filtrage sur les filtres passées en paramètres
    {
      $match: {
        ...filters,
        siret_etablissement_valid: true,
      },
    },
    ...getEffectifsWithStatutAtDateAggregationPipeline(searchDate, projection),
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
 * @param {*} effectifs
 * @returns
 */
const buildEffectifByNiveauxList = (effectifs) => {
  const effectifByNiveauxList = [];

  // Récup les niveaux présents dans les données
  const uniquesNiveaux = getUniquesNiveauxFrom(effectifs).sort();

  // Pour chaque niveau on construit un objet contenant les infos de niveaux + les formations rattachées
  uniquesNiveaux.forEach((currentNiveau) => {
    effectifByNiveauxList.push({
      niveau: {
        libelle: currentNiveau,
        apprentis: buildStatutDataForNiveau(effectifs.apprentis, currentNiveau),
        inscrits: buildStatutDataForNiveau(effectifs.inscrits, currentNiveau),
        abandons: buildStatutDataForNiveau(effectifs.abandons, currentNiveau),
      },
      formations: buildFormationsDataForNiveau(effectifs, currentNiveau),
    });
  });

  return effectifByNiveauxList;
};

/**
 * Construction d'un objet contenant les nbTotaux pour un statut et un niveau
 * @param {*} statutDataEndDate
 * @param {*} statutDataStartDate
 * @param {*} currentNiveau
 * @returns
 */
const buildStatutDataForNiveau = (statutEffectifs, currentNiveau) => ({
  nbTotal: statutEffectifs.nbTotalStatuts,
  nbTotalForNiveau: statutEffectifs.dataDetail?.find((item) => item.niveau === currentNiveau)?.nbStatuts,
});

/**
 * Construction d'une liste d'objets contenant les données des formations pour un niveau
 * @param {*} endDateData
 * @param {*} startDateData
 * @param {*} currentNiveau
 * @returns
 */
const buildFormationsDataForNiveau = (effectifsParStatut, currentNiveau) => {
  const allFormationsForNiveau = [];

  // Récupération des couples année - libellé uniques dans les données effectifs
  const uniquesFormationsParAnneesForNiveau = getUniquesFormationsParAnneesForNiveau(effectifsParStatut, currentNiveau);

  // Pour chaque couple année - libéllé on construit un objet avec les nb de statuts (apprentis / inscrits / abandons)
  uniquesFormationsParAnneesForNiveau.forEach((currentFormationParAnnee) => {
    allFormationsForNiveau.push({
      libelle: currentFormationParAnnee.libelle,
      annee: currentFormationParAnnee.annee,
      apprentis: buildFormationsDataForStatut(
        effectifsParStatut.apprentis.dataDetail,
        currentFormationParAnnee,
        currentNiveau
      ),
      inscrits: buildFormationsDataForStatut(
        effectifsParStatut.inscrits.dataDetail,
        currentFormationParAnnee,
        currentNiveau
      ),
      abandons: buildFormationsDataForStatut(
        effectifsParStatut.abandons.dataDetail,
        currentFormationParAnnee,
        currentNiveau
      ),
    });
  });

  return allFormationsForNiveau;
};

/**
 * Construction d'un objet contenant le nbTotal pour un couple formation - année et un niveau
 * @param {*} dataDetail
 * @param {*} currentFormationParAnnee
 * @param {*} currentNiveau
 * @returns
 */
const buildFormationsDataForStatut = (dataDetail, currentFormationParAnnee, currentNiveau) => {
  const matchingFormations = dataDetail
    ?.find((x) => x.niveau === currentNiveau)
    ?.formations.filter(
      (x) => x.libelle === currentFormationParAnnee.libelle && x.annee === currentFormationParAnnee.annee
    );

  return {
    nbTotalForNiveau: matchingFormations ? matchingFormations.length : 0,
  };
};

/**
 * Récupération des niveaux des formations uniques dans les effectifs
 * @param {*} effectifs
 * @returns
 */
const getUniquesNiveauxFrom = (effectifs) => {
  return [
    ...new Set(
      Object.keys(effectifs)
        .map((item) => ({
          statut: item,
          detail: effectifs[item].dataDetail,
          nbTotal: effectifs[item].nbTotalStatuts,
        }))
        .flat()
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

const regroupEffectifDetails = (array, f) => {
  var groups = {};
  var niveaux = new Map();

  array.forEach(function (o) {
    var group = JSON.stringify(f(o));
    groups[group] = groups[group] || [];
    groups[group].push(omit(o, "niveau"));
  });

  array.forEach(function (o) {
    var group = JSON.stringify(f(o));
    niveaux.set(group, o.niveau);
  });

  return Object.keys(groups).map(function (group) {
    return { niveau: niveaux.get(group), formations: groups[group] };
  });
};

const flattenEffectifDetails = async (data) => {
  const resultList = [];

  await asyncForEach(data, async (currentDetail) => {
    const formationUpgrade = currentDetail.formations.map((item) => ({
      ...item,
      ...{ niveau: currentDetail.niveau },
    }));
    resultList.push(formationUpgrade);
  });

  return resultList.flat();
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
 *    total: number
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
  const aggregationPipeline = [
    // Filtrage sur les filtres passées en paramètres
    {
      $match: {
        ...filters,
        siret_etablissement_valid: true,
      },
    },
    ...getEffectifsWithStatutAtDateAggregationPipeline(searchDate, projection),
    {
      $group: {
        _id: "$siret_etablissement",
        uai_etablissement: { $first: "$uai_etablissement" },
        nom_etablissement: { $first: "$nom_etablissement" },
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

  const effectifsByCfa = await StatutCandidat.aggregate(aggregationPipeline);

  return effectifsByCfa.map(({ _id, uai_etablissement, nom_etablissement, ...counts }) => {
    return {
      siret_etablissement: _id,
      uai_etablissement,
      nom_etablissement,
      effectifs: counts,
    };
  });
};

const computeNouveauxContratsApprentissageForDateRange = async (dateRange, filters = {}) => {
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
