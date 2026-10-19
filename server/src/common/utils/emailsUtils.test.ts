import { describe, expect, it } from "vitest";

import { generateHtml } from "./emailsUtils";
import { getStaticFilePath } from "./getStaticFilePath";

describe("generateHtml", () => {
  it("rend un template mjml en document HTML complet", async () => {
    const html = await generateHtml("jeanne.dupont@example.fr", {
      subject: "Réinitialisation de votre mot de passe",
      templateFile: getStaticFilePath("./emails/reset_password.mjml.ejs"),
      data: {
        token: "jeton-email",
        recipient: { civility: "Madame", prenom: "Jeanne", nom: "Dupont", email: "jeanne.dupont@example.fr" },
        resetPasswordToken: "jeton-reinitialisation",
        role: "cfa",
      },
    });

    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain("Jeanne");
    expect(html).toContain("passwordToken=jeton-reinitialisation");
    expect(html).toContain("/api/emails/jeton-email/unsubscribe");
    expect(html).toMatch(/<\/html>\s*$/);
  });
});
