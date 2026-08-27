import { describe, expect, it } from "vitest";

import { EffectifData } from "../../common/types/ruptures";

import { dePrenom, formatDateSuivi, isDelaiRelanceDepasse, matchesPostalCodes } from "./ruptures.utils";

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

describe("isDelaiRelanceDepasse", () => {
  const now = new Date("2026-08-24T10:00:00.000Z");
  const joursAvant = (jours: number) => new Date(now.getTime() - jours * 24 * 60 * 60 * 1000);

  it("ne signale rien sans date", () => {
    expect(isDelaiRelanceDepasse(null, now)).toBe(false);
    expect(isDelaiRelanceDepasse(undefined, now)).toBe(false);
    expect(isDelaiRelanceDepasse("pas une date", now)).toBe(false);
  });

  it("ne signale pas un dossier dans le délai", () => {
    expect(isDelaiRelanceDepasse(joursAvant(3), now)).toBe(false);
    // le seuil est atteint mais pas dépassé
    expect(isDelaiRelanceDepasse(joursAvant(7), now)).toBe(false);
  });

  it("signale un dossier au-delà du délai", () => {
    expect(isDelaiRelanceDepasse(joursAvant(8), now)).toBe(true);
    expect(isDelaiRelanceDepasse(joursAvant(30).toISOString(), now)).toBe(true);
  });
});

describe("formatDateSuivi", () => {
  const now = new Date("2026-08-24T10:00:00.000Z");

  it("ne rend rien sans date exploitable", () => {
    expect(formatDateSuivi(null, { now })).toBe("");
    expect(formatDateSuivi(undefined, { now })).toBe("");
    expect(formatDateSuivi("pas une date", { now })).toBe("");
  });

  it("dit « aujourd'hui » le jour même", () => {
    expect(formatDateSuivi(new Date("2026-08-24T08:00:00.000Z"), { now })).toBe("aujourd'hui");
  });

  it("donne la date les autres jours", () => {
    expect(formatDateSuivi(new Date("2026-08-20T08:00:00.000Z"), { now })).toBe("le 20/08/2026");
  });

  it("garde la date quand la forme relative est désactivée", () => {
    expect(formatDateSuivi(new Date("2026-08-24T08:00:00.000Z"), { relatif: false, now })).toBe("le 24/08/2026");
  });
});

describe("dePrenom", () => {
  it("élide devant une voyelle", () => {
    expect(dePrenom("Enzo")).toBe("d'Enzo");
    expect(dePrenom("Amélie")).toBe("d'Amélie");
    expect(dePrenom("Ilhan")).toBe("d'Ilhan");
  });

  it("garde « de » devant une consonne", () => {
    expect(dePrenom("Martin")).toBe("de Martin");
    expect(dePrenom("Théo")).toBe("de Théo");
  });

  it("gère un prénom accentué", () => {
    expect(dePrenom("Élodie")).toBe("d'Élodie");
  });
});
