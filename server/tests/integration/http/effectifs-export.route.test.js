const assert = require("assert").strict;
const { startServer } = require("../../utils/testUtils");
const { createRandomDossierApprenant } = require("../../data/randomizedSample");
const { apiRoles, tdbRoles } = require("../../../src/common/roles");
const { EFFECTIF_INDICATOR_NAMES } = require("../../../src/common/constants/dossierApprenantConstants");

const {
  historySequenceInscritToApprentiToAbandon,
  historySequenceApprenti,
  historySequenceInscritToApprenti,
  historySequenceApprentiToInscrit,
} = require("../../data/historySequenceSamples");
const { DossierApprenantModel, CfaModel, UserEventModel } = require("../../../src/common/model");
const { parseXlsxHeaderStreamToJson } = require("../../../src/common/utils/exporterUtils");
const { RESEAUX_CFAS } = require("../../../src/common/constants/networksConstants");
const { USER_EVENTS_ACTIONS } = require("../../../src/common/constants/userEventsConstants");

describe(__filename, () => {
  const seedDossiersApprenants = async (statutsProps) => {
    const nbAbandons = 10;
    const nbApprentis = 5;

    // Add 10 statuts with history sequence - full
    for (let index = 0; index < nbAbandons; index++) {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
        ...statutsProps,
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();
    }

    // Add 5 statuts with history sequence - simple apprenti
    for (let index = 0; index < nbApprentis; index++) {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: historySequenceApprenti,
        ...statutsProps,
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();
    }

    // Add 15 statuts with history sequence - inscritToApprenti
    for (let index = 0; index < 15; index++) {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: historySequenceInscritToApprenti,
        ...statutsProps,
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();
    }

    // Add 8 statuts with history sequence - inscritToApprentiToInscrit (rupturant)
    for (let index = 0; index < 8; index++) {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: historySequenceApprentiToInscrit,
        ...statutsProps,
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();
    }
  };
  describe("/api/effectifs-export/export-csv-anonymized-list route", () => {
    const API_ROUTE = "/api/effectifs-export/export-csv-anonymized-list";

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const { httpClient } = await startServer();
      const response = await httpClient.get(API_ROUTE, { headers: { Authorization: "" } });
      assert.equal(response.status, 401);
    });

    it("Vérifie qu'on peut récupérer des listes de données anonymisées via API en étant authentifié", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", {
        permissions: [tdbRoles.pilot],
      });

      // Seed sample data
      const etablissement_num_departement = "01";
      await seedDossiersApprenants({ annee_scolaire: "2021-2022", etablissement_num_departement });

      // Check good api call
      const response = await httpClient.get(API_ROUTE, {
        params: { date: "2022-06-10T00:00:00.000Z" },
        headers: authHeader,
      });

      assert.equal(response.status, 200);
      assert.ok(response.data);
    });

    it("Vérifie qu'on peut récupérer des listes de données anonymisées au national via API en étant authentifié", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", {
        permissions: [tdbRoles.pilot],
      });

      // Seed sample data
      await seedDossiersApprenants({ annee_scolaire: "2021-2022" });

      // Check good api call
      const response = await httpClient.get(API_ROUTE, {
        params: { date: "2022-06-10T00:00:00.000Z" },
        headers: authHeader,
      });

      // Check good user event in db
      const userEventInDb = await UserEventModel.findOne({
        action: USER_EVENTS_ACTIONS.EXPORT.ANONYMIZED_EFFECTIFS_LISTS.TERRITOIRE_NATIONAL,
      });

      assert.equal(response.status, 200);
      assert.ok(response.data);
      assert.ok(userEventInDb);
    });

    it("Vérifie qu'on peut récupérer des listes de données anonymisées pour un département via API en étant authentifié", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", {
        permissions: [tdbRoles.pilot],
      });

      // Seed sample data
      const etablissement_num_departement = "01";
      await seedDossiersApprenants({ annee_scolaire: "2021-2022", etablissement_num_departement });

      // Check good api call
      const response = await httpClient.get(API_ROUTE, {
        params: { date: "2022-06-10T00:00:00.000Z", etablissement_num_departement },
        headers: authHeader,
      });

      // Check good user event in db
      const userEventInDb = await UserEventModel.findOne({
        action: USER_EVENTS_ACTIONS.EXPORT.ANONYMIZED_EFFECTIFS_LISTS.TERRITOIRE_DEPARTEMENT,
      });

      assert.equal(response.status, 200);
      assert.ok(response.data);
      assert.ok(userEventInDb);
    });

    it("Vérifie qu'on peut récupérer des listes de données anonymisées pour une région via API en étant authentifié", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", {
        permissions: [tdbRoles.pilot],
      });

      // Seed sample data
      const etablissement_num_region = "28";
      await seedDossiersApprenants({ annee_scolaire: "2021-2022", etablissement_num_region });

      // Check good api call
      const response = await httpClient.get(API_ROUTE, {
        params: { date: "2022-06-10T00:00:00.000Z", etablissement_num_region },
        headers: authHeader,
      });

      // Check good user event in db
      const userEventInDb = await UserEventModel.findOne({
        action: USER_EVENTS_ACTIONS.EXPORT.ANONYMIZED_EFFECTIFS_LISTS.TERRITOIRE_REGION,
      });

      assert.equal(response.status, 200);
      assert.ok(response.data);
      assert.ok(userEventInDb);
    });

    it("Vérifie qu'on peut récupérer des listes de données anonymisées pour un réseau via API en étant authentifié", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", {
        permissions: [tdbRoles.pilot],
      });

      // Seed sample data
      const etablissement_reseaux = RESEAUX_CFAS.BTP_CFA.nomReseau;
      await seedDossiersApprenants({ annee_scolaire: "2021-2022", etablissement_reseaux });

      // Check good api call
      const response = await httpClient.get(API_ROUTE, {
        params: { date: "2022-06-10T00:00:00.000Z", etablissement_reseaux },
        headers: authHeader,
      });

      // Check good user event in db
      const userEventInDb = await UserEventModel.findOne({
        action: USER_EVENTS_ACTIONS.EXPORT.ANONYMIZED_EFFECTIFS_LISTS.RESEAU,
      });

      assert.equal(response.status, 200);
      assert.ok(response.data);
      assert.ok(userEventInDb);
    });

    it("Vérifie qu'on peut récupérer des listes de données anonymisées pour une formation via API en étant authentifié", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", {
        permissions: [tdbRoles.pilot],
      });

      // Seed sample data
      const formation_cfd = "50033610";
      await seedDossiersApprenants({ annee_scolaire: "2021-2022", formation_cfd });

      // Check good api call
      const response = await httpClient.get(API_ROUTE, {
        params: { date: "2022-06-10T00:00:00.000Z", formation_cfd },
        headers: authHeader,
      });

      // Check good user event in db
      const userEventInDb = await UserEventModel.findOne({
        action: USER_EVENTS_ACTIONS.EXPORT.ANONYMIZED_EFFECTIFS_LISTS.FORMATION,
      });

      assert.equal(response.status, 200);
      assert.ok(response.data);
      assert.ok(userEventInDb);
    });

    it("Vérifie qu'on peut récupérer des listes de données anonymisées pour un CFA via API en étant authentifié", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", {
        permissions: [tdbRoles.pilot],
      });

      // Seed sample data
      const uai_etablissement = "0762232N";
      await seedDossiersApprenants({ annee_scolaire: "2021-2022", uai_etablissement });

      // Check good api call
      const response = await httpClient.get(API_ROUTE, {
        params: { date: "2022-06-10T00:00:00.000Z", uai_etablissement },
        headers: authHeader,
      });

      // Check good user event in db
      const userEventInDb = await UserEventModel.findOne({
        action: USER_EVENTS_ACTIONS.EXPORT.ANONYMIZED_EFFECTIFS_LISTS.CFA,
      });

      assert.equal(response.status, 200);
      assert.ok(response.data);
      assert.ok(userEventInDb);
    });
  });

  describe("/api/effectifs-export/export-xlsx-lists route", () => {
    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/effectifs-export/export-xlsx-lists", {
        headers: {
          Authorization: "",
        },
      });

      assert.equal(response.status, 401);
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié en tant qu'admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.apiStatutsSeeder] });

      const response = await httpClient.get("/api/effectifs-export/export-xlsx-lists", {
        params: { date: "2020-10-10T00:00:00.000Z", effectif_indicateur: EFFECTIF_INDICATOR_NAMES.apprentis },
        headers: authHeader,
      });

      assert.equal(response.status, 403);
    });

    it("Vérifie qu'on peut récupérer des listes de données des apprentis via API pour un admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const cfaUai = "9994889A";
      await new CfaModel({ uai_etablissement: cfaUai }).save();

      await seedDossiersApprenants({ annee_scolaire: "2020-2021", uai_etablissement: cfaUai });

      // Check good api call
      const response = await httpClient.get("/api/effectifs-export/export-xlsx-lists", {
        params: { date: "2020-10-10T00:00:00.000Z", effectif_indicateur: EFFECTIF_INDICATOR_NAMES.apprentis },
        responseType: "arraybuffer",
        headers: authHeader,
      });

      const apprentisList = parseXlsxHeaderStreamToJson(response.data, 4);

      assert.equal(response.status, 200);
      assert.equal(apprentisList.length, 5);
    });

    it("Vérifie qu'on peut récupérer des listes de données des inscrits sans contrats via API pour un admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const cfaUai = "9994889A";
      await new CfaModel({ uai_etablissement: cfaUai }).save();

      await seedDossiersApprenants({ annee_scolaire: "2020-2021", uai_etablissement: cfaUai });

      // Check good api call
      const response = await httpClient.get("/api/effectifs-export/export-xlsx-lists", {
        params: {
          date: "2020-10-10T00:00:00.000Z",
          effectif_indicateur: EFFECTIF_INDICATOR_NAMES.inscritsSansContrats,
        },
        responseType: "arraybuffer",
        headers: authHeader,
      });

      const inscritsSansContratsList = parseXlsxHeaderStreamToJson(response.data, 4);

      assert.equal(response.status, 200);
      assert.equal(inscritsSansContratsList.length, 15);
    });

    it("Vérifie qu'on peut récupérer des listes de données des abandons via API pour un admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const cfaUai = "9994889A";
      await new CfaModel({ uai_etablissement: cfaUai }).save();

      await seedDossiersApprenants({ annee_scolaire: "2020-2021", uai_etablissement: cfaUai });

      // Check good api call
      const response = await httpClient.get("/api/effectifs-export/export-xlsx-lists", {
        params: { date: "2020-10-10T00:00:00.000Z", effectif_indicateur: EFFECTIF_INDICATOR_NAMES.abandons },
        responseType: "arraybuffer",
        headers: authHeader,
      });

      const abandonsList = parseXlsxHeaderStreamToJson(response.data, 3);

      assert.equal(response.status, 200);
      assert.equal(abandonsList.length, 10);
    });

    it("Vérifie qu'on peut récupérer des listes de données des rupturants via API pour un CFA", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const cfaUai = "9994889A";
      await new CfaModel({ uai_etablissement: cfaUai }).save();

      await seedDossiersApprenants({ annee_scolaire: "2020-2021", uai_etablissement: cfaUai });

      // Check good api call
      const response = await httpClient.get("/api/effectifs-export/export-xlsx-lists", {
        params: { date: "2020-10-10T00:00:00.000Z", effectif_indicateur: EFFECTIF_INDICATOR_NAMES.rupturants },
        responseType: "arraybuffer",
        headers: authHeader,
      });

      const rupturantsList = parseXlsxHeaderStreamToJson(response.data, 4);

      assert.equal(response.status, 200);
      assert.equal(rupturantsList.length, 8);
    });
  });
});
