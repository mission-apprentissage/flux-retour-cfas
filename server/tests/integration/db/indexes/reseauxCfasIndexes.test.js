import { strict as assert } from "assert";
import { createIndexes, dropIndexes } from "../../../../src/common/model/indexes/index.js";
import { getDbCollectionIndexes } from "../../../../src/common/mongodb.js";
import reseauxCfasModelDescriptor from "../../../../src/common/model/previous.models/toRemove.models/reseauxCfas.model.js";
import reseauxCfas from "../../../../src/common/components/reseauxCfas.js";

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
