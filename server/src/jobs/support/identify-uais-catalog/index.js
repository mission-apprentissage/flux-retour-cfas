const cliProgress = require("cli-progress");
const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");
const { JOB_NAMES } = require("../../../common/constants/jobsConstants");
const { DossierApprenantModel } = require("../../../common/model");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { getFormations } = require("../../../common/apis/apiCatalogueMna");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet d'identifier les différents types d'UAIs des statuts candidats
 */
runScript(async () => {
  logger.info(`Identifying UAIs types from Statuts`);
  const allDistinctUais = await DossierApprenantModel.distinct("uai_etablissement");

  loadingBar.start(allDistinctUais.length, 0);

  let uaisAsFormation = [];
  let uaisAsFormateur = [];
  let uaisAsGestionnaire = [];
  let uaisNotFoundCatalog = [];

  await asyncForEach(allDistinctUais, async (currentUai) => {
    loadingBar.increment();

    // Call Catalog API By - uai_formation or etablissement_gestionnaire_uai or etablissement_formateur_uai
    const formationsForUai = await getFormations({
      query: {
        published: true,
        $or: [
          { uai_formation: currentUai },
          { etablissement_formateur_uai: currentUai },
          { etablissement_gestionnaire_uai: currentUai },
        ],
      },
      select: {
        uai_formation: 1,
        etablissement_formateur_uai: 1,
        etablissement_gestionnaire_uai: 1,
        etablissement_gestionnaire_siret: 1,
        etablissement_formateur_siret: 1,
        lieu_formation_siret: 1,
      },
    });

    // Build lists depending results
    if (formationsForUai.length === 0) {
      uaisNotFoundCatalog.push({ uai: currentUai });
    }

    if (formationsForUai.some((item) => item.uai_formation === currentUai)) {
      uaisAsFormation.push({
        uai: currentUai,
        etablissement_gestionnaire_siret: formationsForUai[0].etablissement_gestionnaire_siret,
        etablissement_formateur_siret: formationsForUai[0].etablissement_formateur_siret,
      });
    }

    if (formationsForUai.some((item) => item.etablissement_formateur_uai === currentUai)) {
      uaisAsFormateur.push({
        uai: currentUai,
        etablissement_gestionnaire_siret: formationsForUai[0].etablissement_gestionnaire_siret,
        etablissement_formateur_siret: formationsForUai[0].etablissement_formateur_siret,
      });
    }

    if (formationsForUai.some((item) => item.etablissement_gestionnaire_uai === currentUai)) {
      uaisAsGestionnaire.push({
        uai: currentUai,
        etablissement_gestionnaire_siret: formationsForUai[0].etablissement_gestionnaire_siret,
        etablissement_formateur_siret: formationsForUai[0].etablissement_formateur_siret,
      });
    }
  });

  loadingBar.stop();

  logger.info(`Nb d'UAIs différents dans les statuts : ${allDistinctUais.length}`);
  logger.info(`Nb d'UAIs responsable non trouvés dans le catalogue : ${uaisNotFoundCatalog.length}`);
  logger.info(`Nb d'UAIs formation trouvés dans le catalogue : ${uaisAsFormation.length}`);
  logger.info(`Nb d'UAIs formateur trouvés dans le catalogue : ${uaisAsFormateur.length}`);
  logger.info(`Nb d'UAIs gestionnaires trouvés dans le catalogue : ${uaisAsGestionnaire.length}`);

  logger.info("End !");
}, JOB_NAMES.identifyUaisInCatalog);
