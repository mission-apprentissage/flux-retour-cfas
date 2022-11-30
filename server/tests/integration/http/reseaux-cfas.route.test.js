// import { strict as assert } from "assert";

// // eslint-disable-next-line node/no-unpublished-require
// import { startServer } from "../../utils/testUtils.js";

// import { apiRoles } from "../../../src/common/roles.js";
// import users from "../../../src/common/components/users.js";
// import { reseauxCfasDb } from "../../../src/common/model/collections.js";

// const user = { name: "apiConsumerUser", password: "password" };

// const createApiUser = async () => {
//   const { createUser } = await users();
//   return await createUser({
//     username: user.name,
//     password: user.password,
//     permissions: [apiRoles.administrator],
//   });
// };

// const getJwtForUser = async (httpClient) => {
//   const { data } = await httpClient.post("/api/login", {
//     username: user.name,
//     password: user.password,
//   });
//   return data.access_token;
// };

// describe("Reseaux CFA route", () => {
//   describe("GET /api/v1/admin/reseaux-cfas", () => {
//     it("sends a 200 HTTP response with list of reseaux cfas", async () => {
//       const { httpClient, components } = await startServer();
//       await createApiUser();
//       const accessToken = await getJwtForUser(httpClient);

//       const reseauCfa1 = {
//         nom_reseau: "RESEAU_TEST_1",
//         nom_etablissement: "Etablissement de test 1",
//         uai: "0670141P",
//         siret: "34012780200015",
//       };
//       const reseauCfa2 = {
//         nom_reseau: "RESEAU_TEST_2",
//         nom_etablissement: "Etablissement de test 2",
//         uai: "0670141U",
//         siret: "34012780200010",
//       };
//       await components.reseauxCfas.create(reseauCfa1);
//       await components.reseauxCfas.create(reseauCfa2);

//       const response = await httpClient.get("/api/v1/admin/reseaux-cfas", {
//         headers: { Authorization: `Bearer ${accessToken}` },
//       });
//       assert.equal(response.status, 200);
//       assert.equal(response.data[0].nom_reseau, reseauCfa1.nom_reseau);
//       assert.equal(response.data[0].nom_etablissement, reseauCfa1.nom_etablissement);
//       assert.equal(response.data[0].uai, reseauCfa1.uai);
//       assert.equal(response.data[0].siret, reseauCfa1.siret);
//       assert.equal(response.data[1].nom_reseau, reseauCfa2.nom_reseau);
//       assert.equal(response.data[1].nom_etablissement, reseauCfa2.nom_etablissement);
//       assert.equal(response.data[1].uai, reseauCfa2.uai);
//       assert.equal(response.data[1].siret, reseauCfa2.siret);
//     });
//   });

//   describe("POST /api/v1/admin/reseaux-cfas/search", () => {
//     it("sends a 200 HTTP empty response when no match", async () => {
//       const { httpClient } = await startServer();
//       await createApiUser();
//       const accessToken = await getJwtForUser(httpClient);

//       const response = await httpClient.post(
//         "/api/v1/admin/reseaux-cfas/search",
//         {
//           searchTerm: "blabla",
//         },
//         { headers: { Authorization: `Bearer ${accessToken}` } }
//       );

//       assert.equal(response.status, 200);
//       assert.deepEqual(response.data, []);
//     });

//     it("sends a 200 HTTP response with results when match", async () => {
//       const { httpClient } = await startServer();
//       await createApiUser();
//       const accessToken = await getJwtForUser(httpClient);

//       await reseauxCfasDb().insertOne({
//         nom_etablissement: "BTP CFA Somme",
//         uai: "0801302F",
//         nom_reseau: "AGRI",
//         siret: "34012780200015",
//       });

//       const responseUai = await httpClient.post(
//         "/api/v1/admin/reseaux-cfas/search",
//         { searchTerm: "0801302F" },
//         { headers: { Authorization: `Bearer ${accessToken}` } }
//       );

//       const responseSiret = await httpClient.post(
//         "/api/v1/admin/reseaux-cfas/search",
//         { searchTerm: "34012780200015" },
//         { headers: { Authorization: `Bearer ${accessToken}` } }
//       );

//       const responseNomEtablissement = await httpClient.post(
//         "/api/v1/admin/reseaux-cfas/search",
//         { searchTerm: "Somme" },
//         { headers: { Authorization: `Bearer ${accessToken}` } }
//       );

//       assert.strictEqual(responseUai.status, 200);
//       assert.strictEqual(responseUai.data.length, 1);
//       assert.deepEqual(responseUai.data[0].nom_etablissement, "BTP CFA Somme");

//       assert.strictEqual(responseNomEtablissement.status, 200);
//       assert.strictEqual(responseNomEtablissement.data.length, 1);
//       assert.deepEqual(responseNomEtablissement.data[0].uai, "0801302F");

//       assert.strictEqual(responseSiret.status, 200);
//       assert.strictEqual(responseSiret.data.length, 1);
//       assert.deepEqual(responseSiret.data[0].siret, "34012780200015");
//     });
//   });

//   describe("DELETE /api/v1/admin/reseaux-cfas/delete/:id", () => {
//     it("Permet de supprimer un reseau de cfa", async () => {
//       const { httpClient, components } = await startServer();
//       await createApiUser();
//       const accessToken = await getJwtForUser(httpClient);

//       const reseauCfa1 = {
//         nom_reseau: "RESEAU_TEST_1",
//         nom_etablissement: "Etablissement de test 1",
//         uai: "0670141P",
//       };

//       const { _id } = await components.reseauxCfas.create(reseauCfa1);

//       await httpClient.delete(`/api/v1/admin/reseaux-cfas/delete/${_id}`, {
//         headers: { Authorization: `Bearer ${accessToken}` },
//       });
//       const found = await reseauxCfasDb().find().toArray();
//       assert.deepEqual(found, []);
//     });
//   });
// });
