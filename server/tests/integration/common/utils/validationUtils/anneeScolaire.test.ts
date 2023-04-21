import { strict as assert } from "assert";

import { validateAnneeScolaire } from "@/common/validation/utils/anneeScolaire";

describe("Domain AnneeScolaire", () => {
  describe("validateAnneeScolaire", () => {
    it("Vérifie qu'une annee scolaire de valeur null est invalide", () => {
      const input = null;
      const isInvalid = Boolean(validateAnneeScolaire(input));
      assert.equal(isInvalid, true);
    });
    it("Vérifie qu'une annee scolaire de valeur undefined est invalide", () => {
      const input = undefined;
      const isInvalid = Boolean(validateAnneeScolaire(input));
      assert.equal(isInvalid, true);
    });
    it("Vérifie qu'une annee scolaire de valeur 0 est invalide", () => {
      const input = 0;
      const isInvalid = Boolean(validateAnneeScolaire(input));
      assert.equal(isInvalid, true);
    });
    it("Vérifie qu'une annee scolaire de valeur chaîne vide est invalide", () => {
      const input = "";
      const isInvalid = Boolean(validateAnneeScolaire(input));
      assert.equal(isInvalid, true);
    });
    it("Vérifie qu'une annee scolaire ne respectant pas le format est invalide", () => {
      const input = "2020,2021";
      const isInvalid = Boolean(validateAnneeScolaire(input));
      assert.equal(isInvalid, true);
    });
    it("Vérifie qu'une annee scolaire ne respectant pas le format est invalide", () => {
      const input = "202-2021";
      const isInvalid = Boolean(validateAnneeScolaire(input));
      assert.equal(isInvalid, true);
    });
    it("Vérifie qu'une annee scolaire respectant le format est valide", () => {
      const input = "2021-2022";
      const isInvalid = Boolean(validateAnneeScolaire(input).error);
      assert.equal(isInvalid, false);
    });
  });
});
