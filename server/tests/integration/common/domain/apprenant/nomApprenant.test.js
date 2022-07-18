const assert = require("assert").strict;
const { validateNomApprenant } = require("../../../../../src/common/domain/apprenant/nomApprenant");

describe("Domain nom apprenant", () => {
  describe("validateNomApprenant", () => {
    it("Vérifie qu'un nom apprenant de valeur null est invalide", async () => {
      const input = null;
      const result = validateNomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un nom apprenant de valeur '' est invalide", async () => {
      const input = "";
      const result = validateNomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un nom apprenant de type boolean est invalide", async () => {
      const input = true;
      const result = validateNomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un nom apprenant de type number est invalide", async () => {
      const input = 1234;
      const result = validateNomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un nom apprenant de type string est valide", async () => {
      const input = "hello";
      const result = validateNomApprenant(input);
      assert.equal(result.error, undefined);
    });
  });
});
