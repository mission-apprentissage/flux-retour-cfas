const assert = require("assert").strict;
const { startServer } = require("../../utils/testUtils");
const { createRandomDossierApprenant } = require("../../data/randomizedSample");
const { tdbRoles } = require("../../../src/common/roles");
const config = require("../../../config");
const jwt = require("jsonwebtoken");

const {
  historySequenceInscritToApprentiToAbandon,
  historySequenceApprenti,
  historySequenceInscritToApprenti,
  historySequenceApprentiToInscrit,
} = require("../../data/historySequenceSamples");
const { DossierApprenantModel, UserEventModel, CfaModel } = require("../../../src/common/model");
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

  describe("/api/effectifs-export/export-csv-list route", () => {
    const API_ROUTE = "/api/effectifs-export/export-csv-list";

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
        action: USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.TERRITOIRE_NATIONAL,
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
        action: USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.TERRITOIRE_DEPARTEMENT,
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
        action: USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.TERRITOIRE_REGION,
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
        action: USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.RESEAU,
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
        action: USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.FORMATION,
      });

      assert.equal(response.status, 200);
      assert.ok(response.data);
      assert.ok(userEventInDb);
    });

    it("Vérifie qu'on peut récupérer des listes de données anonymisées pour un CFA via API en étant authentifié en tant que pilot", async () => {
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
        action: USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.CFA_ANONYMOUS,
      });

      assert.equal(response.status, 200);
      assert.ok(response.data);
      assert.ok(userEventInDb);
    });

    it("Vérifie qu'on peut récupérer des listes de données nominatives pour un CFA via API en étant authentifié en tant que cfa", async () => {
      const { httpClient } = await startServer();

      // create cfa in db
      const token = "eyP33IyEAisoErO";
      const uai_etablissement = "0762232N";
      await new CfaModel({
        uai: uai_etablissement,
        access_token: token,
      }).save();

      // Authent cfa
      const authentResponse = await httpClient.post("/api/login-cfa", {
        cfaAccessToken: token,
      });

      // Check cfa authent
      assert.equal(authentResponse.status, 200);
      const decoded = jwt.verify(authentResponse.data.access_token, config.auth.user.jwtSecret);
      assert.ok(decoded.iat);
      assert.ok(decoded.exp);
      assert.equal(decoded.sub, uai_etablissement);
      assert.equal(decoded.iss, config.appName);
      assert.deepStrictEqual(decoded.permissions, [tdbRoles.cfa]);

      // Seed sample data
      await seedDossiersApprenants({ annee_scolaire: "2021-2022", uai_etablissement });

      // Check get named data
      const response = await httpClient.get(API_ROUTE, {
        params: { date: "2022-06-10T00:00:00.000Z", uai_etablissement, namedDataMode: true },
        headers: { Authorization: `Bearer ${authentResponse.data.access_token}` },
      });

      // Check good user event in db
      const userEventInDb = await UserEventModel.findOne({
        action: USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.CFA_NAMED_DATA,
      });

      assert.equal(response.status, 200);
      assert.ok(response.data);
      assert.ok(userEventInDb);
    });
  });
});
