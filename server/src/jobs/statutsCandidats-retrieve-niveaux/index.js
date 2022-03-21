const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const cliProgress = require("cli-progress");
const { DossierApprenantModel, FormationModel } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de mettre à jour les niveaux des DossierApprenant en se basant sur le référentiel Formations
 * Pour chaque formation du référentiel ayant un niveau, on met à jour les statuts matchant sur le cfd
 */
runScript(async () => {
  logger.info("Run DossierApprenant - Niveau Retrieving Job");

  // get all valid formations with niveau & cfd not empty
  const formationsWithNiveau = await FormationModel.find({ niveau: { $ne: "" }, cfd: { $ne: "" } });
  logger.info(`${formationsWithNiveau.length} Formations with niveau & cfd`);

  loadingBar.start(formationsWithNiveau.length, 0);

  await asyncForEach(formationsWithNiveau, async (currentFormation) => {
    // get all DossierApprenant for this cfd
    const statutsForFormation = await DossierApprenantModel.find({ formation_cfd: currentFormation.cfd });

    // Update niveau for all DossierApprenant
    await asyncForEach(statutsForFormation, async (currentStatutToUpdate) => {
      await DossierApprenantModel.findByIdAndUpdate(
        currentStatutToUpdate._id,
        {
          niveau_formation: currentFormation.niveau,
          niveau_formation_libelle: currentFormation.niveau_libelle,
        },
        { new: true }
      );
    });

    loadingBar.increment();
  });

  loadingBar.stop();
  logger.info("End DossierApprenant - Niveau Retrieving Job");
}, JOB_NAMES.dossiersApprenantsRetrieveNiveaux);
