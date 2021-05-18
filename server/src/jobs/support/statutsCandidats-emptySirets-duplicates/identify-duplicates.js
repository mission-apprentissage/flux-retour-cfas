const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");
const { jobNames, duplicatesTypesCodes } = require("../../../common/model/constants/index");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const arg = require("arg");
const fs = require("fs-extra");
const path = require("path");
const { toXlsx, toCsv } = require("../../../common/utils/exporterUtils");

/**
 * Ce script permet d'identifier les doublons de sirets (sirets vides)
 */
runScript(async ({ statutsCandidats }) => {
  logger.info("Identifying empty sirets duplicates...");

  // Handle allowDiskUseMode param
  const args = arg({ "--allowDiskUse": Boolean }, { argv: process.argv.slice(2) });
  const allowDiskUseMode = args["--allowDiskUse"] ? true : false;

  await identifyAll(statutsCandidats, duplicatesTypesCodes.sirets_empty.code, allowDiskUseMode);

  logger.info("End identifying empty sirets duplicates...");
}, jobNames.identifyEmptySiretsDuplicates);

/**
 * Identifie tous les doublons de type sirets vides de la base de donnée
 * @param {*} statutsCandidats
 * @param {*} duplicatesTypesCode
 */
const identifyAll = async (statutsCandidats, duplicatesTypesCode, allowDiskUseMode = false) => {
  logger.info(`Identifying all duplicates`);
  const duplicates = await identifyDuplicatesForFiltersGroupedByUai(
    statutsCandidats,
    duplicatesTypesCode,
    allowDiskUseMode
  );

  // Export list
  await asyncForEach(duplicates, async (currentUaiList) => {
    const exportFolderPath = `/output/uai_${currentUaiList.uai}`;
    const exportName = getDuplicateExportFileName(currentUaiList.duplicates.length, duplicatesTypesCode);
    await fs.ensureDir(path.join(__dirname, exportFolderPath));

    await toXlsx(currentUaiList.duplicates, path.join(__dirname, `${exportFolderPath}/${exportName}.xlsx`));
    await toCsv(currentUaiList.duplicates, path.join(__dirname, `${exportFolderPath}/${exportName}.csv`));
    logger.info(`Output file created : ${exportFolderPath}/${exportName}.csv`);
  });
};

/**
 * Fonction d'identification de tous les doublons de type duplicatesTypesCode
 * Retourne une liste regoupée par UAIs
 * @param {*} statutsCandidats
 * @param {*} duplicatesTypesCode
 * @returns
 */
const identifyDuplicatesForFiltersGroupedByUai = async (
  statutsCandidats,
  duplicatesTypesCode,
  allowDiskUseMode = false,
  filters = {}
) => {
  const duplicatesForType = await statutsCandidats.getDuplicatesList(duplicatesTypesCode, filters, allowDiskUseMode);
  const duplicatesUaiGroup = [];

  if (duplicatesForType.data) {
    await asyncForEach(duplicatesForType.data, async (currentUaiData) => {
      // Build current uai list
      const duplicatesForUai = [];
      currentUaiData.duplicates.forEach((currentDuplicate) => {
        duplicatesForUai.push({
          ine_apprenant: currentDuplicate._id.ine_apprenant,
          nom_apprenant: currentDuplicate._id.nom_apprenant,
          prenom_apprenant: currentDuplicate._id.prenom_apprenant,
          prenom2_apprenant: currentDuplicate._id.prenom2_apprenant,
          prenom3_apprenant: currentDuplicate._id.prenom3_apprenant,
          email_contact: currentDuplicate._id.email_contact,
          id_formation: currentDuplicate._id.id_formation,
          uai_etablissement: currentDuplicate._id.uai_etablissement,
          __sirets: JSON.stringify(currentDuplicate.sirets),
        });
      });

      // Add to uai group
      duplicatesUaiGroup.push({
        uai: currentUaiData.uai,
        duplicates: duplicatesForUai,
      });
    });
  }

  return duplicatesUaiGroup;
};

/**
 * Construction du nom de fichier des doublons pour un type donné
 * @param {*} nbDuplicates
 * @param {*} duplicatesTypesCode
 * @returns
 */
const getDuplicateExportFileName = (nbDuplicates, duplicatesTypesCode) => {
  const duplicatesTypesArray = Object.keys(duplicatesTypesCodes).map((id) => ({
    id,
    name: duplicatesTypesCodes[id].name,
    code: duplicatesTypesCodes[id].code,
  }));
  const duplicateTypeName = duplicatesTypesArray.find((item) => item.code === duplicatesTypesCode)?.name;
  return `${nbDuplicates}doublonsIdentifies_type${duplicateTypeName}__${Date.now()}`;
};
