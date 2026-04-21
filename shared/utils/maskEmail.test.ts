import { describe, expect, it } from "vitest";

import { maskEmail } from "./maskEmail";

describe("maskEmail()", () => {
  it("masque le milieu d'un email standard en conservant 3 premiers + dernier caractère", () => {
    expect(maskEmail("test-cfa-user@tdb.local")).toBe("tes*******r@tdb.local");
  });

  it("masque complètement la partie locale si elle fait 4 caractères ou moins", () => {
    expect(maskEmail("jean@example.com")).toBe("****@example.com");
    expect(maskEmail("a@example.com")).toBe("*@example.com");
  });

  it("retourne un fallback générique si l'email ne contient pas de @", () => {
    expect(maskEmail("not-an-email")).toBe("***@***");
  });

  it("retourne un fallback générique si la partie locale est vide", () => {
    expect(maskEmail("@example.com")).toBe("***@***");
  });

  it("retourne un fallback générique si le domaine est vide", () => {
    expect(maskEmail("user@")).toBe("***@***");
  });

  it("n'expose pas la partie locale au-delà des 3 premiers et dernier caractère", () => {
    const result = maskEmail("verylongusername@domain.com");
    expect(result.startsWith("ver")).toBe(true);
    expect(result).toContain("*******");
    expect(result).toContain("@domain.com");
    expect(result).not.toContain("verylongusername");
  });
});
