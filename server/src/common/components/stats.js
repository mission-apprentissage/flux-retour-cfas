const { StatutCandidat } = require("../../common/model");
const { codesStatutsCandidats } = require("../../common/model/constants");

module.exports = async () => {
  return {
    getAllStats,
    getNbStatutsCandidatsTotal,
    getNbStatutsCandidats,
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

const getAllStats = async () => {
  return {
    nbStatutsCandidats: await getNbStatutsCandidatsTotal(),
    nbStatutsCandidatsMisAJour: await getNbStatutsCandidatsUpdatedTotal(),
    nbStatutsProspect: await getNbStatutsCandidats(codesStatutsCandidats.prospect),
    nbStatutsInscrits: await getNbStatutsCandidats(codesStatutsCandidats.inscrit),
    nbStatutsApprentis: await getNbStatutsCandidats(codesStatutsCandidats.apprenti),
    nbStatutsAbandon: await getNbStatutsCandidats(codesStatutsCandidats.abandon),
    nbDistinctCandidatsWithIne: await getNbDistinctCandidatsWithIne(),
    nbDistinctCandidatsWithoutIne: await getNbDistinctCandidatsWithoutIne(),
    nbStatutsSansIne: await getNbStatutsCandidatsSansIne(),
    nbStatutsCandidatsParUais: await getAllNbStatutsCandidatsParUais(),
    nbStatutsCandidatsProspectsParUais: await getNbStatutsCandidatsParUais(codesStatutsCandidats.prospect),
    nbStatutsCandidatsInscritsParUais: await getNbStatutsCandidatsParUais(codesStatutsCandidats.inscrit),
    nbStatutsCandidatsApprentisParUais: await getNbStatutsCandidatsParUais(codesStatutsCandidats.apprenti),
    nbStatutsCandidatsAbandonParUais: await getNbStatutsCandidatsParUais(codesStatutsCandidats.abandon),
    candidatsMultiUaisWithoutIne: await getDistinctCandidatsWithoutIneMultiUais(),
    candidatsMultiUaisWithIne: await getDistinctCandidatsWithIneWithMultiUais(),

    nbCandidatsMultiUais:
      (await getDistinctCandidatsWithoutIneMultiUais()).length +
      (await getDistinctCandidatsWithIneWithMultiUais()).length,

    candidatsMultiCfdsWithoutIne: await getDistinctCandidatsWithoutIneMultiCfds(),
    candidatsMultiCfdsWithIne: await getDistinctCandidatsWithIneWithMultiCfds(),

    nbCandidatsMultiCfds:
      (await getDistinctCandidatsWithoutIneMultiCfds()).length +
      (await getDistinctCandidatsWithIneWithMultiCfds()).length,

    nbStatutsWithoutHistory: await getNbStatutsCandidatsWithoutHistory(),
    nbDistinctCandidatsWithoutStatutHistory: await getNbDistinctCandidatsWithoutHistory(),

    nbDistinctCandidatsWithStatutHistory1: await getNbDistinctCandidatsWithHistoryNbItems(2),
    nbDistinctCandidatsWithStatutHistory2: await getNbDistinctCandidatsWithHistoryNbItems(3),
    nbDistinctCandidatsWithStatutHistory3: await getNbDistinctCandidatsWithHistoryNbItems(4),

    nbDistinctCandidatsWithChangingStatutProspectInscrit: await getNbDistinctCandidatsWithChangingStatutProspectInscrit(),
    nbDistinctCandidatsWithChangingStatutProspectApprenti: await getNbDistinctCandidatsWithChangingStatutProspectApprenti(),
    nbDistinctCandidatsWithChangingStatutProspectAbandon: await getNbDistinctCandidatsWithChangingStatutProspectAbandon(),
  };
};

const getNbStatutsCandidatsTotal = async () => await StatutCandidat.countDocuments({});

const getNbStatutsCandidatsUpdatedTotal = async () =>
  await StatutCandidat.countDocuments({ updated_at: { $ne: null } });

const getNbStatutsCandidats = async (statutCandidat) =>
  await StatutCandidat.countDocuments({
    statut_apprenant: statutCandidat,
  });

const getNbDistinctCandidatsWithIne = async () =>
  await (await StatutCandidat.find({ ine_apprenant: { $nin: [null, ""] } }).distinct("ine_apprenant")).length;

const getNbStatutsCandidatsSansIne = async () =>
  await (await StatutCandidat.find({ ine_apprenant: { $in: [null, ""] } })).length;

const getAllNbStatutsCandidatsParUais = async () =>
  (await StatutCandidat.aggregate([{ $group: { _id: "$uai_etablissement", count: { $sum: 1 } } }])).map(
    ({ _id, count }) => ({
      uai_etablissement: _id,
      nbStatutsCandidats: count,
    })
  );

const getNbStatutsCandidatsParUais = async (statutCandidat) =>
  (
    await StatutCandidat.aggregate([
      { $match: { statut_apprenant: statutCandidat } },
      { $group: { _id: "$uai_etablissement", count: { $sum: 1 } } },
    ])
  ).map(({ _id, count }) => ({
    uai_etablissement: _id,
    nbStatutsCandidats: count,
  }));

const getNbDistinctCandidatsWithoutIne = async () =>
  (
    await StatutCandidat.aggregate([
      { $match: { ine_apprenant: { $in: [null, ""] } } },
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

const getDistinctCandidatsWithoutIneMultiUais = async () =>
  await StatutCandidat.aggregate([
    { $match: { ine_apprenant: { $in: [null, ""] } } },
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

const getDistinctCandidatsWithIneWithMultiUais = async () =>
  await StatutCandidat.aggregate([
    { $match: { ine_apprenant: { $nin: [null, ""] } } },
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

const getDistinctCandidatsWithoutIneMultiCfds = async () =>
  await StatutCandidat.aggregate([
    { $match: { ine_apprenant: { $in: [null, ""] } } },
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

const getDistinctCandidatsWithIneWithMultiCfds = async () =>
  await StatutCandidat.aggregate([
    { $match: { ine_apprenant: { $nin: [null, ""] } } },
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

const getNbStatutsCandidatsWithoutHistory = async () =>
  await StatutCandidat.countDocuments({ historique_statut_apprenant: { $size: 1 } });

const getNbDistinctCandidatsWithoutHistory = async () =>
  (
    await StatutCandidat.aggregate([
      { $match: { historique_statut_apprenant: { $size: 1 } } },
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

const getNbDistinctCandidatsWithHistoryNbItems = async (nbChangements) =>
  (
    await StatutCandidat.aggregate([
      { $match: { historique_statut_apprenant: { $size: nbChangements } } },
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

const getNbDistinctCandidatsWithChangingStatutProspectInscrit = async () =>
  (
    await StatutCandidat.find({
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

const getNbDistinctCandidatsWithChangingStatutProspectApprenti = async () =>
  (
    await StatutCandidat.find({
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

const getNbDistinctCandidatsWithChangingStatutProspectAbandon = async () =>
  (
    await StatutCandidat.find({
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
