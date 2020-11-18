const config = require("config");
const cliProgress = require("cli-progress");
const logger = require("../../../common/logger");
const dsFetcher = require("../../../common/dsFetcher");
const createMnaCatalogApi = require("../../../common/apis/mnaCatalogApi");
const apiEntreprise = require("../../../common/apis/apiEntreprise");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { mapDsChamps } = require("../utils/dsMapper");
const { DsDossier } = require("../../../common/model");
const { getPercentageFromTotal } = require("../utils/calculUtils");

let mnaApi = null;
const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Module d'import des données DS
 * @param {*} sample
 */
module.exports = async (sample) => {
  // Init DS Config + Mna Api
  logger.info("Init Ds Config & Mna Api ...");
  mnaApi = await createMnaCatalogApi();
  dsFetcher.config({
    id: config.demarchesSimplifiees.procedureCfas2020Id,
    token: config.demarchesSimplifiees.apiToken,
  });

  // Import des données DS + Api
  logger.info("Import des dossiers DS...");
  await importAllDossiers(sample);

  // Log
  const nbDossiers = await DsDossier.countDocuments({});
  logger.info(`${nbDossiers} dossiers importés avec succès ...`);
};

/**
 * Récupération de toutes les données des dossiers DS
 * Construction de la liste des réponses aux questions
 * @param {*} sample
 */
const importAllDossiers = async (sample = null) => {
  const allDossiers = sample ? (await dsFetcher.getDossiers()).splice(0, sample) : await dsFetcher.getDossiers();
  const totalNbFormationsInCatalog = await mnaApi.getFormationsCount();
  let nbDossierTraites = 0;

  loadingBar.start(allDossiers.length, 0);
  await asyncForEach(allDossiers, async ({ id }) => {
    const currentDossier = await dsFetcher.getDossier(id);
    let missingSirenForCurrentDossier = false;
    let missingSiretForCurrentDossier = false;

    nbDossierTraites++;
    loadingBar.update(nbDossierTraites);

    if (currentDossier) {
      if (currentDossier.dossier) {
        // Add questions mapped
        const questions = await mapDsChamps(currentDossier.dossier);
        let fullDossier = { ...currentDossier.dossier, ...questions };

        // Get data from Mna Api Catalog
        let etablissementsInCatalog = await mnaApi.getEtablissementBySiret(currentDossier.dossier.etablissement.siret);

        // Call api entreprise + update timestamps
        const infoApiEntreprise = currentDossier.dossier.entreprise.siren
          ? await apiEntreprise.getEntrepriseInfoFromSiren(currentDossier.dossier.entreprise.siren, true)
          : [];

        // Find by siret not available
        if (etablissementsInCatalog.etablissements.length === 0) {
          missingSiretForCurrentDossier = true;
          etablissementsInCatalog = await mnaApi.getEtablissementBySiren(currentDossier.dossier.entreprise.siren);

          // Find by siren not available
          if (etablissementsInCatalog.etablissements.length === 0) {
            missingSirenForCurrentDossier = true;
          }
        } else {
          const etablissementInCatalog = etablissementsInCatalog.etablissements[0];

          if (etablissementInCatalog) {
            const nbFormationsForEtablissement = etablissementInCatalog.formations_ids
              ? etablissementInCatalog.formations_ids.length
              : 0;
            fullDossier = {
              ...fullDossier,
              ...{
                catalogInfos: {
                  nbFormations: nbFormationsForEtablissement,
                  tauxVolumetrieFormationsCatalogue: getPercentageFromTotal(
                    nbFormationsForEtablissement,
                    totalNbFormationsInCatalog
                  ),
                  num_academie: etablissementInCatalog.num_academie,
                  nom_academie: etablissementInCatalog.nom_academie,
                  region_implantation_code: etablissementInCatalog.region_implantation_code,
                  region_implantation_nom: etablissementInCatalog.region_implantation_nom,
                },
              },
            };
          }
        }

        // Add in db
        const dsDossier = new DsDossier({
          dossier: fullDossier,
          infos_api_entreprise: infoApiEntreprise,
          siren_present_catalogue: !missingSirenForCurrentDossier,
          siret_present_catalogue: !missingSiretForCurrentDossier,
        });
        await dsDossier.save();
      }
    }
  });
  loadingBar.stop();
};
