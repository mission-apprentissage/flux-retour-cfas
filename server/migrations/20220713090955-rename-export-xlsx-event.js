const { USER_EVENTS_ACTIONS } = require("../src/common/constants/userEventsConstants");

module.exports = {
  async up(db) {
    await db
      .collection("userEvents")
      .updateMany(
        { action: "export-xlsx-data-lists" },
        { $set: { action: USER_EVENTS_ACTIONS.EXPORT.XLSX_EFFECTIFS_LISTS } }
      );
  },

  async down(db) {
    await db
      .collection("userEvents")
      .updateMany(
        { action: USER_EVENTS_ACTIONS.EXPORT.XLSX_EFFECTIFS_LISTS },
        { $set: { action: "export-xlsx-data-lists" } }
      );
  },
};
