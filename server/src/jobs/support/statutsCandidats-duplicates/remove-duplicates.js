const logger = require("../../../common/logger");
const arg = require("arg");
const { runScript } = require("../../scriptWrapper");
const { jobNames } = require("../../../common/model/constants/index");
const { StatutCandidat } = require("../../../common/model");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const sortBy = require("lodash.sortby");

let args = [];

/**
 * Ce script permet de nettoyer les doublons des statuts identifiés
 * Ce script prends plusieurs paramètres en argument :
 * --duplicatesTypeCode : types de doublons à supprimer : 1/2/3/4 cf duplicatesTypesCodes
 * --mode : forAll / forRegion / forUai
 *   permets de nettoyer les doublons dans toute la BDD / pour une région / pour un UAI
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
      await removeAll(statutsCandidats, args["--duplicatesTypeCode"], allowDiskUseMode);
      break;

    case "forRegion":
      if (!args["--regionCode"]) throw new Error("missing required argument: --regionCode");
      await removeAllDuplicatesForRegion(
        statutsCandidats,
        args["--regionCode"],
        args["--duplicatesTypeCode"],
        allowDiskUseMode
      );
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
  const allRegionsInStatutsCandidats = await StatutCandidat.distinct("etablissement_num_region");
  await asyncForEach(allRegionsInStatutsCandidats, async (currentCodeRegion) => {
    await removeAllDuplicatesForRegion(statutsCandidats, currentCodeRegion, duplicatesTypesCode, allowDiskUseMode);
  });
};

/**
 * Supprime les doublons de type duplicatesTypesCode pour une région
 * @param {*} statutsCandidats
 * @param {*} codeRegion
 * @param {*} duplicatesTypesCode
 */
const removeAllDuplicatesForRegion = async (statutsCandidats, codeRegion, duplicatesTypesCode, allowDiskUseMode) => {
  logger.info(`Removing all statuts duplicates for codeRegion : ${codeRegion}`);

  const filterQuery = { etablissement_num_region: codeRegion };

  await removeStatutsCandidatsDuplicatesForFilters(
    statutsCandidats,
    duplicatesTypesCode,
    filterQuery,
    allowDiskUseMode
  );
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

  await removeStatutsCandidatsDuplicatesForFilters(
    statutsCandidats,
    duplicatesTypesCode,
    filterQuery,
    allowDiskUseMode
  );
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
      duplicatesRemoved.push(await removeDuplicates(duplicateItem));
    });
  }
  return duplicatesRemoved.flat();
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

  console.log("mostRecentStatut", mostRecentStatut);

  // Remove duplicates
  await asyncForEach(statutsToRemove, async (toRemove) => {
    await StatutCandidat.findByIdAndDelete(toRemove._id);
  });

  // Rewrite history for statut to keep
  // const flattenedHistory = await getFlattenedHistoryFromDuplicates(statutsFound);
  // never used in db ???
  // const statutToKeep = { ...mostRecentStatut, historique_statut_apprenant: flattenedHistory };

  return statutsToRemove.map((statut) => statut._id);
};

// /**
//  * Fonction de réécriture de l'historique à partir des statuts en doublons
//  * @param {*} duplicatesItems
//  * @returns
//  */
// const getFlattenedHistoryFromDuplicates = async (duplicatesItems) => {
//   const history = [];
//   let currentStatut = null;
//   let duplicatesIndex = 0;

//   // Parcours de la liste des doublons ordonné par date de création
//   await asyncForEach(sortBy(duplicatesItems, "created_at"), async (currentDuplicateItem) => {
//     duplicatesIndex++;

//     if (!currentStatut) {
//       history.push({
//         valeur_statut: currentDuplicateItem.statut_apprenant,
//         position_statut: duplicatesIndex,
//         date_statut: currentDuplicateItem.date_metier_mise_a_jour_statut
//           ? new Date(currentDuplicateItem.date_metier_mise_a_jour_statut)
//           : new Date(),
//       });
//       currentStatut = { ...currentDuplicateItem._doc };
//     } else {
//       // statut_apprenant has changed?
//       if (currentStatut.statut_apprenant !== currentDuplicateItem.statut_apprenant) {
//         history.push({
//           valeur_statut: currentDuplicateItem.statut_apprenant,
//           position_statut: currentStatut.historique_statut_apprenant.length + 1,
//           date_statut: currentDuplicateItem.created_at,
//         });
//         currentStatut = { ...currentDuplicateItem._doc, statut_apprenant: currentDuplicateItem.statut_apprenant };
//       }
//     }
//   });

//   return history;
// };
