// import { strict as assert } from "assert";
// import { startServer } from "../../utils/testUtils.js";
// import { RESEAUX_CFAS } from "../../../src/common/constants/networksConstants.js";
// import { REGIONS, DEPARTEMENTS } from "../../../src/common/constants/territoiresConstants.js";

// describe("Referentiel Route", () => {
//   it("Vérifie qu'on peut récupérer les réseaux référentiels via API", async () => {
//     const { httpClient } = await startServer();

//     const response = await httpClient.get("/api/referentiel/networks");

//     assert.deepStrictEqual(response.status, 200);
//     assert.deepEqual(response.data.length, Object.values(RESEAUX_CFAS).length);
//     assert.deepEqual(response.data[0].nom, RESEAUX_CFAS.CMA.nomReseau);
//   });

//   it("Vérifie qu'on peut récupérer les numéro des régions via API", async () => {
//     const { httpClient } = await startServer();
//     const response = await httpClient.get("/api/referentiel/regions");

//     assert.deepStrictEqual(response.status, 200);
//     assert.deepEqual(response.data.length, REGIONS.length);
//     assert.deepEqual(response.data[0].code, REGIONS[0].code);
//     assert.deepEqual(response.data[0].nom, REGIONS[0].nom);
//   });

//   it("Vérifie qu'on peut récupérer les départements via API", async () => {
//     const { httpClient } = await startServer();
//     const response = await httpClient.get("/api/referentiel/departements");

//     assert.deepStrictEqual(response.status, 200);
//     assert.deepEqual(response.data.length, DEPARTEMENTS.length);
//     assert.deepEqual(response.data[0].code, DEPARTEMENTS[0].code);
//     assert.deepEqual(response.data[0].nom, DEPARTEMENTS[0].nom);
//   });
// });
