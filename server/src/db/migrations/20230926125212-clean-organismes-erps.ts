import { Db } from "mongodb";

export const up = async (db: Db) => {
  // Lowercase des ERPS en majuscule
  const erpsToClean = ["YMAG", "SCFORM"];
  await Promise.all(
    erpsToClean.map(async (erpToClean) => {
      await db
        .collection("organismes")
        .updateMany({ erps: erpToClean }, { $set: { "erps.$": erpToClean.toLowerCase() } });
    })
  );
};
