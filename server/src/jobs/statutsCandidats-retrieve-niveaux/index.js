const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const cliProgress = require("cli-progress");
const { StatutCandidatModel, FormationModel } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/model/constants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de mettre à jour les niveaux des StatutsCandidats en se basant sur le référentiel Formations
 * Pour chaque formation du référentiel ayant un niveau, on met à jour les statuts matchant sur le cfd
 */
runScript(async () => {
  logger.info("Run StatutCandidats - Niveau Retrieving Job");

  // get all valid formations with niveau & cfd not empty
  const formationsWithNiveau = await FormationModel.find({ niveau: { $ne: "" }, cfd: { $ne: "" } });
  logger.info(`${formationsWithNiveau.length} Formations with niveau & cfd`);

  loadingBar.start(formationsWithNiveau.length, 0);

  await asyncForEach(formationsWithNiveau, async (currentFormation) => {
    // get all statutsCandidats for this cfd
    const statutsForFormation = await StatutCandidatModel.find({ formation_cfd: currentFormation.cfd });

    // Update niveau for all statutsCandidats
    await asyncForEach(statutsForFormation, async (currentStatutToUpdate) => {
      await StatutCandidatModel.findByIdAndUpdate(
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
  logger.info("End StatutCandidats - Niveau Retrieving Job");
}, jobNames.statutsCandidatsRetrieveNiveaux);
