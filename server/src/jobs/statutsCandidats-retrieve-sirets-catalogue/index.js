const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const cliProgress = require("cli-progress");
const { StatutCandidat } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/model/constants");
const { getFormations2021 } = require("../../common/apis/apiCatalogueMna");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de retrouver les sirets manquants dans les statutsCandidats depuis le Catalogue
 * en se basant sur les UAI et les CFD
 */
runScript(async () => {
  logger.info("Run StatutCandidats - Siret Catalogue Retrieving Job");

  // Récupère tous les coupes UAI - CFD existants pour les statuts avec sirets invalides & uai valides
  const uaiCfdCouples = (
    await StatutCandidat.aggregate([
      {
        $match: {
          uai_etablissement_valid: true,
          siret_etablissement_valid: false,
        },
      },
      {
        $group: {
          _id: { uai: "$uai_etablissement", cfd: "$id_formation" },
        },
      },
    ])
  ).map((item) => ({ uai: item._id.uai, cfd: item._id.cfd }));

  loadingBar.start(uaiCfdCouples.length, 0);
  let nbHandled = 0;

  await asyncForEach(uaiCfdCouples, async (currentUaiCfd) => {
    nbHandled++;
    loadingBar.update(nbHandled);

    // Récupère les sirets depuis le catalogue à partir du CFD + UAI étant dans l'un des 3 types d'uais des formations
    const infoCatalog = await getFormations2021({
      query: {
        published: true,
        cfd: currentUaiCfd.cfd,
        $or: [
          { uai_formation: currentUaiCfd.uai },
          { etablissement_formateur_uai: currentUaiCfd.uai },
          { etablissement_gestionnaire_uai: currentUaiCfd.uai },
        ],
      },
      select: { etablissement_gestionnaire_siret: 1, etablissement_formateur_siret: 1 },
    });

    if (infoCatalog.length > 0) {
      // Récupère tous les statuts ayant ce couple UAI & CFD et un siret invalide
      const statutsForUaiCfdCouple = await StatutCandidat.find({
        uai_etablissement: currentUaiCfd.uai,
        id_formation: currentUaiCfd.cfd,
        siret_etablissement_valid: false,
      });

      await asyncForEach(statutsForUaiCfdCouple, async (currentStatutToUpdate) => {
        // MAJ etablissement_gestionnaire_siret && etablissement_formateur_siret
        await StatutCandidat.findByIdAndUpdate(
          currentStatutToUpdate._id,
          {
            etablissement_gestionnaire_siret: infoCatalog[0].etablissement_gestionnaire_siret,
            etablissement_formateur_siret: infoCatalog[0].etablissement_formateur_siret,
          },
          { new: true }
        );
      });
    }
  });

  loadingBar.stop();
  logger.info("End StatutCandidats - Sirets Retrieving Job");
}, jobNames.statutsCandidatsRetrieveSiretCatalog);
