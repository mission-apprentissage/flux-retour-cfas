import { strict as assert } from 'assert';
import { startServer } from '../../utils/testUtils';
import { createRandomDossierApprenant } from '../../data/randomizedSample';
import { buildTokenizedString } from '../../../src/common/utils/buildTokenizedString';
import { NATURE_ORGANISME_DE_FORMATION } from '../../../src/common/domain/organisme-de-formation/nature';
import { cfasDb, dossiersApprenantsDb } from '../../../src/common/model/collections';

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
      await cfasDb().insertOne({
        nom: "BTP CFA Somme",
        nom_tokenized: buildTokenizedString("BTP CFA Somme", 4),
        uai: "0801302F",
      });

      const response = await httpClient.post("/api/cfas/search", { searchTerm: "Somme" });

      assert.equal(response.status, 200);
      assert.equal(response.data.length, 1);
      assert.deepEqual(response.data[0].uai, "0801302F");
    });

    it("sends a 200 HTTP response with results when match", async () => {
      await cfasDb().insertOne({
        nom: "BTP CFA Somme",
        nom_tokenized: buildTokenizedString("BTP CFA Somme", 4),
        uai: "0801302F",
        sirets: ["34012780200015"],
      });

      const response = await httpClient.post("/api/cfas/search", { searchTerm: "Somme" });

      assert.equal(response.status, 200);
      assert.equal(response.data.length, 1);
      assert.deepEqual(response.data[0].sirets, ["34012780200015"]);
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
        nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR,
        nature_validity_warning: true,
        reseaux: reseauxTest,
        sirets: [siretTest],
        adresse: adresseTest,
      };

      await cfasDb().insertOne(cfaProps);
      await dossiersApprenantsDb().insertOne(
        createRandomDossierApprenant({
          siret_etablissement: siretTest,
          uai_etablissement: uaiTest,
          nom_etablissement: nomTest,
        })
      );

      const response = await httpClient.get(`/api/cfas/${uaiTest}`);

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, {
        libelleLong: nomTest,
        uai: uaiTest,
        sousEtablissements: [{ nom_etablissement: nomTest, siret_etablissement: siretTest }],
        adresse: adresseTest,
        reseaux: reseauxTest,
        nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR,
        natureValidityWarning: true,
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
      await dossiersApprenantsDb().insertOne(randomStatut);

      // Add Cfa in referentiel
      const cfaReferenceToAdd = cfasDb().insertOne({
        sirets: [siretTest],
        nom: nomTest,
        uai: uaiTest,
        reseaux: reseauxTest,
        access_token: tokenTest,
      });
      await cfaReferenceToAdd;

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

      await cfasDb().insertOne({
        uai: "0451582A",
        siret: "31521327200067",
        nom: "TEST CFA",
        region_nom: regionToTest.nom,
        region_num: regionToTest.code,
      });

      const queryStringified = JSON.stringify({ region_num: regionToTest.code });
      const response = await httpClient.get(`/api/cfas?query=${queryStringified}`);

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
