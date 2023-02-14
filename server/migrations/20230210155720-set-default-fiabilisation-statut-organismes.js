import { FIABILISATION_TYPES } from "../src/common/constants/fiabilisationConstants.js";

export const up = async (db) => {
  const collection = db.collection("organismes");
  await collection.updateMany({}, { $set: { fiabilisation_statut: FIABILISATION_TYPES.INCONNU } });
};
