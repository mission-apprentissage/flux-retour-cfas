import { Db } from "mongodb";

export const up = async (db: Db) => {
  // réinitialise la date de transmission quand 0 effectifs et last_transmission_date défini (10 en prod)
  await db.collection("organismes").updateMany(
    {
      effectifs_count: 0,
      last_transmission_date: {
        $exists: true,
      },
    },
    {
      $unset: {
        first_transmission_date: 1,
        last_transmission_date: 1,
      },
    },
    {
      bypassDocumentValidation: true,
    }
  );
};
