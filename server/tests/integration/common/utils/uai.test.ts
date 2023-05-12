import { getDepartementCodeFromUai } from "@/common/utils/uaiUtils";
import { isValidUAI } from "@/common/utils/validationUtils";

describe("Domain UAI", () => {
  describe("isValidUAI", () => {
    [null, undefined, 0, "", "abcdefgh", "12345678"].forEach((uai: any) => {
      it(`Vérifie qu'un UAI de valeur ${JSON.stringify(uai)} est invalide`, () => {
        expect(isValidUAI(uai)).toBeFalsy();
      });
    });

    it("Vérifie qu'un UAI respectant le format est valide", () => {
      const input = "0000001S";
      expect(isValidUAI(input)).toBeTruthy();
    });
  });

  describe("getDepartementCodeFromUai", () => {
    [
      { input: "0011074M", output: "01" },
      { input: "0772242U", output: "77" },
      { input: "9741681J", output: "974" },
    ].forEach(({ input, output }) => {
      it(`Vérifie qu'on récupère le département ${input} pour ${input}`, () => {
        expect(getDepartementCodeFromUai(input)).toBe(output);
      });
    });

    it("Vérifie que la fonction throw une erreur lorsqu'un UAI invalide est passé", () => {
      const input = "abc";
      expect(() => getDepartementCodeFromUai(input)).toThrowError("invalid uai passed");
    });
  });
});
