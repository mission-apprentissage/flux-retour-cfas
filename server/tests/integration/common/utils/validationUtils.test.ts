import { telephoneConverter } from "shared/utils/frenchTelephoneNumber";
import { it, expect, describe } from "vitest";

describe("Validation Utils", () => {
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
