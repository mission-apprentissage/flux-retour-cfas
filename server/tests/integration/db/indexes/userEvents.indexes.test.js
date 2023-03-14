import { strict as assert } from "assert";

import { createIndexes, dropIndexes } from "../../../../src/common/model/indexes/index.js";
import { getDbCollectionIndexes } from "../../../../src/common/mongodb.js";
import userEventsModelDescriptor from "../../../../src/common/model/userEvents.model.js";
import { createUserEvent } from "../../../../src/common/actions/userEvents.actions.js";

describe("UserEvents Indexes", () => {
  it("Vérifie l'existence des indexes", async () => {
    // Crée une entrée en base
    await createUserEvent({
      username: "admin",
      type: "any",
      action: "test",
      data: { hello: "world" },
      date: new Date(),
    });

    // Re-créé les index après l'ajout d'une entrée en base & récupère les index
    await dropIndexes();
    await createIndexes();
    const dbIndexes = await getDbCollectionIndexes(userEventsModelDescriptor.collectionName);

    assert.deepStrictEqual(
      // @ts-ignore
      dbIndexes.sort((a, b) => (a.name > b.name ? 1 : -1)),
      [
        { v: 2, key: { _id: 1 }, name: "_id_" },
        { v: 2, key: { action: 1 }, name: "action" },
        { v: 2, key: { user_email: 1 }, name: "user_email" },
        { v: 2, key: { username: 1 }, name: "username" },
      ]
    );
  });
});
