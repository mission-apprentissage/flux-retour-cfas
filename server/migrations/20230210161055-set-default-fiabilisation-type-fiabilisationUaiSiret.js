import { STATUT_FIABILISATION_COUPLES_UAI_SIRET } from "../src/common/constants/fiabilisationConstants.js";

export const up = async (db) => {
  const collection = db.collection("fiabilisationUaiSiret");
  await collection.updateMany(
    { siret: { $exists: true }, type: { $exists: false } },
    { $set: { type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER } }
  );
};
