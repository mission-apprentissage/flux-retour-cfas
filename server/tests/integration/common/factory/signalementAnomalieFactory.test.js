const assert = require("assert").strict;
const { SignalementAnomalieFactory } = require("../../../../src/common/factory/signalementAnomalieFactory.js");

describe("Factory SignalementAnomalie", () => {
  describe("create", () => {
    it("Vérifie la création du message est valide via sa factory", async () => {
      const entity = await SignalementAnomalieFactory.create({
        email: "test@test.fr",
        message: "Je suis une anomalie",
      });

      assert.equal(entity.email === "test@test.fr", true);
      assert.equal(entity.message === "Je suis une anomalie", true);
      assert.equal(entity.created_at !== null, true);
      assert.equal(entity.updated_at === null, true);
    });

    it("Renvoie null si le parametre message est manquant", async () => {
      const entityMissingMessage = await SignalementAnomalieFactory.create({
        email: "user@test.fr",
      });

      assert.equal(entityMissingMessage === null, true);
    });

    it("Renvoie null si le parametre email est manquant", async () => {
      const entityMissingEmail = await SignalementAnomalieFactory.create({
        message: "Je suis une anomalie",
      });

      assert.equal(entityMissingEmail === null, true);
    });

    it("Renvoie null si un parametre est invalide", async () => {
      const entityInvalideEmail = await SignalementAnomalieFactory.create({
        message: "Je suis une anomalie",
        email: "user@test",
      });
      const entityInvalideMessage = await SignalementAnomalieFactory.create({
        message: 123,
        email: "user@test",
      });
      assert.equal(entityInvalideEmail === null, true);
      assert.equal(entityInvalideMessage === null, true);
    });
  });
});
