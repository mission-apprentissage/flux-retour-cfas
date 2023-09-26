import { Db, MongoClient } from "mongodb";

export const up = async (_db: Db, _client: MongoClient) => {
  // Dédoublonnage du champ ERPS des organismes
  await _db.collection("organismes").updateMany({}, [{ $set: { erps: { $setIntersection: ["$erps", "$erps"] } } }]);
};
