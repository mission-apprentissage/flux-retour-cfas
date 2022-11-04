const assert = require("assert").strict;
const {
  DemandesActivationCompteFactory,
} = require("../../../../src/common/factory/demandesActivationCompteFactory.js");

describe("Factory DemandesActivationCompte", () => {
  describe("create", () => {
    it("Vérifie la création d'une demande d'activation de compte valide via sa factory", async () => {
      const entity = await DemandesActivationCompteFactory.create({ email: "test@test.fr" });

      assert.equal(entity.email === "test@test.fr", true);
      assert.equal(entity.created_at !== null, true);
      assert.equal(entity.updated_at === null, true);
    });

    it("Vérifie la non création de demande d'activation de compte via sa factory avec email au mauvais format", async () => {
      const entity = await DemandesActivationCompteFactory.create({ email: 1223 });
      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de demande d'activation de compte via sa factory avec email manquant", async () => {
      const entity = await DemandesActivationCompteFactory.create({});
      assert.equal(entity === null, true);
    });
  });
});
