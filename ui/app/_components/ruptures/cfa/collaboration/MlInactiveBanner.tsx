"use client";

import { MlInactiveBadge } from "../../shared/collaboration/MlInactiveBadge";
import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import localStyles from "./CfaCollaborationDetail.module.css";
import { MlOrg } from "./types";

const styles = withSharedStyles(localStyles);

export function MlInactiveBanner({ ml }: { ml: MlOrg }) {
  const mlName = ml.nom || "de rattachement";

  return (
    <div className={styles.mlInactiveBanner}>
      <MlInactiveBadge />

      <div className={styles.mlInactiveNotice}>
        <p className={styles.mlInactiveNoticeTitle}>
          <span className="fr-icon-info-line fr-icon--sm" aria-hidden="true" />
          La Mission Locale {mlName} n&apos;utilise pas encore le Tableau de bord
        </p>
        <p className={styles.mlInactiveNoticeBody}>
          La Mission Locale {mlName} n&apos;utilise pas encore le Tableau de bord de l&apos;apprentissage. Votre demande
          de collaboration a bien été envoyée par mail. Cependant le délai de traitement du dossier risque d&apos;être
          plus long. N&apos;hésitez pas à prendre contact avec la Mission Locale directement.
        </p>
      </div>
    </div>
  );
}
