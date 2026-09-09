import { Db, ObjectId } from "mongodb";

export const up = async (db: Db) => {
  const collection = db.collection("brevoMissionLocaleTemplate");

  await collection.insertOne({
    _id: new ObjectId(),
    type: "MISSION_LOCALE",
    name: "REFUS",
    templateId: 2,
    created_at: new Date(),
  });

  await collection.insertOne({
    _id: new ObjectId(),
    type: "MISSION_LOCALE",
    name: "CONFIRMATION",
    templateId: 1,
    created_at: new Date(),
  });
};
