export type {
  CfaCollaborationStatus,
  CfaSuiviCategory,
  ICfaEffectif,
  ICfaEffectifsResponse,
  ICfaRuptureEffectif,
  ICfaRupturesResponse,
  ICfaSuiviMissionLocaleResponse,
} from "shared/models/routes/organismes/cfa";

import { CFA_COLLAB_STATUS, CFA_SUIVI_CATEGORY } from "shared/models/routes/organismes/cfa";
import type { CfaCollaborationStatus } from "shared/models/routes/organismes/cfa";

export { CFA_COLLAB_STATUS, CFA_SUIVI_CATEGORY };

// Libellés des badges affichés dans la colonne "Collaboration avec la ML".
export const COLLAB_STATUS_LABELS: Record<CfaCollaborationStatus, string> = {
  [CFA_COLLAB_STATUS.DEMARRER_COLLAB]: "Démarrer une collab",
  [CFA_COLLAB_STATUS.COLLAB_DEMANDEE]: "Demande collab envoyée",
  [CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB]: "Contacté par la ML",
  [CFA_COLLAB_STATUS.TRAITE_PAR_ML]: "Traité par la ML",
};

// Libellés des options du filtre "Statut collaboration ML" (dropdown).
export const COLLAB_STATUS_FILTER_LABELS: Record<CfaCollaborationStatus, string> = {
  [CFA_COLLAB_STATUS.DEMARRER_COLLAB]: "Pas encore de collaboration",
  [CFA_COLLAB_STATUS.COLLAB_DEMANDEE]: "Collaboration demandée en attente",
  [CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB]: "Contacté par la Mission Locale hors collaboration",
  [CFA_COLLAB_STATUS.TRAITE_PAR_ML]: "Collaboration traitée par la Mission Locale",
};

// Options proposées dans le dropdown de filtre de la liste rupture (ordre d'affichage).
export const COLLAB_STATUS_FILTER_OPTIONS: CfaCollaborationStatus[] = [
  CFA_COLLAB_STATUS.DEMARRER_COLLAB,
  CFA_COLLAB_STATUS.COLLAB_DEMANDEE,
  CFA_COLLAB_STATUS.TRAITE_PAR_ML,
  CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB,
];

export const COLLAB_STATUS_ORDER: Record<CfaCollaborationStatus, number> = {
  [CFA_COLLAB_STATUS.DEMARRER_COLLAB]: 0,
  [CFA_COLLAB_STATUS.COLLAB_DEMANDEE]: 1,
  [CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB]: 2,
  [CFA_COLLAB_STATUS.TRAITE_PAR_ML]: 3,
};

// Statuts "actifs" = un dossier sur lequel il s'est passé quelque chose côté ML.
export const ACTIVE_COLLAB_STATUSES = [
  CFA_COLLAB_STATUS.COLLAB_DEMANDEE,
  CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB,
  CFA_COLLAB_STATUS.TRAITE_PAR_ML,
] as const;

export const ACTIVE_COLLAB_STATUS_LABELS: Partial<Record<CfaCollaborationStatus, string>> = {
  [CFA_COLLAB_STATUS.COLLAB_DEMANDEE]: "Demande collab envoyée",
  [CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB]: "Contacté par la ML hors collaboration",
  [CFA_COLLAB_STATUS.TRAITE_PAR_ML]: "Traité par la ML",
};

export const EN_RUPTURE_OPTIONS = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
];

export const DECA_TOOLTIP_TEXT =
  "DECA (Dépôt des contrats en alternance) : base de données qui stocke les contrats d'apprentissage des secteurs privé et public déposés par les 11 opérateurs de compétences (OPCO) et les agents en DDETS/D(R)(I)EETS.";
