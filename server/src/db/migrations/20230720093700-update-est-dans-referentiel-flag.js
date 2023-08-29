export const up = async (db) => {
  // cette migration MAJ le champ est_dans_le_referentiel avec le nouveau format
  await db
    .collection("organismes")
    .updateMany(
      { est_dans_le_referentiel: true },
      { $set: { est_dans_le_referentiel: "present" } },
      { bypassDocumentValidation: true }
    );

  await db
    .collection("organismes")
    .updateMany(
      { est_dans_le_referentiel: false },
      { $set: { est_dans_le_referentiel: "absent" } },
      { bypassDocumentValidation: true }
    );
};

export const down = async () => {};
