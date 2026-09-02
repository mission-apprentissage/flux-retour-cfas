import { ML_SITUATION_DOSSIER } from "shared/constants";
import { describe, expect, it } from "vitest";

import type { MlListeEffectif } from "@/common/types/ruptures";

import { filterMlEffectifs } from "./filterMlEffectifs";
import { ML_CRITERES } from "./MlCriteresFilter";

const effectif = (overrides: Partial<MlListeEffectif> = {}): MlListeEffectif =>
  ({
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
    injoignable: false,
    nouveau_contrat: false,
    situation_dossier: ML_SITUATION_DOSSIER.RUPTURE,
    relance_urgente: false,
    ...overrides,
  }) as MlListeEffectif;

const sansFiltre = { recherche: "", codesPostaux: [], criteres: [] };

describe("filterMlEffectifs", () => {
  it("préserve l'ordre serveur", () => {
    const liste = [effectif({ nom: "ZZZ" }), effectif({ nom: "AAA" })];
    expect(filterMlEffectifs(liste, sansFiltre).map((e) => e.nom)).toEqual(["ZZZ", "AAA"]);
  });

  it("filtre par nom ou prénom", () => {
    const liste = [effectif({ nom: "Martin", prenom: "Lina" }), effectif({ nom: "Bernard", prenom: "Lucas" })];
    expect(filterMlEffectifs(liste, { ...sansFiltre, recherche: "lina" })).toHaveLength(1);
  });

  it("filtre par commune", () => {
    const liste = [effectif({ code_postal: "33000" }), effectif({ code_postal: "33310" })];
    expect(filterMlEffectifs(liste, { ...sansFiltre, codesPostaux: ["33000"] })).toHaveLength(1);
  });

  it("retient un dossier portant au moins un critère coché", () => {
    const liste = [
      effectif({ nom: "COLLAB", acc_conjoint: true }),
      effectif({ nom: "RQTH", rqth: true }),
      effectif({ nom: "SANSCRITERE" }),
    ];

    const filtres = filterMlEffectifs(liste, { ...sansFiltre, criteres: [ML_CRITERES.COLLABORATION_CFA] });
    expect(filtres.map((e) => e.nom)).toEqual(["COLLAB"]);

    const deuxCriteres = filterMlEffectifs(liste, {
      ...sansFiltre,
      criteres: [ML_CRITERES.COLLABORATION_CFA, ML_CRITERES.RQTH],
    });
    expect(deuxCriteres.map((e) => e.nom)).toEqual(["COLLAB", "RQTH"]);
  });

  it("cumule les filtres", () => {
    const liste = [
      effectif({ nom: "Martin", prenom: "Lina", code_postal: "33000", mineur: true }),
      effectif({ nom: "Martin", prenom: "Lina", code_postal: "75001", mineur: true }),
    ];

    const resultat = filterMlEffectifs(liste, {
      recherche: "martin",
      codesPostaux: ["33000"],
      criteres: [ML_CRITERES.MINEURS],
    });
    expect(resultat).toHaveLength(1);
    expect(resultat[0].code_postal).toBe("33000");
  });
});
