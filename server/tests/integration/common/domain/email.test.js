import { strict as assert } from "assert";
import { validateEmail } from "../../../../src/common/domain/email.js";

describe("Domain Email", () => {
  describe("validateEmail", () => {
    it("Vérifie qu'un email de valeur null est invalide", () => {
      const input = null;
      const result = validateEmail(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un email de valeur 0 est invalide", () => {
      const input = 0;
      const result = validateEmail(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un email de valeur chaîne vide est invalide", () => {
      const input = "";
      const result = validateEmail(input);
      assert.ok(result.error);
    });

    const invalidEmails = ["john-doe", "john-doe@mail", "@mail.com", "john-doe@.com"];

    invalidEmails.forEach((invalidEmail) => {
      it(`Vérifie qu'un email de valeur ${invalidEmail} est invalide`, () => {
        const result = validateEmail(invalidEmail);
        assert.ok(result.error);
      });
    });

    const validEmails = ["john.doe@mail.com", "john@mail.fr", "john75@blabla.co.uk"];

    validEmails.forEach((validEmail) => {
      it(`Vérifie qu'un email de valeur ${validEmail} est valide`, () => {
        const result = validateEmail(validEmail);
        assert.equal(result.error, undefined);
      });
    });
  });
});
