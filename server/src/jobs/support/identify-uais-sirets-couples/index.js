const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");
const path = require("path");
const { toCsv } = require("../../../common/utils/exporterUtils");
const { jobNames } = require("../../../common/model/constants/index");
const { StatutCandidat } = require("../../../common/model");

/**
 * Ce script permet de créer un export contenant les couples UAIs SIRETS
 */
runScript(async () => {
  logger.info(`Identifying UAI-Sirets couples`);
  await identifyUaisSiretsCouples();
  logger.info("Ended !");
}, jobNames.identifyUaisSiretsCouples);

/**
 * Identifying uais sirets couples
 */
const identifyUaisSiretsCouples = async () => {
  // Gets all uai-sirets couples valid
  const uaiSiretsCouples = await StatutCandidat.aggregate([
    {
      $match: {
        uai_etablissement_valid: true,
        siret_etablissement_valid: true,
      },
    },
    {
      $group: {
        _id: { uai: "$uai_etablissement", siret: "$siret_etablissement" },
      },
    },
    { $project: { _id: 0, uai: "$_id.uai", siret: "$_id.siret" } },
    { $sort: { uai: 1 } },
  ]);

  const exportFileName = `tdb_uaisSiretsCouples_${Date.now()}`;

  // Export
  await toCsv(uaiSiretsCouples, path.join(__dirname, `/output/${exportFileName}.csv`), { delimiter: ";" });
};
