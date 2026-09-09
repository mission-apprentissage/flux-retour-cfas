import { Db } from "mongodb";

// Migration historique : la collection `brevoMissionLocaleTemplate` et son modèle ont depuis été
// supprimés (abandon du flux campagne ML). On inline le nom de collection pour préserver
// l'historique sans dépendre du modèle retiré.
export const up = async (db: Db) => {
  await db
    .collection("brevoMissionLocaleTemplate")
    .updateMany({ ml_id: { $exists: true } }, { $unset: { ml_id: true } }, { bypassDocumentValidation: true });
};
