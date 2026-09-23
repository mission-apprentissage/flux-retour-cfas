import { describe, expect, it } from "vitest";

import { getCfaSourceDescriptor } from "./cfaEffectifsSource";

describe("getCfaSourceDescriptor", () => {
  const cases = [
    { label: "ERP connecté via API", organisme: { mode_de_transmission: "API" as const }, state: "erp" },
    { label: "ERP renseigné sans mode", organisme: { erps: ["ymag"] }, state: "erp" },
    { label: "dépôt de fichier", organisme: { mode_de_transmission: "MANUEL" as const }, state: "fichier" },
    { label: "aucune source", organisme: {}, state: "aucune" },
    { label: "organisme non chargé", organisme: undefined, state: "aucune" },
  ];

  cases.forEach(({ label, organisme, state }) => {
    it(`${label} sans DECA`, () => {
      expect(getCfaSourceDescriptor(organisme, false)).toEqual({
        state,
        showsDeca: false,
        linkLabel:
          state === "aucune" ? "Ajouter ma propre source de données" : "Vérifier l'état de connexion de mes données",
      });
    });

    it(`${label} avec DECA`, () => {
      expect(getCfaSourceDescriptor(organisme, true).showsDeca).toBe(true);
    });
  });

  it("le dépôt de fichier n'est pas traité comme une absence de source", () => {
    expect(getCfaSourceDescriptor({ mode_de_transmission: "MANUEL" }, true).linkLabel).toBe(
      "Vérifier l'état de connexion de mes données"
    );
  });
});
