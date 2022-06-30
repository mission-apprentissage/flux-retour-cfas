const { USER_EVENTS_ACTIONS } = require("../src/common/constants/userEventsConstants");

module.exports = {
  async up(db) {
    db.collection("userEvents").updateMany(
      { action: "statut-candidats" },
      { $set: { action: USER_EVENTS_ACTIONS.DOSSIER_APPRENANT } }
    );
  },

  async down(db) {
    db.collection("userEvents").updateMany(
      { action: USER_EVENTS_ACTIONS.DOSSIER_APPRENANT },
      { $set: { action: "statut-candidats" } }
    );
  },
};
