const { runScript } = require("../scriptWrapper");
const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { StatutCandidatModel } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/constants/jobsConstants");
const { getFormations2021 } = require("../../common/apis/apiCatalogueMna");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet d'identifier pour chaque statutsCandidats si sa formation est présente dans le catalogue MNA
 * en se basant sur le CFD et le SIRET
 */
runScript(async () => {
  logger.info("Run StatutsCandidats retrieve formations in MNA Catalog Job");
  await retrieveFormationsInCatalog();
  logger.info("End StatutsCandidats retrieve formations in MNA Catalog Job");
}, jobNames.statutsCandidatsRetrieveFormationsInCatalog);

/**
 * Parse tous les Couples SIRET - CFD des StatutsCandidats vérifie si la formation existe dans le catalogue MNA
 */
const retrieveFormationsInCatalog = async () => {
  // Récupère tous les coupes SIRET - CFD existants pour les statuts avec sirets valides
  const allSiretCfdCouples = await StatutCandidatModel.aggregate([
    { $match: { siret_etablissement_valid: true } },
    { $group: { _id: { siret: "$siret_etablissement", cfd: "$formation_cfd" } } },
    {
      $project: {
        _id: 0,
        siret: "$_id.siret",
        cfd: "$_id.cfd",
      },
    },
  ]);

  logger.info(`Searching for ${allSiretCfdCouples.length} siret-cfd couples in référentiel`);
  loadingBar.start(allSiretCfdCouples.length, 0);

  await asyncForEach(allSiretCfdCouples, async (currentSiretCfdCouple) => {
    // Recherche dans l'API Catalogue sur CFD + etablissement_formateur_siret / etablissement_gestionnaire_siret
    const formationsFoundInCatalog = await getFormations2021({
      query: {
        published: true,
        cfd: currentSiretCfdCouple.cfd,
        $or: [
          { etablissement_formateur_siret: currentSiretCfdCouple.siret },
          { etablissement_gestionnaire_siret: currentSiretCfdCouple.siret },
        ],
      },
    });

    if (formationsFoundInCatalog.length > 0) {
      // Si formation trouvée dans catalogue MNA , update de tous les statutsCandidats pour ce CFD + Siret
      await StatutCandidatModel.updateMany(
        { formation_cfd: currentSiretCfdCouple.cfd, siret_etablissement: currentSiretCfdCouple.siret },
        { match_formation_mnaCatalog_cfd_siret: true }
      );
    }

    loadingBar.increment();
  });

  loadingBar.stop();
};
