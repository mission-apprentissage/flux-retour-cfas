import { ObjectId } from "bson";

import { rncpDb } from "@/common/model/collections";

export const getFicheRNCP = async (code_rncp: string) => {
  return await rncpDb().findOne({ rncp: code_rncp });
};

export const getFicheRNCPById = async (id: ObjectId) => {
  return await rncpDb().findOne({ _id: id });
};
