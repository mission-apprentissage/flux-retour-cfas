const assert = require("assert").strict;
const { createIndexes, dropIndexes } = require("../../../../src/common/model/indexes/index");
const { getDbCollectionIndexes } = require("../../../../src/common/mongodb");
const userEventsModelDescriptor = require("../../../../src/common/model/userEvents.model");
const userEvents = require("../../../../src/common/components/userEvents");

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
