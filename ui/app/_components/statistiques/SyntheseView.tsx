"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useState } from "react";

import { calculatePercentage, getPercentageColor } from "./constants";
import { DeploymentRow } from "./DeploymentRow";
import { FranceMapSVG } from "./FranceMapSVG";
import { useSummaryStats, useRegionalStats } from "./hooks/useMissionLocaleStatsQueries";
import { PeriodSelector } from "./PeriodSelector";
import { RegionTable } from "./RegionTable";
import { TableSkeleton } from "./Skeleton";
import { StatCard } from "./StatCard";
import { StatSection } from "./StatSection";
import styles from "./SyntheseView.module.css";

export function SyntheseView() {
  const [period, setPeriod] = useState<"30days" | "3months" | "all">("30days");

  const { data: stats, isLoading: loading, error: summaryError } = useSummaryStats(period);

  const { data: regionalData, isLoading: loadingRegional, error: regionalError } = useRegionalStats(period);

  const regionalStats = regionalData?.regions || [];

  const latestStats = stats?.summary
    .slice()
    .reverse()
    .find((entry) => entry.stats.length > 0)?.stats[0];
  const firstStats = stats?.summary[0]?.stats[0];

  if (!loading && (!stats || !latestStats || !firstStats)) {
    return (
      <div>
        <Alert
          severity="warning"
          title="Aucune donnée disponible"
          description="Aucune donnée n'est disponible pour cette période"
          className={fr.cx("fr-mb-4w")}
        />
      </div>
    );
  }

  return (
    <div>
      {summaryError ? (
        <Alert
          severity="error"
          title="Erreur"
          description={summaryError instanceof Error ? summaryError.message : "Une erreur est survenue"}
          className={fr.cx("fr-mb-4w")}
        />
      ) : null}

      <div className={fr.cx("fr-mb-4w")}>
        <h2 className={styles.headerTitle}>Synthèse</h2>
        <div className={styles.periodSelectorContainer}>
          <PeriodSelector value={period} onChange={setPeriod} includAll={true} hideLabel={true} />
        </div>
      </div>

      <StatSection title="Traitement">
        <div className={styles.cardsContainer}>
          <StatCard
            label="Total jeunes identifiés en rupture"
            value={latestStats?.total}
            previousValue={firstStats?.total}
            loading={loading}
          />
          <StatCard
            label="Total jeunes contactés par les Missions locales"
            value={latestStats?.total_contacte}
            previousValue={firstStats?.total_contacte}
            loading={loading}
          />
          <StatCard
            label="Total jeunes ayant répondu"
            value={latestStats?.total_repondu}
            previousValue={firstStats?.total_repondu}
            loading={loading}
          />
          <StatCard
            label="Total jeunes accompagnés"
            value={latestStats?.total_accompagne}
            previousValue={firstStats?.total_accompagne}
            loading={loading}
            tooltip={
              <>
                Les &quot;jeunes accompagnés&quot; représentent la somme :
                <ul>
                  <li>
                    Des jeunes non connus du service public à l&apos;emploi qui ont obtenu un rdv avec une Mission
                    locale grâce au TBA (RDV pris)
                  </li>
                  <li>Les jeunes déjà connus et accompagnés par le service public à l&apos;emploi</li>
                </ul>
              </>
            }
          />
        </div>
      </StatSection>

      <section className={`${fr.cx("fr-mb-6w")} ${styles.sectionContainer}`}>
        <h2 className={fr.cx("fr-h4", "fr-mb-3w")}>Déploiement</h2>
        <div className={styles.deploymentContentCard}>
          <div className={styles.deploymentMapContainer}>
            <FranceMapSVG />
          </div>

          <div className={styles.deploymentLegendsContainer}>
            <div className={styles.deploymentLegends}>
              <DeploymentRow
                label={
                  <>
                    Missions locales actives
                    <br /> sur le Tableau de bord
                  </>
                }
                value={stats?.activatedMlCount}
                loading={loading}
                color="#6A6AF4"
                percentage={calculatePercentage(stats?.activatedMlCount || 0, stats?.previousActivatedMlCount || 0)}
                percentageColor={getPercentageColor(stats?.activatedMlCount || 0, stats?.previousActivatedMlCount || 0)}
              />
              <DeploymentRow
                label="ML inactives"
                value={(stats?.mlCount || 0) - (stats?.activatedMlCount || 0)}
                loading={loading}
                color="#E3E3FD"
              />
              <div className={styles.deploymentSeparator} />

              <DeploymentRow label="Total ML en France" value={stats?.mlCount} loading={loading} />
            </div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          {regionalError ? (
            <Alert
              severity="error"
              title="Erreur"
              description={
                regionalError instanceof Error
                  ? regionalError.message
                  : "Erreur lors du chargement des statistiques régionales"
              }
              className={fr.cx("fr-mb-4w")}
            />
          ) : loadingRegional ? (
            <TableSkeleton rows={5} />
          ) : (
            <RegionTable regions={regionalStats} />
          )}
        </div>
      </section>
    </div>
  );
}
