"use client";

import { IEffectifMissionLocale } from "shared";
import { CFA_RISQUE_RUPTURE_ENUM, CFA_SITUATION_TYPE_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import { formatDate } from "@/app/_utils/date.utils";

import styles from "./CollaborationDetail.shared.module.css";

const RISQUE_LABELS: Record<CFA_RISQUE_RUPTURE_ENUM, string> = {
  [CFA_RISQUE_RUPTURE_ENUM.INEVITABLE]: "Inévitable",
  [CFA_RISQUE_RUPTURE_ENUM.TRES_ELEVE]: "Très élevé",
  [CFA_RISQUE_RUPTURE_ENUM.MODERE]: "Modéré",
  [CFA_RISQUE_RUPTURE_ENUM.FAIBLE]: "Faible",
};

type OrganismeData = IEffectifMissionLocale["effectif"]["organisme_data"];

interface DossierSituationBlockProps {
  organismeData: OrganismeData;
  prenom: string;
  dateRupture?: Date | string | null;
}

export function DossierSituationBlock({ organismeData, prenom, dateRupture }: DossierSituationBlockProps) {
  const od = organismeData;
  if (!od) return null;

  // Dossier antérieur au tunnel : pas de situation_type, mais il ne pouvait concerner qu'un rupturant.
  const situationType = od.situation_type ?? CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE;

  const lignes: string[] = [];

  if (situationType === CFA_SITUATION_TYPE_ENUM.EN_CONTRAT) {
    if (od.risque_rupture) {
      lignes.push(`⚠️ Risque de rupture : ${RISQUE_LABELS[od.risque_rupture]}`);
    }
  }

  if (situationType === CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE) {
    if (dateRupture) {
      lignes.push(`❌ Rupture de contrat le ${formatDate(dateRupture)}`);
    }
    if (od.still_at_cfa === true) {
      lignes.push("🏛️ Maintenu en formation actuellement");
    }
    if (od.still_at_cfa === false) {
      lignes.push(od.date_abandon ? `🚪 A quitté le CFA le ${formatDate(od.date_abandon)}` : "🚪 A quitté le CFA");
    }
  }

  if (situationType === CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT) {
    lignes.push(
      od.date_debut_formation
        ? `📅 Rentrée sans contrat, formation débutée le ${formatDate(od.date_debut_formation)}`
        : "📅 Rentrée sans contrat"
    );
  }

  const detail = situationType === CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT ? od.recherche_entreprise : od.cause_rupture;

  if (lignes.length === 0 && !detail) return null;

  return (
    <div className={styles.sentBubbleSection}>
      <p className={styles.sentSectionTitle}>Situation de {prenom}</p>
      {lignes.map((ligne) => (
        <p key={ligne} className={styles.sentStillAtCfa}>
          {ligne}
        </p>
      ))}
      {detail && <p className={styles.sentBody}>{detail}</p>}
    </div>
  );
}
