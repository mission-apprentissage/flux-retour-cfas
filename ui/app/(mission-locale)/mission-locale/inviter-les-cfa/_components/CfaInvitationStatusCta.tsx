import { Button } from "@codegouvfr/react-dsfr/Button";
import { CFA_INVITATION_STATUT, ICfaToInvite } from "shared/models/routes/mission-locale/missionLocale.api";

import styles from "../InviterCfa.module.scss";

interface Props {
  cfa: ICfaToInvite;
  onInvite: (cfa: ICfaToInvite) => void;
}

export function CfaInvitationStatusCta({ cfa, onInvite }: Props) {
  switch (cfa.statut) {
    case CFA_INVITATION_STATUT.CFA_ACTIF:
      return (
        <span className={`fr-badge ${styles.statusBadge} ${styles.statusActive}`}>
          <i className="fr-icon-checkbox-circle-fill fr-icon--sm" aria-hidden="true" />
          <span className={styles.statusText}>CFA activé grâce à vous !</span>
        </span>
      );

    case CFA_INVITATION_STATUT.INVITATION_ENVOYEE:
      return (
        <span className={`fr-badge ${styles.statusBadge} ${styles.statusSent}`}>
          <i className="fr-icon-plane-fill fr-icon--sm" aria-hidden="true" />
          <span className={styles.statusText}>Invitation envoyée</span>
        </span>
      );

    case CFA_INVITATION_STATUT.BIENTOT_DISPONIBLE:
      return (
        <>
          <span className={`fr-badge ${styles.statusBadge} ${styles.statusSoon}`}>
            <i className="fr-icon-pause-circle-fill fr-icon--sm" aria-hidden="true" />
            <span className={styles.statusText}>CFA bientôt disponible</span>
          </span>
        </>
      );

    case CFA_INVITATION_STATUT.INVITER:
    default:
      return (
        <Button priority="primary" className={styles.inviteCTA} onClick={() => onInvite(cfa)}>
          Inviter ce CFA
        </Button>
      );
  }
}
