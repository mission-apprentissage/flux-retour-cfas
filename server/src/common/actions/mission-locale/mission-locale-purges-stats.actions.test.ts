import { describe, expect, it } from "vitest";

import { debutDuMois, moisAvant, moisUTC } from "./mission-locale-purges-stats.actions";

describe("mois des compteurs de purge ML", () => {
  it("prend le mois UTC de la veille pour une fin à minuit UTC", () => {
    expect(moisAvant(new Date("2026-12-01T00:00:00.000Z"))).toBe("2026-11");
  });

  it("prend le mois de Paris du dernier instant pour une autre fin", () => {
    expect(moisAvant(new Date("2026-11-30T23:30:00.000Z"))).toBe("2026-12");
    expect(moisAvant(new Date("2026-11-15T10:00:00.000Z"))).toBe("2026-11");
  });

  it("date le début d'un mois à minuit, heure de Paris", () => {
    expect(debutDuMois("2025-04")).toStrictEqual(new Date("2025-03-31T22:00:00.000Z"));
    expect(debutDuMois("2025-01")).toStrictEqual(new Date("2024-12-31T23:00:00.000Z"));
  });

  it("range une création dans son mois UTC", () => {
    expect(moisUTC(new Date("2025-03-31T23:30:00.000Z"))).toBe("2025-03");
  });
});
