import { isValidCFD } from "shared";

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

  describe("validation des numeros de telephone", () => {
    const testCases = [
      { input: null, output: null },
      { input: undefined, output: undefined },
      { input: 0, output: "0" },
      { input: "", output: "" },
      { input: "033638424988", output: "033638424988" },
      { input: "0638424988", output: "0638424988" },
      { input: "(+)33638424988", output: "+33638424988" },
      { input: "+33638424988", output: "+33638424988" },
      { input: "+33123456789", output: "+33123456789" },
      { input: "33 6 38 42 49 88", output: "33638424988" },
      { input: "12345678", output: "12345678" },
      { input: "ABCDEFGH", output: "ABCDEFGH" },
      { input: "06-38.42.49.88", output: "0638424988" },
      { input: "06.38.42.49.88", output: "0638424988" },
      { input: "06-38-42-49-88", output: "0638424988" },
      { input: "06 (38) 42 49 88", output: "0638424988" },
      { input: "  06 38 42 49 88  ", output: "0638424988" },
      { input: "06abc38424988", output: "06abc38424988" },
      { input: "+33(6)384-249-88", output: "+33638424988" },
    ];

    testCases.forEach(({ input, output }) => {
      it(`Vérifie qu'un numero de téléphone ${JSON.stringify(input)} est transformé en ${output}`, () => {
        expect(telephoneConverter(input as any)).toStrictEqual(output);
      });
    });
  });
});
