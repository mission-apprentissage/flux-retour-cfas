import { USER_EVENTS_ACTIONS } from "../src/common/constants/userEventsConstants";

export const up = async (db) => {
  await db
    .collection("userEvents")
    .updateMany(
      { action: "export-xlsx-data-lists" },
      { $set: { action: USER_EVENTS_ACTIONS.EXPORT.XLSX_EFFECTIFS_LISTS } }
    );
};

export const down = async (db) => {
  await db
    .collection("userEvents")
    .updateMany(
      { action: USER_EVENTS_ACTIONS.EXPORT.XLSX_EFFECTIFS_LISTS },
      { $set: { action: "export-xlsx-data-lists" } }
    );
};
