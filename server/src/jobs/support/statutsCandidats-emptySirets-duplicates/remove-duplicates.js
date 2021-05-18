const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");
const { jobNames, duplicatesTypesCodes } = require("../../../common/model/constants/index");
const { StatutCandidat, JobEvent } = require("../../../common/model");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const sortBy = require("lodash.sortby");
const groupBy = require("lodash.groupby");
const arg = require("arg");
const fs = require("fs-extra");
const path = require("path");
const { toXlsx, toCsv } = require("../../../common/utils/exporterUtils");

/**
 * Ce script permet de supprimer les doublons de sirets vides
 */
runScript(async ({ statutsCandidats }) => {
  logger.info("Removing empty sirets duplicates...");

  // Handle allowDiskUseMode param
  const args = arg({ "--allowDiskUse": Boolean }, { argv: process.argv.slice(2) });
  const allowDiskUseMode = args["--allowDiskUse"] ? true : false;

  await removeAllDuplicates(statutsCandidats, duplicatesTypesCodes.sirets_empty.code, allowDiskUseMode);

  logger.info("End removing empty sirets duplicates...");
}, jobNames.removeEmptySiretsCandidatsDuplicates);

/**
 * Supprime tous les doublons
 * @param {*} statutsCandidats
 * @param {*} uai
 * @param {*} duplicatesTypesCode
 */
const removeAllDuplicates = async (statutsCandidats, duplicatesTypesCode, allowDiskUseMode = false) => {
  logger.info(`Removing all statuts duplicates`);
  const removedDuplicates = await removeStatutsCandidatsDuplicatesForFilters(
    statutsCandidats,
    duplicatesTypesCode,
    allowDiskUseMode
  );

  // Create uai grouped data
  const groupedByUai = groupBy(removedDuplicates, "uai");
  const removedDuplicatesGroupedByUai = Object.keys(groupedByUai).map((item) => ({
    uai: item,
    duplicates: groupedByUai[item],
  }));

  // Export list
  await asyncForEach(removedDuplicatesGroupedByUai, async (currentDuplicatesForUai) => {
    const exportFolderPath = `/output/uai_${currentDuplicatesForUai.uai}`;
    const removedName = getDuplicateRemovedFileName(currentDuplicatesForUai.duplicates.length, duplicatesTypesCode);
    await fs.ensureDir(path.join(__dirname, exportFolderPath));

    await toXlsx(currentDuplicatesForUai.duplicates, path.join(__dirname, `${exportFolderPath}/${removedName}.xlsx`));
    await toCsv(currentDuplicatesForUai.duplicates, path.join(__dirname, `${exportFolderPath}/${removedName}.csv`));
    logger.info(`Output file created : ${exportFolderPath}/${removedName}.csv`);
  });
};

/**
 * Fonction de suppression de tous les doublons pour les filtres fournis en entrée
 * Retourne une liste regoupée par UAIs
 * @param {*} statutsCandidats
 * @param {*} duplicatesTypesCode
 * @param {*} filters
 * @returns
 */
const removeStatutsCandidatsDuplicatesForFilters = async (
  statutsCandidats,
  duplicatesTypesCode,
  allowDiskUseMode = false,
  filters = {}
) => {
  const duplicatesForType = await statutsCandidats.getDuplicatesList(duplicatesTypesCode, filters, allowDiskUseMode);
  const duplicatesRemoved = [];

  if (duplicatesForType.data) {
    await asyncForEach(duplicatesForType.data, async (currentUaiData) => {
      logger.info(`Removing duplicates for UAI : ${currentUaiData.uai}`);
      duplicatesRemoved.push(await removeDuplicates(currentUaiData.duplicates, statutsCandidats));
    });
  }
  return duplicatesRemoved.flat();
};

/**
 * Supprime les mauvais doublons pour la liste des doublons d'uai
 * @param {*} duplicatesToRemove
 * @param {*} statutsCandidats
 */
const removeDuplicates = async (duplicatesToRemove, statutsCandidats) => {
  const removedList = [];

  await asyncForEach(duplicatesToRemove, async (currentDuplicate) => {
    // Build duplicates detail items from _id
    const duplicatesItems = [];
    await asyncForEach(currentDuplicate.duplicatesIds, async (currentDuplicateItem) => {
      duplicatesItems.push(await StatutCandidat.findById(currentDuplicateItem._id));
    });

    // Gets statuts toKeep & toRemove - find max date
    const maxDate = Math.max(...duplicatesItems.map((s) => new Date(s.created_at)));
    // Gets statuts mostRecentStatut & toRemove - keep last created & remove before
    const mostRecentStatut = duplicatesItems.find((statut) => new Date(statut.created_at) >= maxDate);
    const statutsToRemove = duplicatesItems.filter((statut) => new Date(statut.created_at) < maxDate);

    // Save Duplicates detail to userEvents
    await new JobEvent({
      jobname: "remove-emptySirets-statutsCandidats-duplicates",
      action: `removeDuplicates-${JSON.stringify(currentDuplicate._id)}-${currentDuplicate.uai_etablissement}`,
      data: { ...currentDuplicate, ...{ duplicatesItems, mostRecentStatut, statutsToRemove } },
    }).save();

    // Remove duplicates
    await asyncForEach(statutsToRemove, async (toRemove) => {
      await StatutCandidat.findByIdAndDelete(toRemove);
    });

    // Rewrite history for statut to keep
    const flattenedHistory = await getFlattenedHistoryFromDuplicates(duplicatesItems, statutsCandidats);
    const statutToKeep = { ...mostRecentStatut, historique_statut_apprenant: flattenedHistory };

    // Update siret_catalogue & siret as empty
    await StatutCandidat.findByIdAndUpdate(
      statutToKeep._id,
      {
        $set: { siret_catalogue: statutToKeep.siret_etablissement, siret_etablissement: "" },
      },
      { new: true }
    );

    removedList.push({
      duplicatesRemoved: statutsToRemove.map((item) => item._doc),
      uai: currentDuplicate.uai_etablissement,
      statutKeeped: JSON.stringify(statutToKeep._doc),
    });
  });

  return removedList;
};

/**
 * Fonction de réécriture de l'historique à partir des statuts en doublons
 * @param {*} duplicatesItems
 * @param {*} statutsCandidats
 * @returns
 */
const getFlattenedHistoryFromDuplicates = async (duplicatesItems, statutsCandidats) => {
  const history = [];
  let currentStatut = null;
  let duplicatesIndex = 0;

  // Parcours de la liste des doublons ordonné par date de création
  await asyncForEach(sortBy(duplicatesItems, "created_at"), async (currentDuplicateItem) => {
    duplicatesIndex++;

    const shouldCreateStatutCandidat = await statutsCandidats.shouldCreateNewStatutCandidat(
      currentDuplicateItem,
      currentStatut
    );
    if (shouldCreateStatutCandidat) {
      history.push({
        valeur_statut: currentDuplicateItem.statut_apprenant,
        position_statut: duplicatesIndex,
        date_statut: currentDuplicateItem.date_metier_mise_a_jour_statut
          ? new Date(currentDuplicateItem.date_metier_mise_a_jour_statut)
          : new Date(),
      });
      currentStatut = { ...currentDuplicateItem._doc };
    } else {
      // statut_apprenant has changed?
      if (currentStatut.statut_apprenant !== currentDuplicateItem.statut_apprenant) {
        history.push({
          valeur_statut: currentDuplicateItem.statut_apprenant,
          position_statut: currentStatut.historique_statut_apprenant.length + 1,
          date_statut: currentDuplicateItem.created_at,
        });
        currentStatut = { ...currentDuplicateItem._doc, statut_apprenant: currentDuplicateItem.statut_apprenant };
      }
    }
  });

  return history;
};

/**
 * Construction du nom de fichier des doublons supprimés
 * @param {*} nbDuplicates
 * @param {*} duplicatesTypesCode
 * @returns
 */
const getDuplicateRemovedFileName = (nbDuplicates, duplicatesTypesCode) => {
  const duplicatesTypesArray = Object.keys(duplicatesTypesCodes).map((id) => ({
    id,
    name: duplicatesTypesCodes[id].name,
    code: duplicatesTypesCodes[id].code,
  }));
  const duplicateTypeName = duplicatesTypesArray.find((item) => item.code === duplicatesTypesCode)?.name;
  return `${nbDuplicates}doublonsSupprimes_type${duplicateTypeName}__${Date.now()}`;
};
