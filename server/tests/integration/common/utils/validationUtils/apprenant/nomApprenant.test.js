import { strict as assert } from "assert";
import { validateNomApprenant } from "../../../../../../src/common/utils/validationsUtils/apprenant/nomApprenant.js";

describe("Domain nom apprenant", () => {
  describe("validateNomApprenant", () => {
    it("Vérifie qu'un nom apprenant de valeur null est invalide", () => {
      const input = null;
      const result = validateNomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un nom apprenant de valeur '' est invalide", () => {
      const input = "";
      const result = validateNomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un nom apprenant de type boolean est invalide", () => {
      const input = true;
      const result = validateNomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un nom apprenant de type number est invalide", () => {
      const input = 1234;
      const result = validateNomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un nom apprenant de type string est valide", () => {
      const input = "hello";
      const result = validateNomApprenant(input);
      assert.equal(result.error, undefined);
    });
  });
});
