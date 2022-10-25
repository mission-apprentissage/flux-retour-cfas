const assert = require("assert").strict;
const { startServer } = require("../../../utils/testUtils");
const { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } = require("../../../../src/common/constants/userEventsConstants.js");
// eslint-disable-next-line node/no-unpublished-require
const MockDate = require("mockdate");
const { addMinutes } = require("date-fns");
const { PARTAGE_SIMPLIFIE_ROLES } = require("../../../../src/common/roles.js");

describe("API Route User", () => {
  describe("GET /of/upload-history", () => {
    it("renvoie une erreur HTTP 401 lorsque l'utilisateur n'est pas connecté", async () => {
      const { httpClient } = await startServer();
      const response = await httpClient.get("/api/partage-simplifie/of/upload-history", {});

      assert.equal(response.status, 401);
    });

    it("renvoie une erreur HTTP 403 lorsque l'utilisateur n'est pas OF", async () => {
      const { httpClient, createAndLogPsUser } = await startServer();
      const bearerToken = await createAndLogPsUser("user@test.fr", "password", PARTAGE_SIMPLIFIE_ROLES.ADMINISTRATOR);
      const response = await httpClient.get("/api/partage-simplifie/of/upload-history", { headers: bearerToken });

      assert.equal(response.status, 403);
    });

    it("renvoie une 200 et un historique vide quand l'utilisateur n'a jamais uploadé de fichier", async () => {
      const { httpClient, createAndLogPsUser } = await startServer();
      const bearerToken = await createAndLogPsUser("user@test.fr", "password", PARTAGE_SIMPLIFIE_ROLES.OF);
      const response = await httpClient.get("/api/partage-simplifie/of/upload-history", { headers: bearerToken });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data.uploadHistoryList, []);
    });

    it("renvoie une 200 et un historique valide quand l'utilisateur a déja uploadé des fichiers", async () => {
      const { httpClient, createAndLogPsUser, components } = await startServer();
      const testUserMail = "user@test.fr";
      const bearerToken = await createAndLogPsUser(testUserMail, "password", PARTAGE_SIMPLIFIE_ROLES.OF);

      const firstDate = new Date();
      MockDate.set(firstDate);

      await components.userEvents.create({
        username: testUserMail,
        type: USER_EVENTS_TYPES.POST,
        action: USER_EVENTS_ACTIONS.UPLOAD.SUCCESS,
        data: { originalname: "monFichier.xlsx" },
      });

      const secondDate = addMinutes(firstDate, 5);
      MockDate.set(secondDate);

      // Not valid for upload
      await components.userEvents.create({
        username: testUserMail,
        type: USER_EVENTS_TYPES.POST,
        action: USER_EVENTS_ACTIONS.UPLOAD.INIT,
        data: { originalname: "monFichierNotValid.xlsx" },
      });

      // Not valid for user
      await components.userEvents.create({
        username: "otherUser@test.fr",
        type: USER_EVENTS_TYPES.POST,
        action: USER_EVENTS_ACTIONS.UPLOAD.SUCCESS,
        data: { originalname: "monFichierPourUnAutreUser.xlsx" },
      });

      await components.userEvents.create({
        username: testUserMail,
        type: USER_EVENTS_TYPES.POST,
        action: USER_EVENTS_ACTIONS.UPLOAD.SUCCESS,
        data: { originalname: "monFichier2.xlsx" },
      });

      const response = await httpClient.get("/api/partage-simplifie/of/upload-history", { headers: bearerToken });
      assert.equal(response.status, 200);

      assert.equal(response.data.uploadHistoryList.length === 2, true);
      assert.equal(response.data.uploadHistoryList[0].nom_fichier === "monFichier2.xlsx", true);
      assert.equal(response.data.uploadHistoryList[0].date_creation === secondDate.toISOString(), true);

      assert.equal(response.data.uploadHistoryList[1].nom_fichier === "monFichier.xlsx", true);
      assert.equal(response.data.uploadHistoryList[1].date_creation === firstDate.toISOString(), true);
    });
  });
});
