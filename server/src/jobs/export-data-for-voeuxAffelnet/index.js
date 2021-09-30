const fs = require("fs-extra");
// const path = require("path");
// const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { StatutCandidat } = require("../../common/model");
const ovhStorageManager = require("../../common/utils/ovhStorageManager");
// const { toDataCsv } = require("../../common/utils/exporterUtils");
/**
 * Ce script permet de créer un export les data vers les voeux Affelnet
 */

runScript(async () => {
  // Récupère tous les couples ine_apprenant - statut_apprenant existants pour les statuts avec sirets valides
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
  if (!fs.existsSync(allIneStatusCouples)) {
    const storageMgr = await ovhStorageManager();
    // const allIneStatusCouplesCsv = await toDataCsv(allIneStatusCouples);
    await storageMgr.uploadFileTo("./text.txt", "/export-affelnet/monFichierMytho.txt");
  } else {
    // logger.info(`File ${allIneStatusCouples} already in data folder.`);
  }
}, "export-data-for-voeuxAffelnet");
