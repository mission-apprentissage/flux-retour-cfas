import { Db } from "mongodb";

export const up = async (db: Db) => {
  // Certains organismes ont un mode de transmission défini à API sans ERPs.
  // On réinitialise cette configuration incomplète pour les forcer à reparamétrer leur organisme.
  await db.collection("organismes").updateMany(
    {
      mode_de_transmission: "API",
      erps: [],
    },
    {
      $unset: {
        mode_de_transmission: 1,
      },
    },
    {
      bypassDocumentValidation: true,
    }
  );
};
