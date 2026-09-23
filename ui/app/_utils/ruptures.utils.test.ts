import { describe, expect, it } from "vitest";

import { EffectifData } from "../../common/types/ruptures";

import {
  dePrenom,
  estMoisRecent,
  estMoisToutTraite,
  filtrerMoisATraiter,
  formatDateSuivi,
  formatMoisAbrege,
  isDelaiRelanceDepasse,
  matchesPostalCodes,
  moisToutTraitesDepuis,
} from "./ruptures.utils";

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

describe("formatMoisAbrege", () => {
  it("abrège les mois longs et garde les courts", () => {
    expect(formatMoisAbrege("2026-07-01T00:00:00.000Z")).toBe("Juil. 2026");
    expect(formatMoisAbrege("2026-01-01T00:00:00.000Z")).toBe("Janv. 2026");
    expect(formatMoisAbrege("2025-08-01T00:00:00.000Z")).toBe("Août 2025");
    expect(formatMoisAbrege("2025-04-01T00:00:00.000Z")).toBe("Avril 2025");
  });
});

describe("estMoisRecent", () => {
  const now = new Date("2026-08-15T00:00:00.000Z");

  it("garde les douze derniers mois, mois courant inclus", () => {
    expect(estMoisRecent("2026-08-01T00:00:00.000Z", now)).toBe(true);
    expect(estMoisRecent("2025-08-01T00:00:00.000Z", now)).toBe(true);
  });

  it("écarte ce qui a plus d'un an", () => {
    expect(estMoisRecent("2025-07-01T00:00:00.000Z", now)).toBe(false);
  });
});

describe("estMoisToutTraite", () => {
  it("ne retient que les mois sans dossier actionnable mais avec des traités", () => {
    expect(estMoisToutTraite({ month: "2025-08-01", data: [], treated_count: 4 })).toBe(true);
    expect(estMoisToutTraite({ month: "2025-08-01", data: [], treated_count: 0 })).toBe(false);
    expect(estMoisToutTraite({ month: "2025-08-01", data: [], treated_count: undefined })).toBe(false);
    expect(estMoisToutTraite({ month: "2025-08-01", data: [makeEffectif()], treated_count: 4 })).toBe(false);
  });
});

describe("moisToutTraitesDepuis", () => {
  it("ne retient que les mois sans dossier actionnable mais avec des traités", () => {
    const mois = moisToutTraitesDepuis([
      { month: "2026-08-01", data: [], treated_count: 4 },
      { month: "2026-07-01", data: [makeEffectif()], treated_count: 4 },
      { month: "2026-06-01", data: [], treated_count: 0 },
    ]);
    expect([...mois]).toEqual(["2026-08-01"]);
  });
});

describe("filtrerMoisATraiter", () => {
  const now = new Date("2026-08-15T00:00:00.000Z");
  const avecDossiers = { month: "2026-08-01", data: [makeEffectif()] };
  const toutTraite = { month: "2026-07-01", data: [], treated_count: 4 };
  // Le filtre critères vide `data` en laissant `treated_count` : indiscernable d'un mois tout traité.
  const videParFiltre = { month: "2026-06-01", data: [], treated_count: 4 };
  const ancienToutTraite = { month: "2025-01-01", data: [], treated_count: 4 };

  const moisToutTraites = new Set(["2026-07-01", "2025-01-01"]);

  it("garde les mois avec dossiers et les mois entièrement traités", () => {
    const rendus = filtrerMoisATraiter([avecDossiers, toutTraite], moisToutTraites, false, now);
    expect(rendus.map((m) => m.month)).toEqual(["2026-08-01", "2026-07-01"]);
  });

  it("écarte un mois vidé par les filtres, absent des mois tout traités", () => {
    const rendus = filtrerMoisATraiter([videParFiltre], moisToutTraites, false, now);
    expect(rendus).toEqual([]);
  });

  it("replie les mois de plus d'un an tant qu'ils ne sont pas dépliés", () => {
    expect(filtrerMoisATraiter([ancienToutTraite], moisToutTraites, false, now)).toEqual([]);
    expect(filtrerMoisATraiter([ancienToutTraite], moisToutTraites, true, now)).toEqual([ancienToutTraite]);
  });

  it("n'affiche aucun bloc « tout traité » quand la liste n'en déclare pas", () => {
    expect(filtrerMoisATraiter([toutTraite], new Set(), false, now)).toEqual([]);
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
