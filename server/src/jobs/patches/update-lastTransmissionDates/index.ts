import { PromisePool } from "@supercharge/promise-pool";
import { ObjectId } from "mongodb";

import logger from "@/common/logger";
import { effectifsDb, organismesDb } from "@/common/model/collections";

let nbOrganismesUpdated = 0;

/**
 * Fonction de MAJ de la last_transmission_date des organismes avec effectifs
 */
export const updateLastTransmissionDateForOrganismes = async () => {
  logger.info("MAJ de la last_transmission_date des organismes liés a des effectifs ... ");

  // Récupération de la liste des organismes id ayant des effectifs liés
  const organismesIdWithEffectifs = await effectifsDb().distinct("organisme_id");

  // Pour chaque organisme id ayant des effectifs on set la last_transmission_date
  // en récupérant la date de MAJ des effectifs (updated_at) la plus récente
  await PromisePool.for(organismesIdWithEffectifs).process(setLastTransmissionDateForOrganisme);

  logger.info(`${nbOrganismesUpdated} organismes mis à jour ...`);
};

/**
 * Fonction de set de la last_transmission_date en récupérant la date de MAJ des effectifs (updated_at) la plus récente
 */
const setLastTransmissionDateForOrganisme = async (organisme_id: ObjectId) => {
  const maxUpdatedDateForEffectifsForOrganisme = await effectifsDb()
    .find({ organisme_id })
    .sort({ updated_at: -1 })
    .limit(1)
    .toArray();

  const maxUpdatedDate = maxUpdatedDateForEffectifsForOrganisme[0]?.updated_at;

  if (maxUpdatedDate) {
    await organismesDb().findOneAndUpdate(
      { _id: organisme_id },
      { $set: { last_transmission_date: maxUpdatedDate, updated_at: new Date() } }
    );
    nbOrganismesUpdated++;
  }
};
