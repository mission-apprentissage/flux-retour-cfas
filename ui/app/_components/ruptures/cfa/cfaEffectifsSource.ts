export type CfaSourceState = "erp" | "fichier" | "aucune";

export interface CfaSourceDescriptor {
  state: CfaSourceState;
  showsDeca: boolean;
  linkLabel: string;
}

interface CfaSourceInput {
  erps?: string[];
  mode_de_transmission?: "API" | "MANUEL";
}

const VERIFIER_LABEL = "Vérifier l'état de connexion de mes données";
const AJOUTER_LABEL = "Ajouter ma propre source de données";

export function getCfaSourceState(organisme: CfaSourceInput | undefined): CfaSourceState {
  if (organisme?.mode_de_transmission === "API" || (organisme?.erps?.length ?? 0) > 0) {
    return "erp";
  }
  if (organisme?.mode_de_transmission === "MANUEL") {
    return "fichier";
  }
  return "aucune";
}

export function getCfaSourceDescriptor(
  organisme: CfaSourceInput | undefined,
  isAllowedDeca: boolean
): CfaSourceDescriptor {
  const state = getCfaSourceState(organisme);
  return {
    state,
    showsDeca: isAllowedDeca,
    linkLabel: state === "aucune" ? AJOUTER_LABEL : VERIFIER_LABEL,
  };
}
