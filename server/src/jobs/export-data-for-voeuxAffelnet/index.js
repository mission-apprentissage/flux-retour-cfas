const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { StatutCandidat } = require("../../common/model");
const { CroisementVoeuxAffelnet } = require("../../common/model");

/**
 * Ce script permet de créer un export les data vers les voeux Affelnet
 */

runScript(async () => {
  logger.info(
    "Récupère tous les couples ine_apprenant - statut_apprenant existants pour les statuts avec sirets valides"
  );

  const allIneStatusCouples = await StatutCandidat.aggregate([
    { $match: { siret_etablissement_valid: true } },
    { $group: { _id: { ine: "$ine_apprenant", status: "$statut_apprenant" } } },
    {
      $project: {
        _id: 0,
        ine: "$_id.ine",
        status: "$_id.status",
      },
    },
  ]);
  await CroisementVoeuxAffelnet.collection.drop();
  for (let index = 0; index < allIneStatusCouples.length; index++) {
    const element = allIneStatusCouples[index];
    await new CroisementVoeuxAffelnet({
      ine_apprenant: element.ine,
      status_apprenant: element.status,
    }).save();
  }

  logger.info("End ExportData - VoeuxAffelnet Retrieving Job");
}, "export-data-for-voeuxAffelnet");
