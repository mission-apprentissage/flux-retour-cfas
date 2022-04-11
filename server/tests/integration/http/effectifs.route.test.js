const assert = require("assert").strict;
const { startServer } = require("../../utils/testUtils");
const {
  createRandomDossierApprenant,
  getRandomSiretEtablissement,
  createRandomDossierApprenantAbandon,
  createRandomDossierApprenantApprenti,
  createRandomDossierApprenantInscritSansContrat,
  createRandomDossierApprenantRupturant,
  createRandomDossierApprenantRupturantNet,
} = require("../../data/randomizedSample");
const { apiRoles } = require("../../../src/common/roles");
const { EFFECTIF_INDICATOR_NAMES } = require("../../../src/common/constants/dossierApprenantConstants");

const { DossierApprenantModel, CfaModel } = require("../../../src/common/model");
const { parseXlsxHeaderStreamToJson } = require("../../../src/common/utils/exporterUtils");

const seedDossiersApprenants = async (effectifs, props = {}) => {
  const apprentisCount = effectifs.apprentis || 0;
  const inscritsSansContratCount = effectifs.inscritsSansContrat || 0;
  const rupturantsCount = effectifs.rupturants || 0;
  const rupturantsNetsCount = effectifs.rupturantsNets || 0;
  const abandonsCount = effectifs.abandons || 0;

  // create given number of random dossiers apprenants abandons
  for (let index = 0; index < abandonsCount; index++) {
    const randomStatut = createRandomDossierApprenantAbandon(props);
    await new DossierApprenantModel(randomStatut).save();
  }
  // create given number of random dossiers apprenants apprentis
  for (let index = 0; index < apprentisCount; index++) {
    const randomStatut = createRandomDossierApprenantApprenti(props);
    await new DossierApprenantModel(randomStatut).save();
  }
  // create given number of random dossiers apprenants inscrits sans contrat
  for (let index = 0; index < inscritsSansContratCount; index++) {
    const randomStatut = createRandomDossierApprenantInscritSansContrat(props);
    await new DossierApprenantModel(randomStatut).save();
  }
  // create given number of random dossiers apprenants rupturants
  for (let index = 0; index < rupturantsCount; index++) {
    const randomStatut = createRandomDossierApprenantRupturant(props);
    await new DossierApprenantModel(randomStatut).save();
  }
  // create given number of random dossiers apprenants rupturants
  for (let index = 0; index < rupturantsNetsCount; index++) {
    const randomStatut = createRandomDossierApprenantRupturantNet(props);
    await new DossierApprenantModel(randomStatut).save();
  }
};

describe(__filename, () => {
  describe("/api/effectifs route", () => {
    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/effectifs", {
        params: { date: "${new Date().toISOString()}" },
      });

      assert.equal(response.status, 401);
    });

    it("Vérifie qu'on peut récupérer des effectifs via API pour une séquence de statuts sans filtres", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });

      const effectifsToCreate = {
        inscritsSansContrat: 5,
        apprentis: 10,
        abandons: 3,
        rupturants: 2,
        rupturantsNets: 2,
      };
      const expectedResults = {
        ...effectifsToCreate,
        abandons: 5, // abandons + rupturants nets created
      };
      await seedDossiersApprenants(effectifsToCreate);
      // create random dossiers apprenants apprentis that should not be counted because of annee_scolaire
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenant({ annee_scolaire: "2020-2021" });
        await new DossierApprenantModel(randomStatut).save();
      }

      const date = new Date();
      const response = await httpClient.get("/api/effectifs", {
        params: { date: date.toISOString() },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      const indices = response.data;
      assert.deepEqual(indices, {
        date: date.toISOString(),
        ...expectedResults,
      });
    });

    it("Vérifie qu'on peut récupérer des effectifs via API pour une séquence de statuts avec filtres", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const filterQuery = { etablissement_num_region: "84" };

      const effectifsToCreate = {
        inscritsSansContrat: 4,
        apprentis: 7,
        abandons: 1,
        rupturants: 5,
        rupturantsNets: 1,
      };
      const expectedResults = {
        ...effectifsToCreate,
        abandons: 2, // abandons + rupturants nets created
      };
      await seedDossiersApprenants(effectifsToCreate, filterQuery);
      // create random dossiers apprenants apprentis that should not be counted because of different
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenantApprenti({ etablissement_num_region: "10" });
        await new DossierApprenantModel(randomStatut).save();
      }

      const date = new Date();
      const response = await httpClient.get("/api/effectifs", {
        params: { date: date.toISOString(), ...filterQuery },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      const indices = response.data;
      assert.deepEqual(indices, {
        date: date.toISOString(),
        ...expectedResults,
      });
    });
  });

  describe("/api/effectifs/export-xlsx-data-lists route", () => {
    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/effectifs/export-xlsx-data-lists", {
        headers: {
          Authorization: "",
        },
      });

      assert.equal(response.status, 401);
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié en tant qu'admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.apiStatutsSeeder] });

      const response = await httpClient.get("/api/effectifs/export-xlsx-data-lists", {
        params: { date: "${new Date().toISOString()}", effectif_indicateur: EFFECTIF_INDICATOR_NAMES.apprentis },
        headers: authHeader,
      });

      assert.equal(response.status, 403);
    });

    it("Vérifie qu'on peut récupérer des listes de données des apprentis via API pour un admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const cfaUai = "9994889A";
      await new CfaModel({ uai_etablissement: cfaUai }).save();

      const effectifs = {
        inscritsSansContrat: 4,
        apprentis: 1,
        abandons: 1,
        rupturants: 1,
      };
      await seedDossiersApprenants(effectifs, { uai_etablissement: cfaUai });

      const response = await httpClient.get("/api/effectifs/export-xlsx-data-lists", {
        params: { date: new Date().toISOString(), effectif_indicateur: EFFECTIF_INDICATOR_NAMES.apprentis },
        responseType: "arraybuffer",
        headers: authHeader,
      });

      const apprentisList = parseXlsxHeaderStreamToJson(response.data, 4);

      assert.equal(response.status, 200);
      assert.equal(apprentisList.length, effectifs.apprentis);
    });

    it("Vérifie qu'on peut récupérer des listes de données des inscrits sans contrats via API pour un admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const cfaUai = "9994889A";
      await new CfaModel({ uai_etablissement: cfaUai }).save();

      const effectifs = {
        inscritsSansContrat: 4,
        apprentis: 1,
        abandons: 1,
        rupturants: 1,
      };
      await seedDossiersApprenants(effectifs, { uai_etablissement: cfaUai });

      const response = await httpClient.get("/api/effectifs/export-xlsx-data-lists", {
        params: {
          date: new Date().toISOString(),
          effectif_indicateur: EFFECTIF_INDICATOR_NAMES.inscritsSansContrats,
        },
        responseType: "arraybuffer",
        headers: authHeader,
      });

      const inscritsSansContratsList = parseXlsxHeaderStreamToJson(response.data, 4);

      assert.equal(response.status, 200);
      assert.equal(inscritsSansContratsList.length, effectifs.inscritsSansContrat);
    });

    it("Vérifie qu'on peut récupérer des listes de données des abandons via API pour un admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const cfaUai = "9994889A";
      await new CfaModel({ uai_etablissement: cfaUai }).save();

      const effectifs = {
        inscritsSansContrat: 1,
        apprentis: 1,
        abandons: 3,
        rupturants: 1,
      };
      await seedDossiersApprenants(effectifs, { uai_etablissement: cfaUai });

      const response = await httpClient.get("/api/effectifs/export-xlsx-data-lists", {
        params: { date: new Date().toISOString(), effectif_indicateur: EFFECTIF_INDICATOR_NAMES.abandons },
        responseType: "arraybuffer",
        headers: authHeader,
      });

      const abandonsList = parseXlsxHeaderStreamToJson(response.data, 3);

      assert.equal(response.status, 200);
      assert.equal(abandonsList.length, effectifs.abandons);
    });

    it("Vérifie qu'on peut récupérer des listes de données des rupturants nets via API pour un admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const cfaUai = "9994889A";
      await new CfaModel({ uai_etablissement: cfaUai }).save();

      const effectifs = {
        inscritsSansContrat: 1,
        apprentis: 1,
        abandons: 3,
        rupturants: 1,
        rupturantsNets: 2,
      };
      await seedDossiersApprenants(effectifs, { uai_etablissement: cfaUai });

      const response = await httpClient.get("/api/effectifs/export-xlsx-data-lists", {
        params: { date: new Date().toISOString(), effectif_indicateur: EFFECTIF_INDICATOR_NAMES.rupturantsNets },
        responseType: "arraybuffer",
        headers: authHeader,
      });

      const rupturantsNetsList = parseXlsxHeaderStreamToJson(response.data, 4);

      assert.equal(response.status, 200);
      assert.equal(rupturantsNetsList.length, effectifs.rupturantsNets);
    });

    it("Vérifie qu'on peut récupérer des listes de données des rupturants via API pour un CFA", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const cfaUai = "9994889A";
      await new CfaModel({ uai_etablissement: cfaUai }).save();

      const effectifs = {
        inscritsSansContrat: 1,
        apprentis: 1,
        abandons: 1,
        rupturants: 5,
      };
      await seedDossiersApprenants(effectifs, { uai_etablissement: cfaUai });

      const response = await httpClient.get("/api/effectifs/export-xlsx-data-lists", {
        params: { date: new Date().toISOString(), effectif_indicateur: EFFECTIF_INDICATOR_NAMES.rupturants },
        responseType: "arraybuffer",
        headers: authHeader,
      });

      const rupturantsList = parseXlsxHeaderStreamToJson(response.data, 4);

      assert.equal(response.status, 200);
      assert.equal(rupturantsList.length, effectifs.rupturants);
    });
  });

  describe("/api/effectifs/niveau-formation route", () => {
    it("Vérifie qu'on peut récupérer les effectifs répartis par niveaux de formation via API", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const filterQuery = { etablissement_num_region: "84" };

      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenantApprenti({
          ...filterQuery,
          niveau_formation: "1",
          niveau_formation_libelle: "1 (blabla)",
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      const randomStatut = createRandomDossierApprenantApprenti({
        ...filterQuery,
        niveau_formation: "2",
        niveau_formation_libelle: "2 (blabla)",
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();

      const response = await httpClient.get(`/api/effectifs/niveau-formation`, {
        params: {
          date: new Date().toISOString(),
          etablissement_num_region: filterQuery.etablissement_num_region,
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.equal(response.data.length, 2);
      const sortByNiveauFormation = (a, b) => (Number(a.niveau_formation) > Number(b.niveau_formation) ? 1 : -1);
      assert.deepStrictEqual(response.data.sort(sortByNiveauFormation), [
        {
          niveau_formation: "1",
          niveau_formation_libelle: "1 (blabla)",
          effectifs: { apprentis: 5, abandons: 0, inscritsSansContrat: 0, rupturants: 0 },
        },
        {
          niveau_formation: "2",
          niveau_formation_libelle: "2 (blabla)",
          effectifs: { apprentis: 1, abandons: 0, inscritsSansContrat: 0, rupturants: 0 },
        },
      ]);
    });
  });

  describe("/api/effectifs/total-organismes route", () => {
    it("Vérifie qu'on peut récupérer le nombre d'organismes transmettant de la donnée sur une région", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const regionNumTest = "28";

      // Add 1 statut for region
      await new DossierApprenantModel(
        createRandomDossierApprenant({
          nom_etablissement: "TEST CFA",
          siret_etablissement: "77929544300013",
          uai_etablissement: "0762232N",
          etablissement_num_region: regionNumTest,
        })
      ).save();

      // Check good api call
      const response = await httpClient.get("/api/effectifs/total-organismes", {
        params: {
          etablissement_num_region: regionNumTest,
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { nbOrganismes: 1 });

      const badRegionResponse = await httpClient.get("/api/effectifs/total-organismes", {
        params: {
          etablissement_num_region: "01",
        },
        headers: bearerToken,
      });

      assert.deepStrictEqual(badRegionResponse.status, 200);
      assert.deepEqual(badRegionResponse.data, { nbOrganismes: 0 });
    });

    it("Vérifie qu'on peut récupérer le nombre d'organismes transmettant de la donnée sur une formation", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const formationCfd = "abcd1234";

      // Add 1 statut for formation
      await new DossierApprenantModel(
        createRandomDossierApprenant({
          nom_etablissement: "TEST CFA",
          siret_etablissement: getRandomSiretEtablissement(),
          siret_etablissement_valid: true,
          uai_etablissement: "0762232N",
          formation_cfd: formationCfd,
        })
      ).save();

      // Check good api call
      const response = await httpClient.get("/api/effectifs/total-organismes", {
        params: {
          formation_cfd: formationCfd,
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { nbOrganismes: 1 });
    });
  });

  describe("/api/effectifs/formation route", () => {
    it("Vérifie qu'on peut récupérer les effectifs répartis par formation via API", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const filterQuery = { etablissement_num_region: "84" };

      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenantApprenti({
          ...filterQuery,
          niveau_formation: "1",
          niveau_formation_libelle: "1 (blabla)",
          libelle_long_formation: "a",
          formation_cfd: "77929544300013",
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      const randomStatut = createRandomDossierApprenantApprenti({
        ...filterQuery,
        niveau_formation: "2",
        niveau_formation_libelle: "2 (blabla)",
        libelle_long_formation: "b",
        formation_cfd: "77929544300014",
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();

      const response = await httpClient.get(`/api/effectifs/formation`, {
        params: {
          date: new Date().toISOString(),
          etablissement_num_region: filterQuery.etablissement_num_region,
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.equal(response.data.length, 2);
    });
  });

  describe("/api/effectifs/annee-formation route", () => {
    it("Vérifie qu'on peut récupérer les effectifs répartis par annee-formation via API", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const filterQuery = { etablissement_num_region: "84" };

      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenantApprenti({
          ...filterQuery,
          annee_formation: 1,
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      const randomStatut = createRandomDossierApprenantApprenti({
        ...filterQuery,
        annee_formation: 2,
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();

      const response = await httpClient.get(`/api/effectifs/annee-formation`, {
        params: {
          date: new Date().toISOString(),
          etablissement_num_region: filterQuery.etablissement_num_region,
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.equal(response.data.length, 2);
    });
  });

  describe("/api/effectifs/cfa route", () => {
    it("Vérifie qu'on peut récupérer les effectifs répartis par cfa via API", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const filterQuery = { etablissement_num_region: "84" };

      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenantApprenti({
          ...filterQuery,
          uai_etablissement: "0762232N",
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      const randomStatut = createRandomDossierApprenantApprenti({
        ...filterQuery,
        uai_etablissement: "0762232X",
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();

      const response = await httpClient.get(`/api/effectifs/cfa`, {
        params: {
          date: new Date().toISOString(),
          etablissement_num_region: filterQuery.etablissement_num_region,
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.equal(response.data.length, 2);
    });
  });

  describe("/api/effectifs/siret route", () => {
    it("Vérifie qu'on peut récupérer les effectifs répartis par siret via API", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const filterQuery = { etablissement_num_region: "84" };

      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenantApprenti({
          ...filterQuery,
          siret_etablissement: "40239075100046",
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      const randomStatut = createRandomDossierApprenantApprenti({
        ...filterQuery,
        siret_etablissement: "40239075100099",
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();

      const response = await httpClient.get(`/api/effectifs/siret`, {
        params: {
          date: new Date().toISOString(),
          etablissement_num_region: filterQuery.etablissement_num_region,
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.equal(response.data.length, 2);
    });
  });

  describe("/api/effectifs/departement route", () => {
    it("Vérifie qu'on peut récupérer les effectifs répartis par departement via API", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });

      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenantApprenti({
          etablissement_num_departement: "01",
          etablissement_nom_departement: "Ain",
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      const randomStatut = createRandomDossierApprenantApprenti({
        etablissement_num_departement: "91",
        etablissement_nom_departement: "Essonne",
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();

      const response = await httpClient.get(`/api/effectifs/departement`, {
        params: {
          date: new Date().toISOString(),
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.equal(response.data.length, 2);
    });
  });

  describe("/api/effectifs/export-csv-repartition-effectifs-par-organisme route", () => {
    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/effectifs/export-csv-repartition-effectifs-par-organisme", {
        headers: {
          Authorization: "",
        },
      });

      assert.equal(response.status, 401);
    });

    it("Vérifie qu'on peut récupérer des données CSV en étant authentifié", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", {
        permissions: [apiRoles.apiStatutsConsumer.anonymousDataConsumer],
      });

      const response = await httpClient.get("/api/effectifs/export-csv-repartition-effectifs-par-organisme", {
        params: { date: new Date().toISOString(), etablissement_num_departement: "01" },
        headers: authHeader,
      });

      assert.equal(response.status, 200);
    });
  });

  describe("/api/effectifs/export-csv-repartition-effectifs-par-formation route", () => {
    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/effectifs/export-csv-repartition-effectifs-par-formation", {
        headers: {
          Authorization: "",
        },
      });

      assert.equal(response.status, 401);
    });

    it("Vérifie qu'on peut récupérer des données CSV en étant authentifié", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", {
        permissions: [apiRoles.apiStatutsConsumer.anonymousDataConsumer],
      });

      const response = await httpClient.get("/api/effectifs/export-csv-repartition-effectifs-par-formation", {
        params: { date: new Date().toISOString(), etablissement_num_departement: "01" },
        headers: authHeader,
      });

      assert.equal(response.status, 200);
    });
  });
});
