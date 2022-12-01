// import { strict as assert } from "assert";
// import { startServer } from "../../utils/testUtils.js";
// import users from "../../../src/common/components/users.js";
// import { apiRoles } from "../../../src/common/roles.js";
// import { JOB_NAMES, jobEventStatuts } from "../../../src/common/constants/jobsConstants.js";
// import { EFFECTIF_INDICATOR_NAMES } from "../../../src/common/constants/dossierApprenantConstants.js";
// import { createRandomEffectifApprenant } from "../../data/randomizedSample.js";
// import { jobEventsDb, effectifsApprenantsDb } from "../../../src/common/model/collections.js";

// const user = { name: "apiConsumerUser", password: "password" };

// const createApiUser = async () => {
//   const { createUser } = await users();

//   return await createUser({
//     username: user.name,
//     password: user.password,
//     permissions: [apiRoles.apiStatutsConsumer.anonymousDataConsumer],
//   });
// };

// const getJwtForUser = async (httpClient) => {
//   const { data } = await httpClient.post("/api/login", {
//     username: user.name,
//     password: user.password,
//   });
//   return data.access_token;
// };

// describe("Effectifs Apprenants Route", () => {
//   describe("GET effectifs-apprenants/test", () => {
//     it("Vérifie que la route effectifs-apprenants/test fonctionne avec un jeton JWT", async () => {
//       const { httpClient } = await startServer();
//       await createApiUser();
//       const accessToken = await getJwtForUser(httpClient);

//       // Call Api Route
//       const response = await httpClient.get("/api/effectifs-apprenants/test", {
//         headers: { Authorization: `Bearer ${accessToken}` },
//       });

//       // Check Api Route data
//       assert.deepEqual(response.status, 200);
//       assert.deepEqual(response.data.msg, "ok");
//     });
//   });

//   describe("GET effectifs-apprenants/", () => {
//     it("Vérifie qu'on peut récupérer les effectifs apprenants si le Job est terminé", async () => {
//       const { httpClient } = await startServer();
//       await createApiUser();
//       const accessToken = await getJwtForUser(httpClient);

//       const uaiTest = "0152290X";

//       // Add ended Job Event
//       await createJobEvent({
//         jobname: JOB_NAMES.createEffectifsApprenantsCollection,
//         action: jobEventStatuts.ended,
//         date: new Date(),
//       });

//       for (let index = 0; index < 10; index++) {
//         await effectifsApprenantsDb().insertOne({
//           ...createRandomEffectifApprenant(),
//           uai_etablissement: uaiTest,
//         });
//       }

//       // Call Api Route
//       const response = await httpClient.get("/api/effectifs-apprenants?limit=2", {
//         headers: { Authorization: `Bearer ${accessToken}` },
//       });

//       // Check Api Route data
//       assert.deepEqual(response.status, 200);
//       assert.equal(response.data.effectifsApprenants.length, 2);
//       assert.equal(response.data.pagination.page, 1);
//       assert.equal(response.data.pagination.nombre_de_page, 5);
//       assert.equal(response.data.pagination.total, 10);
//     });

//     it("Vérifie qu'on ne peut pas récupérer les effectifs apprenants lorsque le Job n'est pas terminé", async () => {
//       const { httpClient } = await startServer();
//       await createApiUser();
//       const accessToken = await getJwtForUser(httpClient);

//       const uaiTest = "0152290X";

//       // Add ended Job Event
//       await createJobEvent({
//         jobname: JOB_NAMES.createEffectifsApprenantsCollection,
//         action: jobEventStatuts.started,
//         date: new Date(),
//       });

//       for (let index = 0; index < 10; index++) {
//         await effectifsApprenantsDb().insertOne({
//           ...createRandomEffectifApprenant(),
//           uai_etablissement: uaiTest,
//         });
//       }

//       // Call Api Route
//       const response = await httpClient.get("/api/effectifs-apprenants?limit=2", {
//         headers: { Authorization: `Bearer ${accessToken}` },
//       });

//       // Check Api Route data
//       assert.deepEqual(response.status, 503);
//     });

//     it("Vérifie qu'on peut récupérer les effectifs apprenants avec tous les champs optionnels remplis", async () => {
//       const { httpClient } = await startServer();
//       await createApiUser();
//       const accessToken = await getJwtForUser(httpClient);

//       const periode_formationTest = [2019, 2021];
//       const code_commune_insee_apprenantTest = "77144";
//       const date_de_naissance_apprenantTest = new Date("2000-01-13");
//       const contrat_date_debutTest = new Date("2021-03-10");
//       const contrat_date_finTest = new Date("2021-03-20");
//       const contrat_date_ruptureTest = new Date("2021-03-15");
//       const formation_rncpTest = "RNCP34945";

//       // Add ended Job Event
//       await createJobEvent({
//         jobname: JOB_NAMES.createEffectifsApprenantsCollection,
//         action: jobEventStatuts.ended,
//         date: new Date(),
//       });

//       for (let index = 0; index < 10; index++) {
//         await effectifsApprenantsDb().insertOne({
//           ...createRandomEffectifApprenant(),
//           periode_formation: periode_formationTest,
//           code_commune_insee_apprenant: code_commune_insee_apprenantTest,
//           date_de_naissance_apprenant: date_de_naissance_apprenantTest,
//           contrat_date_debut: contrat_date_debutTest,
//           contrat_date_fin: contrat_date_finTest,
//           contrat_date_rupture: contrat_date_ruptureTest,
//           formation_rncp: formation_rncpTest,
//         });
//       }

//       // Call Api Route
//       const response = await httpClient.get("/api/effectifs-apprenants?limit=2", {
//         headers: { Authorization: `Bearer ${accessToken}` },
//       });

//       // Check Api Route data
//       assert.deepEqual(response.status, 200);
//       assert.equal(response.data.effectifsApprenants.length, 2);
//       assert.equal(response.data.pagination.page, 1);
//       assert.equal(response.data.pagination.nombre_de_page, 5);
//       assert.equal(response.data.pagination.total, 10);
//       assert.strictEqual(response.data.effectifsApprenants[0].periode_formation.join(), periode_formationTest.join());
//       assert.strictEqual(
//         response.data.effectifsApprenants[0].code_commune_insee_apprenant,
//         code_commune_insee_apprenantTest
//       );
//       assert.strictEqual(
//         new Date(response.data.effectifsApprenants[0].date_de_naissance_apprenant).getTime(),
//         date_de_naissance_apprenantTest.getTime()
//       );
//       assert.strictEqual(
//         new Date(response.data.effectifsApprenants[0].contrat_date_debut).getTime(),
//         contrat_date_debutTest.getTime()
//       );
//       assert.strictEqual(
//         new Date(response.data.effectifsApprenants[0].contrat_date_fin).getTime(),
//         contrat_date_finTest.getTime()
//       );
//       assert.strictEqual(
//         new Date(response.data.effectifsApprenants[0].contrat_date_rupture).getTime(),
//         contrat_date_ruptureTest.getTime()
//       );
//       assert.strictEqual(response.data.effectifsApprenants[0].formation_rncp, formation_rncpTest);
//     });

//     it("Vérifie qu'on peut récupérer les effectifs apprenants avec des champs indicateur_effectif différents", async () => {
//       const { httpClient } = await startServer();
//       await createApiUser();
//       const accessToken = await getJwtForUser(httpClient);

//       // Add ended Job Event
//       await createJobEvent({
//         jobname: JOB_NAMES.createEffectifsApprenantsCollection,
//         action: jobEventStatuts.ended,
//         date: new Date(),
//       });

//       await effectifsApprenantsDb().insertOne({
//         ...createRandomEffectifApprenant(),
//         indicateur_effectif: EFFECTIF_INDICATOR_NAMES.apprentis,
//       });

//       await effectifsApprenantsDb().insertOne({
//         ...createRandomEffectifApprenant(),
//         indicateur_effectif: EFFECTIF_INDICATOR_NAMES.inscritsSansContrats,
//       });

//       // Call Api Route
//       const response = await httpClient.get("/api/effectifs-apprenants?limit=10", {
//         headers: { Authorization: `Bearer ${accessToken}` },
//       });

//       // Check Api Route data
//       assert.deepEqual(response.status, 200);
//       assert.equal(response.data.effectifsApprenants.length, 2);
//       assert.equal(response.data.pagination.page, 1);
//       assert.equal(response.data.pagination.nombre_de_page, 1);
//       assert.equal(response.data.pagination.total, 2);
//       assert.strictEqual(response.data.effectifsApprenants[0].indicateur_effectif, EFFECTIF_INDICATOR_NAMES.apprentis);
//       assert.strictEqual(
//         response.data.effectifsApprenants[1].indicateur_effectif,
//         EFFECTIF_INDICATOR_NAMES.inscritsSansContrats
//       );
//     });
//   });
// });
