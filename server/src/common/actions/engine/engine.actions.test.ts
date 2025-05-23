import { IEffectif } from "shared/models/data/effectifs.model";
import { vi, it, expect, describe, beforeEach } from "vitest";

import { buildNewHistoriqueStatutApprenant } from "./engine.actions";

const juillet = new Date("2023-07-09T10:00:00.000Z");
const septembre = new Date("2023-09-01T10:00:00.000Z");
const octobre = new Date("2023-10-01T10:00:00.000Z");
const now = new Date("2023-12-31T10:00:00.000Z");

describe("buildNewHistoriqueStatutApprenant", () => {
  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(now);
    return () => {
      vi.useRealTimers();
    };
  });

  it("doit retourner l'historique existant si la nouvelle valeur de statut est vide", () => {
    const existant: IEffectif["apprenant"]["historique_statut"] = [
      {
        valeur_statut: 2,
        date_statut: juillet,
      },
      {
        valeur_statut: 3,
        date_statut: septembre,
      },
    ];

    expect(buildNewHistoriqueStatutApprenant(existant, undefined)).toEqual(existant);
  });

  it.each([[0], [2], [3]])("doit ajouter le nouveau statut dans l'historique", (valeur) => {
    const existant: IEffectif["apprenant"]["historique_statut"] = [
      {
        valeur_statut: 2,
        date_statut: juillet,
      },
      {
        valeur_statut: 3,
        date_statut: septembre,
      },
    ];

    expect(buildNewHistoriqueStatutApprenant(existant, valeur as 0 | 2 | 3, octobre)).toEqual([
      ...existant,
      { valeur_statut: valeur, date_statut: octobre, date_reception: now },
    ]);
  });
});
