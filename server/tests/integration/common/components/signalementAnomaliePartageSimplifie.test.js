const signalementAnomaliePartageSimplifie = require("../../../../src/common/components/signalementAnomaliePartageSimplifie.js");
const { PartageSimplifieSignalementAnomalieModel } = require("../../../../src/common/model/index.js");

const assert = require("assert").strict;

describe("Composant SignalementAnomaliePartageSimplifie", () => {
  describe("createSignalementAnomalie", () => {
    it("Permet de créer un message pour prevenir d'une anomalie et de le sauver en base", async () => {
      const { createSignalementAnomalie } = signalementAnomaliePartageSimplifie();

      const insertedId = await createSignalementAnomalie("test@test.fr", "Je suis une anomalie");
      const foundInDb = await PartageSimplifieSignalementAnomalieModel.findOne({
        _id: insertedId,
      });

      assert.ok(foundInDb);

      assert.equal(foundInDb.email === "test@test.fr", true);
      assert.equal(foundInDb.message === "Je suis une anomalie", true);
      assert.equal(foundInDb.created_at !== null, true);
    });

    it("Ne créé pas de un message pour prevenir d'une anomalie si le message est au mauvais format", async () => {
      const { createSignalementAnomalie } = signalementAnomaliePartageSimplifie();

      const insertedIdInvalideMessage = await createSignalementAnomalie("test@test.fr", 123);

      const foundInDbInvalideMessage = await PartageSimplifieSignalementAnomalieModel.findOne({
        _id: insertedIdInvalideMessage,
      });

      assert.equal(foundInDbInvalideMessage === null, true);
    });

    it("Ne créé pas de un message pour prevenir d'une anomalie si l'email est au mauvais format", async () => {
      const { createSignalementAnomalie } = signalementAnomaliePartageSimplifie();

      const insertedIdInvalideEmail = await createSignalementAnomalie("tes", "Je suis une anomalie");

      const foundInDbInvalideEmail = await PartageSimplifieSignalementAnomalieModel.findOne({
        _id: insertedIdInvalideEmail,
      });

      assert.equal(foundInDbInvalideEmail === null, true);
    });
  });
});
