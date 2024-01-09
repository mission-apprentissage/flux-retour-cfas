import { captureException } from "@sentry/node";

import { updateOrganismeFromApis } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";

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
export const updateMultipleOrganismesWithApis = async () => {
  // On récupère l'intégralité des organismes depuis le référentiel ayant un siret (nécessaire pour un update valide)
  const organismesToUpdate = await organismesDb()
    .find({ siret: { $exists: true } })
    .toArray();

  logger.info(`Mise à jour avec appels API des ${organismesToUpdate.length} organismes ...`);

  for (const organisme of organismesToUpdate) {
    logger.info(`Mise à jour de l'organisme UAI ${organisme.uai || "inconnu"} - SIRET ${organisme.siret} ...`);

    try {
      await updateOrganismeFromApis(organisme);
      nbOrganismeUpdated++;
    } catch (error: any) {
      captureException(error);
      nbOrganismeNotUpdated++;
      logger.error({ error }, `Erreur lors de la mise à jour de l'organisme ${organisme._id}: ${error.message}`);
    }

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
