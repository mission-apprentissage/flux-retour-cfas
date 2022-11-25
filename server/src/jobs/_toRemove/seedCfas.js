import cliProgress from "cli-progress";
import logger from "../../common/logger.js";
import { runScript } from "../scriptWrapper.js";
import { asyncForEach } from "../../common/utils/asyncUtils.js";
import { JOB_NAMES } from "../../common/constants/jobsConstants.js";
import { RESEAUX_CFAS } from "../../common/constants/networksConstants.js";
import { ERPS } from "../../common/constants/erpsConstants.js";
import { validateSiret } from "../../common/utils/validationsUtils/siret.js";
import { dossiersApprenantsDb, cfasDb, reseauxCfasDb } from "../../common/model/collections.js";

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
    await cfasDb().deleteOne({ _id: idToDelete });
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

  await asyncForEach(await cfasDb().find({}).toArray(), async (currentCfa) => {
    if ((await dossiersApprenantsDb().countDocuments({ uai_etablissement: currentCfa.uai })) == 0) {
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
  const allUais = await dossiersApprenantsDb().distinct("uai_etablissement");

  logger.info(`Seeding Referentiel CFAs from ${allUais.length} distincts UAIs found in DossierApprenant`);

  loadingBar.start(allUais.length, 0);
  let nbUpdate = 0;
  let nbUpdateErrors = 0;
  let nbCreation = 0;
  let nbCreationErrors = 0;

  await asyncForEach(allUais, async (currentUai) => {
    loadingBar.increment();

    // Gets dossiers & sirets for UAI
    const dossierForUai = await dossiersApprenantsDb().findOne({
      uai_etablissement: currentUai,
    });
    const allSiretsForUai = await dossiersApprenantsDb().distinct("siret_etablissement", {
      uai_etablissement: currentUai,
    });
    const allValidSiretsForUai = allSiretsForUai.filter((siret) => !validateSiret(siret).error);

    const cfaExistant = await cfasDb().findOne({ uai: currentUai });

    // Create or update CFA
    if (dossierForUai) {
      if (cfaExistant) {
        const updatedCfa = await cfas.updateCfa(cfaExistant._id, dossierForUai, allValidSiretsForUai);
        if (updatedCfa !== null) {
          nbUpdate++;
        } else {
          logger.error(`Cfas with uai ${currentUai} not updated !`);
          nbUpdateErrors++;
        }
        nbUpdate++;
      } else {
        const createdCfa = await cfas.createCfa(dossierForUai, allValidSiretsForUai);
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

  const allCfasForNetworkFile = await reseauxCfasDb().find({ nom_reseau: nomReseau }).toArray();
  loadingBar.start(allCfasForNetworkFile.length, 0);

  // Parse all cfas in file
  await asyncForEach(allCfasForNetworkFile, async (currentCfa) => {
    loadingBar.increment();

    if (currentCfa.uai) {
      // Gets cfas for UAI in collection
      const cfaForUai = await cfasDb().findOne({ uai: `${currentCfa.uai}` });

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
    await cfasDb().updateOne(
      { _id: cfaInReferentiel._id },
      {
        $addToSet: { noms_cfa: cfaInFile.nom_etablissement?.trim(), reseaux: nomReseau },
      }
    );
  }
};
