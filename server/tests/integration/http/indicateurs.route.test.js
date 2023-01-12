import { strict as assert } from "assert";
import { startServer } from "../../utils/testUtils.js";
// import { createRandomDossierApprenant } from "../../data/randomizedSample.js";
// import { apiRoles } from "../../../src/common/roles.js";

// import {
//   historySequenceInscritToApprentiToAbandon,
//   historySequenceApprenti,
//   historySequenceInscritToApprenti,
// } from "../../data/historySequenceSamples.js";

// import { dossiersApprenantsMigrationDb } from "../../../src/common/model/collections.js";
// import dossiersApprenants from "../../../src/common/components/dossiersApprenants.js";
import { seedRoles } from "../../../src/jobs/seed/start/index.js";
import { createUser } from "../../../src/common/actions/users.actions.js";
import { userAfterCreate } from "../../../src/common/actions/users.afterCreate.actions.js";
import { createOrganisme } from "../../../src/common/actions/organismes/organismes.actions.js";

// const createRandomDossierApprenantWithHistorique = async (props) => {
//   const { _id } = await dossiersApprenants().createDossierApprenant(createRandomDossierApprenant());
//   await dossiersApprenantsMigrationDb().updateOne({ _id }, { $set: props });
// };

describe("Effectifs Route", () => {
  describe("/api/indicateurs route", () => {
    beforeEach(async () => {
      await seedRoles();
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/indicateurs", {
        params: { date: "2020-10-10T00:00:00.000Z" },
      });

      assert.equal(response.status, 401);
    });

    it("Vérifie qu'on ne peut pas accéder aux effectifs d'un autre organisme", async () => {
      const { httpClient, logUser } = await startServer();

      // Création de son organisme
      await createOrganisme({
        uai: "0142321X",
        sirets: ["44492238900010"],
        adresse: {
          departement: "14",
          region: "28",
          academie: "70",
        },
        reseaux: ["CCI"],
        erps: ["YMAG"],
        nature: "responsable_formateur",
        nom: "ADEN Formations (Caen)",
      });

      const otherOrganisme = await createOrganisme({
        uai: "0142322X",
        sirets: ["44492238900010"],
        adresse: {
          departement: "14",
          region: "28",
          academie: "70",
        },
        reseaux: ["CCI"],
        erps: ["YMAG"],
        nature: "responsable_formateur",
        nom: "ADEN Formations (Caen)",
      });

      // Create user & afterCreate actions
      const userOf = await createUser(
        { email: "of@test.fr", password: "Secret!Password1" },
        {
          nom: "of",
          prenom: "test",
          description: "Aden formation Caen - direction",
          account_status: "CONFIRMED",
          siret: "44492238900010",
          uai: "0142321X",
          organisation: "ORGANISME_FORMATION",
        }
      );
      await userAfterCreate({ user: userOf, pending: false, notify: false });

      // Log user
      const { cookie } = await logUser("of@test.fr", "Secret!Password1");

      // Get effectifs
      const response = await httpClient.get("/api/indicateurs", {
        params: { date: "2022-10-10T00:00:00.000Z", organisme_id: otherOrganisme._id.toString() },
        headers: { cookie },
      });

      assert.equal(response.status, 401);
      assert.equal(response.data.message, "Accès non autorisé");
    });

    it("Vérifie qu'on peut accéder aux effectifs de son organisme", async () => {
      const { httpClient, logUser } = await startServer();

      // Création de son organisme
      const createdOrganisme = await createOrganisme({
        uai: "0142321X",
        sirets: ["44492238900010"],
        adresse: {
          departement: "14",
          region: "28",
          academie: "70",
        },
        reseaux: ["CCI"],
        erps: ["YMAG"],
        nature: "responsable_formateur",
        nom: "ADEN Formations (Caen)",
      });

      // Create user & afterCreate actions
      const userOf = await createUser(
        { email: "of@test.fr", password: "Secret!Password1" },
        {
          nom: "of",
          prenom: "test",
          description: "Aden formation Caen - direction",
          account_status: "CONFIRMED",
          siret: "44492238900010",
          uai: "0142321X",
          organisation: "ORGANISME_FORMATION",
        }
      );
      await userAfterCreate({ user: userOf, pending: false, notify: false });

      // Log user
      const { cookie } = await logUser("of@test.fr", "Secret!Password1");

      // Get effectifs
      const response = await httpClient.get("/api/indicateurs", {
        params: { date: "2022-10-10T00:00:00.000Z", organisme_id: createdOrganisme._id.toString() },
        headers: { cookie },
      });

      assert.equal(response.status, 200);
      const indices = response.data;
      assert.deepEqual(indices.apprentis, 0);
      assert.deepEqual(indices.abandons, 0);
      assert.deepEqual(indices.rupturants, 0);
      assert.deepEqual(indices.inscritsSansContrat, 0);
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

    //   assert.equal(response.status, 200);
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

  //       assert.equal(response.status, 200);
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

  //       assert.equal(response.status, 200);
  //       assert.deepEqual(response.data, { nbOrganismes: 1 });

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

  //       assert.equal(response.status, 200);
  //       assert.deepEqual(response.data, { nbOrganismes: 1 });
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

  //       assert.equal(response.status, 200);
  //       assert.deepEqual(response.data, { nbOrganismes: 0 });
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

  //       assert.equal(response.status, 200);
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

  //       assert.equal(response.status, 200);
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
  //       await cfasDb().insertOne({
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
  //       await cfasDb().insertOne({
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

  //       assert.equal(response.status, 200);
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

  //       assert.equal(response.status, 200);
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

  //       assert.equal(response.status, 200);
  //       assert.equal(response.data.length, 2);
  //     });
  //   });
});
