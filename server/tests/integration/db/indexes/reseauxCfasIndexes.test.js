const assert = require("assert").strict;
const { createIndexes, dropIndexes } = require("../../../../src/common/model/indexes/index");
const { getDbCollectionIndexes } = require("../../../../src/common/mongodb");
const reseauxCfasModelDescriptor = require("../../../../src/common/model/reseauxCfas.model");
const reseauxCfas = require("../../../../src/common/components/reseauxCfas");

// TODO : Boucler sur la liste des index names pour les tests
describe("ReseauxCfa Indexes", () => {
  let indexes = [];

  beforeEach(async () => {
    // Crée une entrée en base
    const { create } = await reseauxCfas();

    await create({
      nom_reseau: "TEST-RESEAU",
      nom_etablissement: "Etablissement de test",
      uai: "0670141P",
      siret: "19880153200047",
    });

    // Re-créé les indexs après l'ajout d'une entrée en base & récupère les indexes
    await dropIndexes();
    await createIndexes();
    indexes = await getDbCollectionIndexes(reseauxCfasModelDescriptor.collectionName);
  });

  it("Vérifie l'existence d'un index nom_etablissement_tokenized_text", async () => {
    assert.equal(
      indexes.some((item) => item.name === "nom_etablissement_tokenized_text"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ uai", async () => {
    assert.equal(
      indexes.some((item) => item.name === "uai"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ siret", async () => {
    assert.equal(
      indexes.some((item) => item.name === "siret"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ nom_reseau", async () => {
    assert.equal(
      indexes.some((item) => item.name === "nom_reseau"),
      true
    );
  });
});
