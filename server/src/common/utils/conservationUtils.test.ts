import { describe, expect, it } from "vitest";

import {
  estHorsConservation,
  getDateDeFinConservation,
  getDatesDeFinEffectif,
  getDatesDeFinEffectifDeca,
} from "./conservationUtils";

const maintenant = new Date("2026-11-18T00:00:00Z");
const date = (value: string) => new Date(`${value}T00:00:00Z`);

describe("getDateDeFinConservation()", () => {
  it("prend la plus tardive des dates de fin", () => {
    expect(
      getDateDeFinConservation({
        annee_scolaire: "2022-2023",
        datesDeFin: [date("2023-06-30"), null, date("2023-09-15"), undefined],
      })
    ).toStrictEqual(date("2023-09-15"));
  });

  it("se replie sur la fin de l'année scolaire sans date", () => {
    expect(getDateDeFinConservation({ annee_scolaire: "2022-2023", datesDeFin: [null] })).toStrictEqual(
      date("2023-08-01")
    );
  });
});

describe("estHorsConservation()", () => {
  it("vrai deux ans et un jour après la fin", () => {
    expect(estHorsConservation({ annee_scolaire: "2023-2024", datesDeFin: [date("2024-11-17")] }, maintenant)).toBe(
      true
    );
  });

  it("faux deux ans jour pour jour après la fin", () => {
    expect(estHorsConservation({ annee_scolaire: "2023-2024", datesDeFin: [date("2024-11-18")] }, maintenant)).toBe(
      false
    );
  });

  it("faux un an et onze mois après la fin", () => {
    expect(estHorsConservation({ annee_scolaire: "2023-2024", datesDeFin: [date("2024-12-18")] }, maintenant)).toBe(
      false
    );
  });

  it("vrai sans date quand l'année scolaire est finie depuis plus de deux ans", () => {
    expect(estHorsConservation({ annee_scolaire: "2022-2023", datesDeFin: [] }, maintenant)).toBe(true);
  });

  it("faux pour une année scolaire active, même avec une date ancienne", () => {
    expect(estHorsConservation({ annee_scolaire: "2025-2026", datesDeFin: [date("2020-06-30")] }, maintenant)).toBe(
      false
    );
  });

  it("faux pour une année illisible", () => {
    expect(estHorsConservation({ annee_scolaire: "2020", datesDeFin: [date("2020-06-30")] }, maintenant)).toBe(false);
  });
});

describe("dates de fin", () => {
  it("lit la formation, les fins et les ruptures de contrat d'un effectif", () => {
    expect(
      getDatesDeFinEffectif({
        formation: { date_fin: date("2024-06-30") },
        contrats: [{ date_fin: date("2024-08-31"), date_rupture: date("2024-01-15") }],
      })
    ).toStrictEqual([date("2024-06-30"), date("2024-08-31"), date("2024-01-15")]);
  });

  it("ne lit que les fins de contrat d'un effectif DECA", () => {
    expect(
      getDatesDeFinEffectifDeca({ contrats: [{ date_fin: date("2024-08-31"), date_rupture: date("2024-01-15") }] })
    ).toStrictEqual([date("2024-08-31")]);
  });
});
