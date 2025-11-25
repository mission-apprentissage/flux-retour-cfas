"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { _get } from "@/common/httpClient";

import commonStyles from "./common.module.css";
import { calculatePercentage, getPercentageColor } from "./constants";
import { DeploymentRow } from "./DeploymentRow";
import { FranceMapSVG } from "./FranceMapSVG";
import { PeriodSelector, type Period } from "./PeriodSelector";
import { RegionTable } from "./RegionTable";
import { TableSkeleton } from "./Skeleton";
import { STATS_QUERY_CONFIG } from "./statistiques.config";
import { StatSection } from "./StatSection";
import styles from "./SyntheseView.module.css";
import { TraitementCards } from "./TraitementCards";
import { useStatsPrefetch } from "./useStatsPrefetch";

interface SyntheseViewProps {
  showDetailColumn?: boolean;
}

export function SyntheseView({ showDetailColumn = true }: SyntheseViewProps = {}) {
  const [period, setPeriod] = useState<Period>("30days");

  useStatsPrefetch("synthese", period);

  const {
    data,
    isLoading: loading,
    error,
  } = useQuery(
    ["mission-locale-stats", "synthese", period],
    () => _get(`/api/v1/mission-locale/stats/synthese`, { params: { period } }),
    STATS_QUERY_CONFIG
  );

  const stats = data?.summary;
  const regionalStats = data?.regions || [];
  const traitementData = data?.traitement;

  if (!loading && !data) {
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
      {error ? (
        <Alert
          severity="error"
          title="Erreur"
          description={error instanceof Error ? error.message : "Une erreur est survenue"}
          className={fr.cx("fr-mb-4w")}
        />
      ) : null}

      <div className={commonStyles.headerContainer}>
        <div className={commonStyles.logoContainer}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 30H17.5V52.5H7.5V30ZM42.5 20H52.5V52.5H42.5V20ZM25 5H35V52.5H25V5Z" fill="#6A6AF4" />
          </svg>
        </div>
        <h2 className={commonStyles.headerTitle}>Synthèse</h2>
      </div>

      <div className={fr.cx("fr-mb-4w")}>
        <div className={commonStyles.periodSelectorContainer}>
          <PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />
        </div>
      </div>

      <StatSection title="Traitement">
        <div className={styles.cardsContainer}>
          <TraitementCards latestStats={traitementData?.latest} firstStats={traitementData?.first} loading={loading} />
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
                    Missions Locales actives
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
          {loading ? (
            <TableSkeleton rows={5} />
          ) : (
            <RegionTable regions={regionalStats} showDetailColumn={showDetailColumn} />
          )}
        </div>
      </section>
    </div>
  );
}
