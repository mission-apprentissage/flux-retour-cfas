const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const cliProgress = require("cli-progress");
const { DossierApprenantModel } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");
const { getFormations } = require("../../common/apis/apiCatalogueMna");
const { validateSiret } = require("../../common/domain/siret");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de retrouver les uai / sirets formateurs & gestionnaires depuis l'API Catalogue
 * en se basant sur les UAI / SIRET et CFD des dossiers apprenants
 */
runScript(async () => {
  logger.info("Run DossierApprenant - Match Formateur & Gestionnaire infos Catalogue Job");

  // Récupère tous les triplets UAI / SIRET / CFD existants pour les dossiersApprenants avec sirets valides
  const uaiSiretCfdTriplets = (
    await DossierApprenantModel.aggregate([
      { $group: { _id: { uai: "$uai_etablissement", siret: "$siret_etablissement", cfd: "$formation_cfd" } } },
    ])
  )
    .filter((item) => {
      const isSiretValid = !validateSiret(item._id.siret).error;
      return isSiretValid;
    })
    .map((item) => ({ uai: item._id.uai, siret: item._id.siret, cfd: item._id.cfd }));

  loadingBar.start(uaiSiretCfdTriplets.length, 0);

  await asyncForEach(uaiSiretCfdTriplets, async (currentUaiSiretCfd) => {
    loadingBar.increment();

    // Récupère les sirets depuis le catalogue à partir du CFD + UAI étant dans l'un des 3 types d'uais des formations
    const infoCatalog = await getFormations({
      query: {
        published: true,
        cfd: currentUaiSiretCfd.cfd,
        $or: [
          { uai_formation: currentUaiSiretCfd.uai },
          { etablissement_formateur_uai: currentUaiSiretCfd.uai },
          { etablissement_gestionnaire_uai: currentUaiSiretCfd.uai },
          { etablissement_formateur_siret: currentUaiSiretCfd.siret },
          { etablissement_gestionnaire_siret: currentUaiSiretCfd.siret },
        ],
      },
      select: {
        etablissement_formateur_uai: 1,
        etablissement_gestionnaire_uai: 1,
        etablissement_formateur_siret: 1,
        etablissement_gestionnaire_siret: 1,
      },
    });

    if (infoCatalog?.length > 0) {
      // Récupère tous les statuts ayant ce triplet UAI / SIRET / CFD
      const statutsForUaiSiretCfdTriplet = await DossierApprenantModel.find({
        uai_etablissement: currentUaiSiretCfd.uai,
        siret_etablissement: currentUaiSiretCfd.siret,
        formation_cfd: currentUaiSiretCfd.cfd,
      });

      await asyncForEach(statutsForUaiSiretCfdTriplet, async (currentStatutToUpdate) => {
        // MAJ etablissement_gestionnaire_siret && etablissement_formateur_siret
        await DossierApprenantModel.findByIdAndUpdate(
          currentStatutToUpdate._id,
          {
            etablissement_formateur_uai: infoCatalog[0].etablissement_formateur_uai,
            etablissement_gestionnaire_uai: infoCatalog[0].etablissement_gestionnaire_uai,
            etablissement_formateur_siret: infoCatalog[0].etablissement_formateur_siret,
            etablissement_gestionnaire_siret: infoCatalog[0].etablissement_gestionnaire_siret,
          },
          { new: true }
        );
      });
    }
  });

  loadingBar.stop();
  logger.info("End DossierApprenant - Match Formateur & Gestionnaire infos Catalogue Job");
}, JOB_NAMES.dossiersApprenantsRetrieveFormateurGestionnairesCatalog);
