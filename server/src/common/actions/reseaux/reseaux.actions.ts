import { ObjectId } from "bson";

import { reseauxDb } from "@/common/model/collections";

export const getReseauById = async (id: string | ObjectId) => {
  const result = await reseauxDb().findOne({ _id: new ObjectId(id) });
  return result;
};
