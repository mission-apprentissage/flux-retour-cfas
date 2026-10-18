"use client";

import { useEffect } from "react";

import styles from "./StatistiquesMLLayoutClient.module.css";

/** Pages connectées du suivi des indicateurs : la navigation par onglets est portée par l'en-tête. */
export function StatistiquesMLLayoutClient({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reloadIfRestoredFromCache = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", reloadIfRestoredFromCache);
    return () => window.removeEventListener("pageshow", reloadIfRestoredFromCache);
  }, []);

  return (
    <div className={styles.dreetsPage}>
      <div className="fr-container">{children}</div>
    </div>
  );
}
