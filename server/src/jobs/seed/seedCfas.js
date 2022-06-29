const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");
const { RESEAUX_CFAS } = require("../../common/constants/networksConstants");

const { CfaModel, DossierApprenantModel, ReseauCfaModel } = require("../../common/model");
const { ERPS } = require("../../common/constants/erpsConstants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Script qui initialise la collection CFAs
 */
runScript(async ({ cfas }) => {
  logger.info("Seeding CFAs");

  // Delete all cfa in collection and not found in dossierApprenants (i.e Cfas from cleaned data)
  await clearCfasNotInDossierApprenants();

  // Seed new CFAs from Dossiers
  await seedCfasFromDossiersApprenantsUaisValid(cfas);

  // Set networks from reseauxCfas collection
  const networksNames = Object.keys(RESEAUX_CFAS).map((id) => RESEAUX_CFAS[id].nomReseau);
  await asyncForEach(networksNames, async (currentNetworkName) => {
    await updateCfasNetworksFromReseauxCfas(currentNetworkName);
  });

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
  let nbUpdateErrors = 0;
  let nbCreation = 0;
  let nbCreationErrors = 0;

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
        const updatedCfa = await cfas.updateCfa(cfaExistant._id, dossierForUai, allSiretsForUai);
        if (updatedCfa !== null) {
          nbUpdate++;
        } else {
          logger.error(`Cfas with uai ${currentUai} not updated !`);
          nbUpdateErrors++;
        }
        nbUpdate++;
      } else {
        const createdCfa = await cfas.createCfa(dossierForUai, allSiretsForUai);
        if (createdCfa !== null) {
          nbCreation++;
        } else {
          logger.error(`Cfas with uai ${currentUai} not created !`);
          nbCreationErrors++;
        }
      }
    }
  });

  loadingBar.stop();

  logger.info(`${nbUpdate} Cfas updated from DossierApprenants`);
  logger.info(`${nbUpdateErrors} Cfas not updated because errors from DossierApprenants`);
  logger.info(`${nbCreation} Cfas created from DossierApprenants`);
  logger.info(`${nbCreationErrors} Cfas not created because errors from DossierApprenants`);
};

/**
 * Update cfas network informations in collection
 * @param {*} param1
 */
const updateCfasNetworksFromReseauxCfas = async (nomReseau) => {
  logger.info(`Updating CFAs network for ${nomReseau}`);

  const allCfasForNetworkFile = await ReseauCfaModel.find({ nom_reseau: nomReseau }).lean();
  loadingBar.start(allCfasForNetworkFile.length, 0);

  // Parse all cfas in file
  await asyncForEach(allCfasForNetworkFile, async (currentCfa) => {
    loadingBar.increment();

    if (currentCfa.uai) {
      // Gets cfas for UAI in collection
      const cfaForUai = await CfaModel.findOne({ uai: `${currentCfa.uai}` }).lean();

      if (cfaForUai) {
        // Do not handle cfa in network AGRI and having GESTI as ERP
        if (nomReseau === RESEAUX_CFAS.AGRI.nomReseau && cfaForUai.erps.includes(ERPS.GESTI.nomErp.toLowerCase())) {
          return;
        }
        // Update cfa in collection
        await updateCfaFromNetwork(cfaForUai, currentCfa, nomReseau);
      }
    }
  });

  loadingBar.stop();
  logger.info(`All cfas from ${nomReseau} network were handled !`);
};

/**
 * Update cfa in collection if it has not this network already
 * @param {*} cfaInReferentiel
 * @param {*} nomReseau
 * @param {*} nomFichier
 */
const updateCfaFromNetwork = async (cfaInReferentiel, cfaInFile, nomReseau) => {
  const cfaExistantWithoutCurrentNetwork =
    !cfaInReferentiel?.reseaux || !cfaInReferentiel?.reseaux?.some((item) => item === nomReseau);

  // Update only if cfa in referentiel has not network or current network not included
  if (cfaExistantWithoutCurrentNetwork) {
    await CfaModel.findByIdAndUpdate(
      cfaInReferentiel._id,
      {
        $addToSet: { noms_cfa: cfaInFile.nom_etablissement?.trim(), reseaux: nomReseau },
      },
      { new: true }
    );
  }
};
