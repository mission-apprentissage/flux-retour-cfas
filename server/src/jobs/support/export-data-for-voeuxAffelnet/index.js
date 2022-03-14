const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");
const { DossierApprenantModel } = require("../../../common/model");
const { CroisementVoeuxAffelnetModel } = require("../../../common/model");
const cliProgress = require("cli-progress");
const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { jobNames } = require("../../../common/constants/jobsConstants");

/**
 * Ce script permet de créer un export les data vers les voeux Affelnet
 */

runScript(async () => {
  logger.info("Récupère les statuts avec INE et sirets valides pour export vers Affelnet");

  const allIneDataForAffelnet = await DossierApprenantModel.aggregate([
    { $match: { siret_etablissement_valid: true, ine_apprenant: { $ne: "" } } },
    {
      $group: {
        _id: {
          ine: "$ine_apprenant",
          statut: "$statut_apprenant",
          uai: "$uai_etablissement",
          siret: "$siret_etablissement",
          cfd: "$formation_cfd",
          annee_formation: "$annee_formation",
          periode_formation: "$periode_formation",
          annee_scolaire: "$annee_scolaire",
        },
      },
    },
    {
      $project: {
        _id: 0,
        ine: "$_id.ine",
        statut: "$_id.statut",
        uai: "$_id.uai",
        siret: "$_id.siret",
        cfd: "$_id.cfd",
        annee_formation: "$_id.annee_formation",
        periode_formation: "$_id.periode_formation",
        annee_scolaire: "$_id.annee_scolaire",
      },
    },
  ]);

  logger.info(`Clearing existing CroisementVoeuxAffelnet collection ...`);
  await CroisementVoeuxAffelnetModel.deleteMany({});

  loadingBar.start(allIneDataForAffelnet.length, 0);
  await asyncForEach(allIneDataForAffelnet, async (currentAffelnetExportData) => {
    loadingBar.increment();
    await new CroisementVoeuxAffelnetModel({
      ine_apprenant: currentAffelnetExportData.ine,
      statut_apprenant: currentAffelnetExportData.statut,
      uai_etablissement: currentAffelnetExportData.uai,
      siret_etablissement: currentAffelnetExportData.siret,
      formation_cfd: currentAffelnetExportData.cfd,
      annee_formation: currentAffelnetExportData.annee_formation,
      periode_formation: currentAffelnetExportData.periode_formation,
      annee_scolaire: currentAffelnetExportData.annee_scolaire,
    }).save();
  });

  loadingBar.stop();
  logger.info("End ExportData - VoeuxAffelnet Retrieving Job");
}, jobNames.exportDataForVoeuxAffelnet);
