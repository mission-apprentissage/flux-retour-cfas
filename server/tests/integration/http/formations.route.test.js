// import { strict as assert } from "assert";
// import { startServer } from "../../utils/testUtils.js";
// import { asyncForEach } from "../../../src/common/utils/asyncUtils.js";
// import { Formation } from "../../../src/common/factory/formation.js";
// import { createRandomDossierApprenant } from "../../data/randomizedSample.js";
// import { formationsDb, dossiersApprenantsMigrationDb } from "../../../src/common/model/collections.js";

// describe("Formations Route", () => {
//   const formationsSeed = [
//     {
//       cfd: "01022103",
//       rncps: ["RNCP31811"],
//       libelle: "EMPLOYE TRAITEUR (CAP)",
//       cfd_start_date: new Date("2021-08-31").toISOString(),
//       cfd_end_date: new Date("2022-08-31").toISOString(),
//     },
//   ];

//   const seedFormations = async () => {
//     await asyncForEach(formationsSeed, async (formationSeed) => {
//       const formation = Formation.create(formationSeed);
//       await formationsDb().insertOne(formation);
//       await dossiersApprenantsMigrationDb().insertOne(
//         {
//           ...createRandomDossierApprenant(),
//           formation_cfd: formation.cfd,
//         },
//         { bypassDocumentValidation: true }
//       );
//     });
//   };

//   let httpClient;

//   beforeEach(async () => {
//     const { httpClient: _httpClient } = await startServer();
//     httpClient = _httpClient;

//     await seedFormations();
//   });

//   it("sends a 400 HTTP response when searchTerm is shorter than 3 chars", async () => {
//     const searchTerm = "he";

//     const response = await httpClient.post("/api/formations/search", { searchTerm });

//     assert.equal(response.status, 400);
//   });

//   it("sends a 200 HTTP response with results when searchTerm is provided", async () => {
//     const response = await httpClient.post("/api/formations/search", { searchTerm: "traiteur" });

//     assert.equal(response.status, 200);
//     assert.deepEqual(response.data, formationsSeed);
//   });
// });
