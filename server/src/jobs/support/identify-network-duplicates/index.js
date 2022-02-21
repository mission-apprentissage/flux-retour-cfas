const path = require("path");
const groupBy = require("lodash.groupby");
const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");
const { readJsonFromCsvFile } = require("../../../common/utils/fileUtils");
const { reseauxCfas } = require("../../../common/model/constants/");
const { toXlsx } = require("../../../common/utils/exporterUtils");
const { jobNames } = require("../../../common/model/constants/index");

/**
 * Ce script permet d'identifier les doublons dans les fichiers de référence des réseaux
 */
runScript(async ({ ovhStorage }) => {
  logger.info("Identifying Network Referentiel Duplicates");

  await identifyDuplicatesForNetwork(ovhStorage, reseauxCfas.CCI);
  await identifyDuplicatesForNetwork(ovhStorage, reseauxCfas.CMA);
  await identifyDuplicatesForNetwork(ovhStorage, reseauxCfas.AGRI);
  await identifyDuplicatesForNetwork(ovhStorage, reseauxCfas.ANASUP);
  await identifyDuplicatesForNetwork(ovhStorage, reseauxCfas.UIMM);
  await identifyDuplicatesForNetwork(ovhStorage, reseauxCfas.BTP_CFA);
  await identifyDuplicatesForNetwork(ovhStorage, reseauxCfas.CFA_EC);
  await identifyDuplicatesForNetwork(ovhStorage, reseauxCfas.GRETA);
  await identifyDuplicatesForNetwork(ovhStorage, reseauxCfas.MFR);

  logger.info("End identifying Network Referentiel Duplicates");
}, jobNames.identifyNetworkDuplicates);

/**
 * Identify duplicates for Network
 */
const identifyDuplicatesForNetwork = async (ovhStorage, { nomReseau, nomFichier }) => {
  logger.info(`Identifying duplicates for network ${nomReseau}`);
  const cfasReferenceFilePath = path.join(__dirname, `./assets/${nomFichier}.csv`);

  // Get Reference CSV File if needed
  await ovhStorage.downloadIfNeededFileTo(`cfas-reseaux/${nomFichier}.csv`, cfasReferenceFilePath);

  // Read data from CSV
  const allCfasForNetwork = readJsonFromCsvFile(cfasReferenceFilePath, "latin1");

  // Gets the group with same siret
  const cfasMultiSiret = getCfasWithSameSiret(allCfasForNetwork);

  if (cfasMultiSiret.length > 0) {
    // Build export XLSX
    const fileToBuild = `doublons_reseau_${nomReseau}_${Date.now()}.xlsx`;
    await toXlsx(cfasMultiSiret, path.join(__dirname, `/output/${fileToBuild}`));
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
