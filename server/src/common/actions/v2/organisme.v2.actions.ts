import { ObjectId } from "mongodb";

import { organismeV2Db } from "@/common/model/collections";

export const getOrCreateOrganismeV2 = async (uai: string, siret: string) => {
  const organisme = await getOrganismeV2(uai, siret);

  if (!organisme) {
    const { insertedId } = await insertOrganismeV2(uai, siret);

    return insertedId;
  }

  return organisme._id;
};

export const getOrganismeV2 = async (uai: string, siret: string) => {
  return organismeV2Db().findOne({
    uai: uai.replace(/\s/g, "").toLowerCase(),
    siret: siret.replace(/\s/g, "").toLowerCase(),
  });
};

export const insertOrganismeV2 = async (uai: string, siret: string) => {
  return organismeV2Db().insertOne({
    _id: new ObjectId(),
    draft: true,
    created_at: new Date(),
    updated_at: new Date(),
    uai: uai.replace(/\s/g, "").toLowerCase(),
    siret: siret.replace(/\s/g, "").toLowerCase(),
  });
};
