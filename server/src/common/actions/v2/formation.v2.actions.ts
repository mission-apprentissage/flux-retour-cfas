import { ObjectId } from "mongodb";

import { formationV2Db } from "@/common/model/collections";

export const insertFormationV2 = async (
  cfd: string,
  rncp: string,
  organisme_responsable_id: ObjectId,
  organisme_formateur_id: ObjectId
) => {
  return formationV2Db().insertOne({
    _id: new ObjectId(),
    draft: true,
    created_at: new Date(),
    updated_at: new Date(),
    cfd: cfd,
    rncp: rncp,
    organisme_responsable_id,
    organisme_formateur_id,
  });
};
