import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  await db
    .collection("organismes")
    .updateMany({}, { $rename: { formations: "relatedFormations" } }, { bypassDocumentValidation: true });
};
