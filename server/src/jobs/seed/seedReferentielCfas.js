const cliProgress = require("cli-progress");
const fs = require("fs-extra");
const path = require("path");
const logger = require("../../common/logger");
const ovhStorageManager = require("../../common/utils/ovhStorageManager");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { Cfa } = require("../../common/model");
const { reseauxCfas, erps, jobNames } = require("../../common/model/constants/");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Script qui initialise la collection CFAs de référence
 * Initialise les réseaux et les ERPs
 */
runScript(async () => {
  logger.info("Seeding referentiel CFAs");

  // Seed Networks
  await seedCfasNetworkFromCsv(reseauxCfas.CCCA_BTP);
  await seedCfasNetworkFromCsv(reseauxCfas.CCCI_France);
  await seedCfasNetworkFromCsv(reseauxCfas.CMA);
  // await seedCfasNetworkFromCsv(reseauxCfas.AGRI); // En attente violaine
  await seedCfasNetworkFromCsv(reseauxCfas.ANASUP);
  // await seedCfasNetworkFromCsv(reseauxCfas.PROMOTRANS); // En attente violaine
  await seedCfasNetworkFromCsv(reseauxCfas.COMPAGNONS_DU_DEVOIR);
  await seedCfasNetworkFromCsv(reseauxCfas.UIMM);
  await seedCfasNetworkFromCsv(reseauxCfas.BTP_CFA);
  await seedCfasNetworkFromCsv(reseauxCfas.MFR);

  // Seed Erps
  await seedCfasErpsFromCsv(erps.GESTI);
  await seedCfasErpsFromCsv(erps.YMAG);

  logger.info("End seeding référentiel CFAs !");
}, jobNames.seedReferentielCfas);

/**
 * Seeding Reference CFAs for Network
 * 1. Gets csv file reference from OVH Storage
 * 2. Parse data from csv
 * 2.a - If cfa in data has siret - check if update or creation needed
 * 2.b - If cfa in data has uai - check if update or creation needed
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

  const allCfasForNetwork = readJsonFromCsvFile(cfasReferenceFilePath, "latin1");
  loadingBar.start(allCfasForNetwork.length, 0);
  let nbCfasHandled = 0;

  // Parse all cfas in file
  await asyncForEach(allCfasForNetwork, async (currentCfa) => {
    nbCfasHandled++;
    loadingBar.update(nbCfasHandled);

    if (currentCfa.siret) {
      const cfaForSiret = await Cfa.findOne({ siret: `${currentCfa.siret}` });
      if (cfaForSiret) {
        // Update if needed
        await updateCfaIfNeeded(cfaForSiret, nomReseau, nomFichier);
      } else {
        await addCfaToReferentiel(currentCfa, nomReseau, nomFichier);
      }
    } else if (currentCfa.uai) {
      // Gets cfas for UAI in referentiel
      const cfaForUai = await Cfa.findOne({ uai: `${currentCfa.uai}` });
      if (cfaForUai) {
        // Update if needed
        await updateCfaIfNeeded(cfaForUai, nomReseau, nomFichier);
      } else {
        await addCfaToReferentiel(currentCfa, nomReseau, nomFichier);
      }
    }
  });

  loadingBar.stop();
  logger.info(`All cfas from ${nomFichier}.csv file imported !`);
};

/**
 * Update cfa in referentiel if it has not this network existant
 * @param {*} cfaInReferentiel
 * @param {*} nomReseau
 * @param {*} nomFichier
 */
const updateCfaIfNeeded = async (cfaInReferentiel, nomReseau, nomFichier) => {
  const cfaExistantWithoutCurrentNetwork =
    !cfaInReferentiel.reseaux ||
    (!cfaInReferentiel.reseaux.some((item) => item === nomReseau) &&
      !cfaInReferentiel.fichiers_reference.some((item) => item === `${nomFichier}.csv`));

  // Update only if cfa in referentiel has not network or current network not included
  if (cfaExistantWithoutCurrentNetwork) {
    await Cfa.findByIdAndUpdate(
      cfaInReferentiel._id,
      {
        $addToSet: { reseaux: nomReseau, fichiers_reference: `${nomFichier}.csv` },
      },
      { new: true }
    );
  }
};

/**
 * Add cfa to referentiel collection
 * @param {*} currentCfa
 * @param {*} nomReseau
 * @param {*} nomFichier
 */
const addCfaToReferentiel = async (currentCfa, nomReseau, nomFichier) => {
  // Add cfa in référentiel
  const cfaToAdd = new Cfa({
    nom: currentCfa.nom ?? null,
    siret: currentCfa.siret ? currentCfa.siret?.replace(/(\s|\.)/g, "") : null, //if siret exists and escaping spaces and dots makes it valid
    siren: currentCfa.siren ? currentCfa.siren?.replace(/(\s|\.)/g, "") : null, //if siren exists and escaping spaces and dots makes it valid
    uai: currentCfa.uai ?? null,
    emails_contact: [currentCfa.email_contact] ?? null,
    telephone: currentCfa.telephone ?? null,
    reseaux: [nomReseau],
    fichiers_reference: [`${nomFichier}.csv`],
  });

  await cfaToAdd.save();
};

/**
 * Seeding Reference CFAs for Erps
 */
const seedCfasErpsFromCsv = async ({ nomErp, nomFichier }) => {
  logger.info(`Seeding CFAs for erp ${nomErp}`);
  const cfasReferenceFilePath = path.join(__dirname, `./assets/${nomFichier}.csv`);

  // Get Reference CSV File if needed
  if (!fs.existsSync(cfasReferenceFilePath)) {
    const storageMgr = await ovhStorageManager();
    await storageMgr.downloadFileTo(`cfas-clients-erps/${nomFichier}.csv`, cfasReferenceFilePath);
  } else {
    logger.info(`File ${cfasReferenceFilePath} already in data folder.`);
  }

  const allCfasForErp = readJsonFromCsvFile(cfasReferenceFilePath);
  loadingBar.start(allCfasForErp.length, 0);
  let nbCfasHandled = 0;

  // Parse all cfas in file
  await asyncForEach(allCfasForErp, async (currentCfa) => {
    nbCfasHandled++;
    loadingBar.update(nbCfasHandled);

    if (currentCfa.uai) {
      // Gets cfa for this uai without this ERP
      const cfasForUai = await Cfa.findOne({ uai: `${currentCfa.uai}` });

      // Update cfa if needed, create it if not existant
      if (cfasForUai) {
        // Update only if cfa in referentiel has not erp
        if (
          !cfasForUai.erps ||
          (!cfasForUai.erps.some((item) => item === nomErp) &&
            !cfasForUai.fichiers_reference.some((item) => item === `${nomFichier}.csv`))
        ) {
          await Cfa.findOneAndUpdate(
            { uai: `${currentCfa.uai}` },
            { $addToSet: { erps: nomErp, fichiers_reference: `${nomFichier}.csv` } },
            { new: true }
          );
        }
      } else {
        const cfaToAdd = new Cfa({
          nom: currentCfa.nom ?? null,
          siret: currentCfa.siret ? currentCfa.siret?.replace(/(\s|\.)/g, "") : null, //if siret exists and escaping spaces and dots makes it valid
          siren: currentCfa.siren ? currentCfa.siren?.replace(/(\s|\.)/g, "") : null, //if siren exists and escaping spaces and dots makes it valid
          uai: currentCfa.uai ?? null,
          emails_contact: [currentCfa.email_contact] ?? null,
          telephone: currentCfa.telephone ?? null,
          erps: [nomErp],
          fichiers_reference: [`${nomFichier}.csv`],
        });

        await cfaToAdd.save();
      }
    }
  });

  loadingBar.stop();
  logger.info(`All cfas from ${nomFichier}.csv file imported !`);
};
