const cliProgress = require("cli-progress");
const fs = require("fs-extra");
const path = require("path");
const logger = require("../../common/logger");
const ovhStorageManager = require("../../common/utils/ovhStorageManager");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { Cfa } = require("../../common/model");
const { reseauxCfas } = require("../../common/model/constants/");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

runScript(async () => {
  logger.info("Seeding referentiel CFAs");

  await seedCfasNetworkFromCsv(reseauxCfas.CCCA_BTP);
  await seedCfasNetworkFromCsv(reseauxCfas.CCCI_France);
  await seedCfasNetworkFromCsv(reseauxCfas.CMA);
  await seedCfasNetworkFromCsv(reseauxCfas.AGRI);
  await seedCfasNetworkFromCsv(reseauxCfas.ANASUP);
  await seedCfasNetworkFromCsv(reseauxCfas.PROMOTRANS);

  logger.info("End seeding référentiel CFAs !");
});

/**
 * Seeding Reference CFAs for Network
 */
const seedCfasNetworkFromCsv = async ({ nomReseau, nomFichier }) => {
  logger.info(`Seeding CFAs for network ${nomReseau}`);
  const cfasReferenceFilePath = path.join(__dirname, `./assets/${nomFichier}.csv`);

  // Get Reference CSV File if needed
  if (!fs.existsSync(cfasReferenceFilePath)) {
    const storageMgr = await ovhStorageManager();
    await storageMgr.downloadFileTo(`cfas-reseaux/${nomFichier}.csv`, cfasReferenceFilePath);
  } else {
    logger.info(`File ${cfasReferenceFilePath} already in data folder.`);
  }

  const allCfasForNetwork = readJsonFromCsvFile(cfasReferenceFilePath);
  loadingBar.start(allCfasForNetwork.length, 0);
  let nbCfasHandled = 0;

  // Parse all cfas in file
  await asyncForEach(allCfasForNetwork, async (currentCfa) => {
    nbCfasHandled++;
    loadingBar.update(nbCfasHandled);

    if (currentCfa.uai) {
      const cfasForUai = await Cfa.findOne({ uai: `${currentCfa.uai}` });

      // Update cfa if needed, create it if not existant
      if (cfasForUai) {
        await Cfa.findOneAndUpdate(
          { uai: `${currentCfa.uai}` },
          { $addToSet: { reseaux: nomReseau, fichiers_reference: `${nomFichier}.csv` } },
          { new: true }
        );
      } else {
        const cfaToAdd = new Cfa({
          nom: currentCfa.nom ?? null,
          siret: currentCfa.siret ?? null,
          siren: currentCfa.siren ?? null,
          uai: currentCfa.uai ?? null,
          emails_contact: [currentCfa.email_contact] ?? null,
          telephone: currentCfa.telephone ?? null,
          reseaux: [nomReseau],
          fichiers_reference: [`${nomFichier}.csv`],
        });

        await cfaToAdd.save();
      }
    }
  });

  loadingBar.stop();
  logger.info(`All cfas from ${nomFichier}.csv file imported !`);
};
