import { describe, expect, it } from "vitest";

import { normaliserVoie } from "./normaliserVoie";

describe("normaliserVoie", () => {
  it("retire accents, casse, ponctuation et mots vides", () => {
    expect(normaliserVoie("Rue de la Chaussée Romaine")).toBe("rue chaussee romaine");
    expect(normaliserVoie("Impasse des Platanes")).toBe("impasse platanes");
    expect(normaliserVoie("Allée de l'Hôtel de Chaalis")).toBe("allee hotel chaalis");
  });

  it("développe les abréviations de type de voie", () => {
    expect(normaliserVoie("43 AV. BIR HAKEIM")).toBe("43 avenue bir hakeim");
    expect(normaliserVoie("12 bd St Jean")).toBe("12 boulevard saint jean");
    expect(normaliserVoie("3 imp. Ste Anne")).toBe("3 impasse sainte anne");
  });

  it("renvoie une chaîne vide pour une entrée absente", () => {
    expect(normaliserVoie(null)).toBe("");
    expect(normaliserVoie(undefined)).toBe("");
    expect(normaliserVoie("  ,  ")).toBe("");
  });
});
