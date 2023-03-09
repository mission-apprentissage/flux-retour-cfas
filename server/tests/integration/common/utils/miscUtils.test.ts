import { strict as assert } from "assert";
import { generateRandomAlphanumericPhrase } from "../../../../src/common/utils/miscUtils";

describe("generateRandomAlphanumericPhrase", () => {
  it("crée une chaîne de caractère aléatoire de longueur demandée", () => {
    const randomPhrase = generateRandomAlphanumericPhrase(13);
    assert.equal(randomPhrase.length, 13);
  });

  it("crée une chaîne de caractère aléatoire de longueur 20 lorsqu'aucun longueur n'est passée", () => {
    const randomPhrase = generateRandomAlphanumericPhrase();
    assert.equal(randomPhrase.length, 20);
  });

  it("crée une chaîne de caractère aléatoire ne contenant que des caractères alphanumériques", () => {
    const randomPhrase = generateRandomAlphanumericPhrase();
    assert.equal(/^[a-zA-Z0-9]*$/.test(randomPhrase), true);
  });
});
