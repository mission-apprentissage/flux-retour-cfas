const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { StatutCandidat } = require("../../common/model");
const { CroisementVoeuxAffelnet } = require("../../common/model");
const cliProgress = require("cli-progress");
const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/model/constants");

/**
 * Ce script permet de créer un export les data vers les voeux Affelnet
 */

runScript(async () => {
  logger.info(
    "Récupère tous les couples ine_apprenant - statut_apprenant existants pour les statuts avec sirets valides"
  );

  const allIneStatusCouples = await StatutCandidat.aggregate([
    { $match: { siret_etablissement_valid: true } },
    { $group: { _id: { ine: "$ine_apprenant", statut: "$statut_apprenant" } } },
    {
      $project: {
        _id: 0,
        ine: "$_id.ine",
        statut: "$_id.statut",
      },
    },
  ]);
  logger.info(`Clearing existing CroisementVoeuxAffelnet collection ...`);
  await CroisementVoeuxAffelnet.deleteMany({});
  loadingBar.start(allIneStatusCouples.length, 0);
  await asyncForEach(allIneStatusCouples, async (currentDecaData) => {
    loadingBar.increment();
    await new CroisementVoeuxAffelnet({
      ine_apprenant: currentDecaData.ine,
      statut_apprenant: currentDecaData.statut,
    }).save();
  });
  loadingBar.stop();
  logger.info("End ExportData - VoeuxAffelnet Retrieving Job");
}, jobNames.exportDataForVoeuxAffelnet);
