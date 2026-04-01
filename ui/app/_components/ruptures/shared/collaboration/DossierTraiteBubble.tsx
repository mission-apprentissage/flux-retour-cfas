"use client";

import { SITUATION_ENUM } from "shared";

import { BooleanLine } from "./BooleanLine";
import { isContactReussi } from "./collaboration.utils";
import styles from "./CollaborationDetail.shared.module.css";

interface DossierTraiteBubbleProps {
  log: {
    situation?: SITUATION_ENUM | null;
    commentaires?: string | null;
  };
}

export function DossierTraiteBubble({ log }: DossierTraiteBubbleProps) {
  if (!log.situation) return null;

  const isNeVeutPas = log.situation === SITUATION_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT;
  const contactReussi = isContactReussi(log.situation) || isNeVeutPas;
  const rdvPris = log.situation === SITUATION_ENUM.RDV_PRIS;

  return (
    <div className={styles.dossierTraiteBubble}>
      <div className={styles.sentBubbleSection}>
        <p className={styles.sentSectionTitle}>Situation</p>
        <BooleanLine label="Jeune contacté" value={contactReussi} className={styles.dossierTraiteLine} />
        {!contactReussi && log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR && (
          <p className={styles.dossierTraiteLine}>
            {"🔄 "}
            <strong>À relancer bientôt</strong>
          </p>
        )}
        {!contactReussi && log.situation === SITUATION_ENUM.COORDONNEES_INCORRECT && (
          <p className={styles.dossierTraiteLine}>
            ❌ <strong>Mauvaises coordonnées / Injoignable</strong>
          </p>
        )}
        {!contactReussi && log.situation === SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES && (
          <p className={styles.dossierTraiteLine}>
            ❌ <strong>Injoignable après plusieurs relances</strong>
          </p>
        )}
        {contactReussi && (
          <BooleanLine
            label="Rendez-vous pris à la Mission Locale"
            value={rdvPris}
            className={styles.dossierTraiteLine}
          />
        )}
      </div>

      {log.commentaires && (
        <div className={styles.sentBubbleSection}>
          <p className={styles.sentSectionTitle}>Commentaire de la Mission Locale</p>
          <p className={styles.dossierTraiteCommentaire}>{log.commentaires}</p>
        </div>
      )}
    </div>
  );
}
