const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");
const arg = require("arg");
const { jobNames } = require("../../../common/model/constants/index");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { StatutCandidat, DuplicateEvent } = require("../../../common/model");

let args = [];

/**
 * Ce script permet de créer un export contenant tous les doublons des statuts identifiés
 * Ce script prends plusieurs paramètres en argument :
 * --duplicatesTypeCode : types de doublons à identifier : 1/2/3/4 cf duplicatesTypesCodes
 * --mode : forAll / forRegion / forUai
 *   permets d'identifier les doublons dans toute la BDD / pour une région / pour un UAI
 * --regionCode : si mode forRegion actif, permet de préciser le codeRegion souhaité
 * --uai : si mode forUai actif, permet de préciser l'uai souhaité
 * --allowDiskUse : si mode allowDiskUse actif, permet d'utiliser l'espace disque pour les requetes d'aggregation mongoDb
 */
runScript(async ({ statutsCandidats }) => {
  args = arg(
    {
      "--duplicatesTypeCode": Number,
      "--mode": String,
      "--regionCode": String,
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

    case "forRegion":
      if (!args["--regionCode"]) throw new Error("missing required argument: --regionCode");
      await identifyForRegion(statutsCandidats, args["--duplicatesTypeCode"], args["--regionCode"], allowDiskUseMode);
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
  const allRegionsInStatutsCandidats = await StatutCandidat.distinct("etablissement_num_region");
  await asyncForEach(allRegionsInStatutsCandidats, async (currentCodeRegion) => {
    await identifyForRegion(statutsCandidats, duplicatesTypesCode, currentCodeRegion, allowDiskUseMode);
  });
};

/**
 * Identifie tous les doublons de type duplicatesTypesCode pour une région
 * @param {*} statutsCandidats
 * @param {*} duplicatesTypesCode
 * @param {*} codeRegion
 * @returns
 */
const identifyForRegion = async (statutsCandidats, duplicatesTypesCode, codeRegion, allowDiskUseMode) => {
  logger.info(`Identifying all statuts duplicates for codeRegion : ${codeRegion}`);

  const filterQuery = { etablissement_num_region: codeRegion };

  const duplicatesForRegion = await statutsCandidats.getDuplicatesList(
    duplicatesTypesCode,
    filterQuery,
    allowDiskUseMode
  );
  const timestamp = Date.now();

  // Log duplicates list
  await asyncForEach(duplicatesForRegion, async (duplicate) => {
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
