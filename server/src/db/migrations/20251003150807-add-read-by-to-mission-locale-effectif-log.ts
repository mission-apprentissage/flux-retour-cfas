import { Db } from "mongodb";

export const up = async (db: Db) => {
  await db
    .collection("missionLocaleEffectifLog")
    .updateMany({ read_by: { $exists: false } }, { $set: { read_by: [] } });
};
