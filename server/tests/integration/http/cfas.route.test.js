const assert = require("assert").strict;
const omit = require("lodash.omit");
const httpTests = require("../../utils/httpTests");
const { createRandomStatutCandidat } = require("../../data/randomizedSample");
const { StatutCandidat: StatutCandidatModel, Cfa } = require("../../../src/common/model");
const { buildTokenizedString } = require("../../../src/common/utils/buildTokenizedString");

httpTests(__filename, ({ startServer }) => {
  let httpClient;

  beforeEach(async () => {
    const { httpClient: _httpClient } = await startServer();
    httpClient = _httpClient;
  });

  describe("POST /cfas/search", () => {
    it("sends a 400 HTTP response when no body provided", async () => {
      const response = await httpClient.post("/api/cfas/search", {});

      assert.equal(response.status, 400);
    });

    it("sends a 200 HTTP empty response when no match", async () => {
      const response = await httpClient.post("/api/cfas/search", { searchTerm: "blabla" });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, []);
    });

    it("sends a 200 HTTP response with results when match", async () => {
      await new StatutCandidatModel({
        ...createRandomStatutCandidat(),
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
      const response = await httpClient.post("/api/cfas/data-feedback", validBody);

      assert.equal(response.status, 200);
      assert.deepEqual(omit(response.data, "_id", "__v", "created_at"), {
        uai: validBody.uai,
        details: validBody.details,
        email: validBody.email,
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
      const cfaReferenceToAdd = new Cfa({
        sirets: [siretTest],
        nom: nomTest,
        uai: uaiTest,
        reseaux: reseauxTest,
      });
      await cfaReferenceToAdd.save();

      const response = await httpClient.get(`/api/cfas/${uaiTest}`);

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, {
        libelleLong: nomTest,
        uai: uaiTest,
        sirets: [siretTest],
        adresse: adresseTest,
        reseaux: reseauxTest,
        domainesMetiers: [],
      });
    });

    it("Vérifie qu'on peut récupérer les informations d'un CFA qui n'est pas dans le référentiel via API", async () => {
      const { httpClient } = await startServer();

      const nomTest = "TEST NOM";
      const uaiTest = "0762232N";
      const adresseTest = "TEST ADRESSE";
      const reseauxTest = [];

      const cfaInfos = {
        nom_etablissement: nomTest,
        uai_etablissement: uaiTest,
        uai_etablissement_valid: true,
        etablissement_adresse: adresseTest,
      };

      const randomStatut = createRandomStatutCandidat({
        ...cfaInfos,
      });
      const toAdd = new StatutCandidatModel(randomStatut);
      await toAdd.save();

      const response = await httpClient.get(`/api/cfas/${uaiTest}`);

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, {
        libelleLong: nomTest,
        uai: uaiTest,
        adresse: adresseTest,
        reseaux: reseauxTest,
        domainesMetiers: [],
      });
    });

    it("Vérifie qu'on reçoit une réponse 404 lorsqu'aucun CFA n'est trouvé pour le SIRET demandé", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get(`/api/cfas/unknown`);
      assert.equal(response.status, 404);
    });
  });

  it("Vérifie qu'on peut récupérer une liste paginée de cfas pour une région en query", async () => {
    const regionToTest = {
      code: "24",
      nom: "Centre-Val de Loire",
    };

    await new Cfa({
      uai: "0451582A",
      siret: "31521327200067",
      nom: "TEST CFA",
      region_nom: regionToTest.nom,
      region_num: regionToTest.code,
    }).save();

    const response = await httpClient.get(`/api/cfas?query={"region_num":${regionToTest.code}}`);

    assert.equal(response.status, 200);
    assert.equal(response.data.cfas.length, 1);
    assert.deepEqual(response.data.cfas[0].nom, "TEST CFA");
    assert.deepEqual(response.data.cfas[0].region_nom, regionToTest.nom);
    assert.deepEqual(response.data.cfas[0].region_num, regionToTest.code);
  });
});
