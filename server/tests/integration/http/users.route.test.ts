// import { strict as assert } from "assert";

// // eslint-disable-next-line node/no-unpublished-require
// import MockDate from "mockdate";

// import { startServer } from "../../utils/testUtils";
// import { apiRoles, tdbRoles } from "../../../src/common/roles";
// import { differenceInCalendarDays } from "date-fns";
// import config from "../../../src/config";
// import { ORGANISMES_APPARTENANCE } from "../../../src/common/constants/usersConstants";
// import omit from "lodash.omit";
// import { usersDb } from "../../../src/common/model/collections";

// describe("Users Route", () => {
//   afterEach(() => {
//     MockDate.reset();
//   });

//   describe("GET /users", () => {
//     it("sends a 401 HTTP response when user is not authenticated", async () => {
//       const { httpClient } = await startServer();
//       const response = await httpClient.get("/api/v1/admin/users", {});

//       assert.equal(response.status, 401);
//     });

//     it("sends a 403 HTTP response when user is not admin", async () => {
//       const { httpClient, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.apiStatutsSeeder] });

//       const response = await httpClient.get("/api/v1/admin/users", { headers: bearerToken });

//       assert.equal(response.status, 403);
//     });

//     it("sends a 200 HTTP response with list of users", async () => {
//       const { httpClient, components, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });

//       await components.users.createUser({
//         email: "test1@mail.com",
//         username: "test1",
//         permissions: [apiRoles.administrator],
//         network: "NETWORK",
//         region: "REGION",
//         organisme: "ORGANISME",
//       });

//       await components.users.createUser({
//         email: "test2@mail.com",
//         username: "test2",
//         permissions: [apiRoles.apiStatutsSeeder],
//         network: "NETWORK",
//         region: "REGION",
//         organisme: "ORGANISME",
//       });
//       const response = await httpClient.get("/api/v1/admin/users", { headers: bearerToken });

//       assert.equal(response.status, 200);
//       assert.equal(response.data.length, 3);

//       assert.equal(response.data[0].password, undefined);

//       assert.equal(response.data[1].password, undefined);
//       assert.equal(response.data[1].network, "NETWORK");
//       assert.equal(response.data[1].region, "REGION");
//       assert.equal(response.data[1].organisme, "ORGANISME");

//       assert.equal(response.data[2].password, undefined);
//       assert.equal(response.data[2].network, "NETWORK");
//       assert.equal(response.data[2].region, "REGION");
//       assert.equal(response.data[2].organisme, "ORGANISME");
//     });
//   });

//   describe("GET /users/:id", () => {
//     it("sends a 401 HTTP response when user is not authenticated", async () => {
//       const { httpClient } = await startServer();
//       const testObjectId = "an-id-&9393";
//       const response = await httpClient.get(`/api/v1/admin/user/${testObjectId}`, {}); // TODO

//       assert.equal(response.status, 401);
//     });

//     it("sends a 403 HTTP response when user is not admin", async () => {
//       const { httpClient, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.apiStatutsSeeder] });

//       const testObjectId = "random-id-39393";
//       const response = await httpClient.get(`/api/v1/admin/user/${testObjectId}`, { headers: bearerToken }); // TODO

//       assert.equal(response.status, 403);
//     });

//     it("sends a 200 HTTP response with the users with good id", async () => {
//       const { httpClient, components, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });

//       const username = "john-doe";
//       await components.users.createUser({ username });

//       // Find user
//       const found = await usersDb().findOne({ username });
//       assert.equal(found.username === username, true);
//       assert.equal(found._id !== null, true);

//       // Get by id
//       const response = await httpClient.get(`/api/v1/admin/user/${found._id}`, { headers: bearerToken }); // TODO

//       // Check response & data returner
//       assert.equal(response.status, 200);
//       assert.equal(response.data.username, found.username);
//     });
//   });

//   describe("POST /users", () => {
//     it("sends a 401 HTTP response when user is not authenticated", async () => {
//       const { httpClient } = await startServer();
//       const response = await httpClient.post("/api/v1/admin/user", {});

//       assert.equal(response.status, 401);
//     });

//     it("sends a 403 HTTP response when user is not admin", async () => {
//       const { httpClient, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.apiStatutsSeeder] });

//       const response = await httpClient.post("/api/v1/admin/user", {}, { headers: bearerToken });

//       assert.equal(response.status, 403);
//     });

//     it("sends a 200 HTTP response with created pilot user", async () => {
//       const { httpClient, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
//       const fakeNowDate = new Date();
//       MockDate.set(fakeNowDate);

//       const response = await httpClient.post(
//         "/api/v1/admin/user",
//         { email: "test@mail.com", username: "test", role: tdbRoles.pilot },
//         { headers: bearerToken }
//       );

//       assert.equal(response.status, 200);
//       assert.deepEqual(omit(response.data, ["id"]), {
//         email: "test@mail.com",
//         username: "test",
//         permissions: [tdbRoles.pilot],
//         network: null,
//         organisme: null,
//         region: null,
//         created_at: fakeNowDate.toISOString(),
//       });
//     });

//     it("sends a 200 HTTP response with created network and organisme and region user", async () => {
//       const { httpClient, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
//       const fakeNowDate = new Date();
//       MockDate.set(fakeNowDate);

//       const response = await httpClient.post(
//         "/api/v1/admin/user",
//         {
//           email: "test@mail.com",
//           username: "test",
//           role: tdbRoles.network,
//           network: "CMA",
//           region: "CENTRE VAL DE LOIRE",
//           organisme: "DREETS",
//         },
//         { headers: bearerToken }
//       );

//       assert.equal(response.status, 200);
//       assert.deepEqual(omit(response.data, ["id"]), {
//         email: "test@mail.com",
//         username: "test",
//         permissions: [tdbRoles.network],
//         network: "CMA",
//         organisme: "DREETS",
//         region: "CENTRE VAL DE LOIRE",
//         created_at: fakeNowDate.toISOString(),
//       });
//     });
//   });

//   describe("POST /users/generate-update-password-url", () => {
//     it("sends a 401 HTTP response when user is not authenticated", async () => {
//       const { httpClient } = await startServer();
//       const response = await httpClient.post("/api/v1/admin/user/generate-update-password-url"); // TODO

//       assert.equal(response.status, 401);
//     });

//     it("sends a 403 HTTP response when user is not admin", async () => {
//       const { httpClient, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.apiStatutsSeeder] });

//       const response = await httpClient.post(
//         "/api/v1/admin/user/generate-update-password-url", // TODO
//         { username: "john-doe" },
//         { headers: bearerToken }
//       );

//       assert.equal(response.status, 403);
//     });

//     it("sends a 200 HTTP response with password update url", async () => {
//       const { httpClient, createAndLogUserLegacy, components } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });

//       const username = "john-doe";
//       await components.users.createUser({ username });

//       const response = await httpClient.post(
//         "/api/v1/admin/user/generate-update-password-url", // TODO
//         { username },
//         { headers: bearerToken }
//       );

//       assert.equal(response.status, 200);
//       assert.ok(response.data.passwordUpdateUrl);
//       assert.equal(response.data.passwordUpdateUrl.startsWith(`${config.publicUrl}/modifier-mot-de-passe`), true);

//       const updatedUser = await components.users.getUser(username);
//       assert.ok(updatedUser.password_update_token);
//       // password token should expire in 48h
//       const expiryDate = updatedUser.password_update_token_expiry;
//       assert.equal(differenceInCalendarDays(expiryDate, new Date()), 2);
//     });
//   });

//   describe("DELETE /users/delete/:username", () => {
//     it("Permet de vérifier qu'on peut supprimer un utilisateur depuis son username en étant connecté en tant qu'administrateur", async () => {
//       const { httpClient, components, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
//       const username = "john-doe";
//       await components.users.createUser({ username });

//       const checkUserBeforeDelete = await usersDb().count({ username });
//       assert.equal(checkUserBeforeDelete, 1);

//       const response = await httpClient.delete(`/api/v1/admin/user/${username}`, { headers: bearerToken });
//       assert.equal(response.status, 200);
//       const checkAfterDelete = await usersDb().count({ username });
//       assert.equal(checkAfterDelete, 0);
//     });

//     it("Permet de vérifier qu'on ne peut supprimer un utilisateur depuis son username en étant connecté en tant que non administrateur", async () => {
//       const { httpClient, components, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [tdbRoles.pilot] });
//       const username = "john-doe";
//       await components.users.createUser({ username });

//       const checkUserBeforeDelete = await usersDb().count({ username });
//       assert.equal(checkUserBeforeDelete, 1);

//       const response = await httpClient.delete(`/api/v1/admin/user/${username}`, { headers: bearerToken });

//       assert.equal(response.status, 403);
//       const checkAfterDelete = await usersDb().count({ username });
//       assert.equal(checkAfterDelete, 1);
//     });

//     it("Permet de vérifier qu'on ne peut supprimer un utilisateur si on fournit un username inexistant en étant connecté en tant qu'administrateur", async () => {
//       const { httpClient, components, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
//       const username = "john-doe";
//       const badUsername = "john-smith";
//       await components.users.createUser({ username });

//       const checkUserBeforeDelete = await usersDb().count({ username });
//       assert.equal(checkUserBeforeDelete, 1);

//       const response = await httpClient.delete(`/api/v1/admin/user/${badUsername}`, { headers: bearerToken });

//       assert.equal(response.status, 500);
//       const checkAfterDelete = await usersDb().count({ username });
//       assert.equal(checkAfterDelete, 1);
//     });
//   });

//   describe("POST /users/search", () => {
//     it("sends a 200 HTTP empty response when no match", async () => {
//       const { httpClient, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
//       const response = await httpClient.post(
//         "/api/v1/admin/users/search",
//         { searchTerm: "blabla" },
//         { headers: bearerToken }
//       );

//       assert.equal(response.status, 200);
//       assert.deepEqual(response.data, []);
//     });

//     it("sends a 200 HTTP response with results when match on username", async () => {
//       const { httpClient, components, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user1", "password", { permissions: [apiRoles.administrator] });

//       await components.users.createUser({
//         email: "test3@mail.com",
//         username: "user2",
//         permissions: [apiRoles.administrator],
//         network: "NETWORK",
//         region: "REGION",
//         organisme: "ORGANISME",
//       });

//       await components.users.createUser({
//         email: "test3@mail.com",
//         username: "user3",
//         permissions: [apiRoles.apiStatutsSeeder],
//         network: "NETWORK",
//         region: "REGION",
//         organisme: "ORGANISME",
//       });

//       const response = await httpClient.post(
//         "/api/v1/admin/users/search",
//         { searchTerm: "user" },
//         { headers: bearerToken }
//       );

//       assert.strictEqual(response.status, 200);
//       assert.strictEqual(response.data.length, 3);
//       assert.deepEqual(response.data[0].username, "user1");
//       assert.deepEqual(response.data[1].username, "user2");
//       assert.deepEqual(response.data[2].username, "user3");
//     });

//     it("sends a 200 HTTP response with results when match on email", async () => {
//       const { httpClient, components, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user1", "password", {
//         email: "test1@mail.com",
//         permissions: [apiRoles.administrator],
//       });

//       await components.users.createUser({
//         email: "test2@mail.com",
//         username: "user2",
//         permissions: [apiRoles.administrator],
//         network: "NETWORK",
//         region: "REGION",
//         organisme: "ORGANISME",
//       });

//       await components.users.createUser({
//         email: "test3@mail.com",
//         username: "user3",
//         permissions: [apiRoles.apiStatutsSeeder],
//         network: "NETWORK",
//         region: "REGION",
//         organisme: "ORGANISME",
//       });

//       const response = await httpClient.post(
//         "/api/v1/admin/users/search",
//         { searchTerm: "mail.com" },
//         { headers: bearerToken }
//       );

//       assert.strictEqual(response.status, 200);
//       assert.strictEqual(response.data.length, 3);
//       assert.deepEqual(response.data[0].email, "test1@mail.com");
//       assert.deepEqual(response.data[1].email, "test2@mail.com");
//       assert.deepEqual(response.data[2].email, "test3@mail.com");
//     });

//     it("sends a 200 HTTP response with results when match on organisme", async () => {
//       const { httpClient, components, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user1", "password", {
//         organisme: ORGANISMES_APPARTENANCE.ACADEMIE,
//         permissions: [apiRoles.administrator],
//       });

//       await components.users.createUser({
//         email: "test2@mail.com",
//         username: "user2",
//         permissions: [apiRoles.administrator],
//         network: "NETWORK",
//         region: "REGION",
//         organisme: ORGANISMES_APPARTENANCE.ACADEMIE,
//       });

//       await components.users.createUser({
//         email: "test3@mail.com",
//         username: "user3",
//         permissions: [apiRoles.apiStatutsSeeder],
//         network: "NETWORK",
//         region: "REGION",
//         organisme: ORGANISMES_APPARTENANCE.ACADEMIE,
//       });

//       const response = await httpClient.post(
//         "/api/v1/admin/users/search",
//         { searchTerm: ORGANISMES_APPARTENANCE.ACADEMIE },
//         { headers: bearerToken }
//       );

//       assert.strictEqual(response.status, 200);
//       assert.strictEqual(response.data.length, 3);
//       assert.deepEqual(response.data[0].organisme, ORGANISMES_APPARTENANCE.ACADEMIE);
//       assert.deepEqual(response.data[1].organisme, ORGANISMES_APPARTENANCE.ACADEMIE);
//       assert.deepEqual(response.data[2].organisme, ORGANISMES_APPARTENANCE.ACADEMIE);
//     });
//   });

//   describe("PUT /users/:id", () => {
//     it("Permet de vérifier qu'on peut mettre à jour un utilisateur depuis son id en étant connecté en tant qu'administrateur", async () => {
//       const { httpClient, components, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [apiRoles.administrator] });
//       const username = "john-doe";
//       await components.users.createUser({ username });

//       // Find user
//       const found = await usersDb().findOne({ username });
//       assert.equal(found.username === username, true);
//       assert.equal(found._id !== null, true);

//       // Update
//       const response = await httpClient.put(
//         `/api/v1/admin/user/${found._id}`,
//         { username: "UPDATED" },
//         { headers: bearerToken }
//       );

//       // Check response & updated value
//       assert.equal(response.status, 200);
//       const checkAfterUpdate = await usersDb().findOne({ _id: found._id });
//       assert.equal(checkAfterUpdate.username === "UPDATED", true);
//     });

//     it("Permet de vérifier qu'on ne peut mettre à jour un utilisateur depuis son id en étant connecté en tant que non administrateur", async () => {
//       const { httpClient, components, createAndLogUserLegacy } = await startServer();
//       const bearerToken = await createAndLogUserLegacy("user", "password", { permissions: [tdbRoles.pilot] });
//       const username = "john-doe";
//       await components.users.createUser({ username });

//       // Find user
//       const found = await usersDb().findOne({ username });
//       assert.equal(found.username === username, true);
//       assert.equal(found._id !== null, true);

//       // Update
//       const response = await httpClient.put(
//         `/api/v1/admin/user/${found._id}`,
//         { username: "UPDATED" },
//         { headers: bearerToken }
//       );

//       // Check response & updated value
//       assert.equal(response.status, 403);
//       const checkAfterUpdate = await usersDb().count({ username: "UPDATED" });
//       assert.equal(checkAfterUpdate, 0);
//     });
//   });
// });
