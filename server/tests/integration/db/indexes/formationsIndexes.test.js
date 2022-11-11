const assert = require("assert").strict;
const { createIndexes, dropIndexes } = require("../../../../src/common/model/indexes/index");
const { getDbCollectionIndexes } = require("../../../../src/common/mongodb");
const formationsModelDescriptor = require("../../../../src/common/model/formations.model");
const { formationsDb } = require("../../../../src/common/model/collections");

// TODO : Boucler sur la liste des index names pour les tests
describe("Formations Indexes", () => {
  let indexes = [];

  beforeEach(async () => {
    // Crée une entrée en base
    await formationsDb().insertOne({ cfd: "0123456G" });

    // Re-créé les indexs après l'ajout d'une entrée en base & récupère les indexes
    await dropIndexes();
    await createIndexes();
    indexes = await getDbCollectionIndexes(formationsModelDescriptor.collectionName);
  });

  it("Vérifie l'existence d'un index sur le champ libelle_text_tokenized_libelle_text", async () => {
    assert.equal(
      indexes.some((item) => item.name === "libelle_text_tokenized_libelle_text"),
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
