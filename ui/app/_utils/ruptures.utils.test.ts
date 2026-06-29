import { describe, expect, it } from "vitest";

import { EffectifData } from "../../common/types/ruptures";

import { matchesPostalCodes } from "./ruptures.utils";

const makeEffectif = (overrides: Partial<EffectifData> = {}): EffectifData => ({
  id: Math.random().toString(36).slice(2),
  nom: "Doe",
  prenom: "John",
  libelle_formation: "BTS Info",
  organisme_nom: "CFA",
  organisme_raison_sociale: "CFA",
  organisme_enseigne: "CFA",
  prioritaire: false,
  a_contacter: false,
  mineur: false,
  acc_conjoint: false,
  rqth: false,
  a_traiter: true,
  nouveau_contrat: false,
  ...overrides,
});

describe("matchesPostalCodes", () => {
  it("keeps every effectif when no postal code is selected", () => {
    expect(matchesPostalCodes(makeEffectif({ code_postal: "13001" }), [])).toBe(true);
    expect(matchesPostalCodes(makeEffectif({ code_postal: null }), [])).toBe(true);
  });

  it("keeps an effectif whose postal code is selected", () => {
    expect(matchesPostalCodes(makeEffectif({ code_postal: "13001" }), ["13001", "13002"])).toBe(true);
  });

  it("excludes an effectif whose postal code is not selected", () => {
    expect(matchesPostalCodes(makeEffectif({ code_postal: "13003" }), ["13001", "13002"])).toBe(false);
  });

  it("excludes an effectif without a postal code when a filter is active", () => {
    expect(matchesPostalCodes(makeEffectif({ code_postal: null }), ["13001"])).toBe(false);
  });
});
