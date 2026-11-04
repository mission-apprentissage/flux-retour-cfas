import { describe, expect, it } from "vitest";

import { construireBilanImport } from "./deca-bilan";

describe("construireBilanImport", () => {
  it("calcule la durée, le débit et le taux de défaut global du cache", () => {
    const bilan = construireBilanImport({
      debutMs: 0,
      finMs: 600 * 60_000,
      contrats: 2_700_000,
      cache: {
        organisme: { acces: 300, defauts: 3, tauxDefaut: 0.01 },
        "opcos-rncp": { acces: 100, defauts: 7, tauxDefaut: 0.07 },
      },
    });

    expect(bilan.dureeMin).toBe(600);
    expect(bilan.contratsParSeconde).toBe(75);
    expect(bilan.tauxDefautCache).toBe(0.025);
  });

  it("ne divise pas par zéro sur un run instantané ou sans cache", () => {
    const bilan = construireBilanImport({ debutMs: 1_000, finMs: 1_000, contrats: 0, cache: null });

    expect(bilan).toEqual({ dureeMin: 0, contrats: 0, contratsParSeconde: 0, cache: null, tauxDefautCache: null });
  });
});
