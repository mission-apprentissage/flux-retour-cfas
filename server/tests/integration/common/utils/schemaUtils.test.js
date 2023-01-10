// import { strict as assert } from "assert";
// import { defaultValuesEffectif } from "../../../../src/common/model/next.toKeep.models/effectifs.model/effectifs.model.js";
// import { getSchemaValidationErrors } from "../../../../src/common/utils/schemaUtils.js";
// import { schema as effectifSchema } from "../../../../src/common/model/next.toKeep.models/effectifs.model/effectifs.model.js";
// import { defaultValuesApprenant } from "../../../../src/common/model/next.toKeep.models/effectifs.model/parts/apprenant.part.js";
// import mongodb from "mongodb";
// import { defaultValuesFormationEffectif } from "../../../../src/common/model/next.toKeep.models/effectifs.model/parts/formation.effectif.part.js";

// describe("getSchemaValidationErrors", () => {
//   it("returns [] when no validation errors", () => {
//     const validationErrors = getSchemaValidationErrors(defaultValuesEffectif({ lockAtCreate: false }), effectifSchema);
//     assert.deepEqual(validationErrors, []);
//   });

//   it("returns 1 error when validation error on one field", () => {
//     const dataToInsert = {
//       ...defaultValuesEffectif({ lockAtCreate: false }),
//       apprenant: { ...defaultValuesApprenant, nom: "test", prenom: "test", historique_statut: [] },
//       formation: { ...defaultValuesFormationEffectif, cfd: "50033412" },
//       id_erp_apprenant: "12345",
//       organisme_id: new mongodb.ObjectId(),
//       source: 5, // Error on field
//       annee_scolaire: "2022-2022",
//     };

//     const validationErrors = getSchemaValidationErrors(dataToInsert, effectifSchema);

//     assert.deepEqual(validationErrors, [
//       {
//         fieldName: "source",
//         inputValue: 5,
//         message: '"source" must be a string',
//       },
//     ]);
//   });

//   it("returns 2 errors when validation error on multiple fields", () => {
//     const dataToInsert = {
//       ...defaultValuesEffectif({ lockAtCreate: false }),
//       apprenant: { ...defaultValuesApprenant, nom: "test", prenom: "test", historique_statut: [] },
//       formation: { ...defaultValuesFormationEffectif, cfd: "50033412" },
//       id_erp_apprenant: "12345",
//       organisme_id: new mongodb.ObjectId(),
//       source: 5, // Error on field
//       annee_scolaire: 18,
//     };

//     const validationErrors = getSchemaValidationErrors(dataToInsert, effectifSchema);

//     assert.deepEqual(validationErrors, [
//       {
//         fieldName: "source",
//         inputValue: 5,
//         message: '"source" must be a string',
//       },
//       {
//         fieldName: "annee_scolaire",
//         inputValue: 18,
//         message: '"annee_scolaire" must be a string',
//       },
//     ]);
//   });
// });
