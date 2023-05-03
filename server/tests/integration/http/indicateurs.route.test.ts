import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";

import { effectifsDb, organismesDb } from "@/common/model/collections";
import { historySequenceInscritToApprenti } from "@tests/data/historySequenceSamples";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import {
  PermissionsTestConfig,
  commonEffectifsAttributes,
  organismes,
  testPermissions,
} from "@tests/utils/permissions";
import {
  RequestAsOrganisationFunc,
  expectForbiddenError,
  expectUnauthorizedError,
  id,
  initTestApp,
} from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

describe("Route indicateurs Route", () => {
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
  });
  beforeEach(async () => {
    await organismesDb().insertMany(organismes);
  });

  describe("GET /api/indicateurs - indicateurs sur les effectifs", () => {
    const date = "2022-10-10T00:00:00.000Z";
    const anneeScolaire = "2022-2023";

    beforeEach(async () => {
      await effectifsDb().insertOne(
        createSampleEffectif({
          ...commonEffectifsAttributes,
          annee_scolaire: anneeScolaire,
          apprenant: {
            historique_statut: historySequenceInscritToApprenti,
          },
        })
      );
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.get(`/api/indicateurs?date=${date}`);

      expectUnauthorizedError(response);
    });

    describe("Sans filtre", () => {
      describe("Permissions", () => {
        const accesOrganisme: PermissionsTestConfig<number> = {
          "OFF lié": 1,
          "OFF non lié": 0,
          "OFR lié": 1,
          "OFR responsable": 1,
          "OFR non lié": 0,
          "OFRF lié": 1,
          "OFRF responsable": 1,
          "OFRF non lié": 0,
          "Tête de réseau": 1,
          "Tête de réseau non liée": 0,
          "DREETS même région": 1,
          "DREETS autre région": 1,
          "DDETS même département": 1,
          "DDETS autre département": 1,
          "ACADEMIE même académie": 1,
          "ACADEMIE autre académie": 1,
          "Opérateur public national": 1,
          Administrateur: 1,
        };
        testPermissions(accesOrganisme, async (organisation, nbApprentis) => {
          const response = await requestAsOrganisation(organisation, "get", `/api/indicateurs?date=${date}`);

          assert.strictEqual(response.status, 200);
          assert.deepStrictEqual(response.data, {
            date,
            apprentis: nbApprentis,
            inscritsSansContrat: 0,
            rupturants: 0,
            abandons: 0,
            totalOrganismes: 0,
          });
        });
      });
    });

    describe("Avec filtre organisme_id", () => {
      describe("Permissions", () => {
        const accesOrganisme: PermissionsTestConfig = {
          "OFF lié": true,
          "OFF non lié": false,
          "OFR lié": true,
          "OFR responsable": true,
          "OFR non lié": false,
          "OFRF lié": true,
          "OFRF responsable": true,
          "OFRF non lié": false,
          "Tête de réseau": true,
          "Tête de réseau non liée": false,
          "DREETS même région": true,
          "DREETS autre région": false,
          "DDETS même département": true,
          "DDETS autre département": false,
          "ACADEMIE même académie": true,
          "ACADEMIE autre académie": false,
          "Opérateur public national": true,
          Administrateur: true,
        };
        testPermissions(accesOrganisme, async (organisation, allowed) => {
          const response = await requestAsOrganisation(
            organisation,
            "get",
            `/api/indicateurs?date=${date}&organisme_id=${id(1)}`
          );

          if (allowed) {
            assert.strictEqual(response.status, 200);
            assert.deepStrictEqual(response.data, {
              date,
              apprentis: 1,
              inscritsSansContrat: 0,
              rupturants: 0,
              abandons: 0,
              totalOrganismes: 0,
            });
          } else {
            expectForbiddenError(response);
          }
        });
      });
    });

    // it("Vérifie qu'on peut récupérer des effectifs via API pour une séquence de statuts sans filtres", async () => {
    //   const { httpClient, createAndLogUserLegacy } = await startServer();
    //   const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });

    //   // Add 10 statuts for filter with history sequence - full
    //   for (let index = 0; index < 10; index++) {
    //     await createRandomDossierApprenantWithHistorique({
    //       historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
    //       annee_scolaire: "2020-2021",
    //     });
    //   }

    //   // Add 5 statuts for filter with history sequence - simple apprenti
    //   for (let index = 0; index < 5; index++) {
    //     await createRandomDossierApprenantWithHistorique({
    //       historique_statut_apprenant: historySequenceApprenti,
    //       annee_scolaire: "2020-2021",
    //     });
    //   }

    //   // Add 15 statuts for filter  with history sequence - inscritToApprenti
    //   for (let index = 0; index < 15; index++) {
    //     await createRandomDossierApprenantWithHistorique({
    //       historique_statut_apprenant: historySequenceInscritToApprenti,
    //       annee_scolaire: "2020-2021",
    //     });
    //   }

    //   // this one should be ignored because of annee_scolaire
    //   await createRandomDossierApprenantWithHistorique({
    //     historique_statut_apprenant: historySequenceInscritToApprenti,
    //     annee_scolaire: "2021-2022",
    //   });

    //   // Expected results
    //   const expectedResults = {
    //     nbInscrits: 15,
    //     nbApprentis: 5,
    //     nbAbandons: 10,
    //   };

    //   // Check good api call
    //   const response = await httpClient.get("/api/indicateurs", {
    //     params: { date: "2020-10-10T00:00:00.000Z" },
    //     headers: bearerToken,
    //   });

    //   expect(response.status).toBe(200);
    //   const indices = response.data;
    //   assert.deepEqual(indices.inscritsSansContrat + indices.rupturants, expectedResults.nbInscrits);
    //   assert.deepEqual(indices.apprentis, expectedResults.nbApprentis);
    //   assert.deepEqual(indices.abandons, expectedResults.nbAbandons);
    // });

    // it("Vérifie qu'on peut récupérer des effectifs via API pour une séquence de statuts avec filtres", async () => {
    //   const { httpClient, createAndLogUserLegacy } = await startServer();
    //   const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
    //   const filterQuery = { etablissement_num_region: "84" };

    //   // Add 10 statuts for filter with history sequence - full
    //   for (let index = 0; index < 10; index++) {
    //     await createRandomDossierApprenantWithHistorique({
    //       historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
    //       annee_scolaire: "2020-2021",
    //       ...filterQuery,
    //     });
    //   }

    //   // Add 5 statuts for filter with history sequence - simple apprenti
    //   for (let index = 0; index < 5; index++) {
    //     await createRandomDossierApprenantWithHistorique({
    //       historique_statut_apprenant: historySequenceApprenti,
    //       annee_scolaire: "2020-2021",
    //       ...filterQuery,
    //     });
    //   }

    //   // Add 15 statuts for filter  with history sequence - inscritToApprenti
    //   for (let index = 0; index < 15; index++) {
    //     await createRandomDossierApprenantWithHistorique({
    //       historique_statut_apprenant: historySequenceInscritToApprenti,
    //       annee_scolaire: "2020-2021",
    //       ...filterQuery,
    //     });
    //   }

    //   // Expected results
    //   const expectedResults = {
    //     nbInscrits: 15,
    //     nbApprentis: 5,
    //     nbAbandons: 10,
    //   };

    //   // Check good api call
    //   const response = await httpClient.get("/api/indicateurs", {
    //     params: { date: "2020-10-10T00:00:00.000Z", ...filterQuery },
    //     headers: bearerToken,
    //   });

    //   const indices = response.data;
    //   assert.deepEqual(indices.inscritsSansContrat + indices.rupturants, expectedResults.nbInscrits);
    //   assert.deepEqual(indices.apprentis, expectedResults.nbApprentis);
    //   assert.deepEqual(indices.abandons, expectedResults.nbAbandons);

    //   // Check bad api call
    //   const badResponse = await httpClient.get("/api/indicateurs", {
    //     params: { date: "2020-10-10T00:00:00.000Z", etablissement_num_region: "99" },
    //     headers: bearerToken,
    //   });

    //   assert.deepStrictEqual(badResponse.status, 200);
    //   assert.deepStrictEqual(badResponse.data.inscritsSansContrat, 0);
    //   assert.deepStrictEqual(badResponse.data.rupturants, 0);
    //   assert.deepStrictEqual(badResponse.data.apprentis, 0);
    //   assert.deepStrictEqual(badResponse.data.abandons, 0);
    // });
  });

  //   describe("/api/indicateurs/niveau-formation route", () => {
  //     it("Vérifie qu'on peut récupérer les effectifs répartis par niveaux de formation via API", async () => {
  //       const { httpClient, createAndLogUserLegacy } = await startServer();
  //       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
  //       const filterQuery = { etablissement_num_region: "84" };

  //       for (let index = 0; index < 5; index++) {
  //         await createRandomDossierApprenantWithHistorique({
  //           ...filterQuery,
  //           historique_statut_apprenant: historySequenceApprenti,
  //           annee_scolaire: "2020-2021",
  //           niveau_formation: "1",
  //           niveau_formation_libelle: "1 (blabla)",
  //         });
  //       }

  //       await createRandomDossierApprenantWithHistorique({
  //         ...filterQuery,
  //         historique_statut_apprenant: historySequenceApprenti,
  //         annee_scolaire: "2020-2021",
  //         niveau_formation: "2",
  //         niveau_formation_libelle: "2 (blabla)",
  //       });

  //       const searchParams = `date=2020-10-10T00:00:00.000Z&etablissement_num_region=${filterQuery.etablissement_num_region}`;
  //       const response = await httpClient.get(`/api/indicateurs/niveau-formation?${searchParams}`, {
  //         headers: bearerToken,
  //       });

  //       expect(response.status).toBe(200);
  //       assert.equal(response.data.length, 2);
  //       const sortByNiveauFormation = (a, b) => (Number(a.niveau_formation) > Number(b.niveau_formation) ? 1 : -1);
  //       assert.deepStrictEqual(response.data.sort(sortByNiveauFormation), [
  //         {
  //           niveau_formation: "1",
  //           niveau_formation_libelle: "1 (blabla)",
  //           effectifs: { apprentis: 5, abandons: 0, inscritsSansContrat: 0, rupturants: 0 },
  //         },
  //         {
  //           niveau_formation: "2",
  //           niveau_formation_libelle: "2 (blabla)",
  //           effectifs: { apprentis: 1, abandons: 0, inscritsSansContrat: 0, rupturants: 0 },
  //         },
  //       ]);
  //     });
  //   });

  //   describe("/api/indicateurs/total-organismes route", () => {
  //     it("Vérifie qu'on peut récupérer le nombre d'organismes transmettant de la donnée sur une région", async () => {
  //       const { httpClient, createAndLogUserLegacy } = await startServer();
  //       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
  //       const regionNumTest = "28";

  //       // Add 1 statut for region
  //       await createRandomDossierApprenantWithHistorique({
  //         nom_etablissement: "TEST CFA",
  //         annee_scolaire: "2020-2021",
  //         siret_etablissement: "77929544300013",
  //         uai_etablissement: "0762232N",
  //         etablissement_num_region: regionNumTest,
  //         historique_statut_apprenant: historySequenceApprenti,
  //       });

  //       // Check good api call
  //       const response = await httpClient.get("/api/indicateurs/total-organismes", {
  //         params: {
  //           etablissement_num_region: regionNumTest,
  //           date: "2020-10-10T00:00:00.000Z",
  //         },
  //         headers: bearerToken,
  //       });

  //       expect(response.status).toBe(200);
  //       expect(response.data).toMatchObject({ nbOrganismes: 1 });

  //       const badRegionResponse = await httpClient.get("/api/indicateurs/total-organismes", {
  //         params: {
  //           etablissement_num_region: "01",
  //           date: "2020-10-10T00:00:00.000Z",
  //         },
  //         headers: bearerToken,
  //       });

  //       assert.deepStrictEqual(badRegionResponse.status, 200);
  //       assert.deepEqual(badRegionResponse.data, { nbOrganismes: 0 });
  //     });

  //     it("Vérifie qu'on peut récupérer le nombre d'organismes transmettant de la donnée sur une formation", async () => {
  //       const { httpClient, createAndLogUserLegacy } = await startServer();
  //       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
  //       const formationCfd = "abcd1234";

  //       // Add 1 statut for formation
  //       await createRandomDossierApprenantWithHistorique({
  //         nom_etablissement: "TEST CFA",
  //         annee_scolaire: "2020-2021",
  //         siret_etablissement: getRandomSiretEtablissement(),
  //         uai_etablissement: "0762232N",
  //         formation_cfd: formationCfd,
  //         historique_statut_apprenant: historySequenceApprenti,
  //       });

  //       // Check good api call
  //       const response = await httpClient.get("/api/indicateurs/total-organismes", {
  //         params: {
  //           formation_cfd: formationCfd,
  //           date: "2020-10-10T00:00:00.000Z",
  //         },
  //         headers: bearerToken,
  //       });

  //       expect(response.status).toBe(200);
  //       expect(response.data).toMatchObject({ nbOrganismes: 1 });
  //     });

  //     it("Vérifie qu'on ne peut pas récupérer le bon nombre d'organismes transmettant de la donnée sur une formation pour une mauvaise année scolaire", async () => {
  //       const { httpClient, createAndLogUserLegacy } = await startServer();
  //       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
  //       const formationCfd = "abcd1234";

  //       // Add 1 statut for formation
  //       await createRandomDossierApprenantWithHistorique({
  //         nom_etablissement: "TEST CFA",
  //         annee_scolaire: "2022-2023",
  //         siret_etablissement: getRandomSiretEtablissement(),
  //         uai_etablissement: "0762232N",
  //         formation_cfd: formationCfd,
  //         historique_statut_apprenant: historySequenceApprenti,
  //       });

  //       // Check good api call
  //       const response = await httpClient.get("/api/indicateurs/total-organismes", {
  //         params: {
  //           formation_cfd: formationCfd,
  //           date: "2020-10-10T00:00:00.000Z",
  //         },
  //         headers: bearerToken,
  //       });

  //       expect(response.status).toBe(200);
  //       expect(response.data).toMatchObject({ nbOrganismes: 0 });
  //     });
  //   });

  //   describe("/api/indicateurs/formation route", () => {
  //     it("Vérifie qu'on peut récupérer les effectifs répartis par formation via API", async () => {
  //       const { httpClient, createAndLogUserLegacy } = await startServer();
  //       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
  //       const filterQuery = { etablissement_num_region: "84" };

  //       for (let index = 0; index < 5; index++) {
  //         await createRandomDossierApprenantWithHistorique({
  //           ...filterQuery,
  //           historique_statut_apprenant: historySequenceApprenti,
  //           annee_scolaire: "2020-2021",
  //           niveau_formation: "1",
  //           niveau_formation_libelle: "1 (blabla)",
  //           libelle_long_formation: "a",
  //           formation_cfd: "77929544300013",
  //         });
  //       }

  //       await createRandomDossierApprenantWithHistorique({
  //         ...filterQuery,
  //         historique_statut_apprenant: historySequenceApprenti,
  //         annee_scolaire: "2020-2021",
  //         niveau_formation: "2",
  //         niveau_formation_libelle: "2 (blabla)",
  //         libelle_long_formation: "b",
  //         formation_cfd: "77929544300014",
  //       });

  //       const searchParams = `date=2020-10-10T00:00:00.000Z&etablissement_num_region=${filterQuery.etablissement_num_region}`;
  //       const response = await httpClient.get(`/api/indicateurs/formation?${searchParams}`, {
  //         headers: bearerToken,
  //       });

  //       expect(response.status).toBe(200);
  //       assert.equal(response.data.length, 2);
  //     });
  //   });

  //   describe("/api/indicateurs/annee-formation route", () => {
  //     it("Vérifie qu'on peut récupérer les effectifs répartis par annee-formation via API", async () => {
  //       const { httpClient, createAndLogUserLegacy } = await startServer();
  //       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
  //       const filterQuery = { etablissement_num_region: "84" };

  //       for (let index = 0; index < 5; index++) {
  //         await createRandomDossierApprenantWithHistorique({
  //           ...filterQuery,
  //           historique_statut_apprenant: historySequenceApprenti,
  //           annee_scolaire: "2020-2021",
  //           annee_formation: 1,
  //         });
  //       }
  //       await createRandomDossierApprenantWithHistorique({
  //         ...filterQuery,
  //         historique_statut_apprenant: historySequenceApprenti,
  //         annee_scolaire: "2020-2021",
  //         annee_formation: 2,
  //       });

  //       const searchParams = `date=2020-10-10T00:00:00.000Z&etablissement_num_region=${filterQuery.etablissement_num_region}`;
  //       const response = await httpClient.get(`/api/indicateurs/annee-formation?${searchParams}`, {
  //         headers: bearerToken,
  //       });

  //       expect(response.status).toBe(200);
  //       assert.equal(response.data.length, 2);
  //     });
  //   });

  //   describe("/api/indicateurs/cfa route", () => {
  //     it("Vérifie qu'on peut récupérer les effectifs répartis par cfa via API", async () => {
  //       const { httpClient, createAndLogUserLegacy } = await startServer();
  //       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
  //       const filterQuery = { etablissement_num_region: "84" };

  //       const cfaData1 = {
  //         uai_etablissement: "0762232N",
  //         siret_etablissement: "83737827300023",
  //         nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
  //         nature_validity_warning: true,
  //       };
  //       await organismesDb().insertOne({
  //         uai: cfaData1.uai_etablissement,
  //         nom: "aaaa",
  //         nature: cfaData1.nature,
  //         nature_validity_warning: cfaData1.nature_validity_warning,
  //         created_at: new Date(),
  //       });

  //       const cfaData2 = {
  //         uai_etablissement: "0762232X",
  //         siret_etablissement: "83737827300093",
  //         nature: NATURE_ORGANISME_DE_FORMATION.INCONNUE,
  //         nature_validity_warning: false,
  //       };
  //       await organismesDb().insertOne({
  //         uai: cfaData2.uai_etablissement,
  //         nom: "bbbb",
  //         nature: cfaData2.nature,
  //         nature_validity_warning: cfaData2.nature_validity_warning,
  //         created_at: new Date(),
  //       });

  //       for (let index = 0; index < 5; index++) {
  //         await createRandomDossierApprenantWithHistorique({
  //           ...filterQuery,
  //           annee_scolaire: "2020-2021",
  //           uai_etablissement: cfaData1.uai_etablissement,
  //           siret_etablissement: cfaData1.siret_etablissement,
  //           historique_statut_apprenant: historySequenceApprenti,
  //         });
  //       }

  //       await createRandomDossierApprenantWithHistorique({
  //         ...filterQuery,
  //         annee_scolaire: "2020-2021",
  //         uai_etablissement: cfaData2.uai_etablissement,
  //         siret_etablissement: cfaData2.siret_etablissement,
  //         historique_statut_apprenant: historySequenceApprenti,
  //       });

  //       const searchParams = `date=2020-10-10T00:00:00.000Z&etablissement_num_region=${filterQuery.etablissement_num_region}`;
  //       const response = await httpClient.get(`/api/indicateurs/cfa?${searchParams}`, {
  //         headers: bearerToken,
  //       });

  //       expect(response.status).toBe(200);
  //       assert.equal(response.data.length, 2);
  //     });
  //   });

  //   describe("/api/indicateurs/siret route", () => {
  //     it("Vérifie qu'on peut récupérer les effectifs répartis par siret via API", async () => {
  //       const { httpClient, createAndLogUserLegacy } = await startServer();
  //       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
  //       const filterQuery = { etablissement_num_region: "84" };

  //       for (let index = 0; index < 5; index++) {
  //         await createRandomDossierApprenantWithHistorique({
  //           ...filterQuery,
  //           annee_scolaire: "2020-2021",
  //           siret_etablissement: "40239075100046",
  //           historique_statut_apprenant: historySequenceApprenti,
  //         });
  //       }

  //       await createRandomDossierApprenantWithHistorique({
  //         ...filterQuery,
  //         annee_scolaire: "2020-2021",
  //         siret_etablissement: "40239075100099",
  //         historique_statut_apprenant: historySequenceApprenti,
  //       });

  //       const searchParams = `date=2020-10-10T00:00:00.000Z&etablissement_num_region=${filterQuery.etablissement_num_region}`;
  //       const response = await httpClient.get(`/api/indicateurs/siret?${searchParams}`, {
  //         headers: bearerToken,
  //       });

  //       expect(response.status).toBe(200);
  //       assert.equal(response.data.length, 2);
  //     });
  //   });

  //   describe("/api/indicateurs/departement route", () => {
  //     it("Vérifie qu'on peut récupérer les effectifs répartis par departement via API", async () => {
  //       const { httpClient, createAndLogUserLegacy } = await startServer();
  //       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });

  //       for (let index = 0; index < 5; index++) {
  //         await createRandomDossierApprenantWithHistorique({
  //           annee_scolaire: "2020-2021",
  //           etablissement_num_departement: "01",
  //           etablissement_nom_departement: "Ain",
  //           historique_statut_apprenant: historySequenceApprenti,
  //         });
  //       }

  //       await createRandomDossierApprenantWithHistorique({
  //         annee_scolaire: "2020-2021",
  //         etablissement_num_departement: "91",
  //         etablissement_nom_departement: "Essonne",
  //         historique_statut_apprenant: historySequenceApprenti,
  //       });

  //       const searchParams = `date=2020-10-10T00:00:00.000Z`;
  //       const response = await httpClient.get(`/api/indicateurs/departement?${searchParams}`, {
  //         headers: bearerToken,
  //       });

  //       expect(response.status).toBe(200);
  //       assert.equal(response.data.length, 2);
  //     });
  //   });
});
