const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const path = require("path");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");
const { RESEAUX_CFAS } = require("../../common/constants/networksConstants");

const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { reseauxCfasDb } = require("../../common/model/collections");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

const CFAS_NETWORKS = [
  RESEAUX_CFAS.CMA,
  RESEAUX_CFAS.UIMM,
  RESEAUX_CFAS.AGRI,
  RESEAUX_CFAS.MFR,
  RESEAUX_CFAS.CCI,
  RESEAUX_CFAS.GRETA,
  RESEAUX_CFAS.AFTRAL,
];

/**
 * Script qui initialise la collection CFAs
 */
runScript(async ({ reseauxCfas, ovhStorage }) => {
  logger.info("Seeding ReseauxCfas");

  // Clear reseauxCfas collection
  await reseauxCfasDb().deleteMany({});

  // Set networks from CSV
  await asyncForEach(CFAS_NETWORKS, async (currentNetwork) => {
    await seedReseauxCfasFromNetwork(reseauxCfas, ovhStorage, currentNetwork);
  });

  logger.info("End seeding ReseauxCfas !");
}, JOB_NAMES.seedReseauxCfas);

/**
 * Seed de la collection reseauxCfas depuis un fichier csv de réseau
 * @param {*} reseauxCfas
 * @param {*} ovhStorage
 * @param {*} currentNetwork
 */
const seedReseauxCfasFromNetwork = async (reseauxCfas, ovhStorage, { nomReseau, nomFichier }) => {
  logger.info(`Seeding reseauxCfas network for ${nomReseau}`);
  const cfasReferenceFilePath = path.join(__dirname, `./assets/${nomFichier}.csv`);

  // Get Reference CSV File if needed
  await ovhStorage.downloadIfNeededFileTo(`cfas-reseaux/${nomFichier}.csv`, cfasReferenceFilePath, { clearFile: true });

  const allCfasForNetworkFile = readJsonFromCsvFile(cfasReferenceFilePath);
  loadingBar.start(allCfasForNetworkFile.length, 0);

  // Parse all cfas in file & create entry in collection
  await asyncForEach(allCfasForNetworkFile, async (currentCfaInCsv) => {
    loadingBar.increment();
    await reseauxCfas.create({
      nom_reseau: nomReseau,
      nom_etablissement: currentCfaInCsv?.nom,
      uai: currentCfaInCsv?.uai,
      siret: currentCfaInCsv?.siret,
    });
  });

  loadingBar.stop();
  logger.info(`All cfas from ${nomFichier}.csv file were added to reseauxCfas !`);
};
