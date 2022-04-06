const assert = require("assert").strict;
const { startServer } = require("../../utils/testUtils");
const { createRandomDossierApprenant } = require("../../data/randomizedSample");
const { DossierApprenantModel, CfaModel } = require("../../../src/common/model");
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
      await new CfaModel({
        nom: "BTP CFA Somme",
        nom_tokenized: buildTokenizedString("BTP CFA Somme", 4),
        uai: "0801302F",
      }).save();

      const response = await httpClient.post("/api/cfas/search", { searchTerm: "Somme" });

      assert.equal(response.status, 200);
      assert.equal(response.data.length, 1);
      assert.deepEqual(response.data[0].uai, "0801302F");
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

      const cfaProps = {
        nom: nomTest,
        uai: uaiTest,
        reseaux: reseauxTest,
        sirets: [siretTest],
        adresse: adresseTest,
        private_url: "http://hello.world",
      };

      await new CfaModel(cfaProps).save();
      await new DossierApprenantModel(
        createRandomDossierApprenant({
          siret_etablissement: siretTest,
          uai_etablissement: uaiTest,
          nom_etablissement: nomTest,
        })
      ).save();

      const response = await httpClient.get(`/api/cfas/${uaiTest}`);

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, {
        libelleLong: nomTest,
        uai: uaiTest,
        sousEtablissements: [{ nom_etablissement: nomTest, siret_etablissement: siretTest }],
        adresse: adresseTest,
        reseaux: reseauxTest,
        domainesMetiers: [],
        url_tdb: "http://hello.world",
      });
    });

    it("Vérifie qu'on reçoit une réponse 404 lorsqu'aucun CFA n'est trouvé pour le UAI demandé", async () => {
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
        etablissement_adresse: adresseTest,
      };

      const randomStatut = createRandomDossierApprenant(cfaInfos);
      const toAdd = new DossierApprenantModel(randomStatut);
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

  describe("GET /cfas", () => {
    it("Vérifie qu'on peut récupérer une liste paginée de cfas pour une région en query", async () => {
      const regionToTest = {
        code: "24",
        nom: "Centre-Val de Loire",
      };

      await new CfaModel({
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

      assert.equal(response.data.pagination.page, 1);
      assert.equal(response.data.pagination.nombre_de_page, 1);
      assert.equal(response.data.pagination.total, 1);
    });
  });
});
