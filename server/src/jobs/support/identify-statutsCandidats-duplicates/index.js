const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");
const path = require("path");
const { toXlsx, toCsv } = require("../../../common/utils/exporterUtils");
const { jobNames, regionsCfas } = require("../../../common/model/constants/index");
const { asyncForEach } = require("../../../common/utils/asyncUtils");

const DEFAUlT_CODE_REGION_TO_CHECK = regionsCfas.NORMANDIE.numRegion;

/**
 * Ce script permet de créer un export contenant tous les statuts pour le réseau CMA
 */
runScript(async ({ statutsCandidats }) => {
  const codeRegionToCheck = process.argv.length > 2 ? process.argv[2] : DEFAUlT_CODE_REGION_TO_CHECK;
  logger.info(`Identifying statuts duplicates for CodeRegion ${codeRegionToCheck}`);
  await identifyStatutsCandidatsDuplicatesForRegion(statutsCandidats, codeRegionToCheck);
  logger.info("Ended !");
}, jobNames.identifyStatutsCandidatsDuplicates);

/**
 * Fonction d'identification de tous les doublons pour tous les uais pour la région donnée
 * @param {*} statutsCandidats
 * @param {*} codeRegion
 */
const identifyStatutsCandidatsDuplicatesForRegion = async (statutsCandidats, codeRegion) => {
  const duplicates = await statutsCandidats.getDuplicatesList({ etablissement_num_region: codeRegion });
  if (duplicates.data) {
    await asyncForEach(duplicates.data, async (currentUaiData) => {
      logger.info(`Exporting duplicates for UAI : ${currentUaiData.uai}`);
      await buildExportDuplicatesForUai(currentUaiData);
    });
  }
};

/**
 * Export dans un XLSX les doublons d'une liste pour un uai
 * @param {*} uaiDuplicatesData
 */
const buildExportDuplicatesForUai = async (uaiDuplicatesData) => {
  const exportFileName = `${uaiDuplicatesData.uai}_${uaiDuplicatesData.nbDuplicates}doublons`;

  const duplicatesListForUai = [];

  uaiDuplicatesData.duplicates.forEach((currentDuplicate) => {
    duplicatesListForUai.push({
      ine_apprenant: currentDuplicate._id.ine_apprenant,
      nom_apprenant: currentDuplicate._id.nom_apprenant,
      prenom_apprenant: currentDuplicate._id.prenom_apprenant,
      prenom2_apprenant: currentDuplicate._id.prenom2_apprenant,
      prenom3_apprenant: currentDuplicate._id.prenom3_apprenant,
      email_contact: currentDuplicate._id.email_contact,
      id_formation: currentDuplicate._id.id_formation,
      uai_etablissement: currentDuplicate._id.uai_etablissement,
      __periodes: JSON.stringify(currentDuplicate.periodes),
    });
  });

  // Build export Csv & XLSX
  await toCsv(duplicatesListForUai, path.join(__dirname, `/output/${exportFileName}.csv`), { delimiter: ";" });
  await toXlsx(duplicatesListForUai, path.join(__dirname, `/output/${exportFileName}.xlsx`));
};
