import { validateUai } from "../src/common/domain/uai.js";

export const up = async (db) => {
  const collection = db.collection("statutsCandidats");
  const cursor = collection.find();
  while (await cursor.hasNext()) {
    const document = await cursor.next();

    const isUaiValid = !validateUai(document.uai_etablissement).error;
    await collection.findOneAndUpdate({ _id: document._id }, { $set: { uai_etablissement_valid: isUaiValid } });
  }
};

export const down = async (db) => {
  const collection = db.collection("statutsCandidats");
  await collection.updateMany({}, { $unset: { uai_etablissement_valid: "" } });
};
