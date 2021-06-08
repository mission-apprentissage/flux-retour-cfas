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
 * --mode : forAll / forUai
 *   permets d'identifier les doublons dans toute la BDD / pour une région / pour un UAI
 * --uai : si mode forUai actif, permet de préciser l'uai souhaité
 * --allowDiskUse : si mode allowDiskUse actif, permet d'utiliser l'espace disque pour les requetes d'aggregation mongoDb
 */
runScript(async ({ statutsCandidats }) => {
  args = arg(
    {
      "--duplicatesTypeCode": Number,
      "--mode": String,
      "--uai": String,
      "--allowDiskUse": Boolean,
    },
    { argv: process.argv.slice(2) }
  );

  if (!args["--duplicatesTypeCode"])
    throw new Error("missing required argument: --duplicatesTypeCode  (should be in [1/2/3/4])");

  if (!args["--mode"])
    throw new Error("missing required argument: --mode  (should be in [forAll / forRegion / forUai])");

  // Handle allowDiskUseMode param
  const allowDiskUseMode = args["--allowDiskUse"] ? true : false;

  switch (args["--mode"]) {
    case "forAll":
      await identifyAll(statutsCandidats, args["--duplicatesTypeCode"], allowDiskUseMode);
      break;

    case "forUai":
      if (!args["--uai"]) throw new Error("missing required argument: --uai");
      await identifyForUai(statutsCandidats, args["--duplicatesTypeCode"], args["--uai"], allowDiskUseMode);
      break;

    default:
      throw new Error("bad argument: --mode (should be in [forAll / forRegion / forUai])");
  }

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

/**
 * Identifie tous les doublons de type duplicatesTypesCode pour un uai
 * @param {*} statutsCandidats
 * @param {*} duplicatesTypesCode
 * @param {*} uai
 */
const identifyForUai = async (statutsCandidats, duplicatesTypesCode, uai, allowDiskUseMode) => {
  logger.info(`Identifying all statuts duplicates for uai : ${uai}`);

  const filterQuery = { uai_etablissement: uai };

  const duplicatesForUai = await statutsCandidats.getDuplicatesList(duplicatesTypesCode, filterQuery, allowDiskUseMode);
  const timestamp = Date.now();

  // Log duplicates list
  await asyncForEach(duplicatesForUai, async (duplicate) => {
    await new DuplicateEvent({
      jobType: "identify-duplicates",
      filters: filterQuery,
      args: args,
      jobTimestamp: timestamp,
      ...duplicate,
    }).save();
  });
};
