import { strict as assert } from "assert";
import { validateCodeCommune } from "../../../../../src/common/validation/utils/codeCommune.js";

describe("Domain Code Commune", () => {
  describe("validateCodeCommune", () => {
    it("Vérifie qu'un code commune de valeur null est invalide", () => {
      const input = null;
      const result = validateCodeCommune(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un code commune de valeur 0 est invalide", () => {
      const input = 0;
      const result = validateCodeCommune(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un code commune de valeur chaîne vide est invalide", () => {
      const input = "";
      const result = validateCodeCommune(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un code commune alphanumérique de longueur < 5 est invalide", () => {
      const input = "7500";
      const result = validateCodeCommune(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un code commune alphanumérique de longueur > 5 est invalide", () => {
      const input = "750001";
      const result = validateCodeCommune(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un code commune de valeur ABCDE est invalide", () => {
      const input = "ABCDE";
      const result = validateCodeCommune(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un code commune de valeur 3B001 est invalide", () => {
      const input = "3B001";
      const result = validateCodeCommune(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un code commune de valeur 75001 est valide", () => {
      const input = "75001";
      const result = validateCodeCommune(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'un code commune de valeur 01022 est valide", () => {
      const input = "01022";
      const result = validateCodeCommune(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'un code commune de valeur 2A004 est valide", () => {
      const input = "2A004";
      const result = validateCodeCommune(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'un code commune de valeur 2B134 est valide", () => {
      const input = "2B134";
      const result = validateCodeCommune(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'un code commune de valeur 97209 est valide", () => {
      const input = "97209";
      const result = validateCodeCommune(input);
      assert.equal(result.error, undefined);
    });
  });
});
