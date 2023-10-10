import { rncpDb } from "@/common/model/collections";

export const getFicheRNCP = async (code_rncp: string) => {
  return await rncpDb().findOne({ rncp: code_rncp });
};
