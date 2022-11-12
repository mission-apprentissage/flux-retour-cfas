/*
  niveau_formation used to be a string with example value `"3 (Bac, CAP...)"`
  We now split it into two fields :
    - niveau_formation : number (parsed from niveau_formation string)
    - niveau_formation : string (the former niveau_formation)
*/

import { asyncForEach } from "../src/common/utils/asyncUtils.js";

import formationsComponent from "../src/common/components/formations.js";

export const up = async (db) => {
  const { getNiveauFormationFromLibelle } = formationsComponent();
  const formationsCollection = db.collection("formations");
  const allNiveauFormation = await formationsCollection.distinct("niveau", { niveau: { $exists: true } });

  await asyncForEach(allNiveauFormation, async (niveau) => {
    const parsedNiveau = getNiveauFormationFromLibelle(niveau);
    await formationsCollection.updateMany(
      { niveau },
      {
        $set: { niveau: parsedNiveau, niveau_libelle: niveau },
      }
    );
  });
};

export const down = async (db) => {
  const collection = db.collection("formations");

  await collection.updateMany(
    {},
    {
      $rename: { niveau_libelle: "niveau" },
      $unset: { niveau_libelle: "" },
    }
  );
};
