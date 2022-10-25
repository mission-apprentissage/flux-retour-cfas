const assert = require("assert").strict;
const { startServer } = require("../../utils/testUtils");
const { COLLECTIONS_NAMES } = require("../../../src/common/model/collections.js");
const { dbCollection } = require("../../../src/common/mongodb.js");

describe("API Route DemandesActivationCompte", () => {
  describe("POST /demandes-activation-compte/", () => {
    it("renvoie une 200 quand l'email fourni est valide", async () => {
      const { httpClient } = await startServer();

      const email = "user1@test.fr";
      const response = await httpClient.post("/api/partage-simplifie/demandes-activation-compte", { email });
      assert.equal(response.status, 200);
      assert.equal(response.data.createdId !== null, true);

      const foundInDb = await dbCollection(COLLECTIONS_NAMES.PsDemandesActivationCompte).findOne({
        email: "user1@test.fr",
      });

      assert.ok(foundInDb);
      assert.equal(foundInDb.created_at !== null, true);
    });

    it("renvoie une 400 quand aucun email n'est fourni", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.post("/api/partage-simplifie/demandes-activation-compte", {});
      assert.equal(response.status, 400);
      assert.equal(response.data.message, "Erreur de validation");
    });

    it("renvoie une 400 quand l'email fourni n'est pas au bon format", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.post("/api/partage-simplifie/demandes-activation-compte", { email: 123 });
      assert.equal(response.status, 400);
      assert.equal(response.data.message, "Erreur de validation");
    });
  });
});
