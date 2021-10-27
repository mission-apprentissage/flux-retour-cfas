const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");
const arg = require("arg");
const { jobNames } = require("../../../common/model/constants/index");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { DuplicateEvent } = require("../../../common/model");

let args = [];

/**
 * Ce script permet de créer un export contenant tous les doublons des statuts identifiés
 * Ce script prends plusieurs paramètres en argument :
 * --duplicatesTypeCode : types de doublons à identifier : 1/2/3/4 cf duplicatesTypesCodes
 * --allowDiskUse : si mode allowDiskUse actif, permet d'utiliser l'espace disque pour les requetes d'aggregation mongoDb
 */
runScript(async ({ statutsCandidats }) => {
  args = arg(
    {
      "--duplicatesTypeCode": Number,
      "--allowDiskUse": Boolean,
    },
    { argv: process.argv.slice(2) }
  );

  if (!args["--duplicatesTypeCode"])
    throw new Error("missing required argument: --duplicatesTypeCode  (should be in [1/2/3/4])");

  // Handle allowDiskUseMode param
  const allowDiskUseMode = args["--allowDiskUse"] ? true : false;

  await identifyAll(statutsCandidats, args["--duplicatesTypeCode"], allowDiskUseMode);

  logger.info("Job Ended !");
}, jobNames.identifyStatutsCandidatsDuplicates);

/**
 * Identifie tous les doublons de type duplicatesTypesCode de la base de donnée
 * Boucle sur toutes les régions
 * @param {*} statutsCandidats
 * @param {*} duplicatesTypesCode
 */
const identifyAll = async (statutsCandidats, duplicatesTypesCode, allowDiskUseMode) => {
  const filterQuery = {};
  const allDuplicates = await statutsCandidats.getDuplicatesList(duplicatesTypesCode, filterQuery, allowDiskUseMode);
  const timestamp = Date.now();

  // Log duplicates list
  await asyncForEach(allDuplicates, async (duplicate) => {
    await new DuplicateEvent({
      jobType: "identify-duplicates",
      filters: filterQuery,
      args,
      jobTimestamp: timestamp,
      ...duplicate,
    }).save();
  });
};
