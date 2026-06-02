import { ICfaToInvite } from "shared/models/routes/mission-locale/missionLocale.api";

import styles from "../InviterCfa.module.scss";

import { CfaInvitationStatusCta } from "./CfaInvitationStatusCta";

interface Props {
  cfa: ICfaToInvite;
  onInvite: (cfa: ICfaToInvite) => void;
}

export function CfaInvitationCard({ cfa, onInvite }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.cardInfo}>
        <i className={`ri-school-line ${styles.cardIcon}`} aria-hidden="true" />
        <div>
          <p className={styles.cardName}>{cfa.nom ?? "CFA"}</p>
          {cfa.adresse && <p className={styles.cardAddress}>{cfa.adresse}</p>}
        </div>
      </div>
      <div className={styles.cardStats}>
        <span className={styles.statNumber}>{cfa.nb_jeunes_rupture}</span>
        <span className={styles.statLabel}>
          jeune{cfa.nb_jeunes_rupture > 1 ? "s" : ""} en rupture rattaché{cfa.nb_jeunes_rupture > 1 ? "s" : ""} à votre
          Mission Locale
        </span>
      </div>
      <div className={styles.cardCta}>
        <CfaInvitationStatusCta cfa={cfa} onInvite={onInvite} />
      </div>
    </div>
  );
}
