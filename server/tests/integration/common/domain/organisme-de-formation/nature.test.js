const assert = require("assert").strict;
const {
  validateNatureOrganismeDeFormation,
} = require("../../../../../src/common/domain/organisme-de-formation/nature");

describe("Domain Organisme de formation nature", () => {
  describe("validateNatureOrganismeDeFormation", () => {
    it("Vérifie qu'une nature de valeur null est invalide", async () => {
      const input = null;
      const result = validateNatureOrganismeDeFormation(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'une nature de valeur 1 est invalide", async () => {
      const input = 1;
      const result = validateNatureOrganismeDeFormation(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'une nature de valeur false est invalide", async () => {
      const input = false;
      const result = validateNatureOrganismeDeFormation(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'une nature de valeur responsable_formateur est invalide", async () => {
      const input = "responsable_formateur";
      const result = validateNatureOrganismeDeFormation(input);
      assert.equal(result.error, undefined);
    });
  });
});
