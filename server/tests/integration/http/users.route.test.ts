// import { strict as assert } from "assert";
// import { ObjectId } from "mongodb";
// import sinon from "sinon";

// import { startServer, createAdminUser, createSimpleUser } from "@tests/utils/testUtils";
// import { createUser } from "@/common/actions/users.actions";

// const ADMIN_USERS_ENDPOINT = "/api/v1/admin/users";

// describe("Users Route", () => {
//   beforeEach(async () => {
//     // Crée une entrée en base
//     await createUser(
//       { email: "of@test.fr", password: "Secret!Password1" },
//       {
//         nom: "of",
//         prenom: "test",
//         roles: ["of"],
//         account_status: "DIRECT_PENDING_PASSWORD_SETUP",
//       }
//     );
//   });

//   describe("GET /users", () => {
//     it("sends a 401 HTTP response when user is not authenticated", async () => {
//       const { httpClient } = await startServer();
//       const response = await httpClient.get(ADMIN_USERS_ENDPOINT, {});

//       assert.strictEqual(response.status, 401);
//     });

//     it("sends a 403 HTTP response when user is not admin", async () => {
//       const { httpClient, logUser } = await startServer();
//       const { email, password } = await createSimpleUser();
//       const { cookie } = await logUser(email, password);

//       const response = await httpClient.get(ADMIN_USERS_ENDPOINT, { headers: { cookie } });

//       assert.strictEqual(response.status, 403);
//     });

//     it("sends a 200 HTTP response with list of users", async () => {
//       const { httpClient, logUser } = await startServer();
//       const { email, password } = await createAdminUser();
//       const { cookie } = await logUser(email, password);

//       const response = await httpClient.get(ADMIN_USERS_ENDPOINT, { headers: { cookie } });

//       assert.strictEqual(response.status, 200);
//       assert.strictEqual(response.data.data.length, 2);
//     });
//   });
// });

// describe("GET /users/[id]", () => {
//   it("sends a 401 HTTP response when user is not authenticated", async () => {
//     const { httpClient } = await startServer();
//     const response = await httpClient.get(`${ADMIN_USERS_ENDPOINT}/${new ObjectId()}`, {});

//     assert.strictEqual(response.status, 401);
//   });

//   it("sends a 403 HTTP response when user is not admin", async () => {
//     const { httpClient, logUser } = await startServer();
//     const { email, password } = await createSimpleUser();
//     const { cookie } = await logUser(email, password);

//     const response = await httpClient.get(`${ADMIN_USERS_ENDPOINT}/${new ObjectId()}`, { headers: { cookie } });

//     assert.strictEqual(response.status, 403);
//   });

//   it("sends a 400 HTTP response if invalid id", async () => {
//     const { httpClient, logUser } = await startServer();
//     const { email, password } = await createAdminUser();
//     const { cookie } = await logUser(email, password);

//     const response = await httpClient.get(`${ADMIN_USERS_ENDPOINT}/invalidUserId`, { headers: { cookie } });

//     assert.strictEqual(response.status, 400);
//     assert.deepStrictEqual(response.data, {
//       error: "Bad Request",
//       message: "Erreur de validation",
//       details: [
//         {
//           code: "custom",
//           fatal: true,
//           message: "Input not instance of ObjectId",
//           path: ["id"],
//         },
//       ],
//     });
//   });

//   it("sends a 404 HTTP response if user not found", async () => {
//     const { httpClient, logUser } = await startServer();
//     const { email, password } = await createAdminUser();
//     const { cookie } = await logUser(email, password);

//     const response = await httpClient.get(`${ADMIN_USERS_ENDPOINT}/${new ObjectId()}`, { headers: { cookie } });

//     assert.strictEqual(response.status, 404);
//   });

//   it("sends a 200 HTTP response if user is found", async () => {
//     const { httpClient, logUser } = await startServer();
//     const { _id, email, password } = await createAdminUser();
//     const { cookie } = await logUser(email, password);

//     const response = await httpClient.get(`${ADMIN_USERS_ENDPOINT}/${_id}`, { headers: { cookie } });
//     assert.strictEqual(response.status, 200);
//   });
// });

// describe("POST /users", () => {
//   it("sends a 401 HTTP response when user is not authenticated", async () => {
//     const { httpClient } = await startServer();
//     const response = await httpClient.post(ADMIN_USERS_ENDPOINT, {});

//     assert.strictEqual(response.status, 401);
//   });

//   it("sends a 403 HTTP response when user is not admin", async () => {
//     const { httpClient, logUser } = await startServer();
//     const { email, password } = await createSimpleUser();
//     const { cookie } = await logUser(email, password);

//     const response = await httpClient.post(ADMIN_USERS_ENDPOINT, {}, { headers: { cookie } });

//     assert.strictEqual(response.status, 403);
//   });

//   it("sends a 400 HTTP response if invalid data", async () => {
//     const { httpClient, logUser } = await startServer();
//     const { email, password } = await createAdminUser();
//     const { cookie } = await logUser(email, password);

//     const response = await httpClient.post(ADMIN_USERS_ENDPOINT, { is_admin: true }, { headers: { cookie } });
//     assert.strictEqual(response.status, 400);
//     assert.deepStrictEqual(response.data, {
//       error: "Bad Request",
//       message: "Erreur de validation",
//       details: [
//         {
//           code: "invalid_type",
//           expected: "string",
//           received: "undefined",
//           path: ["prenom"],
//           message: "Required",
//         },
//         {
//           code: "invalid_type",
//           expected: "string",
//           received: "undefined",
//           path: ["nom"],
//           message: "Required",
//         },
//         {
//           code: "invalid_type",
//           expected: "string",
//           received: "undefined",
//           path: ["email"],
//           message: "Required",
//         },
//         {
//           code: "invalid_type",
//           expected: "array",
//           received: "undefined",
//           path: ["roles"],
//           message: "Required",
//         },
//       ],
//     });
//   });

//   it("sends a 200 HTTP response if valid data", async () => {
//     const { httpClient, logUser, mailer } = await startServer();
//     const { _id, email, password } = await createAdminUser();
//     const { cookie } = await logUser(email, password);

//     const response = await httpClient.post(
//       ADMIN_USERS_ENDPOINT,
//       {
//         prenom: "prenom",
//         nom: "nom",
//         email: "test@beta.gouv.fr",
//         roles: ["of"],
//       },
//       { headers: { cookie } }
//     );
//     assert.strictEqual(response.status, 200);
//     assert.strictEqual(
//       mailer.sendEmail.calledWith(sinon.match.has("to", "test@beta.gouv.fr"), "activation_user"),
//       true
//     );
//   });
// });
