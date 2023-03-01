import logger from "../../../common/logger.js";
import { updateOrganisme } from "../../../common/actions/organismes/organismes.actions.js";
import { createJobEvent } from "../../../common/actions/jobEvents.actions.js";
import { organismesDb } from "../../../common/model/collections.js";

const JOB_NAME = "update-organismes-with-apis";

let nbOrganismeUpdated = 0;
let nbOrganismeNotUpdated = 0;
const DELAY_BETWEEN_UPDATES = 250;

/**
 * Script qui va mettre à jour tous les organismes en appelant les APIs externes
 * - On va récupérer les informations établissements via le siret en utilisant l'API Entreprise
 * - On va remplir l'arbre des formations et leurs organismes liés via l'API Catalogue
 * - On va récupérer les métiers associés via l'API LaBonneAlternance
 * Pas de promisePool pour pouvoir respecter les rateLimits des API
 */
export const updateOrganismesWithApis = async () => {
  // On récupère l'intégralité des organismes depuis le référentiel ayant un siret (nécessaire pour un update valide)
  const organismesToUpdate = await organismesDb()
    .find({ siret: { $exists: true } })
    .toArray();

  logger.info(`Mise à jour avec appels API des ${organismesToUpdate.length} organismes ...`);

  for (const currentOrganismeFromReferentiel of organismesToUpdate) {
    const { uai, siret } = currentOrganismeFromReferentiel;
    logger.info(`Mise à jour de l'organisme UAI ${uai || "inconnu"} - SIRET ${siret} ...`);

    await updateOrganismeWithApis(currentOrganismeFromReferentiel);

    // Delai entre les updates pour limites API
    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_UPDATES));
  }

  // Log & stats
  logger.info(`---> ${nbOrganismeUpdated} organismes mis à jour`);
  logger.info(`---> ${nbOrganismeNotUpdated} organismes non mis à jour (erreur)`);

  return {
    nbOrganismesMaj: nbOrganismeUpdated,
    nbOrganismesNonMajErreur: nbOrganismeNotUpdated,
  };
};

/**
 * Fonction de maj d'un organisme en appelant les APIs externes
 * @param {*} organisme
 */
const updateOrganismeWithApis = async (organisme) => {
  try {
    await updateOrganisme(
      organisme._id,
      { ...organisme },
      {
        buildFormationTree: true,
        buildInfosFromSiret: true,
        callLbaApi: true,
      }
    );
    nbOrganismeUpdated++;
  } catch (error) {
    nbOrganismeNotUpdated++;
    await createJobEvent({
      jobname: JOB_NAME,
      date: new Date(),
      action: "organisme-not-updated",
      data: { organisme, error },
    });
  }
};
