import { ObjectId } from "mongodb";
import { REGIONS } from "shared/constants";

import { regionsDb } from "@/common/model/collections";

export const up = async () => {
  regionsDb().insertMany(
    REGIONS.map(({ nom, code }) => ({
      nom,
      code,
      _id: new ObjectId(),
    }))
  );
};
