const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");
const path = require("path");
const { toCsv, toXlsx } = require("../../../common/utils/exporterUtils");
const { jobNames } = require("../../../common/constants/jobsConstants");
const { StatutCandidatModel } = require("../../../common/model");

/**
 * Ce script permet de créer un export contenant les CFAS sans SIRET
 */
runScript(async () => {
  logger.info(`Identifying UAI-Sirets couples with duplicates`);
  await identifyMultipleSirets();
  await identifyMultipleUais();
  logger.info("Ended !");
}, jobNames.identifyUaisSiretsDuplicates);

/**
 * Identifying multiple sirets for uais
 */
const identifyMultipleSirets = async () => {
  // Gets all uai-sirets couples valid
  const uaiSiretsCouples = await StatutCandidatModel.aggregate([
    {
      $match: {
        siret_etablissement_valid: true,
      },
    },
    {
      $group: {
        _id: "$uai_etablissement",
        sirets: { $addToSet: "$siret_etablissement" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Gets multiple sirets formatted for export
  const multipleSirets = uaiSiretsCouples
    .filter((item) => item.sirets.length > 1)
    .map((item) => ({
      uai: item._id,
      sirets: JSON.stringify(item.sirets),
    }));

  // Export
  await toXlsx(multipleSirets, path.join(__dirname, `/output/multipleSirets_${Date.now()}.xlsx`));
  await toCsv(multipleSirets, path.join(__dirname, `/output/multipleSirets_${Date.now()}.csv`));
};

/**
 * Identifying multiple uais for sirets
 */
const identifyMultipleUais = async () => {
  // Gets all sirets-uais couples valid
  const siretsUaisCouples = await StatutCandidatModel.aggregate([
    {
      $match: {
        siret_etablissement_valid: true,
      },
    },
    {
      $group: {
        _id: "$siret_etablissement",
        uais: { $addToSet: "$uai_etablissement" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Gets multiple sirets formatted for export
  const multipleUais = siretsUaisCouples
    .filter((item) => item.uais.length > 1)
    .map((item) => ({
      siret: item._id,
      uais: JSON.stringify(item.uais),
    }));

  // Export
  await toXlsx(multipleUais, path.join(__dirname, `/output/multipleUais_${Date.now()}.xlsx`));
  await toCsv(multipleUais, path.join(__dirname, `/output/multipleUais_${Date.now()}.csv`));
};
