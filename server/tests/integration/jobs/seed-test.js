const assert = require("assert");
const integrationTests = require("../../utils/integrationTests");
const { User } = require("../../../src/common/model");
const createUsers = require("../../../src/jobs/seed/createUsers");

integrationTests(__filename, ({ getContext }) => {
  it("Vérifie la création d'users depuis le job", async () => {
    const { components } = await getContext();
    await User.deleteMany({});
    await createUsers(components.users);

    const results = await User.find({ username: "testUser" });
    assert.deepStrictEqual(results.length > 0, true);
  });
});
