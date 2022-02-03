const assert = require("assert").strict;
const integrationTests = require("../../../utils/integrationTests");
const userEvents = require("../../../../src/common/components/userEvents");
const { UserEventModel } = require("../../../../src/common/model");

integrationTests(__filename, () => {
  describe("createUserEvent", () => {
    it("Permet de créer un userEvent et de le sauver en base", async () => {
      const { create } = userEvents();

      await create({ username: "admin", type: "any", action: "test", data: { hello: "world" }, date: new Date() });
      const foundInDb = await UserEventModel.findOne({ username: "admin" });
      assert.ok(foundInDb);
    });
  });
});
