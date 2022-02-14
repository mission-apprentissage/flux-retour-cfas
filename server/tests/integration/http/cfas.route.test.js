const assert = require("assert").strict;
const omit = require("lodash.omit");
const { startServer } = require("../../utils/testUtils");
const { createRandomStatutCandidat } = require("../../data/randomizedSample");
const { StatutCandidatModel, CfaModel } = require("../../../src/common/model");
const { buildTokenizedString } = require("../../../src/common/utils/buildTokenizedString");

describe(__filename, () => {
  let httpClient;

  beforeEach(async () => {
    const { httpClient: _httpClient } = await startServer();
    httpClient = _httpClient;
  });

  describe("POST /cfas/search", () => {
    it("sends a 200 HTTP empty response when no match", async () => {
      const response = await httpClient.post("/api/cfas/search", { searchTerm: "blabla" });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, []);
    });

    it("sends a 200 HTTP response with results when match", async () => {
      await new StatutCandidatModel({
        ...createRandomStatutCandidat(),
        uai_etablissement_valid: true,
        nom_etablissement: "FACULTE SCIENCES NANCY",
        nom_etablissement_tokenized: buildTokenizedString("FACULTE SCIENCES NANCY", 3),
      }).save();

      const response = await httpClient.post("/api/cfas/search", { searchTerm: "FACULTE" });

      assert.equal(response.status, 200);
      assert.equal(response.data.length, 1);
      assert.deepEqual(response.data[0].nom_etablissement, "FACULTE SCIENCES NANCY");
    });
  });

  describe("POST /cfas/data-feedback", () => {
    const validBody = {
      uai: "0762232N",
      details: "blabla",
      email: "mail@example.com",
    };

    it("sends a 400 HTTP response when no data provided", async () => {
      const response = await httpClient.post("/api/cfas/data-feedback");

      assert.equal(response.status, 400);
    });

    it("sends a 400 HTTP response when uai is missing in body", async () => {
      const response = await httpClient.post("/api/cfas/data-feedback", omit(validBody, "uai"));

      assert.equal(response.status, 400);
    });

    it("sends a 400 HTTP response when email is missing in body", async () => {
      const response = await httpClient.post("/api/cfas/data-feedback", omit(validBody, "email"));

      assert.equal(response.status, 400);
    });

    it("sends a 400 HTTP response when details is missing in body", async () => {
      const response = await httpClient.post("/api/cfas/data-feedback", omit(validBody, "details"));

      assert.equal(response.status, 400);
    });

    it("sends a 200 HTTP response when feedback was created", async () => {
      const sampleRegion_nom = "Normandie";
      const sampleRegion_num = "28";

      // Add Cfa with region_num / region_nom for valid UAI
      await new CfaModel({
        uai: validBody.uai,
        region_nom: sampleRegion_nom,
        region_num: sampleRegion_num,
      }).save();

      // Call API
      const response = await httpClient.post("/api/cfas/data-feedback", validBody);

      assert.equal(response.status, 200);
      assert.deepEqual(omit(response.data, "_id", "__v", "created_at"), {
        uai: validBody.uai,
        details: validBody.details,
        email: validBody.email,
        region_nom: sampleRegion_nom,
        region_num: sampleRegion_num,
      });
    });
  });

  describe("GET /cfas/:uai", () => {
    it("Vérifie qu'on peut récupérer les informations d'un CFA via son UAI", async () => {
      const { httpClient } = await startServer();

      const nomTest = "TEST NOM";
      const siretTest = "77929544300013";
      const uaiTest = "0762232N";
      const adresseTest = "TEST ADRESSE";
      const reseauxTest = ["Reseau1", "Reseau2"];
      const accessTokenTest = "TEST_TOKEN";

      const cfaInfos = {
        nom_etablissement: nomTest,
        siret_etablissement: siretTest,
        uai_etablissement: uaiTest,
        uai_etablissement_valid: true,
        etablissement_adresse: adresseTest,
      };

      const randomStatut = createRandomStatutCandidat(cfaInfos);
      const toAdd = new StatutCandidatModel(randomStatut);
      await toAdd.save();

      // Add Cfa in referentiel
      const cfaReferenceToAdd = new CfaModel({
        sirets: [siretTest],
        nom: nomTest,
        uai: uaiTest,
        reseaux: reseauxTest,
        access_token: accessTokenTest,
        private_url: "http://hello.world",
      });
      await cfaReferenceToAdd.save();

      const response = await httpClient.get(`/api/cfas/${uaiTest}`);

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, {
        libelleLong: nomTest,
        uai: uaiTest,
        sousEtablissements: [
          { siret_etablissement: cfaInfos.siret_etablissement, nom_etablissement: cfaInfos.nom_etablissement },
        ],
        adresse: adresseTest,
        reseaux: reseauxTest,
        domainesMetiers: [],
        url_tdb: "http://hello.world",
      });
    });

    it("Vérifie qu'on peut récupérer les informations d'un CFA qui n'est pas dans le référentiel via API", async () => {
      const { httpClient } = await startServer();

      const nomTest = "TEST NOM";
      const uaiTest = "0762232N";
      const adresseTest = "TEST ADRESSE";

      const cfaInfos = {
        nom_etablissement: nomTest,
        uai_etablissement: uaiTest,
        uai_etablissement_valid: true,
        siret_etablissement: "77929544300013",
        etablissement_adresse: adresseTest,
      };

      const randomStatut = createRandomStatutCandidat(cfaInfos);
      const toAdd = new StatutCandidatModel(randomStatut);
      await toAdd.save();

      const response = await httpClient.get(`/api/cfas/${uaiTest}`);

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, {
        libelleLong: nomTest,
        uai: uaiTest,
        adresse: adresseTest,
        reseaux: [],
        domainesMetiers: [],
        sousEtablissements: [
          { siret_etablissement: cfaInfos.siret_etablissement, nom_etablissement: cfaInfos.nom_etablissement },
        ],
        url_tdb: null,
      });
    });

    it("Vérifie qu'on reçoit une réponse 404 lorsqu'aucun CFA n'est trouvé pour le SIRET demandé", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get(`/api/cfas/unknown`);
      assert.equal(response.status, 404);
    });
  });

  describe("GET /cfas/url-access-token/:token", () => {
    it("Vérifie qu'on peut récupérer l'uai d'un CFA via un Token Url", async () => {
      const { httpClient } = await startServer();

      const nomTest = "TEST NOM";
      const siretTest = "77929544300013";
      const uaiTest = "0762232N";
      const adresseTest = "TEST ADRESSE";
      const reseauxTest = ["Reseau1", "Reseau2"];
      const tokenTest = "TOKEN1234567890";

      const cfaInfos = {
        nom_etablissement: nomTest,
        siret_etablissement: siretTest,
        uai_etablissement: uaiTest,
        uai_etablissement_valid: true,
        etablissement_adresse: adresseTest,
      };

      const randomStatut = createRandomStatutCandidat(cfaInfos);
      const toAdd = new StatutCandidatModel(randomStatut);
      await toAdd.save();

      // Add Cfa in referentiel
      const cfaReferenceToAdd = new CfaModel({
        sirets: [siretTest],
        nom: nomTest,
        uai: uaiTest,
        reseaux: reseauxTest,
        access_token: tokenTest,
      });
      await cfaReferenceToAdd.save();

      const response = await httpClient.get(`/api/cfas/url-access-token/${tokenTest}`);

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { uai: uaiTest });
    });

    it("Vérifie qu'on reçoit une réponse 404 lorsqu'aucun CFA n'est trouvé pour le Token demandé", async () => {
      const { httpClient } = await startServer();
      const response = await httpClient.get(`/api/cfas/url-access-token/unknown`);
      assert.equal(response.status, 404);
    });
  });
});
