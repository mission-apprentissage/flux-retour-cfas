const { StatutCandidat } = require("../../common/model");
const { codesStatutsCandidats } = require("../../common/model/constants");

module.exports = async () => {
  return {
    getAllStats,
    getNbStatutsCandidatsTotal,
    getNbDistinctCandidatsWithIne,
    getNbDistinctCandidatsWithoutIne,
    getNbStatutsCandidatsSansIne,
    getAllNbStatutsCandidatsParUais,
    getNbStatutsCandidatsParUais,
    getDistinctCandidatsWithoutIneMultiUais,
    getDistinctCandidatsWithIneWithMultiUais,
    getDistinctCandidatsWithoutIneMultiCfds,
    getDistinctCandidatsWithIneWithMultiCfds,
    getNbStatutsCandidatsWithoutHistory,
    getNbDistinctCandidatsWithoutHistory,
    getNbDistinctCandidatsWithHistoryNbItems,
    getNbDistinctCandidatsWithChangingStatutProspectInscrit,
    getNbDistinctCandidatsWithChangingStatutProspectApprenti,
    getNbDistinctCandidatsWithChangingStatutProspectAbandon,
  };
};

const getAllStats = async (filters = {}) => {
  return {
    nbStatutsCandidats: await getNbStatutsCandidatsTotal(filters),
    nbStatutsCandidatsMisAJour: await getNbStatutsCandidatsUpdatedTotal(filters),
    nbStatutsProspect: await getNbStatutsCandidatsTotal({
      ...filters,
      statut_apprenant: codesStatutsCandidats.prospect,
    }),
    nbStatutsInscrits: await getNbStatutsCandidatsTotal({
      ...filters,
      statut_apprenant: codesStatutsCandidats.inscrit,
    }),
    nbStatutsApprentis: await getNbStatutsCandidatsTotal({
      ...filters,
      statut_apprenant: codesStatutsCandidats.apprenti,
    }),
    nbStatutsAbandon: await getNbStatutsCandidatsTotal({ ...filters, statut_apprenant: codesStatutsCandidats.abandon }),
    nbDistinctCandidatsTotal:
      (await getNbDistinctCandidatsWithIne(filters)) + (await getNbDistinctCandidatsWithoutIne(filters)),
    nbDistinctCandidatsWithIne: await getNbDistinctCandidatsWithIne(filters),
    nbDistinctCandidatsWithoutIne: await getNbDistinctCandidatsWithoutIne(filters),
    nbStatutsSansIne: await getNbStatutsCandidatsSansIne(filters),
    nbStatutsCandidatsParUais: await getAllNbStatutsCandidatsParUais(filters),
    nbStatutsCandidatsProspectsParUais: await getNbStatutsCandidatsParUais({
      ...filters,
      statut_apprenant: codesStatutsCandidats.prospect,
    }),
    nbStatutsCandidatsInscritsParUais: await getNbStatutsCandidatsParUais({
      ...filters,
      statut_apprenant: codesStatutsCandidats.inscrit,
    }),
    nbStatutsCandidatsApprentisParUais: await getNbStatutsCandidatsParUais({
      ...filters,
      statut_apprenant: codesStatutsCandidats.apprenti,
    }),
    nbStatutsCandidatsAbandonParUais: await getNbStatutsCandidatsParUais({
      ...filters,
      statut_apprenant: codesStatutsCandidats.abandon,
    }),
    candidatsMultiUaisWithoutIne: await getDistinctCandidatsWithoutIneMultiUais(filters),
    candidatsMultiUaisWithIne: await getDistinctCandidatsWithIneWithMultiUais(filters),

    nbCandidatsMultiUais:
      (await getDistinctCandidatsWithoutIneMultiUais(filters)).length +
      (await getDistinctCandidatsWithIneWithMultiUais(filters)).length,

    candidatsMultiCfdsWithoutIne: await getDistinctCandidatsWithoutIneMultiCfds(filters),
    candidatsMultiCfdsWithIne: await getDistinctCandidatsWithIneWithMultiCfds(filters),

    nbCandidatsMultiCfds:
      (await getDistinctCandidatsWithoutIneMultiCfds(filters)).length +
      (await getDistinctCandidatsWithIneWithMultiCfds(filters)).length,

    nbStatutsWithoutHistory: await getNbStatutsCandidatsWithoutHistory(filters),
    nbDistinctCandidatsWithoutStatutHistory: await getNbDistinctCandidatsWithoutHistory(filters),

    nbDistinctCandidatsWithStatutHistory1: await getNbDistinctCandidatsWithHistoryNbItems(2),
    nbDistinctCandidatsWithStatutHistory2: await getNbDistinctCandidatsWithHistoryNbItems(3),
    nbDistinctCandidatsWithStatutHistory3: await getNbDistinctCandidatsWithHistoryNbItems(4),

    nbDistinctCandidatsWithChangingStatutProspectInscrit: await getNbDistinctCandidatsWithChangingStatutProspectInscrit(
      filters
    ),
    nbDistinctCandidatsWithChangingStatutProspectApprenti: await getNbDistinctCandidatsWithChangingStatutProspectApprenti(
      filters
    ),
    nbDistinctCandidatsWithChangingStatutProspectAbandon: await getNbDistinctCandidatsWithChangingStatutProspectAbandon(
      filters
    ),

    nbCfas: await getNbDistinctCfas(),
  };
};

const getNbStatutsCandidatsTotal = async (filters = {}) => await StatutCandidat.countDocuments(filters);

const getNbStatutsCandidatsUpdatedTotal = async (filters = {}) =>
  await StatutCandidat.countDocuments({ ...filters, updated_at: { $ne: null } });

const getNbDistinctCandidatsWithIne = async (filters = {}) =>
  await (await StatutCandidat.find({ ...filters, ine_apprenant: { $nin: [null, ""] } }).distinct("ine_apprenant"))
    .length;

const getNbStatutsCandidatsSansIne = async (filters = {}) =>
  await (await StatutCandidat.find({ ...filters, ine_apprenant: { $in: [null, ""] } })).length;

const getAllNbStatutsCandidatsParUais = async (filters = {}) =>
  (
    await StatutCandidat.aggregate([{ $match: filters }, { $group: { _id: "$uai_etablissement", count: { $sum: 1 } } }])
  ).map(({ _id, count }) => ({
    uai_etablissement: _id,
    nbStatutsCandidats: count,
  }));

const getNbStatutsCandidatsParUais = async (filters = {}) =>
  (
    await StatutCandidat.aggregate([{ $match: filters }, { $group: { _id: "$uai_etablissement", count: { $sum: 1 } } }])
  ).map(({ _id, count }) => ({
    uai_etablissement: _id,
    nbStatutsCandidats: count,
  }));

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

const getDistinctCandidatsWithoutIneMultiUais = async (filters = {}) =>
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
        uais: { $addToSet: "$uai_etablissement" },
      },
    },
    { $match: { "uais.1": { $exists: true } } },
  ]);

const getDistinctCandidatsWithIneWithMultiUais = async (filters = {}) =>
  await StatutCandidat.aggregate([
    { $match: { ...filters, ine_apprenant: { $nin: [null, ""] } } },
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

const getDistinctCandidatsWithoutIneMultiCfds = async (filters = {}) =>
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
        idsFormations: { $addToSet: "$id_formation" },
      },
    },
    { $match: { "idsFormations.1": { $exists: true } } },
  ]);

const getDistinctCandidatsWithIneWithMultiCfds = async (filters = {}) =>
  await StatutCandidat.aggregate([
    { $match: { ...filters, ine_apprenant: { $nin: [null, ""] } } },
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

const getNbDistinctCandidatsWithoutHistory = async (filters = {}) =>
  (
    await StatutCandidat.aggregate([
      { $match: { ...filters, historique_statut_apprenant: { $size: 1 } } },
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

const getNbDistinctCandidatsWithChangingStatutProspectInscrit = async (filters = {}) =>
  (
    await StatutCandidat.find({
      ...filters,
      $where: function () {
        return [1, 2].every((val) =>
          this.historique_statut_apprenant
            .sort((a, b) => a.position_statut > b.position_statut)
            .map((item) => item.valeur_statut)
            .includes(val)
        );
      },
    })
  ).length;

const getNbDistinctCandidatsWithChangingStatutProspectApprenti = async (filters = {}) =>
  (
    await StatutCandidat.find({
      ...filters,
      $where: function () {
        return [1, 3].every((val) =>
          this.historique_statut_apprenant
            .sort((a, b) => a.position_statut > b.position_statut)
            .map((item) => item.valeur_statut)
            .includes(val)
        );
      },
    })
  ).length;

const getNbDistinctCandidatsWithChangingStatutProspectAbandon = async (filters = {}) =>
  (
    await StatutCandidat.find({
      ...filters,
      $where: function () {
        return [1, 0].every((val) =>
          this.historique_statut_apprenant
            .sort((a, b) => a.position_statut > b.position_statut)
            .map((item) => item.valeur_statut)
            .includes(val)
        );
      },
    })
  ).length;

const getNbDistinctCfas = async () => {
  const distinctUais = await StatutCandidat.distinct("uai_etablissement");
  return distinctUais.length;
};
