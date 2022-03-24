const cliProgress = require("cli-progress");
const path = require("path");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");
const { RESEAUX_CFAS } = require("../../common/constants/networksConstants");
const { ERPS } = require("../../common/constants/erpsConstants");
const { CfaModel, DossierApprenantModel } = require("../../common/model");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { getMetiersBySirets } = require("../../common/apis/apiLba");
const { sleep, generateRandomAlphanumericPhrase } = require("../../common/utils/miscUtils");
const config = require("../../../config");
const { validateUai } = require("../../common/domain/uai");
const { Cfa } = require("../../common/domain/cfa");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Script qui initialise la collection CFAs de référence
 */
runScript(async ({ cfas, ovhStorage }) => {
  logger.info("Seeding referentiel CFAs");

  // Unplug all cfas
  await CfaModel.updateMany({}, { $set: { branchement_tdb: false } });
  await seedCfasFromDossiersApprenantsUaisValid(cfas);

  await seedMetiersFromLbaApi();

  await seedCfasNetworkFromCsv(ovhStorage, RESEAUX_CFAS.CMA);
  await seedCfasNetworkFromCsv(ovhStorage, RESEAUX_CFAS.UIMM);
  await seedCfasNetworkFromCsv(ovhStorage, RESEAUX_CFAS.AGRI);
  await seedCfasNetworkFromCsv(ovhStorage, RESEAUX_CFAS.MFR);
  await seedCfasNetworkFromCsv(ovhStorage, RESEAUX_CFAS.CCI);
  await seedCfasNetworkFromCsv(ovhStorage, RESEAUX_CFAS.CFA_EC);
  await seedCfasNetworkFromCsv(ovhStorage, RESEAUX_CFAS.GRETA);

  await identifyUaiValidity();

  logger.info("End seeding référentiel CFAs !");
}, JOB_NAMES.seedReferentielCfas);

/**
 * Seed des cfas depuis statuts candidats avec UAIs valid
 */
const seedCfasFromDossiersApprenantsUaisValid = async (cfas) => {
  // All distinct valid uais
  const allUais = await DossierApprenantModel.distinct("uai_etablissement");

  logger.info(`Seeding Referentiel CFAs from ${allUais.length} UAIs found in DossierApprenant`);

  loadingBar.start(allUais.length, 0);

  await asyncForEach(allUais, async (currentUai) => {
    loadingBar.increment();

    // Gets statuts & sirets for UAI
    const statutForUai = await DossierApprenantModel.findOne({
      uai_etablissement: currentUai,
    });
    const allSiretsForUai = await DossierApprenantModel.distinct("siret_etablissement", {
      uai_etablissement: currentUai,
      siret_etablissement_valid: true,
    });

    const cfaExistant = await CfaModel.findOne({ uai: currentUai }).lean();

    // Create or update CFA
    if (statutForUai) {
      if (cfaExistant) {
        await updateCfaFromDossierApprenant(cfas, cfaExistant, statutForUai, allSiretsForUai);
      } else {
        await createCfaFromDossierApprenant(cfas, statutForUai, allSiretsForUai);
      }
    }
  });

  loadingBar.stop();
};

/**
 * Create cfa from statut
 * @param {*} statutForCfa
 */
const createCfaFromDossierApprenant = async (cfas, statutForCfa, allSirets) => {
  const accessToken = generateRandomAlphanumericPhrase();

  await new CfaModel({
    uai: statutForCfa.uai_etablissement,
    sirets: allSirets,
    nom: statutForCfa.nom_etablissement.trim() ?? null,
    nom_tokenized: Cfa.createTokenizedNom(statutForCfa.nom_etablissement),
    adresse: statutForCfa.etablissement_adresse,
    branchement_tdb: true,
    source_seed_cfa: "StatutsCandidats",
    erps: [statutForCfa.source],
    region_nom: statutForCfa.etablissement_nom_region,
    region_num: statutForCfa.etablissement_num_region,
    access_token: accessToken,
    private_url: `${config.publicUrl}/cfas/${accessToken}`,
    first_transmission_date: await cfas.getCfaFirstTransmissionDateFromUai(statutForCfa.uai_etablissement),
  }).save();
};

/**
 * Update cfa from statut
 * @param {*} statutForCfa
 */
const updateCfaFromDossierApprenant = async (cfas, cfaExistant, statutForCfa, allSirets) => {
  await CfaModel.findOneAndUpdate(
    { _id: cfaExistant._id },
    {
      $set: {
        uai: statutForCfa.uai_etablissement,
        nom: statutForCfa.nom_etablissement.trim() ?? null,
        nom_tokenized: Cfa.createTokenizedNom(statutForCfa.nom_etablissement),
        adresse: statutForCfa.etablissement_adresse,
        sirets: allSirets,
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
const seedCfasNetworkFromCsv = async (ovhStorage, { nomReseau, nomFichier, encoding }) => {
  logger.info(`Seeding CFAs for network ${nomReseau}`);
  const cfasReferenceFilePath = path.join(__dirname, `./assets/${nomFichier}.csv`);

  // Get Reference CSV File if needed
  await ovhStorage.downloadIfNeededFileTo(`cfas-reseaux/${nomFichier}.csv`, cfasReferenceFilePath);

  const allCfasForNetwork = readJsonFromCsvFile(cfasReferenceFilePath, encoding);
  loadingBar.start(allCfasForNetwork.length, 0);

  // Parse all cfas in file
  await asyncForEach(allCfasForNetwork, async (currentCfa) => {
    loadingBar.increment();

    if (currentCfa.siret) {
      const cfaForSiret = await CfaModel.findOne({ sirets: { $in: [currentCfa.siret] } });
      if (cfaForSiret) {
        // Handle AGRI - Without MFR
        if (nomReseau === RESEAUX_CFAS.AGRI.nomReseau && cfaForSiret.erps.includes(ERPS.GESTI.nomErp.toLowerCase())) {
          return;
        }
        // Update if needed
        await updateCfaFromNetwork(cfaForSiret, currentCfa, nomReseau, nomFichier);
      } else {
        await addCfaFromNetwork(currentCfa, nomReseau, nomFichier);
      }
    } else if (currentCfa.uai) {
      // Gets cfas for UAI in referentiel
      const cfaForUai = await CfaModel.findOne({ uai: `${currentCfa.uai}` }).lean();

      if (cfaForUai) {
        // Handle AGRI - Without MFR
        if (nomReseau === RESEAUX_CFAS.AGRI.nomReseau && cfaForUai.erps.includes(ERPS.GESTI.nomErp.toLowerCase())) {
          return;
        }
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
    await CfaModel.findByIdAndUpdate(
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
  const accessToken = generateRandomAlphanumericPhrase();

  // Add cfa in référentiel
  const cfaToAdd = new CfaModel({
    nom: currentCfa.nom?.trim(),
    noms_cfa: [currentCfa.nom?.trim()],
    sirets: currentCfa.siret ? [currentCfa.siret?.replace(/(\s|\.)/g, "")] : null, //if siret exists and escaping spaces and dots makes it valid
    siren: currentCfa.siren ? currentCfa.siren?.replace(/(\s|\.)/g, "") : null, //if siren exists and escaping spaces and dots makes it valid
    uai: currentCfa.uai ?? null,
    emails_contact: [currentCfa.email_contact] ?? null,
    telephone: currentCfa.telephone ?? null,
    reseaux: [nomReseau],
    fichiers_reference: [`${nomFichier}.csv`],
    access_token: accessToken,
    private_url: `${config.publicUrl}/cfas/${accessToken}`,
    source_seed_cfa: "NetworkFile",
  });

  await cfaToAdd.save();
};

/**
 * Seed des métiers dans la collection CFAs
 */
const seedMetiersFromLbaApi = async () => {
  const allCfasWithSirets = await CfaModel.find({ sirets: { $nin: [null, ""] } });

  logger.info(`Seeding Metiers to CFAs from ${allCfasWithSirets.length} cfas found with siret`);

  loadingBar.start(allCfasWithSirets.length, 0);

  await asyncForEach(allCfasWithSirets, async (currentCfaWithSiret) => {
    loadingBar.increment();

    // Build metiers list for all sirets for currentCfa
    if (currentCfaWithSiret.sirets.length > 0) {
      const metiersFromSirets = await getMetiersBySirets(currentCfaWithSiret.sirets);
      await sleep(100); // Delay for LBA Api quota

      // Update metiers list
      await CfaModel.findOneAndUpdate(
        { _id: currentCfaWithSiret._id },
        {
          $set: {
            metiers: metiersFromSirets?.metiers,
          },
        }
      );
    }
  });

  loadingBar.stop();
};

const identifyUaiValidity = async () => {
  const allCfasWithUai = await CfaModel.find({ uai: { $exists: true } });

  await asyncForEach(allCfasWithUai, async (currentCfaWithUai) => {
    // Update metiers list
    await CfaModel.findOneAndUpdate(
      { _id: currentCfaWithUai._id },
      { $set: { uai_valid: validateUai(currentCfaWithUai.uai) } }
    );
  });
};
