import { getDatabase } from "@/common/mongodb";

const PREFIXE_ARCHIVE = "Recherche d'entreprise signalée par le CFA : ";

export const up = async () => {
  const db = getDatabase();
  const collection = db.collection("missionLocaleEffectif");

  const filtre = {
    $or: [
      { "organisme_data.situation_type": "SANS_CONTRAT" },
      { "organisme_data.date_debut_formation": { $exists: true } },
      { "organisme_data.recherche_entreprise": { $exists: true } },
    ],
  };

  const aTraiter = await collection.countDocuments(filtre);
  console.log(`Dossiers portant la situation « sans contrat » retirée : ${aTraiter}`);

  if (aTraiter === 0) {
    return;
  }

  await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" });
  try {
    const res = await collection.updateMany(filtre, [
      {
        $set: {
          "organisme_data.note_complementaire": {
            $cond: [
              { $ifNull: ["$organisme_data.recherche_entreprise", false] },
              {
                $trim: {
                  input: {
                    $concat: [
                      { $ifNull: ["$organisme_data.note_complementaire", ""] },
                      "\n\n",
                      PREFIXE_ARCHIVE,
                      "$organisme_data.recherche_entreprise",
                    ],
                  },
                },
              },
              { $ifNull: ["$organisme_data.note_complementaire", "$$REMOVE"] },
            ],
          },
        },
      },
      {
        $set: {
          "organisme_data.situation_type": {
            $cond: [
              { $eq: ["$organisme_data.situation_type", "SANS_CONTRAT"] },
              "$$REMOVE",
              "$organisme_data.situation_type",
            ],
          },
        },
      },
      { $unset: ["organisme_data.date_debut_formation", "organisme_data.recherche_entreprise"] },
    ]);
    console.log(`Dossiers nettoyés : ${res.modifiedCount}`);
  } finally {
    await db.command({ collMod: "missionLocaleEffectif", validationLevel: "strict" });
  }
};
