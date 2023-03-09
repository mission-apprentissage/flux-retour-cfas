import { strict as assert } from "assert";
import { createUserEvent } from "../../../../src/common/actions/userEvents.actions";
import { userEventsDb } from "../../../../src/common/model/collections";

describe("Tests des actions UserEvents", () => {
  describe("createUserEvent", () => {
    it("Permet de créer un userEvent et de le sauver en base", async () => {
      await createUserEvent({
        username: "admin",
        user_email: "admin@test.fr",
        type: "any",
        action: "test",
        data: { hello: "world" },
        date: new Date(),
      });

      const foundInDb = await userEventsDb().findOne({ username: "admin" });
      assert.ok(foundInDb);
      assert.equal(foundInDb.username, "admin");
      assert.equal(foundInDb.user_email, "admin@test.fr");
      assert.equal(foundInDb.type, "any");
      assert.equal(foundInDb.action, "test");
      assert.deepEqual(foundInDb.data, { hello: "world" });
    });
  });
});
