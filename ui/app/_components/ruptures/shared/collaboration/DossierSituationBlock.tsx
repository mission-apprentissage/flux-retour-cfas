"use client";

import { IEffectifMissionLocale } from "shared";
import { ML_SITUATION_DOSSIER } from "shared/constants";
import { CFA_SITUATION_TYPE_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import { RISQUE_RUPTURE_LABELS } from "@/app/_components/ruptures/shared/constants";
import { formatDate } from "@/app/_utils/date.utils";
import { dePrenom } from "@/app/_utils/ruptures.utils";

import styles from "./CollaborationDetail.shared.module.css";
import { SituationDossierTag } from "./SituationDossierTag";

type OrganismeData = IEffectifMissionLocale["effectif"]["organisme_data"];

interface DossierSituationBlockProps {
  organismeData: OrganismeData;
  prenom: string;
  dateRupture?: Date | string | null;
  /** Côté ML uniquement : le champ n'est pas projeté pour le CFA. */
  situationDossier?: ML_SITUATION_DOSSIER | null;
}

export function DossierSituationBlock({
  organismeData,
  prenom,
  dateRupture,
  situationDossier,
}: DossierSituationBlockProps) {
  const od = organismeData;
  if (!od) return null;

  // Dossier antérieur au tunnel : pas de situation_type, mais il ne pouvait concerner qu'un rupturant.
  const situationType = od.situation_type ?? CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE;

  const lignes: string[] = [];

  if (situationType === CFA_SITUATION_TYPE_ENUM.EN_CONTRAT) {
    if (od.risque_rupture) {
      lignes.push(`⚠️ Risque de rupture : ${RISQUE_RUPTURE_LABELS[od.risque_rupture]}`);
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
        ? `📅 Date de début de formation le ${formatDate(od.date_debut_formation)}`
        : "📅 Rentrée sans contrat"
    );
  }

  const detail = situationType === CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT ? od.recherche_entreprise : od.cause_rupture;

  if (!situationDossier && lignes.length === 0 && !detail) return null;

  return (
    <div className={styles.sentBubbleSection}>
      <p className={styles.sentSectionTitle}>
        {situationDossier ? "Situation du jeune" : `Situation ${dePrenom(prenom)}`}
      </p>
      {situationDossier && <SituationDossierTag situation={situationDossier} />}
      {lignes.map((ligne) => (
        <p key={ligne} className={styles.sentStillAtCfa}>
          {ligne}
        </p>
      ))}
      {detail && <p className={styles.sentBody}>{detail}</p>}
    </div>
  );
}
