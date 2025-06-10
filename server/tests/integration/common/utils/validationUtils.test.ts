import { extensions } from "shared/models/parts/zodPrimitives";
import { it, expect, describe } from "vitest";

describe("Validation Utils", () => {
  describe("validation des numeros de telephone", () => {
    const testCases = [
      [null, { success: true, data: null }],
      [undefined, { success: true, data: undefined }],
      [0, { success: false, error: ["Format invalide"] }],
      ["", { success: true, data: null }],
      ["033638424988", { success: false, error: ["Format invalide"] }],
      ["0638424988", { success: true, data: "0638424988" }],
      ["(+)33638424988", { success: true, data: "0638424988" }],
      ["+33638424988", { success: true, data: "0638424988" }],
      ["+33123456789", { success: true, data: "0123456789" }],
      ["33 6 38 42 49 88", { success: true, data: "0638424988" }],
      ["12345678", { success: false, error: ["Format invalide"] }],
      ["ABCDEFGH", { success: false, error: ["Format invalide"] }],
      ["06-38.42.49.88", { success: true, data: "0638424988" }],
      ["06.38.42.49.88", { success: true, data: "0638424988" }],
      ["06-38-42-49-88", { success: true, data: "0638424988" }],
      ["06 (38) 42 49 88", { success: true, data: "0638424988" }],
      ["  06 38 42 49 88  ", { success: true, data: "0638424988" }],
      ["06abc38424988", { success: false, error: ["Format invalide"] }],
      ["+33(6)384-249-88", { success: true, data: "0638424988" }],
      ["+262 0693 31 00 00", { success: true, data: "+262693310000" }],
      ["06 93 31 00 00", { success: true, data: "+262693310000" }], // Réunion,
      ["06 94 31 00 00", { success: true, data: "+594694310000" }], // Martinique
      ["06 90 31 00 00", { success: true, data: "+590690310000" }], // Guadeloupe
      ["06 96 31 00 00", { success: true, data: "+596696310000" }], // Martinique
      ["06 92 31 00 00", { success: true, data: "+262692310000" }], // Réunion
      ["02 62 31 00 00", { success: true, data: "+262262310000" }], // Mayotte
      ["02 69 65 00 11", { success: true, data: "+262269650011" }], // Réunion
    ] as const;

    it.each(testCases)(`Vérifie qu'un numero de téléphone %s est transformé en %s`, (input, expected) => {
      const result = extensions.phone().nullish().safeParse(input);
      if (expected.success) {
        expect(result).toEqual(expected);
      } else {
        expect(result.success).toBe(false);
        expect(result.error?.format()).toEqual({ _errors: expected.error });
      }
    });
  });
});
