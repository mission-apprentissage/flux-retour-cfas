// import { strict as assert } from "assert";
// import { startServer } from "../../utils/testUtils.js";

// describe("Cache Route", () => {
//   describe("POST /cache/clear", () => {
//     it("sends a 403 HTTP response when caller is not admin", async () => {
//       const { httpClient, createAndLogUserLegacy } = await startServer();
//       const authHeaders = await createAndLogUserLegacy("user", "password", { permissions: [] });

//       const response = await httpClient.post("/api/cache/clear", {}, { headers: authHeaders });
//       assert.equal(response.status, 403);
//     });
//   });
// });
