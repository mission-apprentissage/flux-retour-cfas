import { FIABILISATION_TYPES } from "../src/common/constants/fiabilisationConstants.js";

export const up = async (db) => {
  const collection = db.collection("fiabilisationUaiSiret");
  await collection.updateMany(
    { siret: { $exists: true }, type: { $exists: false } },
    { $set: { type: FIABILISATION_TYPES.A_FIABILISER } }
  );
};
