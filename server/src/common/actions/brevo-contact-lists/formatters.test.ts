import { describe, expect, it } from "vitest";

import { cleanSiret, formatCivilite, formatEmail, formatJoinedList, formatName, formatPhoneFR } from "./formatters";

describe("formatName", () => {
  it("title case basique", () => {
    expect(formatName("DUPONT")).toBe("Dupont");
    expect(formatName("alice")).toBe("Alice");
    expect(formatName("jean")).toBe("Jean");
  });

  it("preserve les tirets dans les noms composés", () => {
    expect(formatName("jean-pierre")).toBe("Jean-Pierre");
    expect(formatName("MARIE-CHANTAL")).toBe("Marie-Chantal");
  });

  it("preserve les apostrophes", () => {
    expect(formatName("d'artagnan")).toBe("D'Artagnan");
    expect(formatName("D'ARTAGNAN")).toBe("D'Artagnan");
  });

  it("preserve les espaces des prénoms/noms composés", () => {
    expect(formatName("MARIE CHANTAL")).toBe("Marie Chantal");
    expect(formatName("jean luc")).toBe("Jean Luc");
  });

  it("trim les espaces de bord", () => {
    expect(formatName("  Jean  ")).toBe("Jean");
  });

  it("gère les valeurs vides ou absentes", () => {
    expect(formatName("")).toBeNull();
    expect(formatName("   ")).toBeNull();
    expect(formatName(null)).toBeNull();
    expect(formatName(undefined)).toBeNull();
  });
});

describe("formatPhoneFR", () => {
  it("préfixe +33 sur les numéros français à 10 chiffres", () => {
    expect(formatPhoneFR("0123456789")).toBe("+33123456789");
    expect(formatPhoneFR("0635353535")).toBe("+33635353535");
  });

  it("strip les espaces, points, tirets", () => {
    expect(formatPhoneFR("01 23 45 67 89")).toBe("+33123456789");
    expect(formatPhoneFR("01.23.45.67.89")).toBe("+33123456789");
    expect(formatPhoneFR("01-23-45-67-89")).toBe("+33123456789");
  });

  it("préserve les numéros déjà au format international", () => {
    expect(formatPhoneFR("+33 1 23 45 67 89")).toBe("+33123456789");
    expect(formatPhoneFR("+33123456789")).toBe("+33123456789");
    expect(formatPhoneFR("+44 20 1234 5678")).toBe("+442012345678");
  });

  it("gère les valeurs vides", () => {
    expect(formatPhoneFR("")).toBeNull();
    expect(formatPhoneFR(null)).toBeNull();
    expect(formatPhoneFR(undefined)).toBeNull();
  });
});

describe("formatCivilite", () => {
  it("normalise Madame → Mme", () => {
    expect(formatCivilite("Madame")).toBe("Mme");
    expect(formatCivilite("MADAME")).toBe("Mme");
    expect(formatCivilite("madame")).toBe("Mme");
    expect(formatCivilite("Mme")).toBe("Mme");
    expect(formatCivilite("Mme.")).toBe("Mme");
  });

  it("normalise Monsieur → M.", () => {
    expect(formatCivilite("Monsieur")).toBe("M.");
    expect(formatCivilite("MONSIEUR")).toBe("M.");
    expect(formatCivilite("M.")).toBe("M.");
    expect(formatCivilite("M")).toBe("M.");
  });

  it("retourne la valeur trim si non reconnue", () => {
    expect(formatCivilite("Mx")).toBe("Mx");
    expect(formatCivilite("  Autre  ")).toBe("Autre");
  });

  it("gère les valeurs vides", () => {
    expect(formatCivilite("")).toBeNull();
    expect(formatCivilite(null)).toBeNull();
    expect(formatCivilite(undefined)).toBeNull();
  });
});

describe("formatEmail", () => {
  it("lowercase + trim", () => {
    expect(formatEmail("Alice@EXAMPLE.COM")).toBe("alice@example.com");
    expect(formatEmail("  alice@example.com  ")).toBe("alice@example.com");
  });
});

describe("cleanSiret", () => {
  it("strip les non-chiffres", () => {
    expect(cleanSiret("78106280700032")).toBe("78106280700032");
    expect(cleanSiret("781 062 807 000 32")).toBe("78106280700032");
    expect(cleanSiret("781.062.807.000.32")).toBe("78106280700032");
  });

  it("gère les valeurs vides", () => {
    expect(cleanSiret("")).toBeNull();
    expect(cleanSiret("abc")).toBeNull();
    expect(cleanSiret(null)).toBeNull();
    expect(cleanSiret(undefined)).toBeNull();
  });
});

describe("formatJoinedList", () => {
  it("join avec virgule + espace par défaut", () => {
    expect(formatJoinedList(["CMA", "AGRI", "CFA_EN"])).toBe("CMA, AGRI, CFA_EN");
  });

  it("supporte un séparateur custom", () => {
    expect(formatJoinedList(["a", "b", "c"], { separator: ";" })).toBe("a;b;c");
  });

  it("lowercase optionnel (pour CFA_ERP)", () => {
    expect(formatJoinedList(["YPAREO", "Gestibase"], { lowercase: true })).toBe("ypareo, gestibase");
  });

  it("trim les éléments et filtre les vides", () => {
    expect(formatJoinedList([" CMA ", "", "AGRI", "  "])).toBe("CMA, AGRI");
  });

  it("gère les valeurs vides ou absentes", () => {
    expect(formatJoinedList([])).toBeNull();
    expect(formatJoinedList(null)).toBeNull();
    expect(formatJoinedList(undefined)).toBeNull();
    expect(formatJoinedList(["", "   ", ""])).toBeNull();
  });
});
