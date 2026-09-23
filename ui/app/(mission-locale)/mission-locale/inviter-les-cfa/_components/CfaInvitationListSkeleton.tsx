"use client";

import { Skeleton } from "@/app/_components/common/Skeleton";

import styles from "../InviterCfa.module.scss";

const NB_CARTES_FANTOMES = 4;
const HAUTEUR_CARTE = 96;

export function CfaInvitationListSkeleton() {
  return (
    <section className={styles.invitationsSection} aria-busy="true" aria-label="Chargement des CFA à inviter">
      <Skeleton width="40%" height={28} className="fr-mb-2w" />
      <Skeleton width="100%" height={18} className="fr-mb-4w" />

      <div className={styles.invitationsList}>
        {[...Array(NB_CARTES_FANTOMES)].map((_, i) => (
          <Skeleton key={i} height={HAUTEUR_CARTE} />
        ))}
      </div>
    </section>
  );
}
