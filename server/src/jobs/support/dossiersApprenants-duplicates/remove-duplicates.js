import logger from '../../../common/logger';
import arg from 'arg';
import { runScript } from '../../scriptWrapper';
import { asyncForEach } from '../../../common/utils/asyncUtils';
import sortBy from 'lodash.sortby';
import omit from 'lodash.omit';
import { dossiersApprenantsDb, duplicatesEventsDb } from '../../../common/model/collections';

let args = [];
let mongo;

/**
 * Ce script permet de nettoyer les doublons des statuts identifiés
 * Ce script prends plusieurs paramètres en argument :
 * --duplicatesTypeCode : types de doublons à supprimer : 1/2/3/4 cf DUPLICATE_TYPE_CODES
 * --duplicatesWithNoUpdate : supprime uniquement les doublons sans changement de statut_apprenant
 * --allowDiskUse : si mode allowDiskUse actif, permet d'utiliser l'espace disque pour les requetes d'aggregation mongoDb
 * --dry : will run but won't delete any data
 */
runScript(async ({ dossiersApprenants, db }) => {
  mongo = db;
  args = arg(
    {
      "--duplicatesTypeCode": Number,
      "--allowDiskUse": Boolean,
      "--duplicatesWithNoUpdate": Boolean,
      "--dry": Boolean,
    },
    { argv: process.argv.slice(2) }
  );

  if (!args["--duplicatesTypeCode"])
    throw new Error("missing required argument: --duplicatesTypeCode  (should be in [1/2/3/4])");

  // arguments
  const duplicatesTypeCode = args["--duplicatesTypeCode"];
  const allowDiskUse = args["--allowDiskUse"] ? true : false;
  const duplicatesWithNoUpdate = args["--duplicatesWithNoUpdate"] ? true : false;
  const dry = args["--dry"] ? true : false;

  const filterQuery = {};
  const jobTimestamp = Date.now();

  const duplicatesGroups = await dossiersApprenants.getDuplicatesList(duplicatesTypeCode, filterQuery, {
    allowDiskUse,
    duplicatesWithNoUpdate,
  });
  const duplicatesRemoved = [];

  logger.info(`Found ${duplicatesGroups.length} duplicates groups`);

  if (dry) {
    logger.info("dry argument passed, terminating without deleting any data");
    return;
  }
  if (duplicatesGroups) {
    await asyncForEach(duplicatesGroups, async (duplicateGroup) => {
      const removalInfo = await removeDuplicates(duplicateGroup);
      duplicatesRemoved.push(removalInfo);
    });
  }

  await asyncForEach(duplicatesRemoved, async (duplicate) => {
    await duplicatesEventsDb.insertOne({
      jobType: "remove-duplicates",
      args,
      filters: filterQuery,
      jobTimestamp,
      created_at: new Date(),
      ...duplicate,
    });
  });
  logger.info(`Removed ${duplicatesRemoved.length} dossiersApprenants in db`);

  logger.info("Job Ended !");
}, "remove-duplicates");

/* Will keep the oldest statut in duplicates group, delete the others and store them in a specific collection */
const removeDuplicates = async (duplicatesGroup) => {
  const statutsFound = [];

  await asyncForEach(duplicatesGroup.duplicatesIds, async (duplicateId) => {
    statutsFound.push(await dossiersApprenantsDb().findOne({ _id: duplicateId }));
  });

  // will sort by created_at, last item is the one with the most recent date
  const sortedByCreatedAt = sortBy(statutsFound, "created_at");
  // get the newest statut first
  const [newestStatut, ...statutsToRemove] = sortedByCreatedAt.slice().reverse();

  // Remove duplicates
  await asyncForEach(statutsToRemove, async (toRemove) => {
    try {
      await dossiersApprenantsDb().deleteOne({ _id: toRemove._id });
      // archive the deleted duplicate in dedicated collection
      await mongo
        .collection("dossiersApprenantsDuplicatesRemoved")
        .insertOne({ ...omit(toRemove, "_id"), original_id: toRemove._id });
    } catch (err) {
      logger.error(`Could not delete DossierApprenant with _id ${toRemove._id}`);
    }
  });

  return {
    ...duplicatesGroup,
    data: {
      keptStatutId: newestStatut._id,
      removedIds: statutsToRemove.map((statut) => statut._id),
      removedCount: statutsToRemove.length,
    },
  };
};
