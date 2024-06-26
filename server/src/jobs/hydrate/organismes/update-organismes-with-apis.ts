import { captureException } from "@sentry/node";

import { updateOneOrganismeRelatedFormations } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";

let nbOrganismeUpdated = 0;
let nbOrganismeNotUpdated = 0;

/**
 * Script qui va mettre à jour tous les organismes en appelant les APIs externes
 * - On va remplir l'arbre des formations et leurs organismes liés via l'API Catalogue
 */
export const updateAllOrganismesRelatedFormations = async () => {
  // On récupère l'intégralité des organismes depuis le référentiel ayant un siret (nécessaire pour un update valide)
  const organismesCursor = organismesDb().find({});
  const organismesCount = await organismesDb().estimatedDocumentCount();

  logger.info(`Mise à jour avec appels API des ${organismesCount} organismes ...`);

  while (await organismesCursor.hasNext()) {
    const organisme = await organismesCursor.next();
    if (organisme) {
      try {
        logger.info(`Mise à jour de l'organisme UAI ${organisme.uai || "inconnu"} - SIRET ${organisme.siret} ...`);
        await updateOneOrganismeRelatedFormations(organisme);
        nbOrganismeUpdated++;
      } catch (error: any) {
        captureException(error);
        nbOrganismeNotUpdated++;
        logger.error({ error }, `Erreur lors de la mise à jour de l'organisme ${organisme._id}: ${error.message}`);
      }
    }
  }

  // Log & stats
  logger.info(`---> ${nbOrganismeUpdated} organismes mis à jour`);
  logger.info(`---> ${nbOrganismeNotUpdated} organismes non mis à jour (erreur)`);

  return {
    nbOrganismesMaj: nbOrganismeUpdated,
    nbOrganismesNonMajErreur: nbOrganismeNotUpdated,
  };
};
