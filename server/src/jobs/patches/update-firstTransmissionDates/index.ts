import { ObjectId } from "bson";

import logger from "@/common/logger";
import { effectifsDb, organismesDb } from "@/common/model/collections";

let nbOrganismesUpdated = 0;

/**
 * Fonction de MAJ de la last_transmission_date des organismes avec effectifs
 */
export const updateFirstTransmissionDateForOrganismes = async () => {
  logger.info("MAJ de la first_transmission_date des organismes liés a des effectifs ... ");

  const cursor = effectifsDb().aggregate<{ _id: ObjectId; first_created_at: Date }>([
    {
      $sort: {
        organisme_id: 1,
        created_at: 1,
      },
    },
    {
      $group: {
        _id: "$organisme_id",
        first_created_at: {
          $first: "$created_at",
        },
      },
    },
  ]);

  for await (const { _id: organisme_id, first_created_at } of cursor) {
    await organismesDb().updateOne(
      { _id: organisme_id },
      { $set: { first_transmission_date: first_created_at, updated_at: new Date() } }
    );
    nbOrganismesUpdated++;
  }

  logger.info(`${nbOrganismesUpdated} organismes mis à jour ...`);
};
