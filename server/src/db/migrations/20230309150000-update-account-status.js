export const up = async (db) => {
  // Simplification des statuts des comptes utilisateur
  const oldStatusToNewStatus = {
    NOT_CONFIRMED: "PENDING_EMAIL_VALIDATION",
    FIRST_FORCE_RESET_PASSWORD: "PENDING_PASSWORD_SETUP",
    FORCE_COMPLETE_PROFILE_STEP1: "PENDING_PERMISSIONS_SETUP",
    FORCE_COMPLETE_PROFILE_STEP2: "PENDING_ADMIN_VALIDATION",
    FORCE_RESET_PASSWORD: "DIRECT_PENDING_PASSWORD_SETUP",
  };

  /** @type {import('mongodb').Collection} */
  const usersMigrationDb = db.collection("usersMigration");
  await Promise.all(
    Object.entries(oldStatusToNewStatus).map(async ([oldStatus, newStatus]) => {
      await usersMigrationDb.updateMany(
        {
          account_status: oldStatus,
        },
        {
          $set: {
            account_status: newStatus,
          },
        },
        { bypassDocumentValidation: true }
      );
    })
  );
};
