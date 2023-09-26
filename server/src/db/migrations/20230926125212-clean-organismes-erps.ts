import { Db, MongoClient } from "mongodb";

export const up = async (_db: Db, _client: MongoClient) => {
  // Lowercase des ERPS en majuscule
  const erpsToClean = ["YMAG", "SCFORM"];
  await Promise.all(
    erpsToClean.map(async (erpToClean) => {
      await _db
        .collection("organismes")
        .updateMany({ erps: erpToClean }, { $set: { "erps.$": erpToClean.toLowerCase() } });
    })
  );
};
