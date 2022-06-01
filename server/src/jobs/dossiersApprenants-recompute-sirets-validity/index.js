const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const cliProgress = require("cli-progress");
const { DossierApprenantModel } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");
const { validateSiret } = require("../../common/domain/siret");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de recalculer la validité des sirets dans les DossierApprenant
 */
runScript(async () => {
  logger.info("Run DossierApprenant - Recompute SIRET validity Job");

  // Retrieve all distinct siret
  const distinctSiretFromDossierApprenants = await DossierApprenantModel.distinct("siret_etablissement");

  loadingBar.start(distinctSiretFromDossierApprenants.length, 0);

  // For each siret valid recheck validate method
  await asyncForEach(distinctSiretFromDossierApprenants, async (currentSiret) => {
    loadingBar.increment();

    const siretValidity = validateSiret(currentSiret);

    // MAJ all dossiers apprenants with siretValidity
    await DossierApprenantModel.updateMany(
      { siret_etablissement: currentSiret },
      { $set: { siret_etablissement_valid: siretValidity } }
    );
  });

  loadingBar.stop();
  logger.info("End DossierApprenant - Recompute SIRET validity Job");
}, JOB_NAMES.dossiersApprenantsRecomputeSiretValidity);
