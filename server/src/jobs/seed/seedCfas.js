const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const path = require("path");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");
const { RESEAUX_CFAS } = require("../../common/constants/networksConstants");

const { CfaModel, DossierApprenantModel } = require("../../common/model");
const { generateRandomAlphanumericPhrase, sleep } = require("../../common/utils/miscUtils");
const { Cfa } = require("../../common/domain/cfa");
const config = require("../../../config");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { ERPS } = require("../../common/constants/erpsConstants");
const { getMetiersBySirets, API_DELAY_QUOTA } = require("../../common/apis/apiLba");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

const CFAS_NETWORKS = [
  RESEAUX_CFAS.CMA,
  RESEAUX_CFAS.UIMM,
  RESEAUX_CFAS.AGRI,
  RESEAUX_CFAS.MFR,
  RESEAUX_CFAS.CCI,
  RESEAUX_CFAS.CFA_EC,
  RESEAUX_CFAS.GRETA,
  RESEAUX_CFAS.AFTRAL,
];

/**
 * Script qui initialise la collection CFAs
 */
runScript(async ({ cfas, ovhStorage }) => {
  logger.info("Seeding CFAs");

  // Delete all cfa in collection and not found in dossierApprenants (i.e Cfas from cleaned data)
  await clearCfasNotInDossierApprenants();

  // Seed new CFAs from Dossiers
  await seedCfasFromDossiersApprenantsUaisValid(cfas);

  // Set networks from CSV
  await asyncForEach(CFAS_NETWORKS, async (currentNetwork) => {
    await updateCfasNetworksFromCsv(ovhStorage, currentNetwork);
  });

  // Set metiers from LBA Api
  await seedMetiersFromLbaApi();

  logger.info("End seeding CFAs !");
}, JOB_NAMES.seedCfas);

/**
 * Clear all cfas from Cfas collection which are not found in DossierApprenant collection
 */
const clearCfasNotInDossierApprenants = async () => {
  logger.info(`Removing Cfas from Cfas collection which are not found in DossierApprenant collection`);
  const cfasIdsToDelete = await getCfasIdsNotInDossierApprenants();
  loadingBar.start(cfasIdsToDelete.length, 0);

  await asyncForEach(cfasIdsToDelete, async (idToDelete) => {
    loadingBar.increment();
    await CfaModel.findByIdAndDelete(idToDelete);
  });

  loadingBar.stop();
  logger.info(`${cfasIdsToDelete.length} Cfas not found in DossierApprenant to delete !`);
};

/**
 * Get the cfas uai list in Cfas collection but not in DossierApprenants collection
 * @returns
 */
const getCfasIdsNotInDossierApprenants = async () => {
  const cfasIdsNotInDossierApprenants = new Set();

  await asyncForEach(await CfaModel.find({}).lean(), async (currentCfa) => {
    if ((await DossierApprenantModel.countDocuments({ uai_etablissement: currentCfa.uai })) == 0) {
      cfasIdsNotInDossierApprenants.add(currentCfa._id);
    }
  });

  return [...cfasIdsNotInDossierApprenants];
};

/**
 * Seed des cfas depuis DossierApprenants avec UAIs valid
 */
const seedCfasFromDossiersApprenantsUaisValid = async (cfas) => {
  // All distinct valid uais
  const allUais = await DossierApprenantModel.distinct("uai_etablissement");

  logger.info(`Seeding Referentiel CFAs from ${allUais.length} distincts UAIs found in DossierApprenant`);

  loadingBar.start(allUais.length, 0);
  let nbUpdate = 0;
  let nbCreation = 0;

  await asyncForEach(allUais, async (currentUai) => {
    loadingBar.increment();

    // Gets dossiers & sirets for UAI
    const dossierForUai = await DossierApprenantModel.findOne({
      uai_etablissement: currentUai,
    });
    const allSiretsForUai = await DossierApprenantModel.distinct("siret_etablissement", {
      uai_etablissement: currentUai,
      siret_etablissement_valid: true,
    });

    const cfaExistant = await CfaModel.findOne({ uai: currentUai }).lean();

    // Create or update CFA
    if (dossierForUai) {
      if (cfaExistant) {
        await updateCfaFromDossierApprenant(cfas, cfaExistant, dossierForUai, allSiretsForUai);
        nbUpdate++;
      } else {
        await createCfaFromDossierApprenant(cfas, dossierForUai, allSiretsForUai);
        nbCreation++;
      }
    }
  });

  loadingBar.stop();

  logger.info(`${nbUpdate} Cfas updated from DossierApprenants`);
  logger.info(`${nbCreation} Cfas created from DossierApprenants`);
};

/**
 * Create cfa from dossier & generate an accessToken and privateUrl for this cfa
 * @param {*} dossierForCfa
 */
const createCfaFromDossierApprenant = async (cfas, dossierForCfa, allSirets) => {
  const accessToken = generateRandomAlphanumericPhrase();

  await new CfaModel({
    uai: dossierForCfa.uai_etablissement,
    sirets: allSirets,
    nom: dossierForCfa.nom_etablissement.trim() ?? null,
    nom_tokenized: Cfa.createTokenizedNom(dossierForCfa.nom_etablissement),
    adresse: dossierForCfa.etablissement_adresse,
    erps: [dossierForCfa.source],
    region_nom: dossierForCfa.etablissement_nom_region,
    region_num: dossierForCfa.etablissement_num_region,
    access_token: accessToken,
    private_url: `${config.publicUrl}/cfas/${accessToken}`,
    first_transmission_date: await cfas.getCfaFirstTransmissionDateFromUai(dossierForCfa.uai_etablissement),
  }).save();
};

/**
 * Update cfa from statut
 * @param {*} dossierForCfa
 */
const updateCfaFromDossierApprenant = async (cfas, cfaExistant, dossierForCfa, allSirets) => {
  await CfaModel.findOneAndUpdate(
    { _id: cfaExistant._id },
    {
      $set: {
        uai: dossierForCfa.uai_etablissement,
        nom: dossierForCfa.nom_etablissement.trim() ?? null,
        nom_tokenized: Cfa.createTokenizedNom(dossierForCfa.nom_etablissement),
        adresse: dossierForCfa.etablissement_adresse,
        sirets: allSirets,
        erps: [dossierForCfa.source],
        region_nom: dossierForCfa.etablissement_nom_region,
        region_num: dossierForCfa.etablissement_num_region,
        first_transmission_date: await cfas.getCfaFirstTransmissionDateFromUai(dossierForCfa.uai_etablissement),
      },
    }
  );
};

/**
 * Update cfas network informations in collection
 * @param {*} ovhStorage
 * @param {*} param1
 */
const updateCfasNetworksFromCsv = async (ovhStorage, { nomReseau, nomFichier, encoding }) => {
  logger.info(`Updating CFAs network for ${nomReseau}`);
  const cfasReferenceFilePath = path.join(__dirname, `./assets/${nomFichier}.csv`);

  // Get Reference CSV File if needed
  await ovhStorage.downloadIfNeededFileTo(`cfas-reseaux/${nomFichier}.csv`, cfasReferenceFilePath);

  const allCfasForNetworkFile = readJsonFromCsvFile(cfasReferenceFilePath, encoding);
  loadingBar.start(allCfasForNetworkFile.length, 0);

  // Parse all cfas in file
  await asyncForEach(allCfasForNetworkFile, async (currentCfaInCsv) => {
    loadingBar.increment();

    if (currentCfaInCsv.uai) {
      // Gets cfas for UAI in collection
      const cfaForUai = await CfaModel.findOne({ uai: `${currentCfaInCsv.uai}` }).lean();

      if (cfaForUai) {
        // Do not handle cfa in network AGRI and having GESTI as ERP
        if (nomReseau === RESEAUX_CFAS.AGRI.nomReseau && cfaForUai.erps.includes(ERPS.GESTI.nomErp.toLowerCase())) {
          return;
        }
        // Update cfa in collection
        await updateCfaFromNetwork(cfaForUai, currentCfaInCsv, nomReseau, nomFichier);
      }
    }
  });

  loadingBar.stop();
  logger.info(`All cfas from ${nomFichier}.csv file were handled !`);
};

/**
 * Update cfa in collection if it has not this network already
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
 * Seed metiers from LBA Api
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
      await sleep(API_DELAY_QUOTA); // Delay for LBA Api quota

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
