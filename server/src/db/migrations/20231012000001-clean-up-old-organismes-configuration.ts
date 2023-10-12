import { Db } from "mongodb";

export const up = async (db: Db) => {
  // nettoyage setup_step_courante suite à la revue du paramétrage des organismes
  await db.collection("organismes").updateMany(
    {},
    {
      $unset: {
        setup_step_courante: 1,
      },
    },
    {
      bypassDocumentValidation: true,
    }
  );
};
