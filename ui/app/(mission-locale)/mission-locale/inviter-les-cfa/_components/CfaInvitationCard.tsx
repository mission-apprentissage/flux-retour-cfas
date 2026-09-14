import { CFA_INVITATION_STATUT, ICfaToInvite } from "shared/models/routes/mission-locale/missionLocale.api";

import styles from "../InviterCfa.module.scss";

import { CfaInvitationStatusCta } from "./CfaInvitationStatusCta";

interface Props {
  cfa: ICfaToInvite;
  onInvite: (cfa: ICfaToInvite) => void;
}

const CARD_STATUT_CLASSNAME: Partial<Record<CFA_INVITATION_STATUT, string>> = {
  [CFA_INVITATION_STATUT.CFA_ACTIF]: styles.cardActive,
};

export function CfaInvitationCard({ cfa, onInvite }: Props) {
  const cardClassName = [styles.card, CARD_STATUT_CLASSNAME[cfa.statut]].filter(Boolean).join(" ");

  return (
    <div className={cardClassName}>
      <div className={styles.cardInfo}>
        <i className={`ri-school-line ${styles.cardIcon}`} aria-hidden="true" />
        <div>
          <p className={styles.cardName}>{cfa.nom ?? "CFA"}</p>
          {cfa.adresse && <p className={styles.cardAddress}>{cfa.adresse}</p>}
        </div>
      </div>
      <div className={styles.cardCta}>
        <CfaInvitationStatusCta cfa={cfa} onInvite={onInvite} />
      </div>
    </div>
  );
}
