import { describe, expect, it } from "vitest";

import { calculatePercentage } from "./stats";

describe("calculatePercentage", () => {
  it("exprime l'évolution en pourcentage de la valeur précédente", () => {
    expect(calculatePercentage(150, 100)).toBe("+50%");
    expect(calculatePercentage(50, 100)).toBe("-50%");
    expect(calculatePercentage(0, 100)).toBe("-100%");
  });

  it("renvoie 0% quand rien ne change ou que l'écart arrondi est nul", () => {
    expect(calculatePercentage(0, 0)).toBe("0%");
    expect(calculatePercentage(100, 100)).toBe("0%");
    expect(calculatePercentage(1001, 1000)).toBe("0%");
  });

  it("est vide quand il n'y a pas de valeur précédente", () => {
    expect(calculatePercentage(12, 0)).toBe("");
  });

  it("garde le sens de la variation quand la valeur précédente est négative", () => {
    expect(calculatePercentage(-5, -10)).toBe("+50%");
    expect(calculatePercentage(-15, -10)).toBe("-50%");
  });
});
