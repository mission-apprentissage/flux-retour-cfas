export const up = async (db) => {
  // migration du champ apprenant.handicap vers apprenant.rqth
  await db
    .collection("effectifs")
    .updateMany(
      { "apprenant.handicap": true },
      { $set: { "apprenant.rqth": true } },
      { bypassDocumentValidation: true }
    );
  await db
    .collection("effectifs")
    .updateMany({}, { $unset: { "apprenant.handicap": "" } }, { bypassDocumentValidation: true });

  // migration du champ apprenant.contrats vers contrats
  await db
    .collection("effectifs")
    .updateMany({}, { $set: { contrats: "$apprenant.contrats" } }, { bypassDocumentValidation: true });
  await db
    .collection("effectifs")
    .updateMany({}, { $unset: { "apprenant.contrats": "" } }, { bypassDocumentValidation: true });
};
