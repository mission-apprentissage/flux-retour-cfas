"use client";

import { useState } from "react";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import { DeploymentRow } from "../cards/DeploymentRow";
import { getVariationColorFromString } from "../constants";
import { useDeploymentStats, useSyntheseRegionsStats } from "../hooks/useStatsQueries";
import { RegionTable } from "../tables/RegionTable";
import { FranceMapSVG } from "../ui/FranceMapSVGLazy";
import { PeriodSelector, type Period } from "../ui/PeriodSelector";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./DeploymentSection.module.css";
import { StatisticsSection } from "./StatisticsSection";

interface DeploymentSectionProps {
  defaultPeriod?: Period;
}

export function DeploymentSection({ defaultPeriod = "30days" }: DeploymentSectionProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);

  return (
    <StatisticsSection
      title="Déploiement aux Missions Locales"
      className={styles.sectionContainer}
      controls={<PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />}
      controlsPosition="below-left"
    >
      <DeploymentContent period={period} />
    </StatisticsSection>
  );
}

interface DeploymentContentProps {
  period: Period;
  region?: string;
  departement?: string;
}

export function DeploymentContent({ period, region, departement }: DeploymentContentProps) {
  const {
    data: deploymentData,
    isLoading: deploymentLoading,
    isFetching: deploymentFetching,
    error: deploymentError,
  } = useDeploymentStats(period, region, departement);
  const {
    data: regionsData,
    isLoading: regionsLoading,
    isFetching: regionsFetching,
    error: regionsError,
  } = useSyntheseRegionsStats(period, region);

  const stats = deploymentData?.summary;
  const regionsActives = deploymentData?.regionsActives || [];
  const regionalStats = regionsData?.regions || [];

  const loading = deploymentLoading || regionsLoading;

  const loadingPercentage = (deploymentFetching || regionsFetching) && !loading;
  const error = deploymentError || regionsError;

  return (
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
              percentage={stats?.activatedMlVariation}
              percentageColor={getVariationColorFromString(stats?.activatedMlVariation ?? "")}
              tooltip="Missions Locales dont l'accès au suivi des jeunes a été activé sur le Tableau de bord à la date d'évaluation."
            />

            <DeploymentRow
              label="ML engagées"
              value={stats?.engagedMlCount}
              loading={loading}
              loadingPercentage={loadingPercentage}
              percentage={stats?.engagedMlVariation}
              percentageColor={getVariationColorFromString(stats?.engagedMlVariation ?? "")}
              tooltip="Les Missions Locales sont considérées comme engagées sur l'utilisation du service du Tableau de bord de l'apprentissage à partir d'un taux de dossiers traités supérieur ou égal à 70%."
              indented
            />

            <DeploymentRow
              label="ML inactives"
              value={(stats?.mlCount || 0) - (stats?.activatedMlCount || 0)}
              loading={loading}
              color="#E3E3FD"
              tooltip="Missions Locales recensées dont l'accès n'a pas encore été activé."
            />

            <div className={styles.deploymentSeparator} />

            <DeploymentRow
              label={region ? "Total ML sur le territoire" : "Total ML en France"}
              value={stats?.mlCount}
              loading={loading}
              tooltip={
                region
                  ? "Ensemble des Missions Locales recensées dans le Tableau de bord sur le territoire sélectionné."
                  : "Ensemble des Missions Locales recensées dans le Tableau de bord, métropole et outre-mer."
              }
            />
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <TableSkeleton rows={5} />
        ) : (
          <RegionTable
            regions={regionalStats}
            loadingDeltas={loadingPercentage}
            detailRegions={regionalStats.map((stat) => stat.code)}
          />
        )}
      </div>
    </StatsErrorHandler>
  );
}
