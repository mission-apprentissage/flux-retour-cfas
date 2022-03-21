const { runScript } = require("../scriptWrapper");
const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { DossierApprenantModel, CfaModel } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de récupérer les réseaux de cfas
 * pour chaque DossierApprenant
 */
runScript(async () => {
  logger.info("Run Cfas Network Retrieving Job");
  await retrieveNetworks();
  logger.info("End Cfas Network Retrieving Job");
}, JOB_NAMES.dossiersApprenantsRetrieveNetworks);

/**
 * Parse tous les CFAs ayant un réseau de cfas
 * MAJ les DossierApprenant pour ce CFA
 */
const retrieveNetworks = async () => {
  // Parse tous les CFAs du référentiel avec un réseau
  const cfasWithReseaux = await CfaModel.find({
    reseaux: { $exists: true },
  }).lean();

  logger.info(`Searching for ${cfasWithReseaux.length} CFAs in référentiel`);
  loadingBar.start(cfasWithReseaux.length, 0);

  await asyncForEach(cfasWithReseaux, async (cfaReferentiel) => {
    // Si siret fourni on update les statuts pour ce siret
    if (cfaReferentiel.sirets) {
      // Recupération des DossierApprenant pour ces sirets
      const statutsForSirets = await DossierApprenantModel.find({
        siret_etablissement: { $in: cfaReferentiel.sirets },
      }).lean();
      if (statutsForSirets) {
        await updateNetworksForStatuts(statutsForSirets, cfaReferentiel);
      }
    } else {
      // Sinon si uai fourni on update les statuts pour cet uai
      if (cfaReferentiel.uai) {
        // Recupération des DossierApprenant pour cet uai
        const statutsForUai = await DossierApprenantModel.find({ uai_etablissement: cfaReferentiel.uai }).lean();
        if (statutsForUai) {
          await updateNetworksForStatuts(statutsForUai, cfaReferentiel);
        }
      }
    }

    loadingBar.increment();
  });

  loadingBar.stop();
};

/**
 * Méthode de MAJ d'une liste de DossierApprenant à partir d'un CFA du référentiel
 * @param {*} statutsToUpdate
 * @param {*} cfaReferentiel
 * @returns
 */
const updateNetworksForStatuts = async (statutsToUpdate, cfaReferentiel) => {
  await asyncForEach(statutsToUpdate, async (currentStatut) => {
    // Update du statut s'il n'a pas de réseau
    if (!currentStatut.etablissement_reseaux) {
      await addReseauxToDossierApprenant(currentStatut, cfaReferentiel.reseaux);
    } else {
      // Identification des réseaux manquants dans le statut, et update si nécessaire
      const missingNetworks = cfaReferentiel.reseaux.filter((x) => !currentStatut.etablissement_reseaux.includes(x));
      if (missingNetworks.length > 0) {
        await addReseauxToDossierApprenant(currentStatut, missingNetworks);
      }
    }
  });
};

/**
 * Ajout de réseaux à un DossierApprenant
 * @param {*} currentStatutForSiret
 * @param {*} reseauxToAdd
 */
const addReseauxToDossierApprenant = async (currentStatutForSiret, reseauxToAdd) => {
  await DossierApprenantModel.findByIdAndUpdate(
    currentStatutForSiret._id,
    {
      $addToSet: {
        etablissement_reseaux: reseauxToAdd,
      },
    },
    { new: true }
  );
};
