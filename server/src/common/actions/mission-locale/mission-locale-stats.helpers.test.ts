import { zStatsPeriod } from "shared/models/data/nationalStats.model";
import { describe, expect, it } from "vitest";

import {
  buildEmptySegments,
  calculateStartDate,
  buildSituationBuckets,
  ISituationCounters,
  listUtcDays,
  toCollabSegmentStats,
  toSegmentStats,
} from "./mission-locale-stats.helpers";

const COUNTERS: ISituationCounters = {
  rdv_pris: 10,
  nouveau_projet: 4,
  deja_accompagne: 3,
  contacte_sans_retour: 7,
  injoignables: 5,
  coordonnees_incorrectes: 2,
  autre: 6,
  cherche_contrat: 1,
  reorientation: 2,
  ne_veut_pas_accompagnement: 3,
  ne_souhaite_pas_etre_recontacte: 4,
  autre_avec_contact: 4,
};

describe("buildSituationBuckets", () => {
  it("répartit les situations dans les 6 tranches V2", () => {
    expect(buildSituationBuckets(COUNTERS)).toEqual({
      rdv_pris: 10,
      projet_pro_securise: 4,
      ne_souhaite_pas_accompagnement: 10,
      a_recontacter: 7,
      injoignable: 7,
      autre: 9,
      autre_avec_contact: 4,
      repondu: 28,
    });
  });

  it("place DEJA_ACCOMPAGNE et AUTRE avec problème dans la tranche Autre", () => {
    const buckets = buildSituationBuckets({ ...COUNTERS, autre: 6, autre_avec_contact: 2, deja_accompagne: 3 });
    expect(buckets.autre).toBe(9);
    expect(buckets.repondu).toBe(10 + 4 + 10 + 2);
  });

  it("somme des 6 tranches = total des situations renseignées", () => {
    const buckets = buildSituationBuckets(COUNTERS);
    const traite =
      COUNTERS.rdv_pris +
      COUNTERS.nouveau_projet +
      COUNTERS.deja_accompagne +
      COUNTERS.contacte_sans_retour +
      COUNTERS.injoignables +
      COUNTERS.coordonnees_incorrectes +
      COUNTERS.autre +
      COUNTERS.cherche_contrat +
      COUNTERS.reorientation +
      COUNTERS.ne_veut_pas_accompagnement +
      COUNTERS.ne_souhaite_pas_etre_recontacte;
    expect(
      buckets.rdv_pris +
        buckets.projet_pro_securise +
        buckets.ne_souhaite_pas_accompagnement +
        buckets.a_recontacter +
        buckets.injoignable +
        buckets.autre
    ).toBe(traite);
  });
});

describe("toSegmentStats", () => {
  it("construit un segment complet à partir des compteurs bruts", () => {
    const segment = toSegmentStats({
      ...COUNTERS,
      total: 100,
      a_traiter: 49,
      traite: 51,
      rdv_pris_decouverts: 8,
      deja_connu_accompagne: 5,
    });
    expect(segment).toEqual({
      total: 100,
      a_traiter: 49,
      traite: 51,
      rdv_pris_decouverts: 8,
      deja_connu_accompagne: 5,
      rdv_pris: 10,
      projet_pro_securise: 4,
      ne_souhaite_pas_accompagnement: 10,
      a_recontacter: 7,
      injoignable: 7,
      autre: 9,
      autre_avec_contact: 4,
      repondu: 28,
    });
  });

  it("ajoute les situations qualifiées et le délai pour le segment collab", () => {
    const segment = toCollabSegmentStats({
      ...COUNTERS,
      total: 12,
      a_traiter: 2,
      traite: 10,
      rdv_pris_decouverts: 1,
      deja_connu_accompagne: 2,
      situation_rupture: 5,
      situation_abandon: 1,
      situation_prevention_inevitable: 1,
      situation_prevention_tres_eleve: 2,
      situation_prevention_modere: 2,
      situation_besoin_aide_hors_rupture: 1,
      delai_premiere_activite_jours_total: 30,
      delai_premiere_activite_count: 6,
    });
    expect(segment).toMatchObject({
      total: 12,
      situation_rupture: 5,
      situation_besoin_aide_hors_rupture: 1,
      delai_premiere_activite_jours_total: 30,
      delai_premiere_activite_count: 6,
    });
  });
});

describe("buildEmptySegments", () => {
  it("renvoie deux segments complets à zéro, indépendants entre appels", () => {
    const segments = buildEmptySegments();
    expect(Object.values(segments.rupture).every((v) => v === 0)).toBe(true);
    expect(Object.values(segments.collab).every((v) => v === 0)).toBe(true);
    expect(Object.keys(segments.collab)).toHaveLength(21);
    segments.rupture.total = 3;
    expect(buildEmptySegments().rupture.total).toBe(0);
  });
});

describe("listUtcDays", () => {
  it("énumère chaque jour UTC une seule fois, changements d'heure compris, bornes incluses", () => {
    const days = listUtcDays(new Date("2025-03-22T09:30:00.000Z"), new Date("2026-09-21T15:00:00.000Z"));
    const keys = days.map((day) => day.toISOString());

    expect(days).toHaveLength(549);
    expect(new Set(keys).size).toBe(549);
    expect(keys[0]).toBe("2025-03-22T00:00:00.000Z");
    expect(keys[keys.length - 1]).toBe("2026-09-21T00:00:00.000Z");
    expect(keys).toContain("2025-10-26T00:00:00.000Z");
    expect(keys.filter((key) => key.startsWith("2026-03-29")).length).toBe(1);
  });

  it("renvoie une liste vide quand le début est après la fin", () => {
    expect(listUtcDays(new Date("2026-09-22T00:00:00.000Z"), new Date("2026-09-21T00:00:00.000Z"))).toEqual([]);
  });
});

describe("calculateStartDate", () => {
  const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
  const reference = new Date("2026-10-15T14:30:00.000Z");

  it("recule de 30 jours, 3 mois ou 6 mois à minuit UTC", () => {
    expect(calculateStartDate("30days", reference)).toEqual(utc("2026-09-15"));
    expect(calculateStartDate("3months", reference)).toEqual(utc("2026-07-15"));
    expect(calculateStartDate("6months", reference)).toEqual(utc("2026-04-15"));
  });

  it("ramène au dernier jour du mois quand le jour n'existe pas", () => {
    expect(calculateStartDate("6months", utc("2026-08-31"))).toEqual(utc("2026-02-28"));
    expect(calculateStartDate("3months", utc("2026-05-31"))).toEqual(utc("2026-02-28"));
    expect(calculateStartDate("6months", utc("2028-08-31"))).toEqual(utc("2028-02-29"));
    expect(calculateStartDate("3months", utc("2027-01-31"))).toEqual(utc("2026-10-31"));
  });

  it("part du 1er janvier de l'année pour « Depuis janvier »", () => {
    expect(calculateStartDate("since-2026", reference)).toEqual(utc("2026-01-01"));
  });

  it("part de la date la plus ancienne connue depuis le lancement", () => {
    expect(calculateStartDate("all", reference, new Date("2025-03-21T08:00:00.000Z"))).toEqual(utc("2025-03-21"));
  });
});

describe("zStatsPeriod", () => {
  it("n'accepte « Depuis janvier » que pour les années de 2026 à l'année en cours", () => {
    expect(zStatsPeriod.safeParse("since-2026").success).toBe(true);
    expect(zStatsPeriod.safeParse("since-2025").success).toBe(false);
    expect(zStatsPeriod.safeParse(`since-${new Date().getUTCFullYear() + 1}`).success).toBe(false);
    expect(zStatsPeriod.safeParse("since-abcd").success).toBe(false);
    expect(zStatsPeriod.safeParse("6months").success).toBe(true);
  });
});
