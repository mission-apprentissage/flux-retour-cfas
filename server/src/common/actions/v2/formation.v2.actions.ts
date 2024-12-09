import { ObjectId } from "mongodb";

import { formationV2Db } from "@/common/model/collections";

export const getOrCreateFormationV2 = async (
  cfd: string,
  rncp: string,
  organisme_responsable_id: ObjectId,
  organisme_formateur_id: ObjectId
) => {
  const formation = await getFormationV2(cfd, rncp, organisme_responsable_id, organisme_formateur_id);

  if (!formation) {
    const { insertedId } = await insertFormationV2(cfd, rncp, organisme_responsable_id, organisme_formateur_id);
    return insertedId;
  }

  return formation._id;
};

const getFormationV2 = async (
  cfd: string,
  rncp: string,
  organisme_responsable_id: ObjectId,
  organisme_formateur_id: ObjectId
) => {
  // CFD & RNCP --> tjr en uppercase
  return formationV2Db().findOne({
    cfd: cfd.replace(/\s/g, "").toLowerCase(),
    rncp: rncp.replace(/\s/g, "").toLowerCase(),
    organisme_responsable_id,
    organisme_formateur_id,
  });
};

const insertFormationV2 = async (
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
    cfd: cfd.replace(/\s/g, "").toLowerCase(),
    rncp: rncp.replace(/\s/g, "").toLowerCase(),
    organisme_responsable_id,
    organisme_formateur_id,
  });
};
