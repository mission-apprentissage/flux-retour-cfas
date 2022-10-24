const assert = require("assert").strict;
const { JobEventsFactory } = require("../../../../src/common/factory/jobEventsFactory.js");

describe("Factory JobEvents", () => {
  describe("create", () => {
    it("Vérifie la création de jobEvents via sa factory", async () => {
      const entity = await JobEventsFactory.create({ jobname: "testJob", action: "any", data: { hello: "world" } });

      assert.equal(entity.jobname === "testJob", true);
      assert.equal(entity.action === "any", true);
      assert.deepEqual(entity.data, { hello: "world" });
      assert.equal(entity.created_at !== null, true);
      assert.equal(entity.updated_at === null, true);
    });

    it("Vérifie la non création de jobEvents via sa factory avec jobname au mauvais format", async () => {
      const entity = await JobEventsFactory.create({ jobname: 1223, action: "any", data: { hello: "world" } });
      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de jobEvents via sa factory avec jobname manquant", async () => {
      const entity = await JobEventsFactory.create({ action: "any", data: { hello: "world" } });
      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de jobEvents via sa factory avec action au mauvais format", async () => {
      const entity = await JobEventsFactory.create({ jobname: "test", action: 123, data: { hello: "world" } });
      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de jobEvents via sa factory avec action manquant", async () => {
      const entity = await JobEventsFactory.create({ jobname: "test", data: { hello: "world" } });
      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de jobEvents via sa factory avec data au mauvais format", async () => {
      const entity = await JobEventsFactory.create({ jobname: "testJob", action: "any", data: 123 });
      assert.equal(entity === null, true);
    });
  });
});
