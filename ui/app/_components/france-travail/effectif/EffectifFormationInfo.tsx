"use client";

import { formatDate } from "@/app/_utils/date.utils";

import styles from "./EffectifDetail.module.css";

interface EffectifFormationInfoProps {
  dateDebut?: string;
  badgeStyle: { backgroundColor: string; color: string; label: string };
  organisme?: {
    enseigne?: string;
    raison_sociale?: string;
    nom?: string;
    telephone?: string;
    email?: string;
  };
  formation?: {
    niveau_libelle?: string;
    libelle_long?: string;
  };
  secteurs?: Array<{ code: string; libelle: string }>;
}

export function EffectifFormationInfo({
  dateDebut,
  badgeStyle,
  organisme,
  formation,
  secteurs,
}: EffectifFormationInfoProps) {
  return (
    <>
      <h2 className={styles.sectionTitle}>Formation</h2>

      <div className={styles.formationHeader}>
        <p className={styles.formationStart}>
          <i className={`ri-calendar-event-line ${styles.icon}`} />
          Démarrage formation <b>{formatDate(dateDebut) || "-"}</b>
          <span
            className={styles.badgeDuree}
            style={{
              backgroundColor: badgeStyle.backgroundColor,
              color: badgeStyle.color,
            }}
          >
            {badgeStyle.label}
          </span>
        </p>
      </div>

      <p className={styles.orgName}>
        <i className={`ri-school-line ${styles.icon}`} />
        {organisme?.enseigne || organisme?.raison_sociale || organisme?.nom || "-"}
      </p>
      {formation?.niveau_libelle && (
        <p className={styles.formationLevelContainer}>
          <i className={`ri-honour-line ${styles.icon}`} />
          <span className={styles.formationLevel}>{formation.niveau_libelle}</span>
        </p>
      )}
      {formation?.libelle_long && <p className={styles.formationTitle}>{formation.libelle_long}</p>}

      {secteurs && secteurs.length > 0 && (
        <div className={styles.secteursSection}>
          <p className={styles.coordTitle}>Formation rattachée aux secteurs</p>
          <div className={styles.secteursBadges}>
            {secteurs.map((secteur) => (
              <span key={secteur.code} className={styles.secteurBadge}>
                {secteur.libelle}
              </span>
            ))}
          </div>
        </div>
      )}

      {(organisme?.telephone || organisme?.email) && (
        <>
          <p className={styles.coordTitle}>Coordonnées organisme de formation</p>
          {organisme?.telephone && <p className={styles.infoPara}>{organisme.telephone}</p>}
          {organisme?.email && <p className={styles.infoPara}>{organisme.email}</p>}
        </>
      )}
    </>
  );
}
