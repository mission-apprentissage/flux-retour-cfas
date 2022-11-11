const assert = require("assert").strict;
const { createIndexes, dropIndexes } = require("../../../../src/common/model/indexes/index");
const { getDbCollectionIndexes } = require("../../../../src/common/mongodb");
const usersModelDescriptor = require("../../../../src/common/model/users.model");
const users = require("../../../../src/common/components/users");

// TODO : Boucler sur la liste des index names pour les tests
describe("Users Indexes", () => {
  let indexes = [];

  beforeEach(async () => {
    // Crée une entrée en base
    const { createUser } = users();
    await createUser({ username: "user", password: "password" });

    // Re-créé les indexs après l'ajout d'une entrée en base & récupère les indexes
    await dropIndexes();
    await createIndexes();
    indexes = await getDbCollectionIndexes(usersModelDescriptor.collectionName);
  });

  it("Vérifie l'existence d'un index sur le champ username", async () => {
    assert.equal(
      indexes.some((item) => item.name === "username"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ email", async () => {
    assert.equal(
      indexes.some((item) => item.name === "email"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ organisme", async () => {
    assert.equal(
      indexes.some((item) => item.name === "organisme"),
      true
    );
  });
});
