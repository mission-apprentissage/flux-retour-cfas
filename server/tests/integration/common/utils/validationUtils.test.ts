import { isValidCFD, isValidINE } from "@/common/constants/validations";
import { getAnneesScolaireListFromDate } from "@/common/utils/anneeScolaireUtils";
import { telephoneConverter } from "@/common/validation/utils/frenchTelephoneNumber";

describe("Validation Utils", () => {
  describe("validation du CFD", () => {
    [
      { input: null, output: false },
      { input: undefined, output: false },
      { input: 0, output: false },
      { input: "", output: false },
      { input: "ABC123", output: false },
      { input: "ABC123456", output: false },
      { input: "12345678", output: true },
      { input: "ABCDEFGH", output: true },
    ].forEach(({ input, output }) => {
      it(`Vérifie qu'un CFD de valeur ${JSON.stringify(input)} est ${output ? "valide" : "invalide"}`, () => {
        expect(isValidCFD(input)).toBe(output);
      });
    });
  });

  describe("validation de l'INE", () => {
    [
      { input: null, output: false },
      { input: undefined, output: false },
      { input: 0, output: false },
      { input: "", output: false },
      { input: "123456789F", output: false },
      { input: "123456789FFF", output: false },
      { input: "A123456789F", output: false },
      // valid INEs
      { input: "123456789FF", output: true },
      { input: "1234567890F", output: true },
      { input: "1234A12345F", output: true },
    ].forEach(({ input, output }) => {
      it(`Vérifie qu'un INE de valeur ${JSON.stringify(input)} est ${output ? "valide" : "invalide"}`, () => {
        expect(isValidINE(input)).toBe(output);
      });
    });
  });

  describe("validation des numeros de telephone", () => {
    [
      { input: null, output: null },
      { input: undefined, output: undefined },
      { input: 0, output: 0 },
      { input: "", output: "" },
      { input: "033638424988", output: "+33638424988" },
      { input: "0638424988", output: "+33638424988" },
      { input: "12345678", output: "12345678" },
      { input: "ABCDEFGH", output: "ABCDEFGH" },
    ].forEach(({ input, output }) => {
      it(`Vérifie qu'un numero de téléphone ${JSON.stringify(input)} est transformé en ${output}`, () => {
        expect(telephoneConverter(input as any)).toStrictEqual(output);
      });
    });
  });

  describe("deducation années scolaires en cours à partir d'une date", () => {
    [
      { date: "2020-09-01", expected: ["2020-2020", "2020-2021"] },
      { date: "2021-01-10", expected: ["2021-2021", "2020-2021"] },
      { date: "2021-07-31", expected: ["2021-2021", "2020-2021"] },
      { date: "2021-08-01", expected: ["2021-2021", "2021-2022"] },
      { date: "2021-10-01", expected: ["2021-2021", "2021-2022"] },
      { date: "2021-12-31", expected: ["2021-2021", "2021-2022"] },
      { date: "2022-03-01", expected: ["2022-2022", "2021-2022"] },
      { date: "2022-07-31", expected: ["2022-2022", "2021-2022"] },
      { date: "2022-08-01", expected: ["2022-2022", "2022-2023"] },
    ].forEach(({ date, expected }) => {
      it(`returns [${expected.join(", ")}] for ${date}`, () => {
        expect(getAnneesScolaireListFromDate(new Date(`${date}T00:00:00.000Z`))).toStrictEqual(expected);
      });
    });
  });
});