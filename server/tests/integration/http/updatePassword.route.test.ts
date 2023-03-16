// import { strict as assert } from "assert";
// import { startServer } from "../../utils/testUtils.js";

// describe("Update Password route", () => {
//   describe("POST /update-password", () => {
//     it("renvoie une 200 quand le token fourni et le nouveau mot de passe sont corrects", async () => {
//       const { httpClient, components } = await startServer();
//       // create user
//       const username = "user1";
//       const user = await components.users.createUser({ username });
//       // generate password update token
//       const token = await components.users.generatePasswordUpdateToken(username);

//       const response = await httpClient.post("/api/update-password", {
//         token,
//         newPassword: "strong long password 1234",
//       });

//       assert.equal(response.status, 200);

//       const userAfterRequest = await components.users.getUser(username);
//       assert.equal(userAfterRequest.password_update_token, null);
//       assert.equal(userAfterRequest.password_update_token_expiry, null);
//       assert.notEqual(user.password, userAfterRequest.password);
//     });

//     it("renvoie une 400 quand le nouveau mot de passe est trop court", async () => {
//       const { httpClient, components } = await startServer();
//       // create user
//       const username = "user1";
//       const user = await components.users.createUser({ username });
//       // generate password update token
//       const token = await components.users.generatePasswordUpdateToken(username);

//       const response = await httpClient.post("/api/update-password", {
//         token,
//         newPassword: "trop court",
//       });

//       assert.equal(response.status, 400);
//       assert.equal(response.data.details.length, 1);
//       assert.deepEqual(response.data.details[0].path, ["newPassword"]);
//       assert.equal(response.data.details[0].type, "string.min");

//       // user password should be unchanged
//       const userAfterRequest = await components.users.getUser(username);
//       assert.equal(user.password, userAfterRequest.password);
//     });

//     it("renvoie une 400 quand aucun token n'est fourni", async () => {
//       const { httpClient, components } = await startServer();
//       // create user
//       const username = "user1";
//       const user = await components.users.createUser({ username });
//       // generate password update token
//       await components.users.generatePasswordUpdateToken(username);

//       const response = await httpClient.post("/api/update-password", {
//         token: "",
//         newPassword: "mot de passe assez long",
//       });

//       assert.equal(response.status, 400);
//       assert.equal(response.data.details.length, 1);
//       assert.deepEqual(response.data.details[0].path, ["token"]);
//       assert.equal(response.data.details[0].type, "string.empty");

//       // user password should be unchanged
//       const userAfterRequest = await components.users.getUser(username);
//       assert.equal(user.password, userAfterRequest.password);
//     });

//     it("renvoie une 500 quand le token fourni ne correspond pas à celui généré", async () => {
//       const { httpClient, components } = await startServer();
//       // create user
//       const username = "user1";
//       const user = await components.users.createUser({ username });
//       // generate password update token
//       await components.users.generatePasswordUpdateToken(username);

//       const response = await httpClient.post("/api/update-password", {
//         token: "un-autre-token",
//         newPassword: "mot de passe assez long",
//       });

//       assert.equal(response.status, 500);

//       // user password should be unchanged
//       const userAfterRequest = await components.users.getUser(username);
//       assert.equal(user.password, userAfterRequest.password);
//     });

//     it("renvoie une 500 lorsqu'aucun token de modification de mot de passe n'a été créé", async () => {
//       const { httpClient, components } = await startServer();
//       // create user
//       const username = "user1";
//       const user = await components.users.createUser({ username });

//       const response = await httpClient.post("/api/update-password", {
//         token: "un token qui n'existe pas",
//         newPassword: "mot de passe assez long",
//       });

//       assert.equal(response.status, 500);

//       // user password should be unchanged
//       const userAfterRequest = await components.users.getUser(username);
//       assert.equal(user.password, userAfterRequest.password);
//     });
//   });
// });
