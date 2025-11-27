"use client";

import styles from "./tables/TraitementTable.module.css";

export function formatPercentageBadge(percentage: number, evolution?: string) {
  let badgeClass = styles.percentageBadgeMedium;
  if (percentage >= 70) {
    badgeClass = styles.percentageBadgeHigh;
  } else if (percentage === 0) {
    badgeClass = styles.percentageBadgeZero;
  }

  const getEvolutionClass = (evo: string) => {
    if (evo.startsWith("+")) return styles.evolutionPositive;
    if (evo.startsWith("-")) return styles.evolutionNegative;
    return styles.evolutionZero;
  };

  return (
    <span>
      <span className={badgeClass}>{percentage}%</span>
      {evolution && evolution !== "" && <span className={getEvolutionClass(evolution)}>{evolution}</span>}
    </span>
  );
}

export function formatPercentageBadgeSimple(percentage: number) {
  if (percentage >= 70) {
    return <span className={styles.percentageBadgeHigh}>{percentage}%</span>;
  }
  if (percentage > 0) {
    return <span className={styles.percentageBadgeMedium}>{percentage}%</span>;
  }
  return <span className={styles.percentageBadgeZero}>{percentage}%</span>;
}

export function formatActivityDuration(days: number | null): { text: string; className: string } {
  if (days === null) return { text: "-", className: styles.emptyValue };
  if (days === 0) return { text: "Aujourd'hui", className: styles.activityToday };
  if (days < 30) return { text: `Il y a ${days} jour${days > 1 ? "s" : ""}`, className: styles.activityRecent };
  if (days < 365) {
    const months = Math.floor(days / 30);
    return { text: `Il y a ${months} mois`, className: styles.activityOld };
  }
  const years = Math.floor(days / 365);
  return { text: `Il y a ${years} an${years > 1 ? "s" : ""}`, className: styles.activityOld };
}

export function formatMlActives(count: number) {
  if (count === 0) {
    return <span className={styles.emptyValue}>Aucune ML</span>;
  }
  return count;
}
