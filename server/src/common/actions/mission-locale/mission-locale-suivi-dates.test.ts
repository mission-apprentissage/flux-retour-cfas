import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { describe, expect, it } from "vitest";

import { computeSuiviDatesSet } from "./mission-locale-suivi-dates";

const NOW = new Date("2026-08-24T10:00:00.000Z");

describe("computeSuiviDatesSet", () => {
  it("ne renvoie rien sans écriture effective", () => {
    expect(computeSuiviDatesSet(SITUATION_ENUM.RDV_PRIS, false, NOW)).toEqual({});
    expect(computeSuiviDatesSet(undefined, false, NOW)).toEqual({});
  });

  it("pose uniquement la date d'action quand la situation ne change pas", () => {
    expect(computeSuiviDatesSet(undefined, true, NOW)).toEqual({ date_derniere_action_ml: NOW });
  });

  it("pose la date de recontact et annule le traitement sur CONTACTE_SANS_RETOUR", () => {
    expect(computeSuiviDatesSet(SITUATION_ENUM.CONTACTE_SANS_RETOUR, true, NOW)).toEqual({
      date_derniere_action_ml: NOW,
      date_dernier_passage_a_recontacter: NOW,
      date_traitement: null,
    });
  });

  it("annule le traitement quand la situation est remise à null", () => {
    expect(computeSuiviDatesSet(null, true, NOW)).toEqual({
      date_derniere_action_ml: NOW,
      date_traitement: null,
    });
  });

  it.each([
    SITUATION_ENUM.RDV_PRIS,
    SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES,
    SITUATION_ENUM.NOUVEAU_CONTRAT,
    SITUATION_ENUM.AUTRE,
  ])("pose date_traitement pour la situation traitée %s", (situation) => {
    expect(computeSuiviDatesSet(situation, true, NOW)).toEqual({
      date_derniere_action_ml: NOW,
      date_traitement: NOW,
    });
  });
});
