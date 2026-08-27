"use client";

import { CFA_SITUATION_TYPE_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import { FormValues } from "../types";

import { StepId } from "./types";

export function buildTunnelSteps(values: FormValues): StepId[] {
  const steps: StepId[] = ["situation"];

  switch (values.situation_type) {
    case CFA_SITUATION_TYPE_ENUM.EN_CONTRAT:
      steps.push("risqueRupture");
      break;
    case CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE:
      steps.push("maintienFormation", "datesRupture");
      break;
    case CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT:
      steps.push("rentreeSansContrat");
      break;
    default:
      return steps;
  }

  return [...steps, "objectifs", "contact", "recap"];
}

// Champs propres à une branche : ils sont vidés quand l'utilisateur change de réponse à
// l'écran 1.0, sinon le payload violerait les règles de cohérence du serveur.
export const EMPTY_BRANCH_VALUES = {
  risque_rupture: null,
  still_at_cfa: null,
  date_rupture: "",
  date_abandon: "",
  cause_rupture: "",
  date_debut_formation: "",
  recherche_entreprise: "",
} satisfies Partial<FormValues>;
