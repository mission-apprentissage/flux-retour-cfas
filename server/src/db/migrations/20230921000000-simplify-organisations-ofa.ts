import { Db } from "mongodb";

export const up = async (db: Db) => {
  await db.collection("organisations").updateMany(
    {
      type: {
        $in: [
          "ORGANISME_FORMATION_FORMATEUR",
          "ORGANISME_FORMATION_RESPONSABLE",
          "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR",
        ],
      },
    },
    {
      $set: {
        type: "ORGANISME_FORMATION",
      },
    },
    {
      bypassDocumentValidation: true,
    }
  );
};
