const assert = require("assert").strict;
const { validatePrenomApprenant } = require("../../../../../src/common/domain/apprenant/prenomApprenant");

describe("Domain prenom apprenant", () => {
  describe("validatePrenomApprenant", () => {
    it("Vérifie qu'un prenom apprenant de valeur null est invalide", async () => {
      const input = null;
      const result = validatePrenomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un prenom apprenant de valeur '' est invalide", async () => {
      const input = "";
      const result = validatePrenomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un prenom apprenant de type boolean est invalide", async () => {
      const input = true;
      const result = validatePrenomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un prenom apprenant de type number est invalide", async () => {
      const input = 99;
      const result = validatePrenomApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un prenom apprenant de type string est valide", async () => {
      const input = "john";
      const result = validatePrenomApprenant(input);
      assert.equal(result.error, undefined);
    });
  });
});
