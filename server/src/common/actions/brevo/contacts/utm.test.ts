import { describe, expect, it } from "vitest";

import { buildUtmUrl } from "./utm";

describe("buildUtmUrl", () => {
  it("ajoute les UTM source + medium obligatoires", () => {
    const url = buildUtmUrl("https://tba.fr/auth/connexion", { source: "brevo", medium: "email" });
    expect(url).toBe("https://tba.fr/auth/connexion?utm_source=brevo&utm_medium=email");
  });

  it("ajoute campaign et content si fournis", () => {
    const url = buildUtmUrl("https://tba.fr/auth/connexion", {
      source: "brevo",
      medium: "email",
      campaign: "cfa-users",
      content: "cta_principal",
    });
    expect(url).toContain("utm_source=brevo");
    expect(url).toContain("utm_medium=email");
    expect(url).toContain("utm_campaign=cfa-users");
    expect(url).toContain("utm_content=cta_principal");
  });

  it("omet campaign et content si non fournis", () => {
    const url = buildUtmUrl("https://tba.fr/auth/connexion", { source: "brevo", medium: "email" });
    expect(url).not.toContain("utm_campaign");
    expect(url).not.toContain("utm_content");
  });

  it("retourne l'URL inchangée si pas d'UTM", () => {
    expect(buildUtmUrl("https://tba.fr/auth/connexion")).toBe("https://tba.fr/auth/connexion");
  });

  it("préserve les query params existants (ex: token)", () => {
    const url = buildUtmUrl("https://tba.fr/auth/connexion?token=abc123", {
      source: "brevo",
      medium: "email",
    });
    expect(url).toContain("token=abc123");
    expect(url).toContain("utm_source=brevo");
  });

  it("encode les valeurs avec caractères spéciaux", () => {
    const url = buildUtmUrl("https://tba.fr/x", {
      source: "brevo & co",
      medium: "email",
    });
    expect(url).toContain("utm_source=brevo+%26+co");
  });
});
