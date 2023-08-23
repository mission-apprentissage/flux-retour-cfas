import { strict as assert } from "assert";

import { createIndexes, dropIndexes } from "@/common/model/indexes/index";
import usersModelDescriptor from "@/common/model/users.model";
import { getDbCollectionIndexes } from "@/common/mongodb";

describe("Users Indexes", () => {
  it("Vérifie l'existence des indexes", async () => {
    // Crée une entrée en base
    // await createUser(
    //   { email: "of@test.fr", password: "Secret!Password1" },
    //   {
    //     nom: "of",
    //     prenom: "test",
    //     roles: ["of"],
    //     account_status: "DIRECT_PENDING_PASSWORD_SETUP",
    //   }
    // );

    // Re-créé les index après l'ajout d'une entrée en base & récupère les index
    await dropIndexes();
    await createIndexes();
    const dbIndexes = await getDbCollectionIndexes(usersModelDescriptor.collectionName);

    assert.deepStrictEqual(
      dbIndexes.sort((a, b) => (a.name > b.name ? 1 : -1)),
      [
        { v: 2, key: { _id: 1 }, name: "_id_" },
        { v: 2, key: { email: 1 }, name: "email" },
        { v: 2, key: { organisme: 1 }, name: "organisme" },
        { v: 2, key: { username: 1 }, name: "username" },
      ]
    );
  });
});
