/*
  niveau_formation used to be a string with example value `"3 (Bac, CAP...)"`
  We now split it into two fields :
    - niveau_formation : parsed from niveau_formation string
    - niveau_formation : the former niveau_formation
*/

import { asyncForEach } from "../src/common/utils/asyncUtils.js";

import formationsComponent from "../src/common/components/formations.js";

export const up = async (db) => {
  const { getNiveauFormationFromLibelle } = formationsComponent();
  const collection = db.collection("statutsCandidats");

  const allNiveauFormation = await collection.distinct("niveau_formation", { niveau_formation: { $exists: true } });

  await asyncForEach(allNiveauFormation, async (niveau) => {
    const parsedNiveau = getNiveauFormationFromLibelle(niveau);
    await collection.updateMany(
      { niveau_formation: niveau },
      {
        $set: { niveau_formation: parsedNiveau, niveau_formation_libelle: niveau },
      }
    );
  });
};

export const down = async (db) => {
  const collection = db.collection("statutsCandidats");

  await collection.updateMany(
    {},
    {
      $rename: { niveau_formation_libelle: "niveau_formation" },
      $unset: { niveau_formation_libelle: "" },
    }
  );
};
