"use client";

import { Table } from "@codegouvfr/react-dsfr/Table";
import { format, formatDistanceToNow, fr } from "date-fns";

import { useMissionLocaleMembres } from "../../hooks/useStatsQueries";
import { NoDataMessage } from "../../ui/NoDataMessage";
import { TableSkeleton } from "../../ui/Skeleton";
import { StatsErrorHandler } from "../../ui/StatsErrorHandler";

import styles from "./MLEquipeTab.module.css";

interface MLEquipeTabProps {
  mlId: string;
  noData?: boolean;
}

export function MLEquipeTab({ mlId, noData }: MLEquipeTabProps) {
  const { data, isLoading, error } = useMissionLocaleMembres(mlId);

  const formatActivityDate = (dateString: string | null) => {
    if (!dateString) return "Aucune activité";
    try {
      const date = new Date(dateString);
      const formattedDate = format(date, "dd/MM/yyyy", { locale: fr });
      const relativeTime = formatDistanceToNow(date, { locale: fr, addSuffix: true });
      return `${formattedDate}, ${relativeTime}`;
    } catch {
      return "Aucune activité";
    }
  };

  const formatCivility = (civility: string) => {
    if (civility === "Monsieur") return "M.";
    if (civility === "Madame") return "Mme";
    return civility || "";
  };

  const formatName = (membre: { civility: string; prenom: string; nom: string }) => {
    const parts = [formatCivility(membre.civility), membre.prenom, membre.nom].filter(Boolean);
    return parts.join(" ") || "-";
  };

  if (noData) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Équipe de la Mission Locale</h2>
        <NoDataMessage />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : !data || data.length === 0 ? (
          <div className={styles.emptyState}>
            <i className={`fr-icon-user-line ${styles.emptyStateIcon}`} aria-hidden="true" />
            <h3 className={styles.emptyStateTitle}>Aucun membre</h3>
            <p className={styles.emptyStateText}>Cette Mission Locale n&apos;a pas encore de membres inscrits.</p>
          </div>
        ) : (
          <>
            <h2 className={styles.title}>Équipe de la Mission Locale</h2>
            <div className={styles.tableContainer}>
              <Table
                headers={["Nom et civilité", "Téléphone", "Courriel", "Dernière activité"]}
                data={data.map((membre) => [
                  formatName(membre),
                  membre.telephone || "-",
                  membre.email || "-",
                  formatActivityDate(membre.last_traitement_at),
                ])}
              />
            </div>
          </>
        )}
      </StatsErrorHandler>
    </div>
  );
}
