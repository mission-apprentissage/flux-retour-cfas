export const up = async (db) => {
  // Passe tous les admins bloqués dans un statut invalide en CONFIRMED.
  // En principe, les permissions admin sont déjà créées et actives (pending=false)
  // suite à la migration 20230209000000-fix-admin-permissions (pas de delta sur les environnements)
  await db.collection("usersMigration").updateMany(
    {
      is_admin: true,
      account_status: {
        $in: ["FORCE_COMPLETE_PROFILE_STEP1", "FORCE_COMPLETE_PROFILE_STEP2"],
      },
    },
    {
      $set: {
        status: "CONFIRMED",
      },
    }
  );
};
