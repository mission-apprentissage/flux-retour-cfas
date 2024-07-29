import { ObjectId } from "mongodb";

import { transmissionV2Db } from "@/common/model/collections";

export const insertTransmissionV2 = async (
  organisme_transmetteur_id: string | null | undefined,
  formation_id: ObjectId
) => {
  return transmissionV2Db().insertOne({
    _id: new ObjectId(),
    created_at: new Date(),
    organisme_transmetteur_id: organisme_transmetteur_id ? new ObjectId(organisme_transmetteur_id) : null,
    formation_id,
  });
};
