import { strict as assert } from "assert";
import { validatePrenomApprenant } from "../../../../../src/common/utils/validationsUtils/apprenant/prenomApprenant.js";

describe("Domain prenom apprenant", () => {
  describe("validatePrenomApprenant", () => {
    it("Vérifie qu'un prenom apprenant de valeur null est invalide", () => {
      const input = null;
      const result = validatePrenomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un prenom apprenant de valeur '' est invalide", () => {
      const input = "";
      const result = validatePrenomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un prenom apprenant de type boolean est invalide", () => {
      const input = true;
      const result = validatePrenomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un prenom apprenant de type number est invalide", () => {
      const input = 99;
      const result = validatePrenomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un prenom apprenant de type string est valide", () => {
      const input = "john";
      const result = validatePrenomApprenant(input);
      assert.equal(result.error, undefined);
    });
  });
});
