import { z } from "zod";

describe("zod", () => {
  describe("z.email()", () => {
    [
      { input: "inconnu", expectedOutput: false },
      { input: "user@domain", expectedOutput: false },
      { input: "user+tag@domain.com", expectedOutput: true },
      { input: "user@domain.com", expectedOutput: true },
      { input: "user@domain-dash.com", expectedOutput: true },
      { input: "user@sub.domain.com", expectedOutput: true },
      { input: "user@sub.domain-dash.com", expectedOutput: true },
      { input: "user.dot@domain.com", expectedOutput: true },
      { input: "user-dash.dot@domain.com", expectedOutput: true },
    ].forEach(({ input, expectedOutput }) => {
      it(`${input} => ${expectedOutput ? "valide" : "invalide"}`, () => {
        expect(z.string().email().safeParse(input).success).toStrictEqual(expectedOutput);
      });
    });
  });
});
