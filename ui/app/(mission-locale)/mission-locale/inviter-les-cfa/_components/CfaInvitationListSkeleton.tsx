"use client";

import { Skeleton } from "@mui/material";

import styles from "../InviterCfa.module.scss";

const NB_CARTES_FANTOMES = 4;
const HAUTEUR_CARTE = 118;

export function CfaInvitationListSkeleton() {
  return (
    <section className={styles.invitationsSection} aria-busy="true" aria-label="Chargement des CFA à inviter">
      <Skeleton animation="wave" variant="rounded" width="40%" height={28} sx={{ mb: 2, maxWidth: 380 }} />
      <Skeleton animation="wave" variant="rounded" width="100%" height={18} sx={{ mb: 4, maxWidth: 720 }} />

      <div className={styles.invitationsList}>
        {[...Array(NB_CARTES_FANTOMES)].map((_, i) => (
          <Skeleton key={i} animation="wave" variant="rounded" width="100%" height={HAUTEUR_CARTE} />
        ))}
      </div>
    </section>
  );
}
