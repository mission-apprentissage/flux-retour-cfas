import { Db } from "mongodb";
import { CGU_VERSION } from "shared/constants";

export const up = async (db: Db) => {
  await db
    .collection("usersMigration")
    .updateMany({ has_accept_cgu_version: "v1" }, { $set: { has_accept_cgu_version: CGU_VERSION } });
};
