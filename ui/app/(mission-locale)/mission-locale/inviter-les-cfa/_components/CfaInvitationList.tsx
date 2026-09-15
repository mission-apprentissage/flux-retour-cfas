"use client";

import { Fragment, useState } from "react";
import { ICfaToInvite } from "shared/models/routes/mission-locale/missionLocale.api";

import styles from "../InviterCfa.module.scss";

import { CfaInvitationCard } from "./CfaInvitationCard";
import { EngagementCallout } from "./EngagementCallout";

interface Props {
  invitations: ICfaToInvite[];
  showEngagementCallout: boolean;
  onInvite: (cfa: ICfaToInvite) => void;
}

const ENGAGEMENT_CALLOUT_AFTER_INDEX = 1;

export function CfaInvitationList({ invitations, showEngagementCallout, onInvite }: Props) {
  // Borné pour rester visible quand la liste est plus courte que la position prévue.
  const calloutAfterIndex = Math.min(ENGAGEMENT_CALLOUT_AFTER_INDEX, invitations.length - 1);
  const [faqOuverte, setFaqOuverte] = useState(false);

  return (
    <section className={styles.invitationsSection}>
      <h2 className={styles.sectionTitle}>Invitez les CFA de votre territoire</h2>
      <p className={styles.sectionIntro}>
        Pour inviter un CFA à collaborer avec vous sur le Tableau de bord de l’apprentissage cliquez sur “Inviter ce
        CFA”, vous pourrez ajouter votre propre message de recommandation. L’invitation sera directement envoyée au CFA.
      </p>

      <div className={styles.faq}>
        <button
          type="button"
          className={`fr-link ${styles.faqToggle}`}
          aria-expanded={faqOuverte}
          aria-controls="cfa-invitation-faq"
          onClick={() => setFaqOuverte((ouverte) => !ouverte)}
        >
          Pourquoi manque-t-il certains CFA de mon territoire&nbsp;?
          <span
            className={`fr-icon--sm ${faqOuverte ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"}`}
            aria-hidden="true"
          />
        </button>
        {faqOuverte && (
          <div id="cfa-invitation-faq" className={styles.faqContent}>
            <p>
              À cause de certaines contraintes techniques, nous ne pouvons pas encore ouvrir la possibilité de la
              collaboration à certains CFA (cela peut-être à cause de leur ERP utilisé ou tout simplement de leur
              organisation administrative que nous ne sommes pas encore en capacité de traiter).
            </p>
            <p>
              Cette liste vous permet d’inviter directement les CFA qui peuvent directement en quelques clics commencer
              à utiliser la collaboration dans le Tableau de bord.
            </p>
          </div>
        )}
      </div>

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
