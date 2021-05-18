const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");
const path = require("path");
const arg = require("arg");
const fs = require("fs-extra");
const { toXlsx, toCsv } = require("../../../common/utils/exporterUtils");
const { jobNames, duplicatesTypesCodes } = require("../../../common/model/constants/index");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { StatutCandidat } = require("../../../common/model");

/**
 * Ce script permet de créer un export contenant tous les doublons des statuts identifiés
 * Ce script prends plusieurs paramètres en argument :
 * --duplicatesTypeCode : types de doublons à identifier : 0/1/2/3/4/5 cf duplicatesTypesCodes
 * --mode : forAll / forRegion / forUai
 *   permets d'identifier les doublons dans toute la BDD / pour une région / pour un UAI
 * --regionCode : si mode forRegion actif, permet de préciser le codeRegion souhaité
 * --uai : si mode forUai actif, permet de préciser l'uai souhaité
 * --allowDiskUse : si mode allowDiskUse actif, permet d'utiliser l'espace disque pour les requetes d'aggregation mongoDb
 */
runScript(async ({ statutsCandidats }) => {
  const args = arg(
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
    throw new Error("missing required argument: --duplicatesTypeCode  (should be in [0/1/2/3/4/5])");

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
  const duplicatesForRegion = await identifyDuplicatesForFiltersGroupedByUai(
    statutsCandidats,
    duplicatesTypesCode,
    {
      etablissement_num_region: codeRegion,
    },
    allowDiskUseMode
  );

  // Export list
  await asyncForEach(duplicatesForRegion, async (currentUaiList) => {
    const exportFolderPath = `/output/region_${codeRegion}/uai_${currentUaiList.uai}`;
    const exportName = getDuplicateExportFileName(currentUaiList.duplicates.length, duplicatesTypesCode);
    await fs.ensureDir(path.join(__dirname, exportFolderPath));

    await toXlsx(currentUaiList.duplicates, path.join(__dirname, `${exportFolderPath}/${exportName}.xlsx`));
    await toCsv(currentUaiList.duplicates, path.join(__dirname, `${exportFolderPath}/${exportName}.csv`));
    logger.info(`Output file created : ${exportFolderPath}/${exportName}.csv`);
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
  const duplicatesForUai = await identifyDuplicatesForFiltersGroupedByUai(
    statutsCandidats,
    duplicatesTypesCode,
    {
      uai_etablissement: uai,
    },
    allowDiskUseMode
  );

  // Export list
  await asyncForEach(duplicatesForUai, async (currentUaiList) => {
    const exportFolderPath = `/output/uai_${currentUaiList.uai}`;
    const exportName = getDuplicateExportFileName(currentUaiList.duplicates.length, duplicatesTypesCode);
    await fs.ensureDir(path.join(__dirname, exportFolderPath));

    await toXlsx(currentUaiList.duplicates, path.join(__dirname, `${exportFolderPath}/${exportName}.xlsx`));
    await toCsv(currentUaiList.duplicates, path.join(__dirname, `${exportFolderPath}/${exportName}.csv`));
    logger.info(`Output file created : ${exportFolderPath}/${exportName}.csv`);
  });
};

/**
 * Fonction d'identification de tous les doublons de type duplicatesTypesCode pour les filtres fournis en entrée
 * Retourne une liste regoupée par UAIs
 * @param {*} statutsCandidats
 * @param {*} duplicatesTypesCode
 * @param {*} filters
 * @returns
 */
const identifyDuplicatesForFiltersGroupedByUai = async (
  statutsCandidats,
  duplicatesTypesCode,
  filters = {},
  allowDiskUseMode
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
          __periodes: JSON.stringify(currentDuplicate.periodes),
          __ids_formations: JSON.stringify(currentDuplicate.ids_formations),
          __emails_contact: JSON.stringify(currentDuplicate.emails_contact),
          __INEs: JSON.stringify(currentDuplicate.ines),
          __prenoms2: JSON.stringify(currentDuplicate.prenoms2_apprenants),
          __prenoms3: JSON.stringify(currentDuplicate.prenoms3_apprenants),
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
