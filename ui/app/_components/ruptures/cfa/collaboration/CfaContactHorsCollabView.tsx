"use client";

import { CFA_COLLAB_STATUS } from "@/common/types/cfaRuptures";

import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";
import {
  CfaCollaborationBadge,
  CfaHorsCollabTag,
  HORS_COLLAB_TEXTE_COORDONNEES,
  HORS_COLLAB_TEXTE_IDENTIFICATION,
} from "../CfaCollaborationBadge";

import localStyles from "./CfaCollaborationDetail.module.css";

const styles = withSharedStyles(localStyles);

export function CfaContactHorsCollabView({ avecCoordonnees }: { avecCoordonnees: boolean }) {
  return (
    <>
      <div className={styles.sentHeader}>
        <span className={styles.sentHeaderTitle}>Collaboration avec la Mission Locale</span>
        <CfaCollaborationBadge status={CFA_COLLAB_STATUS.CONTACTE_PAR_ML_HORS_COLLAB} effectifId="" sansTagHorsCollab />
      </div>
      <div className={styles.horsCollabBandeau}>
        <CfaHorsCollabTag />
        <p className={styles.horsCollabBandeauTitre}>
          <span className="fr-icon-info-fill fr-icon--sm" aria-hidden="true" />
          Sur ce dossier, le jeune a été contacté par la Mission Locale en dehors d&apos;une collaboration de votre
          initiative.
        </p>
        <p className={styles.horsCollabBandeauTexte}>
          {HORS_COLLAB_TEXTE_IDENTIFICATION}
          {avecCoordonnees && ` ${HORS_COLLAB_TEXTE_COORDONNEES}`}
        </p>
      </div>
    </>
  );
}
