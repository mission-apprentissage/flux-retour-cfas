import { strict as assert } from "assert";

import { describe, it } from "vitest";

import { ADMIN_PASSWORD_MIN_LENGTH, zPassword } from "@/common/validation/passwordSchema";

describe("Validators", () => {
  describe("password", () => {
    const validPasswords = [
      "ABCabc123$^éçéàô>!ç",
      "KZ$OR4t$[<PFbhO.",
      "rEIFG~XRMkHj^g2t",
      'u")5wUo.5LFhVi^e',
      "/d)w-jzul5DAbSK'",
      "mr78>Axl,E)f=P$.",
      "}UMN2G[xheh|H}0p",
      "I1;!VjRxJ[QV3s4",
    ];
    validPasswords.forEach((validPassword) => {
      it(`Vérifie que ${validPassword} est un mot de passe valide`, () => {
        assert.equal(zPassword().safeParse(validPassword).success, true);
      });
    });

    const invalidPasswords = [
      "AAAABBBcccc123", // pas de caractère spécial
      "AAAABBBcccc????", // pas de chiffre
      "AAAABBB5555?.?.?.?.?.", // pas de minuscule
      "acacacacac5555?.?.?.?.?.", // pas de majuscule
      "aA3?;$", // trop court
      "Abc12e,'", // trop court (8 caractères)
      "",
    ];
    invalidPasswords.forEach((invalidPassword) => {
      it(`Vérifie que ${invalidPassword} n'est pas un mot de passe valide`, () => {
        assert.equal(zPassword().safeParse(invalidPassword).success, false);
      });
    });

    it("Vérifie que la longueur minimale administrateur est plus exigeante", () => {
      const password = "KZ$OR4t$[<PFbhO."; // 16 caractères, valide pour un compte standard
      assert.equal(zPassword().safeParse(password).success, true);
      assert.equal(zPassword(ADMIN_PASSWORD_MIN_LENGTH).safeParse(password).success, false);
    });
  });
});
