import { strict as assert } from "assert";
import { createIndexes, dropIndexes } from "../../../../src/common/model/indexes/index";
import { getDbCollectionIndexes } from "../../../../src/common/mongodb";
import usersModelDescriptor from "../../../../src/common/model/users.model";
import { createUser } from "../../../../src/common/actions/users.actions";

describe("Users Indexes", () => {
  let dbIndexes = [];

  beforeEach(async () => {
    // Crée une entrée en base
    await createUser(
      { email: "of@test.fr", password: "Secret!Password1" },
      {
        nom: "of",
        prenom: "test",
        roles: ["of"],
        account_status: "FORCE_RESET_PASSWORD",
      }
    );

    // Re-créé les index après l'ajout d'une entrée en base & récupère les index
    await dropIndexes();
    await createIndexes();
    dbIndexes = await getDbCollectionIndexes(usersModelDescriptor.collectionName);
  });

  it("Vérifie l'existence d'un index sur le champ username", async () => {
    assert.equal(
      dbIndexes.some((item) => item.name === "username"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ email", async () => {
    assert.equal(
      dbIndexes.some((item) => item.name === "email"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ email", async () => {
    assert.equal(
      dbIndexes.some((item) => item.name === "email"),
      true
    );
  });
});
