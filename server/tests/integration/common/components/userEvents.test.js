const assert = require("assert").strict;
const userEvents = require("../../../../src/common/components/userEvents");
const { UserEventModel, UserModel } = require("../../../../src/common/model");
const users = require("../../../../src/common/components/users");

describe(__filename, () => {
  describe("createUserEvent", () => {
    it("Permet de créer un userEvent et de le sauver en base", async () => {
      const { create } = userEvents();

      await create({ username: "admin", type: "any", action: "test", data: { hello: "world" }, date: new Date() });
      const foundInDb = await UserEventModel.findOne({ username: "admin" });
      assert.ok(foundInDb);
    });

    it("Permet de créer un userEvent pour un user avec region", async () => {
      const { create } = userEvents();
      const { createUser } = await users();

      const usernameTest = "userTest";
      const regionTest = "REGION";

      await createUser({
        username: usernameTest,
        password: "password",
        email: "email@test.fr",
        region: regionTest,
      });

      const foundUser = await UserModel.findOne({ username: usernameTest });
      assert.equal(foundUser.region === regionTest, true);

      await create({ username: usernameTest, type: "any", action: "test", data: { hello: "world" }, date: new Date() });
      const foundUserEvent = await UserEventModel.findOne({ username: usernameTest });
      assert.ok(foundUserEvent);
      assert.equal(foundUserEvent.username === usernameTest, true);
      assert.equal(foundUserEvent.user_region === regionTest, true);
    });

    it("Permet de créer un userEvent pour un user avec organisme", async () => {
      const { create } = userEvents();
      const { createUser } = await users();

      const usernameTest = "userTest";
      const organismeTest = "ORGANISME";

      await createUser({
        username: usernameTest,
        password: "password",
        email: "email@test.fr",
        organisme: organismeTest,
      });

      const foundUser = await UserModel.findOne({ username: usernameTest });
      assert.equal(foundUser.organisme === organismeTest, true);

      await create({ username: usernameTest, type: "any", action: "test", data: { hello: "world" }, date: new Date() });
      const foundUserEvent = await UserEventModel.findOne({ username: usernameTest });
      assert.ok(foundUserEvent);
      assert.equal(foundUserEvent.username === usernameTest, true);
      assert.equal(foundUserEvent.user_organisme === organismeTest, true);
    });

    it("Permet de créer un userEvent pour un user avec réseau", async () => {
      const { create } = userEvents();
      const { createUser } = await users();

      const usernameTest = "userTest";
      const networkTest = "RESEAU";

      await createUser({
        username: usernameTest,
        password: "password",
        email: "email@test.fr",
        network: networkTest,
      });

      const foundUser = await UserModel.findOne({ username: usernameTest });
      assert.equal(foundUser.network === networkTest, true);

      await create({ username: usernameTest, type: "any", action: "test", data: { hello: "world" }, date: new Date() });
      const foundUserEvent = await UserEventModel.findOne({ username: usernameTest });
      assert.ok(foundUserEvent);
      assert.equal(foundUserEvent.username === usernameTest, true);
      assert.equal(foundUserEvent.user_network === networkTest, true);
    });
  });
});
