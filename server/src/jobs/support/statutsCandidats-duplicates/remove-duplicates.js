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
 * --duplicatesTypeCode : types de doublons à supprimer : 1/2/3/4 cf duplicatesTypesCodes
 * --allowDiskUse : si mode allowDiskUse actif, permet d'utiliser l'espace disque pour les requetes d'aggregation mongoDb
 */
runScript(async ({ statutsCandidats, db }) => {
  mongo = db;
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

  await removeAll(statutsCandidats, args["--duplicatesTypeCode"], allowDiskUseMode);

  logger.info("Job Ended !");
}, jobNames.removeStatutsCandidatsDuplicates);

/**
 * Supprime les doublons de type duplicatesTypesCode pour toute la bdd
 * @param {*} statutsCandidats
 * @param {*} duplicatesTypesCode
 */
const removeAll = async (statutsCandidats, duplicatesTypesCode, allowDiskUseMode) => {
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
  const duplicatesGroups = await statutsCandidats.getDuplicatesList(duplicatesTypesCode, filters, allowDiskUseMode);
  const duplicatesRemoved = [];

  if (duplicatesGroups) {
    await asyncForEach(duplicatesGroups, async (duplicateGroup) => {
      logger.info(
        `Removing ${duplicateGroup.duplicatesCount} duplicates with common data : ${duplicateGroup.commonData}`
      );
      const removalInfo = await removeDuplicates(duplicateGroup);
      duplicatesRemoved.push(removalInfo);
    });
  }
  return duplicatesRemoved;
};

/**
 * Supprime les mauvais doublons pour la liste des doublons d'uai
 * @param {*} idsToRemove
 */
const removeDuplicates = async (duplicatesGroups) => {
  const statutsFound = [];

  await asyncForEach(duplicatesGroups.duplicatesIds, async (duplicateId) => {
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
    ...duplicatesGroups,
    data: {
      keptStatutId: mostRecentStatut._id,
      removedIds: statutsToRemove.map((statut) => statut._id),
      removedCount: statutsToRemove.length,
    },
  };
};
