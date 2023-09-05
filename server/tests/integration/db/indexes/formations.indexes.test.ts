import { strict as assert } from "assert";

import { formationsDb } from "@/common/model/collections";
import formationsModelDescriptor from "@/common/model/formations.model";
import { createIndexes, dropIndexes } from "@/common/model/indexes/index";
import { getDbCollectionIndexes } from "@/common/mongodb";
import { useMongo } from "@tests/jest/setupMongo";

describe("Formations Indexes", () => {
  useMongo();
  it("Vérifie l'existence des indexes", async () => {
    // Crée une entrée en base
    await formationsDb().insertOne({ cfd: "0123456G" });

    // Re-créé les index après l'ajout d'une entrée en base & récupère les index
    await dropIndexes();
    await createIndexes();
    const dbIndexes = await getDbCollectionIndexes(formationsModelDescriptor.collectionName);

    assert.deepStrictEqual(
      dbIndexes.sort((a, b) => (a.name > b.name ? 1 : -1)),
      [
        { v: 2, key: { _id: 1 }, name: "_id_" },
        { v: 2, key: { cfd: 1 }, name: "cfd", unique: true },
        {
          v: 2,
          key: { libelle: 1 },
          name: "libelle",
        },
        {
          v: 2,
          key: {
            _fts: "text",
            _ftsx: 1,
          },
          name: "libelle_text",
          weights: {
            libelle: 1,
          },
          default_language: "french",
          language_override: "language",
          textIndexVersion: 3,
        },
        { v: 2, key: { rncps: 1 }, name: "rncps" },
      ]
    );
  });
});
