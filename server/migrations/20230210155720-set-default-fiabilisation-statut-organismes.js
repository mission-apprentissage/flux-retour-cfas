import { STATUT_FIABILISATION_ORGANISME } from "../src/common/constants/fiabilisationConstants.js";

export const up = async (db) => {
  const collection = db.collection("organismes");
  await collection.updateMany(
    { siret: { $exists: true } },
    { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.INCONNU } }
  );
};
