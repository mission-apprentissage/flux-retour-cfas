import { USER_EVENTS_ACTIONS } from "../src/common/constants/userEventsConstants.js";

export const up = async (db) => {
  db.collection("userEvents").updateMany(
    { action: "statut-candidats" },
    { $set: { action: USER_EVENTS_ACTIONS.DOSSIER_APPRENANT } }
  );
};

export const down = async (db) => {
  db.collection("userEvents").updateMany(
    { action: USER_EVENTS_ACTIONS.DOSSIER_APPRENANT },
    { $set: { action: "statut-candidats" } }
  );
};
