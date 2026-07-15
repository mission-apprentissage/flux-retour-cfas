"use client";

import Image from "next/image";
import Link from "next/link";

import styles from "./CfaSuiviMissionLocale.module.css";

export function CfaSuiviEmptyState() {
  return (
    <div className={styles.emptyState}>
      <Image
        src="/images/parcours-partage-mission-locale.svg"
        alt=""
        width={200}
        height={140}
        className={styles.emptyIllustration}
      />
      <p className={styles.emptyTitle}>
        Vous n&apos;avez pas encore sollicité
        <br />
        de Missions Locales pour collaborer
      </p>
      <p className={styles.emptyText}>
        Commencez dès maintenant. Identifiez un·e jeune qui aurait besoin d&apos;un accompagnement d&apos;une Mission
        Locale, demandez une collaboration et elle sera envoyée directement à sa Mission Locale de rattachement.
      </p>
      <Link href="/cfa" className={styles.emptyLink}>
        Aller à la liste des jeunes en rupture
        <i className="fr-icon-arrow-right-line fr-icon--sm" aria-hidden="true" />
      </Link>
    </div>
  );
}
