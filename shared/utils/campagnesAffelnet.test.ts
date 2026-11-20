import { describe, expect, it } from "vitest";

import { getCampagnesAffelnetConservees, getPremiereCampagneAffelnetConservee } from "./campagnesAffelnet";

describe("getPremiereCampagneAffelnetConservee()", () => {
  it("garde la campagne N-2 jusqu'au 31 août à minuit UTC", () => {
    expect(getPremiereCampagneAffelnetConservee(new Date("2026-08-31T23:59:59Z"))).toBe(2024);
  });

  it("retire la campagne N-2 au 1er septembre à minuit UTC", () => {
    expect(getPremiereCampagneAffelnetConservee(new Date("2026-09-01T00:00:00Z"))).toBe(2025);
  });

  it("garde la campagne N-1 toute l'année", () => {
    expect(getPremiereCampagneAffelnetConservee(new Date("2026-12-31T12:00:00Z"))).toBe(2025);
    expect(getPremiereCampagneAffelnetConservee(new Date("2027-01-01T12:00:00Z"))).toBe(2025);
  });
});

describe("getCampagnesAffelnetConservees()", () => {
  it("liste les campagnes gardées, de la plus récente à la plus ancienne", () => {
    expect(getCampagnesAffelnetConservees(new Date("2026-03-15T12:00:00Z"))).toStrictEqual([2026, 2025, 2024]);
    expect(getCampagnesAffelnetConservees(new Date("2026-11-19T12:00:00Z"))).toStrictEqual([2026, 2025]);
  });
});
