"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import styles from "./StatistiquesMLLayoutClient.module.css";

const FICHE_PATH = /^\/suivi-des-indicateurs\/(mission-locale|cfa)\/[^/]+/;

/** Pages connectées du suivi des indicateurs : la navigation par onglets est portée par l'en-tête. */
export function StatistiquesMLLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const reloadIfRestoredFromCache = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", reloadIfRestoredFromCache);
    return () => window.removeEventListener("pageshow", reloadIfRestoredFromCache);
  }, []);

  return (
    <div className={`${styles.dreetsPage} ${FICHE_PATH.test(pathname ?? "") ? styles.fiche : ""}`}>
      <div className="fr-container">{children}</div>
    </div>
  );
}
