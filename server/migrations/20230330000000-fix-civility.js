export const up = async (/** @type {import('mongodb').Db} */ db) => {
  // cette migration corrige le champ civility pour les utilisateurs créés en dehors de l'inscription
  await db.collection("usersMigration").updateMany(
    {
      civility: {
        $exists: false,
      },
    },
    {
      $set: {
        civility: "Monsieur",
      },
    },
    { bypassDocumentValidation: true }
  );
};
