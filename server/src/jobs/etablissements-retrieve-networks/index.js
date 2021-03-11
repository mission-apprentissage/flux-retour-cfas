const { runScript } = require("../scriptWrapper");
const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { StatutCandidat, Cfa } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/model/constants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de récupérer les réseaux de cfas
 * pour chaque statutCandidat ayant un SIRET ou UAI
 */
runScript(async () => {
  logger.info("Run Cfas Network Retrieving Job");
  await retrieveNetworksForSiretValid();
  await retrieveNetworksForUaiValid();
  logger.info("End Cfas Network Retrieving Job");
}, jobNames.etablissementsRetrieveNetworks);

/**
 * Parse tous les statuts ayant un siret valid et pas de réseaux de cfas
 * Récupère si possible le(s) réseaux depuis le référentiel
 */
const retrieveNetworksForSiretValid = async () => {
  // Parse all statutsCandidat with siret_etablissement & etablissement reseaux does not exists
  const statutsWithSiretAndNoNetworks = await StatutCandidat.find({
    siret_etablissement_valid: true,
    etablissement_reseaux: { $exists: false },
  });

  logger.info(`Searching for ${statutsWithSiretAndNoNetworks.length} statuts with Sirets valid and No Networks`);
  loadingBar.start(statutsWithSiretAndNoNetworks.length, 0);

  let nbHandled = 0;
  let nbUpdated = 0;
  let nbNotFound = 0;
  let nbReseauxNotFound = 0;

  await asyncForEach(statutsWithSiretAndNoNetworks, async (statutCandidat) => {
    nbHandled++;

    // Get networks from referentiel Cfas
    const referentielCfaFromSiret = await Cfa.findOne({ siret: statutCandidat.siret_etablissement });

    if (referentielCfaFromSiret) {
      if (referentielCfaFromSiret.reseaux) {
        // Update in db
        await StatutCandidat.findByIdAndUpdate(
          statutCandidat._id,
          {
            $addToSet: {
              etablissement_reseaux: referentielCfaFromSiret.reseaux,
              fichiers_reference: referentielCfaFromSiret.fichiers_reference,
            },
          },
          { new: true }
        );
        nbUpdated++;
      } else {
        nbReseauxNotFound++;
      }
    } else {
      nbNotFound++;
    }

    loadingBar.update(nbHandled);
  });

  loadingBar.stop();

  logger.info(`${nbUpdated} statuts candidats updated in db for siret`);
  logger.info(`${nbNotFound} cfa not found in referentiel Cfas for siret`);
  logger.info(`${nbReseauxNotFound} reseaux not found in referentiel Cfas for siret`);
};

/**
 * Parse tous les statuts ayant un uai valid et pas de réseaux de cfas
 * Récupère si possible le(s) réseaux depuis le référentiel
 */
const retrieveNetworksForUaiValid = async () => {
  // Parse all statutsCandidat with uai_etablissement & etablissement reseaux does not exists
  const statutsWithUaiAndNoNetworks = await StatutCandidat.find({
    uai_etablissement_valid: true,
    etablissement_reseaux: { $exists: false },
  });

  logger.info(`Searching for ${statutsWithUaiAndNoNetworks.length} statuts with Uai valid and No Networks`);
  loadingBar.start(statutsWithUaiAndNoNetworks.length, 0);

  let nbHandled = 0;
  let nbUpdated = 0;
  let nbNotFound = 0;
  let nbReseauxNotFound = 0;

  await asyncForEach(statutsWithUaiAndNoNetworks, async (statutCandidat) => {
    nbHandled++;

    // Get networks from referentiel Cfas
    const referentielCfaFromUai = await Cfa.findOne({ uai: statutCandidat.uai_etablissement });

    if (referentielCfaFromUai) {
      if (referentielCfaFromUai.reseaux) {
        // Update in db
        await StatutCandidat.findByIdAndUpdate(
          statutCandidat._id,
          {
            $addToSet: {
              etablissement_reseaux: referentielCfaFromUai.reseaux,
              fichiers_reference: referentielCfaFromUai.fichiers_reference,
            },
          },
          { new: true }
        );
        nbUpdated++;
      } else {
        nbReseauxNotFound++;
      }
    } else {
      nbNotFound++;
    }

    loadingBar.update(nbHandled);
  });

  loadingBar.stop();

  logger.info(`${nbUpdated} statuts candidats updated in db for uai`);
  logger.info(`${nbNotFound} cfa not found in referentiel Cfas for uai`);
  logger.info(`${nbReseauxNotFound} reseaux not found in referentiel Cfas for uai`);
};
