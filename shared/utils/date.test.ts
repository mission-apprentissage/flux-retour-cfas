import { describe, expect, it } from "vitest";

import { addDaysUTC, subtractDaysUTC, subtractYearsUTC } from "./date";

describe("calculs de dates en UTC", () => {
  it("retranche des jours en restant à minuit UTC, sans effet d'un changement d'heure", () => {
    const veilleDuPassageALHeureDHiver = new Date("2026-10-26T00:00:00.000Z");
    expect(subtractDaysUTC(veilleDuPassageALHeureDHiver, 2).toISOString()).toBe("2026-10-24T00:00:00.000Z");
    expect(addDaysUTC(new Date("2027-03-27T00:00:00.000Z"), 2).toISOString()).toBe("2027-03-29T00:00:00.000Z");
  });

  it("retranche des années en restant à minuit UTC", () => {
    expect(subtractYearsUTC(new Date("2026-11-09T00:00:00.000Z"), 20).toISOString()).toBe("2006-11-09T00:00:00.000Z");
  });

  it("ramène le 29 février au 28 février d'une année non bissextile, comme date-fns", () => {
    expect(subtractYearsUTC(new Date("2028-02-29T00:00:00.000Z"), 1).toISOString()).toBe("2027-02-28T00:00:00.000Z");
    expect(subtractYearsUTC(new Date("2028-02-29T00:00:00.000Z"), 4).toISOString()).toBe("2024-02-29T00:00:00.000Z");
  });
});
