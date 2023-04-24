import { strict as assert } from "assert";

import { telephoneConverter, validateFrenchTelephoneNumber } from "@/common/validation/utils/frenchTelephoneNumber";

describe("Domain French Telephone Number", () => {
  describe("validateFrenchTelephoneNumber", () => {
    it("Vérifie qu'un numero de téléphone de valeur null est invalide", () => {
      const input = null;
      const result = validateFrenchTelephoneNumber(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un numero de téléphone de valeur 0 est invalide", () => {
      const input = 0;
      const result = validateFrenchTelephoneNumber(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un numero de téléphone de valeur chaîne vide est invalide", () => {
      const input = "";
      const result = validateFrenchTelephoneNumber(input);
      assert.ok(result.error);
    });

    const invalidFrenchTelephoneNumbers = ["000", "0000000000", "+34611223344", "00122334455", "(33)0616217277"];

    invalidFrenchTelephoneNumbers.forEach((invalidFrenchTelephoneNumber) => {
      it(`Vérifie qu'un numero de téléphone de valeur ${invalidFrenchTelephoneNumber} est invalide`, () => {
        const result = validateFrenchTelephoneNumber(invalidFrenchTelephoneNumber);
        assert.ok(result.error);
      });
    });

    const validFrenchTelephoneNumbers = [
      "+33 6 20 30 40 50",
      "+33620304050",
      "+33120304050",
      "+33 1.20.30.40.50",
      "0102030405",
      "01.02.03.04.05",
      "01-02-03-04-05",
      "01 02 03 04 05",
      "0033602030455",
    ];

    validFrenchTelephoneNumbers.forEach((validFrenchTelephoneNumber) => {
      it(`Vérifie qu'un numero de téléphone de valeur ${validFrenchTelephoneNumber} est valide`, () => {
        const result = validateFrenchTelephoneNumber(validFrenchTelephoneNumber);
        assert.equal(result.error, undefined);
      });
    });
  });

  describe("telephoneConverter", () => {
    it("Vérifie qu'un numero de téléphone de 12 caractères commençant par 033xxxxxxxxx est transformé en +33xxxxxxxxx", () => {
      const input = "033638424988";
      const result = telephoneConverter(input);
      assert.equal(result, "+33638424988");
    });

    it("Vérifie qu'un numero de téléphone de 10 caractères commençant par 06xxxxxxxx est transformé en +336xxxxxxxx", () => {
      const input = "0638424988";
      const result = telephoneConverter(input);
      assert.equal(result, "+33638424988");
    });
  });
});
