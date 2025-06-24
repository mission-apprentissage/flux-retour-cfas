import { ObjectId } from "bson";

import { organisationsDb } from "@/common/model/collections";

export const getMissionsLocalesByArml = async (armlId: ObjectId) => {
  return organisationsDb()
    .find(
      { arml_id: armlId, type: "MISSION_LOCALE" },
      { projection: { _id: 1, nom: 1, code_postal: "$adresse.code_postal" } }
    )
    .toArray();
};
