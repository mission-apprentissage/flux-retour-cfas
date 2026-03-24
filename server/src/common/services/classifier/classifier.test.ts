import { ObjectId } from "bson";
import { STATUT_APPRENANT } from "shared/constants";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { describe, it, expect } from "vitest";

import { extractScoreInput } from "./classifier";

const createEffectif = (overrides: Partial<IEffectif> = {}): IEffectif => {
  return {
    _id: new ObjectId(),
    organisme_id: new ObjectId(),
    id_erp_apprenant: "test",
    source: "ERP",
    annee_scolaire: "2025-2026",
    apprenant: {
      nom: "DUPONT",
      prenom: "Jean",
      date_de_naissance: new Date("2002-07-28"),
      historique_statut: [],
      has_nir: false,
    },
    formation: {
      date_inscription: new Date("2025-11-10"),
      date_fin: new Date("2027-05-09"),
      date_entree: new Date("2025-11-10"),
    },
    contrats: [
      {
        date_debut: new Date("2025-11-10"),
        date_fin: new Date("2027-05-09"),
        date_rupture: new Date("2025-12-15"),
      },
    ],
    _computed: {
      statut: {
        en_cours: STATUT_APPRENANT.RUPTURANT,
        parcours: [{ date: new Date("2025-12-15"), valeur: STATUT_APPRENANT.RUPTURANT }],
      },
    },
    created_at: new Date(),
    ...overrides,
  } as IEffectif;
};

describe("extractScoreInput", () => {
  it("extrait les 7 dates d'un effectif ERP complet", () => {
    const effectif = createEffectif();
    const result = extractScoreInput(effectif);

    expect(result).not.toBeNull();
    expect(result!["apprenant.date_de_naissance"]).toBe("2002-07-28T00:00:00.000Z");
    expect(result!["formation.date_inscription"]).toBe("2025-11-10T00:00:00.000Z");
    expect(result!["formation.date_fin"]).toBe("2027-05-09T00:00:00.000Z");
    expect(result!["formation.date_entree"]).toBe("2025-11-10T00:00:00.000Z");
    expect(result!["contrat.date_debut"]).toBe("2025-11-10T00:00:00.000Z");
    expect(result!["contrat.date_fin"]).toBe("2027-05-09T00:00:00.000Z");
    expect(result!["contrat.date_rupture"]).toBe("2025-12-15T00:00:00.000Z");
  });

  it("extrait les dates d'un effectif DECA", () => {
    const effectif = {
      ...createEffectif(),
      source: "DECA",
      is_deca_compatible: true,
      deca_raw_id: new ObjectId(),
    } as IEffectifDECA;

    const result = extractScoreInput(effectif);
    expect(result).not.toBeNull();
    expect(result!["contrat.date_rupture"]).toBe("2025-12-15T00:00:00.000Z");
  });

  it("retourne null si pas de date_de_naissance", () => {
    const effectif = createEffectif({
      apprenant: {
        nom: "DUPONT",
        prenom: "Jean",
        date_de_naissance: undefined,
        historique_statut: [],
        has_nir: false,
      },
    } as Partial<IEffectif>);

    expect(extractScoreInput(effectif)).toBeNull();
  });

  it("retourne null si pas de contrat", () => {
    const effectif = createEffectif({ contrats: undefined });
    expect(extractScoreInput(effectif)).toBeNull();
  });

  it("retourne null si contrats est un tableau vide", () => {
    const effectif = createEffectif({ contrats: [] });
    expect(extractScoreInput(effectif)).toBeNull();
  });

  it("retourne null si contrat sans date_rupture", () => {
    const effectif = createEffectif({
      contrats: [{ date_debut: new Date("2025-09-01"), date_fin: new Date("2026-06-30") }],
    });
    expect(extractScoreInput(effectif)).toBeNull();
  });

  it("retourne empty string pour les dates optionnelles manquantes", () => {
    const effectif = createEffectif({ formation: undefined });
    const result = extractScoreInput(effectif);

    expect(result).not.toBeNull();
    expect(result!["formation.date_inscription"]).toBe("");
    expect(result!["formation.date_fin"]).toBe("");
    expect(result!["formation.date_entree"]).toBe("");
  });

  it("prend le dernier contrat quand il y en a plusieurs", () => {
    const effectif = createEffectif({
      contrats: [
        { date_debut: new Date("2024-09-01"), date_fin: new Date("2025-06-30"), date_rupture: new Date("2024-12-01") },
        { date_debut: new Date("2025-09-01"), date_fin: new Date("2026-06-30"), date_rupture: new Date("2025-12-15") },
      ],
    });
    const result = extractScoreInput(effectif);

    expect(result).not.toBeNull();
    expect(result!["contrat.date_rupture"]).toBe("2025-12-15T00:00:00.000Z");
    expect(result!["contrat.date_debut"]).toBe("2025-09-01T00:00:00.000Z");
  });
});
