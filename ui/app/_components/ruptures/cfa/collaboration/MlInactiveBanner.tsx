"use client";

import { useState } from "react";

import { MlInactiveBadge } from "../../shared/collaboration/MlInactiveBadge";
import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import localStyles from "./CfaCollaborationDetail.module.css";
import { MlOrg } from "./types";

const styles = withSharedStyles(localStyles);

export function MlInactiveBanner({ ml }: { ml: MlOrg }) {
  const [contactsOpen, setContactsOpen] = useState(false);
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

      <button
        type="button"
        className={styles.sentContactToggle}
        aria-expanded={contactsOpen}
        onClick={() => setContactsOpen((o) => !o)}
      >
        Coordonnées de la Mission Locale {mlName}
        <span
          className={`fr-icon--sm ${contactsOpen ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"}`}
          aria-hidden="true"
        />
      </button>
      {contactsOpen && (
        <div className={styles.sentContactDetails}>
          {ml.email && <p>Email : {ml.email}</p>}
          {ml.telephone && <p>Téléphone : {ml.telephone}</p>}
        </div>
      )}
    </div>
  );
}
