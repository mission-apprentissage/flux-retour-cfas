"use client";

import Link from "next/link";

import {
  useOrganisationOrganismes,
  useOrganismesDuplicatsLists,
  useOrganismesNormalizedLists,
} from "@/hooks/organismes";

import styles from "./dashboard.module.scss";

export function DashboardAdministrateurLinks() {
  const { organismes } = useOrganisationOrganismes();
  const { organismesACompleter } = useOrganismesNormalizedLists(organismes || []);
  const { organismesDuplicats } = useOrganismesDuplicatsLists();

  return (
    <div className={styles.adminLinksGrid}>
      <Link href="/organismes/a-completer" className={styles.adminLinkCard}>
        <i className={`fr-icon-warning-fill fr-icon--sm ${styles.adminLinkIcon}`} aria-hidden="true" />
        <span>
          {organismesACompleter.length} organismes <strong>à fiabiliser</strong>
        </span>
      </Link>

      <Link href="/admin/fusion-organismes" className={styles.adminLinkCard}>
        <i className={`fr-icon-warning-fill fr-icon--sm ${styles.adminLinkIcon}`} aria-hidden="true" />
        <span>
          {organismesDuplicats?.length || 0} <strong>duplicats d&apos;organismes</strong>
        </span>
      </Link>
    </div>
  );
}
