import { ObjectId } from "mongodb";
import { OpcoName } from "shared/models/data/opco/opcos.model";

import { opcosDb } from "@/common/model/collections";

export const up = async () => {
  const opcos = Object.keys(OpcoName);

  for (let i = 0; i < opcos.length; i++) {
    const opco = opcos[i];
    await opcosDb().insertOne({
      _id: new ObjectId(),
      name: OpcoName[opco],
    });
  }
};
