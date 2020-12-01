const { StatutCandidat } = require("../../common/model");
const { codesStatutsCandidats } = require("../../common/model/constants");

module.exports = async () => {
  return {
    getAllStats,
  };
};

const filterByStatutApprenant = (statutApprenantFilter) => (statutCandidat) => {
  return statutCandidat.statut_apprenant === statutApprenantFilter;
};

const getAllStats = async (filters = {}) => {
  const allStatutCandidats = await StatutCandidat.find().lean();
  const nbDistinctCandidatsWithIne = await getNbDistinctCandidatsWithIne(filters);
  const nbDistinctCandidatsWithoutIne = await getNbDistinctCandidatsWithoutIne(filters);
  const nbStatutsSansIne = allStatutCandidats.filter((statut) => !statut.ine_apprenant).length;
  const nbInvalidUais = allStatutCandidats.filter((statut) => !statut.uai_etablissement_valid).length;

  const nbDistinctCandidatsWithChangingStatutProspectInscrit = allStatutCandidats.filter((statut) => {
    const sortedStatutsValuesHistory = statut.historique_statut_apprenant
      .sort((a, b) => a.position_statut > b.position_statut)
      .map((item) => item.valeur_statut);
    return [codesStatutsCandidats.prospect, codesStatutsCandidats.inscrit].every((val) =>
      sortedStatutsValuesHistory.includes(val)
    );
  }).length;
  const nbDistinctCandidatsWithChangingStatutProspectApprenti = allStatutCandidats.filter((statut) => {
    const sortedStatutsValuesHistory = statut.historique_statut_apprenant
      .sort((a, b) => a.position_statut > b.position_statut)
      .map((item) => item.valeur_statut);
    return [codesStatutsCandidats.prospect, codesStatutsCandidats.apprenti].every((val) =>
      sortedStatutsValuesHistory.includes(val)
    );
  }).length;
  const nbDistinctCandidatsWithChangingStatutProspectAbandon = allStatutCandidats.filter((statut) => {
    const sortedStatutsValuesHistory = statut.historique_statut_apprenant
      .sort((a, b) => a.position_statut > b.position_statut)
      .map((item) => item.valeur_statut);
    return [codesStatutsCandidats.prospect, codesStatutsCandidats.abandon].every((val) =>
      sortedStatutsValuesHistory.includes(val)
    );
  }).length;

  return {
    nbStatutsCandidats: allStatutCandidats.length,
    nbStatutsCandidatsMisAJour: allStatutCandidats.filter((statut) => Boolean(statut.updated_at)).length,
    nbStatutsProspect: allStatutCandidats.filter(filterByStatutApprenant(codesStatutsCandidats.prospect)).length,
    nbStatutsInscrits: allStatutCandidats.filter(filterByStatutApprenant(codesStatutsCandidats.inscrit)).length,
    nbStatutsApprentis: allStatutCandidats.filter(filterByStatutApprenant(codesStatutsCandidats.apprenti)).length,
    nbStatutsAbandon: allStatutCandidats.filter(filterByStatutApprenant(codesStatutsCandidats.abandon)).length,
    nbDistinctCandidatsTotal: nbDistinctCandidatsWithIne + nbDistinctCandidatsWithoutIne,
    nbDistinctCandidatsWithIne,
    nbDistinctCandidatsWithoutIne,
    nbStatutsSansIne,

    nbCandidatsMultiUais: (await getDistinctCandidatsWithMultiUais(filters)).length,

    nbCandidatsMultiCfds: (await getDistinctCandidatsWithMultiCfds(filters)).length,

    nbStatutsWithoutHistory: await getNbStatutsCandidatsWithoutHistory(filters),

    nbDistinctCandidatsWithStatutHistory1: await getNbDistinctCandidatsWithHistoryNbItems(2),
    nbDistinctCandidatsWithStatutHistory2: await getNbDistinctCandidatsWithHistoryNbItems(3),
    nbDistinctCandidatsWithStatutHistory3: await getNbDistinctCandidatsWithHistoryNbItems(4),

    nbDistinctCandidatsWithChangingStatutProspectInscrit,
    nbDistinctCandidatsWithChangingStatutProspectApprenti,
    nbDistinctCandidatsWithChangingStatutProspectAbandon,
    nbCfas: await getNbDistinctCfas(filters),
    nbInvalidUais,
  };
};

const getNbDistinctCandidatsWithIne = async (filters = {}) =>
  await (await StatutCandidat.find({ ...filters, ine_apprenant: { $nin: [null, ""] } }).distinct("ine_apprenant"))
    .length;

const getNbDistinctCandidatsWithoutIne = async (filters = {}) =>
  (
    await StatutCandidat.aggregate([
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
    ])
  ).length;

const getDistinctCandidatsWithMultiUais = async (filters = {}) =>
  await StatutCandidat.aggregate([
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
  ]);

const getDistinctCandidatsWithMultiCfds = async (filters = {}) =>
  await StatutCandidat.aggregate([
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
  ]);

const getNbStatutsCandidatsWithoutHistory = async (filters = {}) =>
  await StatutCandidat.countDocuments({ ...filters, historique_statut_apprenant: { $size: 1 } });

const getNbDistinctCandidatsWithHistoryNbItems = async (nbChangements, filters) =>
  (
    await StatutCandidat.aggregate([
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
    ])
  ).length;

const getNbDistinctCfas = async (filters) => {
  const distinctUais = await StatutCandidat.distinct("uai_etablissement", filters);
  return distinctUais.length;
};
