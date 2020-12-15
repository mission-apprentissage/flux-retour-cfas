const { StatutCandidat } = require("../../common/model");
const { codesStatutsCandidats } = require("../../common/model/constants");
const { validateUai } = require("../domain/uai");

module.exports = async () => {
  return {
    getAllStats,
  };
};

const getAllStats = async (filters = {}) => {
  const nbAllStatutCandidats = await StatutCandidat.countDocuments(filters);
  const nbStatutsCandidatsMisAJour = await StatutCandidat.countDocuments({
    ...filters,
    updatedAt: { $ne: null },
  });
  const nbStatutsProspect = await StatutCandidat.countDocuments({
    statut_apprenant: codesStatutsCandidats.prospect,
    ...filters,
  });
  const nbStatutsInscrits = await StatutCandidat.countDocuments({
    statut_apprenant: codesStatutsCandidats.inscrit,
    ...filters,
  });
  const nbStatutsApprentis = await StatutCandidat.countDocuments({
    statut_apprenant: codesStatutsCandidats.apprenti,
    ...filters,
  });
  const nbStatutsAbandon = await StatutCandidat.countDocuments({
    statut_apprenant: codesStatutsCandidats.abandon,
    ...filters,
  });
  const nbDistinctCandidatsWithIne = await getNbDistinctCandidatsWithIne(filters);
  const nbDistinctCandidatsWithoutIne = await getNbDistinctCandidatsWithoutIne(filters);
  const nbStatutsSansIne = await StatutCandidat.countDocuments({
    ...filters,
    ine_apprenant: { $in: [null, ""] },
  });
  const nbStatutsWithoutHistory = await StatutCandidat.countDocuments({
    ...filters,
    historique_statut_apprenant: { $size: 1 },
  });

  const nbInvalidUais = await getNbInvalidUais(filters);

  const candidatsWithHistory = await StatutCandidat.aggregate([
    { $match: filters },
    {
      $project: { historique_statut_apprenant: 1, hasHistory: { $gt: [{ $size: "$historique_statut_apprenant" }, 1] } },
    },
    { $match: { hasHistory: true } },
  ]);

  const nbDistinctCandidatsWithChangingStatutProspectInscrit = candidatsWithHistory.filter((statut) => {
    const sortedStatutsValuesHistory = statut.historique_statut_apprenant
      .sort((a, b) => a.position_statut > b.position_statut)
      .map((item) => item.valeur_statut);
    return [codesStatutsCandidats.prospect, codesStatutsCandidats.inscrit].every((val) =>
      sortedStatutsValuesHistory.includes(val)
    );
  }).length;
  const nbDistinctCandidatsWithChangingStatutProspectApprenti = candidatsWithHistory.filter((statut) => {
    const sortedStatutsValuesHistory = statut.historique_statut_apprenant
      .sort((a, b) => a.position_statut > b.position_statut)
      .map((item) => item.valeur_statut);
    return [codesStatutsCandidats.prospect, codesStatutsCandidats.apprenti].every((val) =>
      sortedStatutsValuesHistory.includes(val)
    );
  }).length;
  const nbDistinctCandidatsWithChangingStatutProspectAbandon = candidatsWithHistory.filter((statut) => {
    const sortedStatutsValuesHistory = statut.historique_statut_apprenant
      .sort((a, b) => a.position_statut > b.position_statut)
      .map((item) => item.valeur_statut);
    return [codesStatutsCandidats.prospect, codesStatutsCandidats.abandon].every((val) =>
      sortedStatutsValuesHistory.includes(val)
    );
  }).length;

  return {
    nbStatutsCandidats: nbAllStatutCandidats,
    nbStatutsCandidatsMisAJour,
    nbStatutsProspect,
    nbStatutsInscrits,
    nbStatutsApprentis,
    nbStatutsAbandon,
    nbDistinctCandidatsWithIne,
    nbDistinctCandidatsWithoutIne,
    nbDistinctCandidatsTotal: nbDistinctCandidatsWithIne + nbDistinctCandidatsWithoutIne,
    nbStatutsSansIne,

    nbCandidatsMultiUais: await getNbDistinctCandidatsWithMultiUais(filters),

    nbCandidatsMultiCfds: await getDistinctCandidatsWithMultiCfds(filters),

    nbStatutsWithoutHistory,

    nbDistinctCandidatsWithStatutHistory1: await getNbDistinctCandidatsWithHistoryNbItems(2, filters),
    nbDistinctCandidatsWithStatutHistory2: await getNbDistinctCandidatsWithHistoryNbItems(3, filters),
    nbDistinctCandidatsWithStatutHistory3: await getNbDistinctCandidatsWithHistoryNbItems(4, filters),

    nbDistinctCandidatsWithChangingStatutProspectInscrit,
    nbDistinctCandidatsWithChangingStatutProspectApprenti,
    nbDistinctCandidatsWithChangingStatutProspectAbandon,
    nbCfas: await getNbDistinctCfas(filters),
    nbInvalidUais,
  };
};

const getNbDistinctCandidatsWithIne = async (filters = {}) =>
  (await StatutCandidat.distinct("ine_apprenant", { ...filters, ine_apprenant: { $nin: [null, ""] } })).length;

const getNbDistinctCandidatsWithoutIne = async (filters = {}) => {
  const result = await StatutCandidat.aggregate([
    { $match: { ...filters, ine_apprenant: { $in: [null, ""] } } },
    {
      $group: {
        _id: {
          nom: "$nom_apprenant",
          prenom: "$prenom_apprenant",
          prenom2: "$prenom2_apprenant",
          prenom3: "$prenom3_apprenant",
          email: "$email_contact",
        },
      },
    },
    { $count: "count" },
  ]);
  return result[0]?.count;
};

const getNbDistinctCandidatsWithMultiUais = async (filters = {}) => {
  const result = await StatutCandidat.aggregate([
    { $match: filters },
    {
      $group: {
        _id: {
          ine: "$ine_apprenant",
        },
        uais: { $addToSet: "$uai_etablissement" },
      },
    },
    { $match: { "uais.1": { $exists: true } } },
    { $count: "count" },
  ]);
  return result[0]?.count;
};

const getDistinctCandidatsWithMultiCfds = async (filters = {}) => {
  const result = await StatutCandidat.aggregate([
    { $match: filters },
    {
      $group: {
        _id: {
          ine: "$ine_apprenant",
        },
        idsFormations: { $addToSet: "$id_formation" },
      },
    },
    { $match: { "idsFormations.1": { $exists: true } } },
    { $count: "count" },
  ]);
  return result[0]?.count;
};

const getNbDistinctCandidatsWithHistoryNbItems = async (nbChangements, filters) => {
  const result = await StatutCandidat.aggregate([
    { $match: { ...filters, historique_statut_apprenant: { $size: nbChangements } } },
    {
      $group: {
        _id: {
          nom: "$nom_apprenant",
          prenom: "$prenom_apprenant",
          prenom2: "$prenom2_apprenant",
          prenom3: "$prenom3_apprenant",
          email: "$email_contact",
        },
      },
    },
    { $count: "count" },
  ]);

  return result[0]?.count;
};

const getNbDistinctCfas = async (filters) => {
  const distinctUais = await StatutCandidat.distinct("uai_etablissement", filters);
  return distinctUais.length;
};

const getNbInvalidUais = async (filters = {}) => {
  const uais = await StatutCandidat.aggregate([{ $match: filters }, { $project: { uai_etablissement: 1 } }]);
  const invalidUais = uais.filter(({ uai_etablissement }) => !validateUai(uai_etablissement));
  return invalidUais.length;
};
