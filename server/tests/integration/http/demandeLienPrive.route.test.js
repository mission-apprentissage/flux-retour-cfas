const assert = require("assert").strict;
const { startServer } = require("../../utils/testUtils");
const { DemandeLienPriveModel } = require("../../../src/common/model");

describe(__filename, () => {
  let httpClient;

  beforeEach(async () => {
    const { httpClient: _httpClient } = await startServer();
    httpClient = _httpClient;
  });

  describe("POST /demande-lien-prive", () => {
    it("sends a 400 HTTP response when no body provided", async () => {
      const response = await httpClient.post("/api/demande-lien-prive", {});

      assert.equal(response.status, 400);
      const found = await DemandeLienPriveModel.countDocuments();
      assert.equal(found, 0);
    });

    it("sends a 400 HTTP response when bad format for uai sent", async () => {
      const testDemande = {
        nom_organisme: "TEST-ORGA",
        uai_organisme: "ABC",
        code_postal_organisme: "75010",
        email_demandeur: "test@email.fr",
      };

      const response = await httpClient.post("/api/demande-lien-prive", testDemande);

      assert.equal(response.status, 400);
      const found = await DemandeLienPriveModel.countDocuments();
      assert.equal(found, 0);
    });

    it("sends a 400 HTTP response when bad format for code postal sent", async () => {
      const testDemande = {
        nom_organisme: "TEST-ORGA",
        uai_organisme: "0762232N",
        code_postal_organisme: "ABC",
        email_demandeur: "test@email.fr",
      };

      const response = await httpClient.post("/api/demande-lien-prive", testDemande);

      assert.equal(response.status, 400);
      const found = await DemandeLienPriveModel.countDocuments();
      assert.equal(found, 0);
    });

    it("sends a 200 HTTP response and good data when demande lien prive was created", async () => {
      const testDemande = {
        nom_organisme: "TEST-ORGA",
        uai_organisme: "0762232N",
        code_postal_organisme: "75010",
        email_demandeur: "test@email.fr",
      };

      const response = await httpClient.post("/api/demande-lien-prive", testDemande);

      assert.equal(response.status, 200);
      const found = await DemandeLienPriveModel.find().lean();
      assert.equal(found.length, 1);
      assert.equal(found[0].nom_organisme, testDemande.nom_organisme);
      assert.equal(found[0].uai_organisme, testDemande.uai_organisme);
      assert.equal(found[0].code_postal_organisme, testDemande.code_postal_organisme);
      assert.equal(found[0].email_demandeur, testDemande.email_demandeur);
    });
  });
});
