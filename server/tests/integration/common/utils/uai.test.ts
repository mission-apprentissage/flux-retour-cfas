import { strict as assert } from "assert";

import { getDepartementCodeFromUai } from "@/common/utils/uaiUtils";
import { validateUai } from "@/common/utils/validationUtils";

describe("Domain UAI", () => {
  describe("validateUai", () => {
    it("Vérifie qu'un UAI de valeur null est invalide", () => {
      const input = null;
      const result = validateUai(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un UAI de valeur undefined est invalide", () => {
      const input = undefined;
      const result = validateUai(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un UAI de valeur 0 est invalide", () => {
      const input = 0;
      const result = validateUai(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un UAI de valeur chaîne vide est invalide", () => {
      const input = "";
      const result = validateUai(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un UAI contenant uniquement des lettres est invalide", () => {
      const input = "abcdefgh";
      const result = validateUai(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un UAI contenant uniquement des nombes est invalide", () => {
      const input = "12345678";
      const result = validateUai(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un UAI respectant le format est valide", () => {
      const input = "0000001S";
      const result = validateUai(input);
      assert.equal(result.error, undefined);
    });
  });

  describe("getDepartementCodeFromUai", () => {
    it("Vérifie qu'on récupère le département 01 pour 0011074M", () => {
      const input = "0011074M";
      const expectedOutput = "01";
      assert.equal(getDepartementCodeFromUai(input), expectedOutput);
    });

    it("Vérifie qu'on récupère le département 77 pour 0772242U", () => {
      const input = "0772242U";
      const expectedOutput = "77";
      assert.equal(getDepartementCodeFromUai(input), expectedOutput);
    });

    it("Vérifie qu'on récupère le département 974 pour 9741681J", () => {
      const input = "9741681J";
      const expectedOutput = "974";
      assert.equal(getDepartementCodeFromUai(input), expectedOutput);
    });

    it("Vérifie que la fonction throw une erreur lorsqu'un UAI invalide est passé", () => {
      const input = "abc";
      assert.throws(() => getDepartementCodeFromUai(input), new Error("invalid uai passed"));
    });
  });
});
