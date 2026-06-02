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

export function CfaInvitationList({ invitations, showEngagementCallout, onInvite }: Props) {
  return (
    <section className={styles.invitationsSection}>
      <h2 className={styles.sectionTitle}>Invitez les CFA de votre territoire</h2>
      <p className={styles.sectionIntro}>
        Pour invitez un CFA à rejoindre le Tableau de bord de l’apprentissage cliquez sur “Inviter ce CFA”, vous pourrez
        ajouter votre propre message de recommandation. L’invitation sera directement envoyée au CFA.
      </p>

      {invitations.length === 0 ? (
        <p className={styles.empty}>Aucun CFA à inviter pour le moment.</p>
      ) : (
        <div className={styles.invitationsList}>
          {invitations.map((cfa, index) => (
            <Fragment key={cfa.organisme_id}>
              <CfaInvitationCard cfa={cfa} onInvite={onInvite} />
              {showEngagementCallout && index === 0 && <EngagementCallout />}
            </Fragment>
          ))}
        </div>
      )}
    </section>
  );
}
