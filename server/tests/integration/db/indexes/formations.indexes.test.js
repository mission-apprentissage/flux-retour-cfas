import { strict as assert } from "assert";

import { formationsDb } from "@/common/model/collections";
import formationsModelDescriptor from "@/common/model/formations.model";
import { createIndexes, dropIndexes } from "@/common/model/indexes/index";
import { getDbCollectionIndexes } from "@/common/mongodb";

describe("Formations Indexes", () => {
  let indexes = [];

  beforeEach(async () => {
    // Crée une entrée en base
    await formationsDb().insertOne({ cfd: "0123456G" });

    // Re-créé les index après l'ajout d'une entrée en base & récupère les index
    await dropIndexes();
    await createIndexes();
    indexes = await getDbCollectionIndexes(formationsModelDescriptor.collectionName);
  });

  it("Vérifie l'existence d'un index sur le champ libelle_text", async () => {
    assert.equal(
      indexes.some((item) => item.name === "libelle_text"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ cfd", async () => {
    assert.equal(
      indexes.some((item) => item.name === "cfd"),
      true
    );
    assert.equal(indexes.find((item) => item.name === "cfd")?.unique, true);
  });

  it("Vérifie l'existence d'un index sur le champ rncps", async () => {
    assert.equal(
      indexes.some((item) => item.name === "rncps"),
      true
    );
  });
});
