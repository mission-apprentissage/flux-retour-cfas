const assert = require("assert").strict;
const { startServer } = require("../../../utils/testUtils");
const { dbCollection } = require("../../../../src/common/mongodb.js");
const { COLLECTIONS_NAMES } = require("../../../../src/common/model/collections.js");

describe("API Route SignalementAnomalie", () => {
  describe("POST /signalementAnomalie/", () => {
    it("renvoie une 200 quand l'email et le message fourni est valide", async () => {
      const { httpClient } = await startServer();

      const email = "user1@test.fr";
      const message = "Je suis une anomalie";
      const response = await httpClient.post("/api/partage-simplifie/signalementAnomalie", { email, message });
      assert.equal(response.status, 200);
      assert.equal(response.data.createdId !== null, true);

      const foundInDb = await dbCollection(COLLECTIONS_NAMES.PsSignalementAnomalie).findOne({
        email: "user1@test.fr",
      });

      assert.ok(foundInDb);
      assert.equal(foundInDb.message === message, true);
      assert.equal(foundInDb.created_at !== null, true);
    });

    it("renvoie une erreur HTTP 400 lorsqu'il manque le parametre message", async () => {
      const { httpClient } = await startServer();
      const email = "user1@test.fr";

      const responseOnlyEmail = await httpClient.post("/api/partage-simplifie/signalementAnomalie", { email });

      assert.equal(responseOnlyEmail.status, 400);
    });

    it("renvoie une erreur HTTP 400 lorsqu'il manque le parametre email", async () => {
      const { httpClient } = await startServer();
      const message = "Je suis une anomalie";

      const responseOnlyMessage = await httpClient.post("/api/partage-simplifie/signalementAnomalie", { message });

      assert.equal(responseOnlyMessage.status, 400);
    });

    it("renvoie une erreur HTTP 400 lorsqu'il il y aucun parametre", async () => {
      const { httpClient } = await startServer();

      const responseWithoutEmailAndMessage = await httpClient.post("/api/partage-simplifie/signalementAnomalie", {});

      assert.equal(responseWithoutEmailAndMessage.status, 400);
    });

    it("renvoie une erreur HTTP 400 lorsque que le format du parametre email est invalide", async () => {
      const { httpClient } = await startServer();
      const message = 'Je suis une anomalie"';
      const invalideEmail = "user1";

      const responseInvalideEmail = await httpClient.post("/api/partage-simplifie/signalementAnomalie", {
        email: invalideEmail,
        message,
      });

      assert.equal(responseInvalideEmail.status, 400);
    });

    it("renvoie une erreur HTTP 400 lorsque que le format du parametre message est invalide", async () => {
      const { httpClient } = await startServer();
      const email = "user1@test.fr";
      const invalideMessage = 23232;

      const responseInvalideMessage = await httpClient.post("/api/partage-simplifie/signalementAnomalie", {
        email,
        message: invalideMessage,
      });

      assert.equal(responseInvalideMessage.status, 400);
    });
  });
});
