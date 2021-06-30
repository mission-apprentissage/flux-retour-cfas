const cliProgress = require("cli-progress");
const fs = require("fs-extra");
const path = require("path");
const logger = require("../../common/logger");
const ovhStorageManager = require("../../common/utils/ovhStorageManager");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { Cfa, StatutCandidat } = require("../../common/model");
const { jobNames, reseauxCfas } = require("../../common/model/constants/");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { getMetiersBySiret } = require("../../common/apis/apiLba");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Script qui initialise la collection CFAs de référence
 */
runScript(async ({ cfas }) => {
  logger.info("Seeding referentiel CFAs");
  await seedCfasFromStatutsCandidatsUaisValid(cfas);
  await seedMetiersFromLbaApi();

  await seedCfasNetworkFromCsv(reseauxCfas.CMA);
  await seedCfasNetworkFromCsv(reseauxCfas.UIMM);
  await seedCfasNetworkFromCsv(reseauxCfas.AGRI);
  await seedCfasNetworkFromCsv(reseauxCfas.MFR);

  logger.info("End seeding référentiel CFAs !");
}, jobNames.seedReferentielCfas);

/**
 * Seed des cfas depuis statuts candidats avec UAIs valid
 */
const seedCfasFromStatutsCandidatsUaisValid = async (cfas) => {
  // All distinct valid uais
  const allUais = await StatutCandidat.distinct("uai_etablissement", {
    uai_etablissement_valid: true,
  });

  logger.info(`Seeding Referentiel CFAs from ${allUais.length} UAIs found in statutsCandidats`);

  loadingBar.start(allUais.length, 0);
  let nbUaiHandled = 0;

  await asyncForEach(allUais, async (currentUai) => {
    loadingBar.update(nbUaiHandled);
    nbUaiHandled++;

    // Gets statut for UAI
    const statutForUai = await StatutCandidat.findOne({
      uai_etablissement: currentUai,
    });
    const cfaExistant = await Cfa.findOne({ uai: currentUai }).lean();

    // Create or update CFA
    if (cfaExistant) {
      await updateCfaFromStatutCandidat(cfas, cfaExistant._id, statutForUai);
    } else {
      await createCfaFromStatutCandidat(cfas, statutForUai);
    }
  });

  loadingBar.stop();
};

/**
 * Create cfa from statut
 * @param {*} statutForCfa
 */
const createCfaFromStatutCandidat = async (cfas, statutForCfa) => {
  await new Cfa({
    uai: statutForCfa.uai_etablissement,
    siret: statutForCfa.siret_etablissement_valid ? statutForCfa.siret_etablissement : null,
    nom: statutForCfa.nom_etablissement.trim() ?? null,
    branchement_tdb: true,
    source_seed_cfa: "StatutsCandidats",
    erps: [statutForCfa.source],
    region_nom: statutForCfa.etablissement_nom_region,
    region_num: statutForCfa.etablissement_num_region,
    first_transmission_date: await cfas.getCfaFirstTransmissionDateFromUai(statutForCfa.uai_etablissement),
  }).save();
};

/**
 * Update cfa from statut
 * @param {*} statutForCfa
 */
const updateCfaFromStatutCandidat = async (cfas, idCfa, statutForCfa) => {
  await Cfa.findOneAndUpdate(
    { _id: idCfa },
    {
      $set: {
        uai: statutForCfa.uai_etablissement,
        nom: statutForCfa.nom_etablissement.trim() ?? null,
        siret: statutForCfa.siret_etablissement_valid ? statutForCfa.siret_etablissement : null,
        branchement_tdb: true,
        source_seed_cfa: "StatutsCandidats",
        erps: [statutForCfa.source],
        region_nom: statutForCfa.etablissement_nom_region,
        region_num: statutForCfa.etablissement_num_region,
        first_transmission_date: await cfas.getCfaFirstTransmissionDateFromUai(statutForCfa.uai_etablissement),
      },
    }
  );
};

/**
 * Seeding Reference CFAs for Network
 * 1. Gets csv file reference from OVH Storage
 * 2. Parse data from csv
 * 2.a - If cfa in data has siret - check if update or creation needed
 * 2.b - If cfa in data has uai - check if update or creation needed
 */
const seedCfasNetworkFromCsv = async ({ nomReseau, nomFichier, encoding }) => {
  logger.info(`Seeding CFAs for network ${nomReseau}`);
  const cfasReferenceFilePath = path.join(__dirname, `./assets/${nomFichier}.csv`);

  // Get Reference CSV File if needed
  if (!fs.existsSync(cfasReferenceFilePath)) {
    const storageMgr = await ovhStorageManager();
    await storageMgr.downloadFileTo(`cfas-reseaux/${nomFichier}.csv`, cfasReferenceFilePath);
  } else {
    logger.info(`File ${cfasReferenceFilePath} already in data folder.`);
  }

  const allCfasForNetwork = readJsonFromCsvFile(cfasReferenceFilePath, encoding);
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
        await updateCfaFromNetwork(cfaForSiret, currentCfa, nomReseau, nomFichier);
      } else {
        await addCfaFromNetwork(currentCfa, nomReseau, nomFichier);
      }
    } else if (currentCfa.uai) {
      // Gets cfas for UAI in referentiel
      const cfaForUai = await Cfa.findOne({ uai: `${currentCfa.uai}` });
      if (cfaForUai) {
        // Update if needed
        await updateCfaFromNetwork(cfaForUai, currentCfa, nomReseau, nomFichier);
      } else {
        await addCfaFromNetwork(currentCfa, nomReseau, nomFichier);
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
const updateCfaFromNetwork = async (cfaInReferentiel, cfaInFile, nomReseau, nomFichier) => {
  const cfaExistantWithoutCurrentNetwork =
    !cfaInReferentiel?.reseaux ||
    (!cfaInReferentiel?.reseaux?.some((item) => item === nomReseau) &&
      !cfaInReferentiel?.fichiers_reference?.some((item) => item === `${nomFichier}.csv`));

  // Update only if cfa in referentiel has not network or current network not included
  if (cfaExistantWithoutCurrentNetwork) {
    await Cfa.findByIdAndUpdate(
      cfaInReferentiel._id,
      {
        $addToSet: { noms_cfa: cfaInFile.nom.trim(), reseaux: nomReseau, fichiers_reference: `${nomFichier}.csv` },
      },
      { new: true }
    );
  }
};

/**
 * Add cfa to referentiel collection from network
 * @param {*} currentCfa
 * @param {*} nomReseau
 * @param {*} nomFichier
 */
const addCfaFromNetwork = async (currentCfa, nomReseau, nomFichier) => {
  // Add cfa in référentiel
  const cfaToAdd = new Cfa({
    nom: currentCfa.nom?.trim(),
    noms_cfa: [currentCfa.nom?.trim()],
    siret: currentCfa.siret ? currentCfa.siret?.replace(/(\s|\.)/g, "") : null, //if siret exists and escaping spaces and dots makes it valid
    siren: currentCfa.siren ? currentCfa.siren?.replace(/(\s|\.)/g, "") : null, //if siren exists and escaping spaces and dots makes it valid
    uai: currentCfa.uai ?? null,
    emails_contact: [currentCfa.email_contact] ?? null,
    telephone: currentCfa.telephone ?? null,
    reseaux: [nomReseau],
    fichiers_reference: [`${nomFichier}.csv`],
    source_seed_cfa: "NetworkFile",
  });

  await cfaToAdd.save();
};

/**
 * Seed des métiers dans la collection CFAs
 */
const seedMetiersFromLbaApi = async () => {
  const allCfasWithSiret = await Cfa.find({ siret: { $nin: [null, ""] } });

  logger.info(`Seeding Metiers to CFAs from ${allCfasWithSiret.length} cfas found with siret`);

  loadingBar.start(allCfasWithSiret.length, 0);
  let nbHandled = 0;

  await asyncForEach(allCfasWithSiret, async (currentCfaWithSiret) => {
    loadingBar.update(nbHandled);
    nbHandled++;

    const metiersFromSiret = await getMetiersBySiret(currentCfaWithSiret.siret);
    await Cfa.findOneAndUpdate(
      { _id: currentCfaWithSiret._id },
      {
        $set: {
          metiers: metiersFromSiret?.metiers,
        },
      }
    );
  });

  loadingBar.stop();
};
