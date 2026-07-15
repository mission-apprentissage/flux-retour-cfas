"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import type { CfaCollaborationStatus } from "@/common/types/cfaRuptures";

import styles from "./CfaCollaborationBadge.module.css";

interface CfaCollaborationBadgeProps {
  status: CfaCollaborationStatus;
  effectifId: string;
  // Affiche les étiquettes "Contacté par la ML" / "Hors collab" côte à côte (contexte bandeau)
  // au lieu de l'empilement vertical utilisé dans le tableau.
  inline?: boolean;
}

export function CfaCollaborationBadge({ status, effectifId, inline = false }: CfaCollaborationBadgeProps) {
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  switch (status) {
    case "demarrer_collab":
      return (
        <Button
          priority="primary"
          size="small"
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          linkProps={{
            href: `/cfa/${effectifId}`,
            onClick: () => trackPlausibleEvent("cfa_liste_demarrer_collab", undefined, { effectifId }),
          }}
        >
          Démarrer une collab
        </Button>
      );
    case "collab_demandee":
      return <Badge severity="info">Demande collab envoyée</Badge>;
    case "contacte_par_ml_hors_collab":
      return (
        <span className={`${styles.horsCollabContainer} ${inline ? styles.horsCollabContainerInline : ""}`}>
          <span className={styles.contacteBadge}>
            <i className="fr-icon-message-2-fill fr-icon--sm" />
            Contacté par la ML
          </span>
          <span className={styles.horsCollabTag}>
            Hors collab
            <span className={styles.horsCollabInfo}>
              <Tooltip
                kind="hover"
                title="Ce jeune a été contacté par la Mission Locale en dehors d'une collaboration : son dossier a été transmis automatiquement à partir de 45 jours après la rupture."
              />
            </span>
          </span>
        </span>
      );
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
