const { runScript } = require("../scriptWrapper");
const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { DossierApprenantModel } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");
const { getFormations } = require("../../common/apis/apiCatalogueMna");
const { sleep } = require("../../common/utils/miscUtils");

const CATALOGUE_API_REQUEST_DELAY = 150;

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet d'identifier pour chaque DossierApprenant si sa formation est présente dans le catalogue MNA
 * en se basant sur le CFD et le SIRET
 */
runScript(async () => {
  logger.info("Run DossierApprenant retrieve formations in MNA Catalog Job");
  await retrieveFormationsInCatalog();
  logger.info("End DossierApprenant retrieve formations in MNA Catalog Job");
}, JOB_NAMES.dossiersApprenantsRetrieveFormationsInCatalog);

/**
 * Parse tous les Couples SIRET - CFD des DossierApprenant vérifie si la formation existe dans le catalogue MNA
 */
const retrieveFormationsInCatalog = async () => {
  // Récupère tous les coupes SIRET - CFD existants pour les statuts avec sirets valides
  const allSiretCfdCouples = await DossierApprenantModel.aggregate([
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
    const formationsFoundInCatalog = await getFormations({
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
      // Si formation trouvée dans catalogue MNA , update de tous les DossierApprenant pour ce CFD + Siret
      await DossierApprenantModel.updateMany(
        { formation_cfd: currentSiretCfdCouple.cfd, siret_etablissement: currentSiretCfdCouple.siret },
        { match_formation_mnaCatalog_cfd_siret: true }
      );
    }

    await sleep(CATALOGUE_API_REQUEST_DELAY);
    loadingBar.increment();
  });

  loadingBar.stop();
};
