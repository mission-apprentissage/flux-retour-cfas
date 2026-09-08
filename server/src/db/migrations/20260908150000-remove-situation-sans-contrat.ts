import { Db } from "mongodb";

export const up = async (db: Db) => {
  await db.collection("missionLocaleEffectif").updateMany(
    { "organisme_data.situation_type": "SANS_CONTRAT" },
    {
      $unset: {
        "organisme_data.situation_type": "",
        "organisme_data.date_debut_formation": "",
        "organisme_data.recherche_entreprise": "",
      },
    }
  );

  await db.collection("missionLocaleEffectif").updateMany(
    {
      $or: [
        { "organisme_data.date_debut_formation": { $exists: true } },
        { "organisme_data.recherche_entreprise": { $exists: true } },
      ],
    },
    { $unset: { "organisme_data.date_debut_formation": "", "organisme_data.recherche_entreprise": "" } }
  );
};
