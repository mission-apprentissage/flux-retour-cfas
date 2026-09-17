import { ACC_CONJOINT_MOTIF_ENUM } from "shared";
import { CFA_RISQUE_RUPTURE_ENUM } from "shared/models/data/missionLocaleEffectif.model";

export const MOTIF_LABELS: Record<ACC_CONJOINT_MOTIF_ENUM, string> = {
  [ACC_CONJOINT_MOTIF_ENUM.MOBILITE]: "Mobilité",
  [ACC_CONJOINT_MOTIF_ENUM.LOGEMENT]: "Logement",
  [ACC_CONJOINT_MOTIF_ENUM.SANTE]: "Santé",
  [ACC_CONJOINT_MOTIF_ENUM.FINANCE]: "Finance",
  [ACC_CONJOINT_MOTIF_ENUM.ADMINISTRATIF]: "Administratif",
  [ACC_CONJOINT_MOTIF_ENUM.SOCIAL_FAMILIAL]: "Social / Familial",
  [ACC_CONJOINT_MOTIF_ENUM.REORIENTATION]: "Réorientation",
  [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI]: "Recherche d'emploi",
  [ACC_CONJOINT_MOTIF_ENUM.AUTRE]: "Autre",
};

export const MOTIF_EMOJIS: Partial<Record<ACC_CONJOINT_MOTIF_ENUM, string>> = {
  [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI]: "💼",
  [ACC_CONJOINT_MOTIF_ENUM.MOBILITE]: "🚗",
  [ACC_CONJOINT_MOTIF_ENUM.LOGEMENT]: "🏠",
  [ACC_CONJOINT_MOTIF_ENUM.SANTE]: "🩺",
  [ACC_CONJOINT_MOTIF_ENUM.ADMINISTRATIF]: "📂",
  [ACC_CONJOINT_MOTIF_ENUM.FINANCE]: "💶",
  [ACC_CONJOINT_MOTIF_ENUM.SOCIAL_FAMILIAL]: "👨‍👩‍👧",
  [ACC_CONJOINT_MOTIF_ENUM.REORIENTATION]: "🧭",
};

export const RISQUE_RUPTURE_LABELS: Record<CFA_RISQUE_RUPTURE_ENUM, string> = {
  [CFA_RISQUE_RUPTURE_ENUM.INEVITABLE]: "Inévitable",
  [CFA_RISQUE_RUPTURE_ENUM.TRES_ELEVE]: "Très élevé",
  [CFA_RISQUE_RUPTURE_ENUM.MODERE]: "Modéré",
  [CFA_RISQUE_RUPTURE_ENUM.FAIBLE]: "Faible",
};

export const RISQUE_RUPTURE_DESCRIPTIONS: Record<CFA_RISQUE_RUPTURE_ENUM, string> = {
  [CFA_RISQUE_RUPTURE_ENUM.INEVITABLE]: "la rupture est prévue dans un futur proche",
  [CFA_RISQUE_RUPTURE_ENUM.TRES_ELEVE]: "le jeune va certainement connaître une rupture de contrat",
  [CFA_RISQUE_RUPTURE_ENUM.MODERE]: "la rupture peut être évitée si des solutions sont trouvées",
  [CFA_RISQUE_RUPTURE_ENUM.FAIBLE]: "pas de rupture en vue, mais ce jeune a besoin d'un accompagnement",
};
