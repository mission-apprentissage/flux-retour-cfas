"use client";

import { IEffectifMissionLocale } from "shared";
import { ML_SITUATION_DOSSIER } from "shared/constants";
import { CFA_RISQUE_RUPTURE_ENUM, CFA_SITUATION_TYPE_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import { RISQUE_RUPTURE_DESCRIPTIONS, RISQUE_RUPTURE_LABELS } from "@/app/_components/ruptures/shared/constants";
import { formatDate } from "@/app/_utils/date.utils";

import styles from "./CollaborationDetail.shared.module.css";
import { SituationDossierTag } from "./SituationDossierTag";

type OrganismeData = IEffectifMissionLocale["effectif"]["organisme_data"];

interface SituationLigne {
  icon: string;
  erreur?: boolean;
  label: string;
  date?: Date | string | null;
}

interface DossierSituationBlockProps {
  organismeData: OrganismeData;
  dateRupture?: Date | string | null;
  /** Côté ML uniquement : le champ n'est pas projeté pour le CFA. */
  situationDossier?: ML_SITUATION_DOSSIER | null;
}

export function DossierSituationBlock({ organismeData, dateRupture, situationDossier }: DossierSituationBlockProps) {
  const od = organismeData;
  if (!od) return null;

  // Dossier antérieur au tunnel : pas de situation_type, mais il ne pouvait concerner qu'un rupturant.
  const situationType = od.situation_type ?? CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE;
  const enContrat = situationType === CFA_SITUATION_TYPE_ENUM.EN_CONTRAT;
  // Risque faible : le CFA demande un accompagnement, pas une prévention de rupture.
  const risque = enContrat && od.risque_rupture !== CFA_RISQUE_RUPTURE_ENUM.FAIBLE ? od.risque_rupture : null;

  const lignes: SituationLigne[] = [];

  if (enContrat && !risque) {
    lignes.push({ icon: "fr-icon-success-fill", label: "En contrat actuellement" });
  }

  if (situationType === CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE) {
    if (dateRupture) {
      lignes.push({ icon: "fr-icon-error-fill", erreur: true, label: "Rupture de contrat", date: dateRupture });
    }
    if (od.still_at_cfa === true) {
      lignes.push({ icon: "ri-school-line", label: "Maintenu en formation actuellement" });
    }
    if (od.still_at_cfa === false) {
      lignes.push({ icon: "fr-icon-error-fill", erreur: true, label: "A quitté le CFA", date: od.date_abandon });
    }
  }

  if (situationType === CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT) {
    lignes.push({
      icon: "fr-icon-calendar-fill",
      label: "Date de début de formation",
      date: od.date_debut_formation,
    });
  }

  const detail = situationType === CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT ? od.recherche_entreprise : od.cause_rupture;

  if (!situationDossier && !risque && lignes.length === 0 && !detail) return null;

  return (
    <div className={styles.sentBubbleSection}>
      <p className={styles.sentSectionTitle}>Situation du jeune</p>
      {situationDossier && <SituationDossierTag situation={situationDossier} />}
      {risque && (
        <p className={styles.sentSituationLine}>
          <span>
            <strong>Risque de rupture : {RISQUE_RUPTURE_LABELS[risque]}</strong>, {RISQUE_RUPTURE_DESCRIPTIONS[risque]}
          </span>
        </p>
      )}
      {lignes.map((ligne) => (
        <p
          key={ligne.label}
          className={`${styles.sentSituationLine} ${ligne.erreur ? styles.sentSituationLineError : ""}`}
        >
          <i className={`${ligne.icon} fr-icon--sm`} aria-hidden="true" />
          <strong>{ligne.label}</strong>
          {ligne.date && <span className={styles.sentSituationDate}>le {formatDate(ligne.date)}</span>}
        </p>
      ))}
      {detail && <p className={styles.sentBody}>{detail}</p>}
    </div>
  );
}
