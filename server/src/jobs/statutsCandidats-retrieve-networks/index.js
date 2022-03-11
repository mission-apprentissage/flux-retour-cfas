const { runScript } = require("../scriptWrapper");
const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { StatutCandidatModel, CfaModel } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/constants/jobsConstants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de récupérer les réseaux de cfas
 * pour chaque statutCandidat
 */
runScript(async () => {
  logger.info("Run Cfas Network Retrieving Job");
  await retrieveNetworks();
  logger.info("End Cfas Network Retrieving Job");
}, jobNames.statutsCandidatsRetrieveNetworks);

/**
 * Parse tous les CFAs ayant un réseau de cfas
 * MAJ les statuts pour ce CFA
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
      // Recupération des statutsCandidats pour ces sirets
      const statutsForSirets = await StatutCandidatModel.find({
        siret_etablissement: { $in: cfaReferentiel.sirets },
      }).lean();
      if (statutsForSirets) {
        await updateNetworksForStatuts(statutsForSirets, cfaReferentiel);
      }
    } else {
      // Sinon si uai fourni on update les statuts pour cet uai
      if (cfaReferentiel.uai) {
        // Recupération des statutsCandidats pour cet uai
        const statutsForUai = await StatutCandidatModel.find({ uai_etablissement: cfaReferentiel.uai }).lean();
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
 * Méthode de MAJ d'une liste de statutsCandidats à partir d'un CFA du référentiel
 * @param {*} statutsToUpdate
 * @param {*} cfaReferentiel
 * @returns
 */
const updateNetworksForStatuts = async (statutsToUpdate, cfaReferentiel) => {
  await asyncForEach(statutsToUpdate, async (currentStatut) => {
    // Update du statut s'il n'a pas de réseau
    if (!currentStatut.etablissement_reseaux) {
      await addReseauxToStatutCandidat(currentStatut, cfaReferentiel.reseaux);
    } else {
      // Identification des réseaux manquants dans le statut, et update si nécessaire
      const missingNetworks = cfaReferentiel.reseaux.filter((x) => !currentStatut.etablissement_reseaux.includes(x));
      if (missingNetworks.length > 0) {
        await addReseauxToStatutCandidat(currentStatut, missingNetworks);
      }
    }
  });
};

/**
 * Ajout de réseaux à un statutCandidat
 * @param {*} currentStatutForSiret
 * @param {*} reseauxToAdd
 */
const addReseauxToStatutCandidat = async (currentStatutForSiret, reseauxToAdd) => {
  await StatutCandidatModel.findByIdAndUpdate(
    currentStatutForSiret._id,
    {
      $addToSet: {
        etablissement_reseaux: reseauxToAdd,
      },
    },
    { new: true }
  );
};
