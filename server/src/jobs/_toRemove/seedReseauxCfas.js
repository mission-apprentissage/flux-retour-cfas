import cliProgress from "cli-progress";
import logger from "../../common/logger.js";
import path from "path";
import { runScript } from "../scriptWrapper.js";
import { asyncForEach } from "../../common/utils/asyncUtils.js";
import { JOB_NAMES } from "../../common/constants/jobsConstants.js";
import { RESEAUX_CFAS } from "../../common/constants/networksConstants.js";
import { readJsonFromCsvFile } from "../../common/utils/fileUtils.js";
import { reseauxCfasDb } from "../../common/model/collections.js";
import { getDirname } from "../../common/utils/esmUtils.js";
import { downloadIfNeededFileTo } from "../../common/utils/ovhStorageUtils.js";

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
runScript(async ({ reseauxCfas }) => {
  logger.info("Seeding ReseauxCfas");

  // Clear reseauxCfas collection
  await reseauxCfasDb().deleteMany({});

  // Set networks from CSV
  await asyncForEach(CFAS_NETWORKS, async (currentNetwork) => {
    await seedReseauxCfasFromNetwork(reseauxCfas, currentNetwork);
  });

  logger.info("End seeding ReseauxCfas !");
}, JOB_NAMES.seedReseauxCfas);

/**
 * Seed de la collection reseauxCfas depuis un fichier csv de réseau
 * @param {*} reseauxCfas
 * @param {*} currentNetwork
 */
const seedReseauxCfasFromNetwork = async (reseauxCfas, { nomReseau, nomFichier }) => {
  logger.info(`Seeding reseauxCfas network for ${nomReseau}`);
  const cfasReferenceFilePath = path.join(getDirname(import.meta.url), `./assets/${nomFichier}.csv`);

  // Get Reference CSV File if needed
  await downloadIfNeededFileTo(`cfas-reseaux/${nomFichier}.csv`, cfasReferenceFilePath, { clearFile: true });

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
