const assert = require("assert").strict;
const { startServer } = require("../../../utils/testUtils");
const { COLLECTIONS_NAMES } = require("../../../../src/common/model/collections.js");
const { dbCollection } = require("../../../../src/common/mongodb.js");
const { PARTAGE_SIMPLIFIE_ROLES } = require("../../../../src/common/roles.js");
const { sleep } = require("../../../../src/common/utils/miscUtils.js");

describe("API Route DonneesApprenants", () => {
  describe("POST /upload", () => {
    it("renvoie une erreur HTTP 401 lorsque l'utilisateur n'est pas connecté", async () => {
      const { httpClient } = await startServer();
      const response = await httpClient.post("/api/partage-simplifie/donnees-apprenants/upload", {});

      assert.equal(response.status, 401);
    });

    it("renvoie une erreur HTTP 403 lorsque l'utilisateur n'est pas OF", async () => {
      const { httpClient, createAndLogPsUser } = await startServer();
      const bearerToken = await createAndLogPsUser(
        "user@test.fr",
        "superPasswordForUser",
        PARTAGE_SIMPLIFIE_ROLES.ADMINISTRATOR
      );
      const response = await httpClient.post(
        "/api/partage-simplifie/donnees-apprenants/upload",
        {},
        { headers: bearerToken }
      );

      assert.equal(response.status, 403);
    });

    it("renvoie une erreur HTTP 500 lorsque le fichier fourni n'est pas un xlsx", async () => {
      const { superTestHttpClient, createAndLogPsUser } = await startServer();
      const bearerToken = await createAndLogPsUser("user@test.fr", "superPasswordForUser", PARTAGE_SIMPLIFIE_ROLES.OF);

      const response = await superTestHttpClient
        .post("/api/partage-simplifie/donnees-apprenants/upload")
        .set(bearerToken)
        .attach("donneesApprenantsFile", Buffer.from([]), "testFichier.txt");

      assert.equal(response.status, 500);
    });

    it("renvoie une 200 lorsque le fichier fourni est bien au format xlsx", async () => {
      const { superTestHttpClient, createAndLogPsUser } = await startServer();
      const userEmail = "user@test.fr";
      const bearerToken = await createAndLogPsUser(userEmail, "superPasswordForUser", PARTAGE_SIMPLIFIE_ROLES.OF);

      const testFileName = "testFichier.xlsx";

      const response = await superTestHttpClient
        .post("/api/partage-simplifie/donnees-apprenants/upload")
        .set(bearerToken)
        .attach("donneesApprenantsFile", Buffer.from([]), testFileName);

      assert.equal(response.status, 200);
      await sleep(50); // Delay for checking userEvents created in finally block -- todo better handling

      // Verify userEventCreation
      const countUserEventForUpload = await dbCollection(COLLECTIONS_NAMES.UserEvents).countDocuments({
        username: userEmail,
        "data.originalname": testFileName,
      });

      assert.equal(countUserEventForUpload === 1, true);
    });

    it("renvoie une 200 lorsque le fichier fourni est bien au format xlsx et que l'on ajoute un commentaire", async () => {
      const { superTestHttpClient, createAndLogPsUser } = await startServer();
      const userEmail = "user@test.fr";
      const bearerToken = await createAndLogPsUser(userEmail, "superPasswordForUser", PARTAGE_SIMPLIFIE_ROLES.OF);

      const testFileName = "testFichier.xlsx";
      const testComment = "Commentaire";

      const response = await superTestHttpClient
        .post("/api/partage-simplifie/donnees-apprenants/upload")
        .set(bearerToken)
        .field("comment", testComment)
        .attach("donneesApprenantsFile", Buffer.from([]), testFileName);

      assert.equal(response.status, 200);
      await sleep(50); // Delay for checking userEvents created in finally block -- todo better handling

      // Verify userEventCreation
      const countUserEventForUpload = await dbCollection(COLLECTIONS_NAMES.UserEvents).countDocuments({
        username: userEmail,
        "data.originalname": testFileName,
        "data.comment": testComment,
      });

      assert.equal(countUserEventForUpload === 1, true);
    });
  });
});
