import { strict as assert } from "assert";
import { createIndexes, dropIndexes } from "../../../../src/common/model/indexes/index.js";
import { getDbCollectionIndexes } from "../../../../src/common/mongodb.js";
import usersModelDescriptor from "../../../../src/common/model/users.model.js";
import users from "../../../../src/common/components/users.js";

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
