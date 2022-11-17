import { strict as assert } from "assert";
import { startServer } from "../../utils/testUtils.js";
import { createRandomDossierApprenant } from "../../data/randomizedSample.js";
import config from "../../../src/config.js";
import jwt from "jsonwebtoken";
import { apiRoles, tdbRoles } from "../../../src/common/roles.js";

import {
  historySequenceInscritToApprentiToAbandon,
  historySequenceApprenti,
  historySequenceInscritToApprenti,
  historySequenceApprentiToInscrit,
} from "../../data/historySequenceSamples.js";
import { RESEAUX_CFAS } from "../../../src/common/constants/networksConstants.js";
import { USER_EVENTS_ACTIONS } from "../../../src/common/constants/userEventsConstants.js";
import { userEventsDb, cfasDb } from "../../../src/common/model/collections.js";
import dossiersApprenants from "../../../src/common/components/dossiersApprenants.js";
import { Cfa } from "../../../src/common/factory/cfa.js";

describe("Effectifs Export Route", () => {
  const seedDossiersApprenants = async (statutsProps) => {
    const nbAbandons = 10;
    const nbApprentis = 5;

    // Add 10 statuts with history sequence - full
    for (let index = 0; index < nbAbandons; index++) {
      await dossiersApprenants().createDossierApprenant(
        createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
          ...statutsProps,
        })
      );
    }

    // Add 5 statuts with history sequence - simple apprenti
    for (let index = 0; index < nbApprentis; index++) {
      await dossiersApprenants().createDossierApprenant(
        createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceApprenti,
          ...statutsProps,
        })
      );
    }

    // Add 15 statuts with history sequence - inscritToApprenti
    for (let index = 0; index < 15; index++) {
      await dossiersApprenants().createDossierApprenant(
        createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          ...statutsProps,
        })
      );
    }

    // Add 8 statuts with history sequence - inscritToApprentiToInscrit (rupturant)
    for (let index = 0; index < 8; index++) {
      await dossiersApprenants().createDossierApprenant(
        createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceApprentiToInscrit,
          ...statutsProps,
        })
      );
    }
  };

  describe("/api/effectifs-export/export-csv-list route", () => {
    const API_ROUTE = "/api/effectifs-export/export-csv-list";

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const { httpClient } = await startServer();
      const response = await httpClient.get(API_ROUTE, { headers: { Authorization: "" } });
      assert.equal(response.status, 401);
    });

    it("Vérifie qu'on ne peut pas accéder à la route en étant authentifié mais sans le bon rôle", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", {
        permissions: [apiRoles.apiStatutsSeeder],
      });

      const response = await httpClient.get(API_ROUTE, {
        params: { date: "2022-06-10T00:00:00.000Z" },
        headers: authHeader,
      });
      assert.equal(response.status, 403);
      assert.equal(response.data, "Not authorized");
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
      const userEventInDb = await userEventsDb().findOne({
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
      const userEventInDb = await userEventsDb().findOne({
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
      const userEventInDb = await userEventsDb().findOne({
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
      const userEventInDb = await userEventsDb().findOne({
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
      const userEventInDb = await userEventsDb().findOne({
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
      const userEventInDb = await userEventsDb().findOne({
        action: USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.CFA_ANONYMOUS,
      });

      assert.equal(response.status, 200);
      assert.ok(response.data);
      assert.ok(userEventInDb);
    });

    it("Vérifie qu'on peut récupérer des listes de données nominatives pour un CFA via API en étant authentifié en tant que cfa", async () => {
      const { httpClient } = await startServer();

      // create cfa in db
      const uai_etablissement = "0762232N";
      await cfasDb().insertOne(
        Cfa.create({
          uai: uai_etablissement,
          nom: "cfa",
        })
      );
      const { access_token } = await cfasDb().findOne({ uai: uai_etablissement });

      // Authent cfa
      const authentResponse = await httpClient.post("/api/login-cfa", {
        cfaAccessToken: access_token,
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
      const userEventInDb = await userEventsDb().findOne({
        action: USER_EVENTS_ACTIONS.EXPORT_CSV_EFFECTIFS_LISTS.CFA_NAMED_DATA,
      });

      assert.equal(response.status, 200);
      assert.ok(response.data);
      assert.ok(userEventInDb);
    });
  });
});
