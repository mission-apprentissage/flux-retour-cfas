"use client";

import { IndicateursEffectifs } from "shared";

import styles from "./dashboard.module.scss";

function anneeScolaireCourante(): string {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

interface IndicateursApercuProps {
  indicateurs?: IndicateursEffectifs;
  isLoading: boolean;
}

export function IndicateursApercu({ indicateurs, isLoading }: IndicateursApercuProps) {
  const stats = [
    { label: "apprentis (avec contrat)", value: indicateurs?.apprentis },
    { label: "inscrits sans contrat", value: indicateurs?.inscrits },
    { label: "rupturants", value: indicateurs?.rupturants },
    { label: "abandons", value: indicateurs?.abandons },
  ];

  return (
    <section className={styles.ficheCard}>
      <h2 className={styles.ficheCardTitle}>Effectifs année scolaire {anneeScolaireCourante()}</h2>
      {isLoading ? (
        <p className={styles.statTotal}>Chargement des indicateurs…</p>
      ) : (
        <>
          <p className={styles.statTotal}>
            <strong>{indicateurs?.apprenants ?? 0}</strong> apprenant{(indicateurs?.apprenants ?? 0) > 1 ? "s" : ""} au
            total
          </p>
          <div className={styles.statGrid}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.statItem}>
                <span className={styles.statNumber}>{stat.value ?? 0}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
