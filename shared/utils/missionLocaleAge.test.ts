import { describe, expect, it } from "vitest";

import { isAgeEligibleMissionLocale } from "./missionLocaleAge";

describe("isAgeEligibleMissionLocale()", () => {
  const now = new Date("2026-10-06T12:00:00.000Z");

  it.each([
    { label: "25 ans la veille de ses 26 ans", naissance: "2000-10-07T00:00:00.000Z", expected: true },
    { label: "le jour de ses 26 ans", naissance: "2000-10-06T00:00:00.000Z", expected: false },
    { label: "le jour de ses 16 ans", naissance: "2010-10-06T00:00:00.000Z", expected: true },
    { label: "15 ans la veille de ses 16 ans", naissance: "2010-10-07T00:00:00.000Z", expected: false },
    { label: "date reçue en chaîne ISO", naissance: "2005-01-01T00:00:00.000Z", expected: true },
  ])("$label → $expected", ({ naissance, expected }) => {
    expect(isAgeEligibleMissionLocale(naissance, now)).toBe(expected);
    expect(isAgeEligibleMissionLocale(new Date(naissance), now)).toBe(expected);
  });

  it("refuse une date de naissance absente", () => {
    expect(isAgeEligibleMissionLocale(null, now)).toBe(false);
    expect(isAgeEligibleMissionLocale(undefined, now)).toBe(false);
  });
});
