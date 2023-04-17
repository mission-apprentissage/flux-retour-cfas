export const up = async (db) => {
  await db
    .collection("organismes")
    .updateMany({}, { $rename: { formations: "relatedFormations" } }, { bypassDocumentValidation: true });
};
