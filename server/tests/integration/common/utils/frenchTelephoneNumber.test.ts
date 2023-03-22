import { strict as assert } from "assert";
import { transformToInternationalNumber } from "../../../../src/common/validation/utils/frenchTelephoneNumber.js";

describe("transformToInternationalNumber", () => {
  it("Transforme un numéro classique au format international", () => {
    const input = "0638424989";
    const expectedOutput = "33638424989";

    assert.equal(transformToInternationalNumber(input), expectedOutput);
  });

  it("Transforme un numéro contenant plusieurs 0 au format international", () => {
    const input = "0638404900";
    const expectedOutput = "33638404900";

    assert.equal(transformToInternationalNumber(input), expectedOutput);
  });

  it("Applique l'indicatif sans supprimer le 1ère caractère si pas de leading 0", () => {
    const input = "1638404900";
    const expectedOutput = "331638404900";

    assert.equal(transformToInternationalNumber(input), expectedOutput);
  });
});
