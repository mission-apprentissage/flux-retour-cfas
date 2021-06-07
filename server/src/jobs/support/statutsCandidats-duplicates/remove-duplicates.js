const logger = require("../../../common/logger");
const arg = require("arg");
const { runScript } = require("../../scriptWrapper");
const { jobNames } = require("../../../common/model/constants/index");
const { StatutCandidat, DuplicateEvent } = require("../../../common/model");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const sortBy = require("lodash.sortby");
const omit = require("lodash.omit");

let args = [];
let mongo;

/**
 * Ce script permet de nettoyer les doublons des statuts identifiés
 * Ce script prends plusieurs paramètres en argument :
 * --duplicatesTypeCode : types de doublons à supprimer : 1/2/3/4 cf duplicatesTypesCodes
 * --mode : forAll / forUai
 *   permets de nettoyer les doublons dans toute la BDD / pour une région / pour un UAI
 * --regionCode : si mode forRegion actif, permet de préciser le codeRegion souhaité
 * --uai : si mode forUai actif, permet de préciser l'uai souhaité
 * --allowDiskUse : si mode allowDiskUse actif, permet d'utiliser l'espace disque pour les requetes d'aggregation mongoDb
 */
runScript(async ({ statutsCandidats, db }) => {
  mongo = db;
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
      await removeAll(statutsCandidats, args["--duplicatesTypeCode"], allowDiskUseMode);
      break;

    case "forUai":
      if (!args["--uai"]) throw new Error("missing required argument: --uai");
      await removeAllDuplicatesForUai(statutsCandidats, args["--uai"], args["--duplicatesTypeCode"], allowDiskUseMode);
      break;

    default:
      throw new Error("bad argument: --mode (should be in [forAll / forRegion / forUai])");
  }

  logger.info("Job Ended !");
}, jobNames.removeStatutsCandidatsDuplicates);

/**
 * Supprime les doublons de type duplicatesTypesCode pour toute la bdd
 * @param {*} statutsCandidats
 * @param {*} duplicatesTypesCode
 */
const removeAll = async (statutsCandidats, duplicatesTypesCode, allowDiskUseMode) => {
  logger.info(`Removing all statuts duplicates`);

  const filterQuery = {};
  const jobTimestamp = Date.now();

  const duplicatesRemoved = await removeStatutsCandidatsDuplicatesForFilters(
    statutsCandidats,
    duplicatesTypesCode,
    filterQuery,
    allowDiskUseMode
  );

  await asyncForEach(duplicatesRemoved, async (duplicate) => {
    await new DuplicateEvent({
      jobType: "remove-duplicates",
      args,
      filters: filterQuery,
      jobTimestamp,
      ...duplicate,
    }).save();
  });
};

/**
 * Supprime les doublons de type duplicatesTypesCode pour un uai
 * @param {*} statutsCandidats
 * @param {*} uai
 * @param {*} duplicatesTypesCode
 */
const removeAllDuplicatesForUai = async (statutsCandidats, uai, duplicatesTypesCode, allowDiskUseMode) => {
  logger.info(`Removing all statuts duplicates for uai : ${uai}`);

  const filterQuery = { uai_etablissement: uai };
  const jobTimestamp = Date.now();

  const duplicatesRemoved = await removeStatutsCandidatsDuplicatesForFilters(
    statutsCandidats,
    duplicatesTypesCode,
    filterQuery,
    allowDiskUseMode
  );

  await asyncForEach(duplicatesRemoved, async (duplicate) => {
    await new DuplicateEvent({
      jobType: "remove-duplicates",
      args,
      filters: filterQuery,
      jobTimestamp,
      ...duplicate,
    }).save();
  });
};

/**
 * Fonction de suppression de tous les doublons de type duplicatesTypesCode pour les filtres fournis en entrée
 * Retourne une liste regoupée par UAIs
 * @param {*} statutsCandidats
 * @param {*} duplicatesTypesCode
 * @param {*} filters
 * @returns
 */
const removeStatutsCandidatsDuplicatesForFilters = async (
  statutsCandidats,
  duplicatesTypesCode,
  filters = {},
  allowDiskUseMode
) => {
  const duplicatesForType = await statutsCandidats.getDuplicatesList(duplicatesTypesCode, filters, allowDiskUseMode);
  const duplicatesRemoved = [];

  if (duplicatesForType) {
    await asyncForEach(duplicatesForType, async (duplicateItem) => {
      logger.info(
        `Removing ${duplicateItem.duplicatesCount} duplicates with common data : ${duplicateItem.commonData}`
      );
      const removalInfo = await removeDuplicates(duplicateItem);
      duplicatesRemoved.push(removalInfo);
    });
  }
  return duplicatesRemoved;
};

/**
 * Supprime les mauvais doublons pour la liste des doublons d'uai
 * @param {*} idsToRemove
 */
const removeDuplicates = async (duplicatesForType) => {
  const statutsFound = [];

  await asyncForEach(duplicatesForType.duplicatesIds, async (duplicateId) => {
    statutsFound.push(await StatutCandidat.findById(duplicateId).lean());
  });

  // will sort by created_at, last item is the one with the most recent date
  const sortedByCreatedAt = sortBy(statutsFound, "created_at");
  // reverse the result to get the most recent statut first
  const [mostRecentStatut, ...statutsToRemove] = sortedByCreatedAt.slice().reverse();

  // Remove duplicates
  await asyncForEach(statutsToRemove, async (toRemove) => {
    try {
      await StatutCandidat.findByIdAndDelete(toRemove._id);
      // archive the deleted duplicate in dedicated collection
      await mongo
        .collection("statutsCandidatsDuplicatesRemoved")
        .insertOne({ ...omit(toRemove, "_id"), original_id: toRemove._id });
    } catch (err) {
      logger.error(`Could not delete statutCandidat with _id ${toRemove._id}`);
    }
  });

  return {
    ...duplicatesForType,
    data: {
      keptStatutId: mostRecentStatut._id,
      removedIds: statutsToRemove.map((statut) => statut._id),
      removedCount: statutsToRemove.length,
    },
  };
};
