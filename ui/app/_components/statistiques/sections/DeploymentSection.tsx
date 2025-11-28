"use client";

import { useState } from "react";

import { DeploymentRow } from "../cards/DeploymentRow";
import { calculatePercentage, getPercentageColor } from "../constants";
import { useDeploymentStats, useSyntheseRegionsStats } from "../hooks/useStatsQueries";
import { RegionTable } from "../tables/RegionTable";
import { FranceMapSVG } from "../ui/FranceMapSVGLazy";
import { PeriodSelector, type Period } from "../ui/PeriodSelector";
import { TableSkeleton } from "../ui/Skeleton";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./DeploymentSection.module.css";
import { StatisticsSection } from "./StatisticsSection";

interface DeploymentSectionProps {
  defaultPeriod?: Period;
  showDetailColumn?: boolean;
  isAdmin?: boolean;
}

export function DeploymentSection({
  defaultPeriod = "30days",
  showDetailColumn = true,
  isAdmin = false,
}: DeploymentSectionProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);

  const {
    data: deploymentData,
    isLoading: deploymentLoading,
    isFetching: deploymentFetching,
    error: deploymentError,
  } = useDeploymentStats(period);
  const {
    data: regionsData,
    isLoading: regionsLoading,
    isFetching: regionsFetching,
    error: regionsError,
  } = useSyntheseRegionsStats(period);

  const stats = deploymentData?.summary;
  const regionsActives = deploymentData?.regionsActives || [];
  const regionalStats = regionsData?.regions || [];

  const loading = deploymentLoading || regionsLoading;

  const loadingPercentage = (deploymentFetching || regionsFetching) && !loading;
  const error = deploymentError || regionsError;

  return (
    <StatisticsSection
      title="Déploiement"
      className={styles.sectionContainer}
      controls={<PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />}
      controlsPosition="below-left"
    >
      <StatsErrorHandler data={deploymentData && regionsData} error={error} isLoading={loading}>
        <div className={styles.deploymentContentCard}>
          <div className={styles.deploymentMapContainer}>
            <FranceMapSVG regionsActives={regionsActives} />
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
                loadingPercentage={loadingPercentage}
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
            <RegionTable
              regions={regionalStats}
              showDetailColumn={showDetailColumn}
              loadingDeltas={loadingPercentage}
              isAdmin={isAdmin}
            />
          )}
        </div>
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
