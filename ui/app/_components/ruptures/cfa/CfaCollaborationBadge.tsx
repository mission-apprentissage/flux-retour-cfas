"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import type { CfaCollaborationStatus } from "@/common/types/cfaRuptures";

import styles from "./CfaCollaborationBadge.module.css";

interface CfaCollaborationBadgeProps {
  status: CfaCollaborationStatus;
  effectifId: string;
}

export function CfaCollaborationBadge({ status, effectifId }: CfaCollaborationBadgeProps) {
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
      return <Badge severity="info">Collaboration demandée</Badge>;
    case "contacte_par_ml":
      return (
        <span className={styles.contacteBadge}>
          <i className="fr-icon-message-2-fill fr-icon--sm" />
          Contacté par la ML
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
