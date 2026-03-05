export type {
  CfaCollaborationStatus,
  CfaEffectifSource,
  CfaRuptureSegmentKey,
  ICfaEffectif,
  ICfaEffectifsResponse,
  ICfaRuptureEffectif,
  ICfaRuptureSegment,
  ICfaRupturesResponse,
} from "shared/models/routes/organismes/cfa";

import { CFA_COLLAB_STATUS } from "shared/models/routes/organismes/cfa";
import type { CfaCollaborationStatus, CfaRuptureSegmentKey } from "shared/models/routes/organismes/cfa";

export { CFA_COLLAB_STATUS };

export const SEGMENT_LABELS: Record<CfaRuptureSegmentKey, string> = {
  moins_45j: "Ruptures il y a - de 45j",
  "46_90j": "Ruptures entre 46j et 90j",
  "91_180j": "Ruptures entre 91j et 180j",
};

export const COLLAB_STATUS_LABELS: Record<CfaCollaborationStatus, string> = {
  [CFA_COLLAB_STATUS.DEMARRER_COLLAB]: "Démarrer une collab",
  [CFA_COLLAB_STATUS.COLLAB_DEMANDEE]: "Collaboration demandée",
  [CFA_COLLAB_STATUS.CONTACTE_PAR_ML]: "Contacté par la ML",
  [CFA_COLLAB_STATUS.TRAITE_PAR_ML]: "Traité par la ML",
};

export const COLLAB_STATUS_ORDER: Record<CfaCollaborationStatus, number> = {
  [CFA_COLLAB_STATUS.DEMARRER_COLLAB]: 0,
  [CFA_COLLAB_STATUS.COLLAB_DEMANDEE]: 1,
  [CFA_COLLAB_STATUS.CONTACTE_PAR_ML]: 2,
  [CFA_COLLAB_STATUS.TRAITE_PAR_ML]: 3,
};

export const CFA_DEFAULT_ITEMS_TO_SHOW = 10;

export const EN_RUPTURE_OPTIONS = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
];

export const DECA_TOOLTIP_TEXT =
  "DECA (Dépôt des contrats en alternance) : base de données qui stocke les contrats d'apprentissage des secteurs privé et public déposés par les 11 opérateurs de compétences (OPCO) et les agents en DDETS/D(R)(I)EETS.";
