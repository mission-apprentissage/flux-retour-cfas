import path from "path";
import groupBy from "lodash.groupby";
import logger from "../../../../common/logger.js";
import { readJsonFromCsvFile } from "../../../../common/utils/fileUtils.js";
import { RESEAUX_CFAS } from "../../../../common/constants/networksConstants.js";
import { toXlsx } from "../../../../common/utils/exporterUtils.js";
import { __dirname } from "../../../../common/utils/esmUtils.js";

/**
 * Ce script permet d'identifier les doublons dans les fichiers de référence des réseaux
 */
export const identifyNetworkReferenceDuplicates = async (ovhStorage) => {
  logger.info("Identifying Network Referentiel Duplicates");

  await identifyDuplicatesForNetwork(ovhStorage, RESEAUX_CFAS.CCI);
  await identifyDuplicatesForNetwork(ovhStorage, RESEAUX_CFAS.CMA);
  await identifyDuplicatesForNetwork(ovhStorage, RESEAUX_CFAS.AGRI);
  await identifyDuplicatesForNetwork(ovhStorage, RESEAUX_CFAS.ANASUP);
  await identifyDuplicatesForNetwork(ovhStorage, RESEAUX_CFAS.UIMM);
  await identifyDuplicatesForNetwork(ovhStorage, RESEAUX_CFAS.BTP_CFA);
  await identifyDuplicatesForNetwork(ovhStorage, RESEAUX_CFAS.CFA_EC);
  await identifyDuplicatesForNetwork(ovhStorage, RESEAUX_CFAS.GRETA);
  await identifyDuplicatesForNetwork(ovhStorage, RESEAUX_CFAS.MFR);

  logger.info("End identifying Network Referentiel Duplicates");
};

/**
 * Identify duplicates for Network
 */
const identifyDuplicatesForNetwork = async (ovhStorage, { nomReseau, nomFichier }) => {
  logger.info(`Identifying duplicates for network ${nomReseau}`);
  const cfasReferenceFilePath = path.join(__dirname(import.meta.url), `./assets/${nomFichier}.csv`);

  // Get Reference CSV File if needed
  await ovhStorage.downloadIfNeededFileTo(`cfas-reseaux/${nomFichier}.csv`, cfasReferenceFilePath);

  // Read data from CSV
  const allCfasForNetwork = readJsonFromCsvFile(cfasReferenceFilePath);

  // Gets the group with same siret
  const cfasMultiSiret = getCfasWithSameSiret(allCfasForNetwork);

  if (cfasMultiSiret.length > 0) {
    // Build export XLSX
    const fileToBuild = `doublons_reseau_${nomReseau}_${Date.now()}.xlsx`;
    await toXlsx(cfasMultiSiret, path.join(__dirname(import.meta.url), `/output/${fileToBuild}`));
    logger.info(`Export duplicate identification file ${fileToBuild} created.`);
  }
};

/**
 * Gets duplicates cfas with same siret
 * @param {*} allCfasForNetwork
 * @returns
 */
const getCfasWithSameSiret = (allCfasForNetwork) => {
  // Create cfa groups with same siret
  const cfasGroupedBySiret = groupBy(
    allCfasForNetwork.filter((x) => x.siret && x.siret !== "NULL"), // Filter on siret not null
    "siret"
  );

  // Return data with at least 2 same siret for cfa
  return Object.keys(cfasGroupedBySiret)
    .map((k) => cfasGroupedBySiret[k])
    .filter((x) => x.length > 1)
    .flat();
};
