import { Db } from "mongodb";

export const up = async (db: Db) => {
  // Dédoublonnage du champ ERPS des organismes
  await db.collection("organismes").updateMany({}, [{ $set: { erps: { $setIntersection: ["$erps", "$erps"] } } }]);
};
