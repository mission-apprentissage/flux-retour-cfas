import { ObjectId } from "mongodb";
import { REGIONS } from "shared/constants";

import { organisationsDb } from "@/common/model/collections";

export const up = async () => {
  const date = new Date();
  const data = REGIONS.map(({ nom, code }) => {
    return {
      _id: new ObjectId(),
      type: "FRANCE_TRAVAIL" as const,
      nom,
      code_region: code,
      created_at: date,
    };
  });
  await organisationsDb().insertMany(data);
};
