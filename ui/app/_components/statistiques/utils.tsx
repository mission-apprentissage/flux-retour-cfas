"use client";

import format from "date-fns/format/index";
import formatDistanceToNow from "date-fns/formatDistanceToNow/index";
import { fr } from "date-fns/locale";

import commonStyles from "./tables/common.module.css";
import styles from "./tables/TraitementTable.module.css";
import { Skeleton } from "./ui/Skeleton";

export function formatPercentageBadge(percentage: number, evolution?: string, loadingEvolution?: boolean) {
  let badgeClass = styles.percentageBadgeMedium;
  if (percentage >= 70) {
    badgeClass = styles.percentageBadgeHigh;
  } else if (percentage === 0) {
    badgeClass = styles.percentageBadgeZero;
  }

  const getEvolutionDisplay = (evo: string): { icon: string | null; className: string } => {
    if (evo.startsWith("+")) return { icon: "fr-icon-arrow-up-s-line", className: styles.evolutionPositive };
    if (evo.startsWith("-")) return { icon: "fr-icon-arrow-down-s-line", className: styles.evolutionNegative };
    return { icon: null, className: styles.evolutionZero };
  };

  const evolutionDisplay = evolution && evolution !== "" ? getEvolutionDisplay(evolution) : null;

  return (
    <span>
      <span className={badgeClass}>{percentage}%</span>
      {loadingEvolution ? (
        <Skeleton width="32px" height="16px" inline />
      ) : (
        evolutionDisplay &&
        (evolutionDisplay.icon ? (
          <span className={`${evolutionDisplay.icon} ${evolutionDisplay.className}`} aria-hidden="true" />
        ) : (
          <span className={evolutionDisplay.className}>=</span>
        ))
      )}
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
  if (days <= 0) return { text: "Aujourd'hui", className: styles.activityToday };
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

export function formatDateFr(dateString: string | null): string | null {
  if (!dateString) return null;
  try {
    return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
  } catch {
    return null;
  }
}

export function formatDateWithRelativeTime(dateString: string | null): string {
  if (!dateString) return "Aucune activité";
  try {
    const date = new Date(dateString);
    const formattedDate = format(date, "dd/MM/yyyy", { locale: fr });
    const relativeTime = formatDistanceToNow(date, { locale: fr, addSuffix: true });
    return `${formattedDate}, ${relativeTime}`;
  } catch {
    return "Aucune activité";
  }
}

export function formatDelta(delta: number) {
  if (delta === 0) return <span className={commonStyles.deltaZero}>=</span>;
  if (delta > 0) return <span className={commonStyles.deltaPositive}>+{delta}</span>;
  return <span className={commonStyles.deltaNegative}>{delta}</span>;
}

export function formatVariationBadge(variation: string) {
  const numValue = parseInt(variation.replace(/[+%]/g, ""));
  if (numValue === 0) return <span className={commonStyles.variationZero}>{variation}</span>;
  if (numValue > 0) return <span className={commonStyles.variationPositive}>{variation}</span>;
  return <span className={commonStyles.variationNegative}>{variation}</span>;
}
