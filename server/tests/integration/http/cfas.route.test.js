// import { strict as assert } from "assert";
// import { startServer } from "../../utils/testUtils.js";
// import { createRandomDossierApprenant } from "../../data/randomizedSample.js";
// import { buildTokenizedString } from "../../../src/common/utils/buildTokenizedString.js";
// import { NATURE_ORGANISME_DE_FORMATION } from "../../../src/common/utils/validationsUtils/organisme-de-formation/nature.js";
// import { cfasDb, dossiersApprenantsDb } from "../../../src/common/model/collections.js";

// describe("Cfa Route", () => {
//   let httpClient;

//   beforeEach(async () => {
//     const { httpClient: _httpClient } = await startServer();
//     httpClient = _httpClient;
//   });

//   describe("POST /cfas/search", () => {
//     it("sends a 200 HTTP empty response when no match", async () => {
//       const response = await httpClient.post("/api/cfas/search", { searchTerm: "blabla" });

//       assert.equal(response.status, 200);
//       assert.deepEqual(response.data, []);
//     });

//     it("sends a 200 HTTP response with results when match", async () => {
//       await cfasDb().insertOne({
//         nom: "BTP CFA Somme",
//         nom_tokenized: buildTokenizedString("BTP CFA Somme", 4),
//         uai: "0801302F",
//         sirets: [],
//         created_at: new Date(),
//       });

//       const response = await httpClient.post("/api/cfas/search", { searchTerm: "Somme" });

//       assert.equal(response.status, 200);
//       assert.equal(response.data.length, 1);
//       assert.deepEqual(response.data[0].uai, "0801302F");
//     });

//     it("sends a 200 HTTP response with results when match", async () => {
//       await cfasDb().insertOne({
//         nom: "BTP CFA Somme",
//         nom_tokenized: buildTokenizedString("BTP CFA Somme", 4),
//         uai: "0801302F",
//         sirets: ["34012780200015"],
//         created_at: new Date(),
//       });

//       const response = await httpClient.post("/api/cfas/search", { searchTerm: "Somme" });

//       assert.equal(response.status, 200);
//       assert.equal(response.data.length, 1);
//       assert.deepEqual(response.data[0].sirets, ["34012780200015"]);
//     });
//   });

//   describe("GET /cfas/:uai", () => {
//     it("Vérifie qu'on peut récupérer les informations d'un CFA via son UAI", async () => {
//       const { httpClient } = await startServer();

//       const nomTest = "TEST NOM";
//       const siretTest = "77929544300013";
//       const uaiTest = "0762232N";
//       const adresseTest = "TEST ADRESSE";
//       const reseauxTest = ["Reseau1", "Reseau2"];

//       const cfaProps = {
//         nom: nomTest,
//         uai: uaiTest,
//         nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR,
//         nature_validity_warning: true,
//         reseaux: reseauxTest,
//         sirets: [siretTest],
//         adresse: adresseTest,
//         created_at: new Date(),
//       };

//       await cfasDb().insertOne(cfaProps);
//       await dossiersApprenantsDb().insertOne(
//         createRandomDossierApprenant({
//           siret_etablissement: siretTest,
//           uai_etablissement: uaiTest,
//           nom_etablissement: nomTest,
//         }),
//         { bypassDocumentValidation: true }
//       );

//       const response = await httpClient.get(`/api/cfas/${uaiTest}`);

//       assert.equal(response.status, 200);
//       assert.deepEqual(response.data, {
//         libelleLong: nomTest,
//         uai: uaiTest,
//         sousEtablissements: [{ nom_etablissement: nomTest, siret_etablissement: siretTest }],
//         adresse: adresseTest,
//         reseaux: reseauxTest,
//         nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR,
//         natureValidityWarning: true,
//       });
//     });

//     it("Vérifie qu'on reçoit une réponse 404 lorsqu'aucun CFA n'est trouvé pour le UAI demandé", async () => {
//       const { httpClient } = await startServer();

//       const response = await httpClient.get(`/api/cfas/unknown`);
//       assert.equal(response.status, 404);
//     });
//   });

//   describe("GET /cfas/url-access-token/:token", () => {
//     it("Vérifie qu'on peut récupérer l'UAI d'un CFA via un Token Url", async () => {
//       const { httpClient } = await startServer();

//       const nomTest = "TEST NOM";
//       const siretTest = "77929544300013";
//       const uaiTest = "0762232N";
//       const adresseTest = "TEST ADRESSE";
//       const reseauxTest = ["Reseau1", "Reseau2"];
//       const tokenTest = "TOKEN1234567890";

//       const cfaInfos = {
//         nom_etablissement: nomTest,
//         siret_etablissement: siretTest,
//         uai_etablissement: uaiTest,
//         etablissement_adresse: adresseTest,
//       };

//       const randomStatut = createRandomDossierApprenant(cfaInfos);
//       await dossiersApprenantsDb().insertOne(randomStatut, { bypassDocumentValidation: true });

//       // Add Cfa in referentiel
//       const cfaReferenceToAdd = cfasDb().insertOne({
//         sirets: [siretTest],
//         nom: nomTest,
//         uai: uaiTest,
//         reseaux: reseauxTest,
//         access_token: tokenTest,
//         created_at: new Date(),
//       });
//       await cfaReferenceToAdd;

//       const response = await httpClient.get(`/api/cfas/url-access-token/${tokenTest}`);

//       assert.equal(response.status, 200);
//       assert.deepEqual(response.data, { uai: uaiTest });
//     });

//     it("Vérifie qu'on reçoit une réponse 404 lorsqu'aucun CFA n'est trouvé pour le Token demandé", async () => {
//       const { httpClient } = await startServer();
//       const response = await httpClient.get(`/api/cfas/url-access-token/unknown`);
//       assert.equal(response.status, 404);
//     });
//   });

//   describe("GET /cfas", () => {
//     it("Vérifie qu'on peut récupérer une liste paginée de cfas pour une région en query", async () => {
//       const regionToTest = {
//         code: "24",
//         nom: "Centre-Val de Loire",
//       };

//       await cfasDb().insertOne({
//         uai: "0451582A",
//         sirets: ["31521327200067"],
//         nom: "TEST CFA",
//         region_nom: regionToTest.nom,
//         region_num: regionToTest.code,
//         created_at: new Date(),
//       });

//       const queryStringified = JSON.stringify({ region_num: regionToTest.code });
//       const response = await httpClient.get(`/api/cfas?query=${queryStringified}`);

//       assert.equal(response.status, 200);
//       assert.equal(response.data.cfas.length, 1);
//       assert.deepEqual(response.data.cfas[0].nom, "TEST CFA");
//       assert.deepEqual(response.data.cfas[0].region_nom, regionToTest.nom);
//       assert.deepEqual(response.data.cfas[0].region_num, regionToTest.code);

//       assert.equal(response.data.pagination.page, 1);
//       assert.equal(response.data.pagination.nombre_de_page, 1);
//       assert.equal(response.data.pagination.total, 1);
//     });
//   });
// });

// describe("searchCfas", () => {
//   const { searchCfas } = cfasComponent();
//   const cfaSeed = [
//     {
//       nom: "AFTRAL Amiens",
//       uai: "0802004U",
//       sirets: ["77554622900037", "77554622900038"],
//     },
//     {
//       nom: "AFTRAL Pau",
//       uai: "0642119F",
//       sirets: ["77554622900038"],
//     },
//     {
//       nom: "AFTRAL Nice",
//       uai: "0061989E",
//       sirets: ["77554622900039"],
//     },
//     {
//       nom: "BTP CFA Somme",
//       uai: "0801302F",
//       sirets: ["77554622900030"],
//     },
//   ];
//   const dossierApprenantSeed = [
//     {
//       ...createRandomDossierApprenant(),
//       uai_etablissement: cfaSeed[0].uai,
//       siret_etablissement: cfaSeed[0].sirets[0],
//       etablissement_num_departement: "80",
//       etablissement_num_region: "01",
//       etablissement_reseaux: "AFTRAL",
//     },
//     {
//       ...createRandomDossierApprenant(),
//       uai_etablissement: cfaSeed[1].uai,
//       siret_etablissement: cfaSeed[1].sirets[1],
//       etablissement_num_departement: "64",
//       etablissement_num_region: "02",
//       etablissement_reseaux: "AFTRAL",
//     },
//     {
//       ...createRandomDossierApprenant(),
//       uai_etablissement: cfaSeed[2].uai,
//       siret_etablissement: cfaSeed[2].sirets[2],
//       etablissement_num_departement: "06",
//       etablissement_num_region: "03",
//       etablissement_reseaux: "AFTRAL",
//     },
//     {
//       ...createRandomDossierApprenant(),
//       uai_etablissement: cfaSeed[3].uai,
//       siret_etablissement: cfaSeed[3].sirets[3],
//       etablissement_num_departement: "80",
//       etablissement_num_region: "01",
//       etablissement_reseaux: "BTP",
//     },
//   ];
//   beforeEach(async () => {
//     for (let i = 0; i < cfaSeed.length; i++) {
//       await cfasDb().insertOne({ ...cfaSeed[i], nom_tokenized: Cfa.createTokenizedNom(cfaSeed[i].nom) });
//     }
//     for (let i = 0; i < dossierApprenantSeed.length; i++) {
//       const dossierApprenant = dossierApprenantSeed[i];
//       await dossiersApprenantsDb().insertOne(dossierApprenant);
//     }
//   });
//   it("throws error when no parameter passed", async () => {
//     // TODO use assert.rejects
//     try {
//       await searchCfas();
//     } catch (err) {
//       assert.ok(err);
//     }
//   });
//   it("returns [] when no CFA found", async () => {
//     const cfa = await searchCfas({ searchTerm: "blabla" });
//     assert.deepEqual(cfa, []);
//   });
//   it("returns all cfas when no parameter passed", async () => {
//     const cfasFound = await searchCfas({});
//     assert.equal(cfasFound.length, cfaSeed.length);
//     const allUaiFound = cfasFound.map((cfa) => cfa.uai);
//     const allUaiSeed = cfaSeed.map((cfa) => cfa.uai);
//     assert.deepEqual(allUaiFound, allUaiSeed);
//   });
//   it("returns all cfas in a departement when etablissement_num_departement criteria passed", async () => {
//     const cfasFound = await searchCfas({ etablissement_num_departement: "80" });
//     assert.equal(cfasFound.length, 2);
//     const allUaiFound = cfasFound.map((cfa) => cfa.uai);
//     const expectedUai = [cfaSeed[3].uai, cfaSeed[0].uai];
//     assert.deepEqual(allUaiFound, expectedUai);
//   });
//   it("returns all cfas in a region when etablissement_num_region criteria passed", async () => {
//     const cfasFound = await searchCfas({ etablissement_num_region: "03" });
//     assert.equal(cfasFound.length, 1);
//     assert.equal(cfasFound[0].uai, cfaSeed[2].uai);
//   });
//   it("return all cfas in a reseau when etablissement_reseaux criteria passed", async () => {
//     const cfasFound = await searchCfas({ etablissement_reseaux: "AFTRAL" });
//     assert.equal(cfasFound.length, 3);
//     const allUaiFound = cfasFound.map((cfa) => cfa.uai);
//     const expectedUai = [cfaSeed[2].uai, cfaSeed[1].uai, cfaSeed[0].uai];
//     assert.deepEqual(allUaiFound, expectedUai);
//   });
//   it("return all cfas in a reseau and departement when etablissement_reseaux and etablissement_num_departement criteria passed", async () => {
//     const cfasFound = await searchCfas({ etablissement_reseaux: "AFTRAL", etablissement_num_departement: "80" });
//     assert.equal(cfasFound.length, 1);
//     assert.equal(cfasFound[0].uai, cfaSeed[0].uai);
//   });
//   describe("with search term", () => {
//     const validsearchTermCases = [
//       {
//         caseDescription: "when searchTerm matches several nom partially => AFTRAL",
//         searchTerm: "AFTRAL",
//         expectedResults: [cfaSeed[0], cfaSeed[1], cfaSeed[2]],
//       },
//       {
//         caseDescription: "when searchTerm matches several nom but with different case (aftral)",
//         searchTerm: "aftral",
//         expectedResults: [cfaSeed[0], cfaSeed[1], cfaSeed[2]],
//       },
//       {
//         caseDescription: "when searchTerm matches one nom (BTP CFA Somme)",
//         searchTerm: "BTP CFA Somme",
//         expectedResults: [cfaSeed[3]],
//       },
//       {
//         caseDescription: "when searchTerm matches one nom but partially (BTP Somme)",
//         searchTerm: "BTP Somme",
//         expectedResults: [cfaSeed[3]],
//       },
//       {
//         caseDescription: "when searchTerm matches a word in nom but with different diacritics and case (btp sômme)",
//         searchTerm: "btp sômme",
//         expectedResults: [cfaSeed[3]],
//       },
//     ];
//     validsearchTermCases.forEach(({ searchTerm, caseDescription, expectedResults }) => {
//       it(`returns list of CFA matching ${caseDescription}`, async () => {
//         const actualResults = await searchCfas({ searchTerm });
//         assert.equal(actualResults.length, expectedResults.length);
//         expectedResults.forEach((result) => {
//           const foundResult = actualResults.find((cfa) => cfa.uai_etablissement === result.uai_etablissement);
//           assert.ok(foundResult);
//         });
//       });
//     });
//     it("returns list of CFA whose UAI matches searchTerm", async () => {
//       const actual = await searchCfas({ searchTerm: cfaSeed[2].uai });
//       const expected = [cfaSeed[2]];
//       assert.equal(actual.length, 1);
//       assert.deepEqual(actual[0].nom, expected[0].nom);
//     });
//     it("returns list of CFA whose empty Sirets", async () => {
//       const actual = await searchCfas({ searchTerm: "77554622900031" });
//       assert.deepEqual(actual, []);
//     });
//     it("returns list of CFA whose several Sirets matches searchTerm", async () => {
//       cfaSeed[0].sirets.forEach(async (result) => {
//         await searchCfas({ searchTerm: result }).then((res) => {
//           const expected = [cfaSeed[0]];
//           assert.equal(res.length, 1);
//           assert.deepEqual(res[0].nom, expected[0].nom);
//         });
//       });
//     });
//     it("returns list of CFA matching searchTerm AND additional criteria (etablissement_num_departement)", async () => {
//       const actual = await searchCfas({ searchTerm: "AFTRAL", etablissement_num_departement: "80" });
//       const expected = [cfaSeed[0]];
//       assert.equal(actual.length, 1);
//       assert.deepEqual(actual[0].nom, expected[0].nom);
//     });
//     it("returns list of CFA matching searchTerm AND additional filter (etablissement_num_region)", async () => {
//       const actual = await searchCfas({ searchTerm: "AFTRAL", etablissement_num_region: "03" });
//       const expected = [cfaSeed[2]];
//       assert.equal(actual.length, 1);
//       assert.deepEqual(actual[0].nom, expected[0].nom);
//     });
//     it("returns list of CFA matching searchTerm AND additional filter (etablissement_reseaux)", async () => {
//       const actual = await searchCfas({ searchTerm: "somme", etablissement_reseaux: "BTP" });
//       const expected = [cfaSeed[3]];
//       assert.equal(actual.length, 1);
//       assert.deepEqual(actual[0].nom, expected[0].nom);
//     });
//   });
// });
