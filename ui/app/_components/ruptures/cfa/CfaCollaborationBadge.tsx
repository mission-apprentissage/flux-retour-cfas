"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import type { CfaCollaborationStatus } from "@/common/types/cfaRuptures";

import styles from "./CfaCollaborationBadge.module.css";

export const HORS_COLLAB_TEXTE_IDENTIFICATION =
  "Certains jeunes peuvent avoir été identifiés par les Missions Locales en amont d'une initiative de collaboration de votre part. S'ils ont déjà été contactés, nous vous informons avec cette mention «\u00a0Contacté•e par la ML Hors Collab\u00a0».";

export const HORS_COLLAB_TEXTE_COORDONNEES =
  "Nous vous mettons à disposition les coordonnées de la personne de la Mission Locale qui a contacté le jeune.";

interface CfaCollaborationBadgeProps {
  status: CfaCollaborationStatus;
  effectifId: string;
  // Affiche les étiquettes "Contacté•e par la ML" / "Hors collab" côte à côte (contexte bandeau)
  // au lieu de l'empilement vertical utilisé dans le tableau.
  inline?: boolean;
  // Renseigné quand la collaboration est impossible : le CTA est rendu inactif et la raison
  // est affichée en infobulle.
  unavailableReason?: string;
  // Le tag "Hors collab" est alors rendu par l'appelant, sur la ligne de la date.
  sansTagHorsCollab?: boolean;
}

export function CfaHorsCollabTag() {
  return (
    <span className={styles.horsCollabTag}>
      Hors collab
      <span className={styles.horsCollabInfo}>
        <Tooltip kind="hover" title={`${HORS_COLLAB_TEXTE_IDENTIFICATION} ${HORS_COLLAB_TEXTE_COORDONNEES}`} />
      </span>
    </span>
  );
}

export function CfaCollaborationBadge({
  status,
  effectifId,
  inline = false,
  unavailableReason,
  sansTagHorsCollab = false,
}: CfaCollaborationBadgeProps) {
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  switch (status) {
    case "demarrer_collab":
      if (unavailableReason) {
        return (
          <span className={styles.unavailableCta}>
            <Button priority="primary" size="small" disabled>
              Démarrer une collab
            </Button>
            <Tooltip kind="hover" title={unavailableReason} />
          </span>
        );
      }
      return (
        <Button
          priority="primary"
          size="small"
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          linkProps={{
            href: `/cfa/${effectifId}/collaboration`,
            onClick: () => trackPlausibleEvent("cfa_liste_demarrer_collab", undefined, { effectifId }),
          }}
        >
          Démarrer une collab
        </Button>
      );
    case "collab_demandee":
      return (
        <span className={styles.demandeEnvoyeeBadge}>
          <i className="fr-icon-send-plane-fill fr-icon--sm" />
          Demande collab envoyée
        </span>
      );
    case "contacte_par_ml_hors_collab": {
      const contacte = (
        <span className={styles.contacteBadge}>
          <i className="fr-icon-message-2-fill fr-icon--sm" />
          Contacté•e par la ML
        </span>
      );
      if (sansTagHorsCollab) return contacte;
      return (
        <span className={`${styles.horsCollabContainer} ${inline ? styles.horsCollabContainerInline : ""}`}>
          {contacte}
          <CfaHorsCollabTag />
        </span>
      );
    }
    case "traite_par_ml":
      return (
        <span className={styles.traiteBadge}>
          <i className="fr-icon-success-fill fr-icon--sm" />
          Traité par la ML
        </span>
      );
    default:
      return null;
  }
}
