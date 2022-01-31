const assert = require("assert").strict;
const integrationTests = require("../../../utils/integrationTests");
const userEvents = require("../../../../src/common/components/userEvents");
const { UserEventModel } = require("../../../../src/common/model");

integrationTests(__filename, () => {
  describe("getLastUserEventDate", () => {
    it("Permet de retrouver la date du dernier userEvent", async () => {
      const { getLastUserEventDate } = await userEvents();

      // Add first user event
      const firstEvent = new UserEventModel({
        username: "TEST",
        type: "TYPE",
        action: "ACTION",
        data: null,
      });
      await firstEvent.save();
      const firstDateCreated = await UserEventModel.findOne({ username: "TEST", type: "TYPE", action: "ACTION" });

      // Add second user event
      const secondEvent = new UserEventModel({
        username: "TEST",
        type: "TYPE",
        action: "ACTION",
        data: null,
      });
      await secondEvent.save();

      const found = await getLastUserEventDate({ username: "TEST", type: "TYPE", action: "ACTION" });
      assert.notEqual(found, null);
      assert.notEqual(found, firstDateCreated);
    });
  });

  describe("createUserEvent", () => {
    it("Permet de créer un userEvent et de le sauver en base", async () => {
      const { createUserEvent } = await userEvents();

      await createUserEvent({ username: "admin", type: "any", action: "test", data: { hello: "world" } });
      const foundInDb = await UserEventModel.findOne({ username: "admin" });
      assert.ok(foundInDb);
    });
  });
});
