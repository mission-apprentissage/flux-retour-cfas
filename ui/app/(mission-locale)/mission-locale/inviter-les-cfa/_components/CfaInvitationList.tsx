import { Fragment } from "react";
import { ICfaToInvite } from "shared/models/routes/mission-locale/missionLocale.api";

import styles from "../InviterCfa.module.scss";

import { CfaInvitationCard } from "./CfaInvitationCard";
import { EngagementCallout } from "./EngagementCallout";

interface Props {
  invitations: ICfaToInvite[];
  showEngagementCallout: boolean;
  onInvite: (cfa: ICfaToInvite) => void;
}

// Maquette : l'encart de remerciement s'intercale après les deux premières cartes de la liste.
const ENGAGEMENT_CALLOUT_AFTER_INDEX = 1;

export function CfaInvitationList({ invitations, showEngagementCallout, onInvite }: Props) {
  // Borné pour rester visible quand la liste est plus courte que la position prévue.
  const calloutAfterIndex = Math.min(ENGAGEMENT_CALLOUT_AFTER_INDEX, invitations.length - 1);

  return (
    <section className={styles.invitationsSection}>
      <h2 className={styles.sectionTitle}>Invitez les CFA de votre territoire</h2>
      <p className={styles.sectionIntro}>
        Pour inviter un CFA à collaborer avec vous sur le Tableau de bord de l’apprentissage cliquez sur “Inviter ce
        CFA”, vous pourrez ajouter votre propre message de recommandation. L’invitation sera directement envoyée au CFA.
      </p>

      {invitations.length === 0 ? (
        <p className={styles.empty}>
          Aucun CFA de votre territoire ne dispose encore d’un compte sur le Tableau de bord de l’apprentissage.
        </p>
      ) : (
        <div className={styles.invitationsList}>
          {invitations.map((cfa, index) => (
            <Fragment key={cfa.organisme_id}>
              <CfaInvitationCard cfa={cfa} onInvite={onInvite} />
              {showEngagementCallout && index === calloutAfterIndex && <EngagementCallout />}
            </Fragment>
          ))}
        </div>
      )}
    </section>
  );
}
