import { strict as assert } from "assert";
import { createIndexes, dropIndexes } from "../../../../src/common/model/indexes/index.js";
import { getDbCollectionIndexes } from "../../../../src/common/mongodb.js";
import userEventsModelDescriptor from "../../../../src/common/model/userEvents.model.js";
import userEvents from "../../../../src/common/components/userEvents.js";

// TODO : Boucler sur la liste des index names pour les tests
describe("UserEvents Indexes", () => {
  let indexes = [];

  beforeEach(async () => {
    // Crée une entrée en base
    const { create } = userEvents();
    await create({ username: "admin", type: "any", action: "test", data: { hello: "world" }, date: new Date() });

    // Re-créé les indexs après l'ajout d'une entrée en base & récupère les indexes
    await dropIndexes();
    await createIndexes();
    indexes = await getDbCollectionIndexes(userEventsModelDescriptor.collectionName);
  });

  it("Vérifie l'existence d'un index sur le champ username", async () => {
    assert.equal(
      indexes.some((item) => item.name === "username"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ action", async () => {
    assert.equal(
      indexes.some((item) => item.name === "action"),
      true
    );
  });
});
