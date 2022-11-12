import { strict as assert } from 'assert';
import { startServer } from '../../utils/testUtils';
import { createRandomDossierApprenant, getRandomSiretEtablissement } from '../../data/randomizedSample';
import { apiRoles } from '../../../src/common/roles';

import {
  historySequenceInscritToApprentiToAbandon,
  historySequenceApprenti,
  historySequenceInscritToApprenti,
} from '../../data/historySequenceSamples';

import { NATURE_ORGANISME_DE_FORMATION } from '../../../src/common/domain/organisme-de-formation/nature';
import { dossiersApprenantsDb, cfasDb } from '../../../src/common/model/collections';

describe(__filename, () => {
  describe("/api/effectifs route", () => {
    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/effectifs", {
        params: { date: "2020-10-10T00:00:00.000Z" },
      });

      assert.equal(response.status, 401);
    });

    it("Vérifie qu'on peut récupérer des effectifs via API pour une séquence de statuts sans filtres", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
          annee_scolaire: "2020-2021",
        });
        await dossiersApprenantsDb().insertOne(randomStatut);
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
        });
        await dossiersApprenantsDb().insertOne(randomStatut);
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          annee_scolaire: "2020-2021",
        });
        await dossiersApprenantsDb().insertOne(randomStatut);
      }

      // this one should be ignored because of annee_scolaire
      await dossiersApprenantsDb().insertOne(
        createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          annee_scolaire: "2021-2022",
        })
      );

      // Expected results
      const expectedResults = {
        nbInscrits: 15,
        nbApprentis: 5,
        nbAbandons: 10,
      };

      // Check good api call
      const response = await httpClient.get("/api/effectifs", {
        params: { date: "2020-10-10T00:00:00.000Z" },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      const indices = response.data;
      assert.deepEqual(indices.inscritsSansContrat + indices.rupturants, expectedResults.nbInscrits);
      assert.deepEqual(indices.apprentis, expectedResults.nbApprentis);
      assert.deepEqual(indices.abandons, expectedResults.nbAbandons);
    });

    it("Vérifie qu'on peut récupérer des effectifs via API pour une séquence de statuts avec filtres", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const filterQuery = { etablissement_num_region: "84" };

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
          annee_scolaire: "2020-2021",
          ...filterQuery,
        });
        await dossiersApprenantsDb().insertOne(randomStatut);
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
          ...filterQuery,
        });
        await dossiersApprenantsDb().insertOne(randomStatut);
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          annee_scolaire: "2020-2021",
          ...filterQuery,
        });
        await dossiersApprenantsDb().insertOne(randomStatut);
      }

      // Expected results
      const expectedResults = {
        nbInscrits: 15,
        nbApprentis: 5,
        nbAbandons: 10,
      };

      // Check good api call
      const response = await httpClient.get("/api/effectifs", {
        params: { date: "2020-10-10T00:00:00.000Z", ...filterQuery },
        headers: bearerToken,
      });

      const indices = response.data;
      assert.deepEqual(indices.inscritsSansContrat + indices.rupturants, expectedResults.nbInscrits);
      assert.deepEqual(indices.apprentis, expectedResults.nbApprentis);
      assert.deepEqual(indices.abandons, expectedResults.nbAbandons);

      // Check bad api call
      const badResponse = await httpClient.get("/api/effectifs", {
        params: { date: "2020-10-10T00:00:00.000Z", etablissement_num_region: "99" },
        headers: bearerToken,
      });

      assert.deepStrictEqual(badResponse.status, 200);
      assert.deepStrictEqual(badResponse.data.inscritsSansContrat, 0);
      assert.deepStrictEqual(badResponse.data.rupturants, 0);
      assert.deepStrictEqual(badResponse.data.apprentis, 0);
      assert.deepStrictEqual(badResponse.data.abandons, 0);
    });
  });

  describe("/api/effectifs/niveau-formation route", () => {
    it("Vérifie qu'on peut récupérer les effectifs répartis par niveaux de formation via API", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const filterQuery = { etablissement_num_region: "84" };

      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenant({
          ...filterQuery,
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
          niveau_formation: "1",
          niveau_formation_libelle: "1 (blabla)",
        });
        await dossiersApprenantsDb().insertOne(randomStatut);
      }

      const randomStatut = createRandomDossierApprenant({
        ...filterQuery,
        historique_statut_apprenant: historySequenceApprenti,
        annee_scolaire: "2020-2021",
        niveau_formation: "2",
        niveau_formation_libelle: "2 (blabla)",
      });
      await dossiersApprenantsDb().insertOne(randomStatut);

      const searchParams = `date=2020-10-10T00:00:00.000Z&etablissement_num_region=${filterQuery.etablissement_num_region}`;
      const response = await httpClient.get(`/api/effectifs/niveau-formation?${searchParams}`, {
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
      await dossiersApprenantsDb().insertOne(
        createRandomDossierApprenant({
          nom_etablissement: "TEST CFA",
          annee_scolaire: "2020-2021",
          siret_etablissement: "77929544300013",
          uai_etablissement: "0762232N",
          etablissement_num_region: regionNumTest,
        })
      );

      // Check good api call
      const response = await httpClient.get("/api/effectifs/total-organismes", {
        params: {
          etablissement_num_region: regionNumTest,
          date: "2020-10-10T00:00:00.000Z",
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { nbOrganismes: 1 });

      const badRegionResponse = await httpClient.get("/api/effectifs/total-organismes", {
        params: {
          etablissement_num_region: "01",
          date: "2020-10-10T00:00:00.000Z",
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
      await dossiersApprenantsDb().insertOne(
        createRandomDossierApprenant({
          nom_etablissement: "TEST CFA",
          annee_scolaire: "2020-2021",
          siret_etablissement: getRandomSiretEtablissement(),
          uai_etablissement: "0762232N",
          formation_cfd: formationCfd,
        })
      );

      // Check good api call
      const response = await httpClient.get("/api/effectifs/total-organismes", {
        params: {
          formation_cfd: formationCfd,
          date: "2020-10-10T00:00:00.000Z",
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { nbOrganismes: 1 });
    });

    it("Vérifie qu'on ne peut pas récupérer le bon nombre d'organismes transmettant de la donnée sur une formation pour une mauvaise année scolaire", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const formationCfd = "abcd1234";

      // Add 1 statut for formation
      await dossiersApprenantsDb().insertOne(
        createRandomDossierApprenant({
          nom_etablissement: "TEST CFA",
          annee_scolaire: "2022-2023",
          siret_etablissement: getRandomSiretEtablissement(),
          uai_etablissement: "0762232N",
          formation_cfd: formationCfd,
        })
      );

      // Check good api call
      const response = await httpClient.get("/api/effectifs/total-organismes", {
        params: {
          formation_cfd: formationCfd,
          date: "2020-10-10T00:00:00.000Z",
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { nbOrganismes: 0 });
    });
  });

  describe("/api/effectifs/formation route", () => {
    it("Vérifie qu'on peut récupérer les effectifs répartis par formation via API", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const filterQuery = { etablissement_num_region: "84" };

      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenant({
          ...filterQuery,
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
          niveau_formation: "1",
          niveau_formation_libelle: "1 (blabla)",
          libelle_long_formation: "a",
          formation_cfd: "77929544300013",
        });
        await dossiersApprenantsDb().insertOne(randomStatut);
      }

      const randomStatut = createRandomDossierApprenant({
        ...filterQuery,
        historique_statut_apprenant: historySequenceApprenti,
        annee_scolaire: "2020-2021",
        niveau_formation: "2",
        niveau_formation_libelle: "2 (blabla)",
        libelle_long_formation: "b",
        formation_cfd: "77929544300014",
      });
      await dossiersApprenantsDb().insertOne(randomStatut);

      const searchParams = `date=2020-10-10T00:00:00.000Z&etablissement_num_region=${filterQuery.etablissement_num_region}`;
      const response = await httpClient.get(`/api/effectifs/formation?${searchParams}`, {
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
        const randomStatut = createRandomDossierApprenant({
          ...filterQuery,
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
          annee_formation: 1,
        });
        await dossiersApprenantsDb().insertOne(randomStatut);
      }

      const randomStatut = createRandomDossierApprenant({
        ...filterQuery,
        historique_statut_apprenant: historySequenceApprenti,
        annee_scolaire: "2020-2021",
        annee_formation: 2,
      });
      await dossiersApprenantsDb().insertOne(randomStatut);

      const searchParams = `date=2020-10-10T00:00:00.000Z&etablissement_num_region=${filterQuery.etablissement_num_region}`;
      const response = await httpClient.get(`/api/effectifs/annee-formation?${searchParams}`, {
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

      const cfaData1 = {
        uai_etablissement: "0762232N",
        siret_etablissement: "83737827300023",
        nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
        nature_validity_warning: true,
      };
      await cfasDb().insertOne({
        uai: cfaData1.uai_etablissement,
        nature: cfaData1.nature,
        nature_validity_warning: cfaData1.nature_validity_warning,
      });

      const cfaData2 = {
        uai_etablissement: "0762232X",
        siret_etablissement: "83737827300093",
        nature: NATURE_ORGANISME_DE_FORMATION.INCONNUE,
        nature_validity_warning: false,
      };
      await cfasDb().insertOne({
        uai: cfaData2.uai_etablissement,
        nature: cfaData2.nature,
        nature_validity_warning: cfaData2.nature_validity_warning,
      });

      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenant({
          ...filterQuery,
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
          uai_etablissement: cfaData1.uai_etablissement,
          siret_etablissement: cfaData1.siret_etablissement,
        });
        await dossiersApprenantsDb().insertOne(randomStatut);
      }

      const randomStatut = createRandomDossierApprenant({
        ...filterQuery,
        historique_statut_apprenant: historySequenceApprenti,
        annee_scolaire: "2020-2021",
        uai_etablissement: cfaData2.uai_etablissement,
        siret_etablissement: cfaData2.siret_etablissement,
      });
      await dossiersApprenantsDb().insertOne(randomStatut);

      const searchParams = `date=2020-10-10T00:00:00.000Z&etablissement_num_region=${filterQuery.etablissement_num_region}`;
      const response = await httpClient.get(`/api/effectifs/cfa?${searchParams}`, {
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
        const randomStatut = createRandomDossierApprenant({
          ...filterQuery,
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
          siret_etablissement: "40239075100046",
        });
        await dossiersApprenantsDb().insertOne(randomStatut);
      }

      const randomStatut = createRandomDossierApprenant({
        ...filterQuery,
        historique_statut_apprenant: historySequenceApprenti,
        annee_scolaire: "2020-2021",
        siret_etablissement: "40239075100099",
      });
      await dossiersApprenantsDb().insertOne(randomStatut);

      const searchParams = `date=2020-10-10T00:00:00.000Z&etablissement_num_region=${filterQuery.etablissement_num_region}`;
      const response = await httpClient.get(`/api/effectifs/siret?${searchParams}`, {
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
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
          etablissement_num_departement: "01",
          etablissement_nom_departement: "Ain",
        });
        await dossiersApprenantsDb().insertOne(randomStatut);
      }

      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: historySequenceApprenti,
        annee_scolaire: "2020-2021",
        etablissement_num_departement: "91",
        etablissement_nom_departement: "Essonne",
      });
      await dossiersApprenantsDb().insertOne(randomStatut);

      const searchParams = `date=2020-10-10T00:00:00.000Z`;
      const response = await httpClient.get(`/api/effectifs/departement?${searchParams}`, {
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.equal(response.data.length, 2);
    });
  });
});
