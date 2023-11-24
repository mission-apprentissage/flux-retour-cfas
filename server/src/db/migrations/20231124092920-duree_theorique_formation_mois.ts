import { Db } from "mongodb";

export const up = async (db: Db) => {
  // On met à jour tous les effectifs concernés en rajoutant la durée théorique en mois
  await db.collection("effectifs").updateMany(
    {
      "formation.duree_theorique_mois": { $exists: false }, // Sélectionne les documents sans duree_theorique_formation_mois
      "formation.duree_theorique": { $ne: null }, // Sélectionne les documents où duree_theorique_formation n'est pas vide
    },
    [
      {
        $set: {
          "formation.duree_theorique_mois": {
            $multiply: ["$formation.duree_theorique", 12],
          },
        },
      },
    ]
  );
};
