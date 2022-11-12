import { strict as assert } from "assert";
import { cfasDb } from "../../../../src/common/model/collections.js";
import { createIndexes, dropIndexes } from "../../../../src/common/model/indexes/index.js";
import { getDbCollectionIndexes } from "../../../../src/common/mongodb.js";
import cfasModelDescriptor from "./../../../../src/common/model/cfas.model.js";

// TODO : Boucler sur la liste des index names pour les tests
describe("Cfas Indexes", () => {
  let cfasIndexes = [];

  beforeEach(async () => {
    // Crée une entrée en base
    const uai = "0802004U";
    await cfasDb().insertOne({ uai });

    // Re-créé les indexs après l'ajout d'une entrée en base & récupère les indexes
    await dropIndexes();
    await createIndexes();
    cfasIndexes = await getDbCollectionIndexes(cfasModelDescriptor.collectionName);
  });

  it("Vérifie l'existence d'un index nom_tokenized_text", async () => {
    assert.equal(
      cfasIndexes.some((item) => item.name === "nom_tokenized_text"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ uai", async () => {
    assert.equal(
      cfasIndexes.some((item) => item.name === "uai"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ sirets", async () => {
    assert.equal(
      cfasIndexes.some((item) => item.name === "sirets"),
      true
    );
  });
});
